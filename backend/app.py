from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import re
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# Allow the deployed frontend (set FRONTEND_URL in production) plus localhost for dev.
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(app, resources={r"/api/*": {"origins": allowed_origins}})


# Extraction + Processing

def extract_text_from_pdf_bytes(pdf_bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    combined_text = ""
    for page in doc:
        combined_text += page.get_text()
    doc.close()
    return combined_text

def clean_text(text):
    lower_text = text.lower()
    lower_text = re.sub(r'\bjs\b', 'javascript', lower_text)
    cleaned = re.sub(r'\s+', ' ', lower_text)
    return cleaned.strip()


# Dataset + Skills Logic

def load_job_data(file_name=None):
    if file_name is None:
        # Resolve relative to this file so it works no matter where the app is started from
        file_name = os.path.join(os.path.dirname(os.path.abspath(__file__)), "job_data.csv")
    skills_dict = {}
    if os.path.exists(file_name):
        with open(file_name, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        for i in range(1, len(lines)):
            clean_line = lines[i].replace('"', '').strip()
            if ',' in clean_line:
                parts = clean_line.split(',', 1)
                role = parts[0].strip().lower()
                skill = parts[1].strip().lower()
                if role not in skills_dict:
                    skills_dict[role] = []
                skills_dict[role].append(skill)
    return skills_dict

def match_skills(resume_text, job_skills):
    return [s for s in job_skills if re.search(rf'\b{re.escape(s)}\b', resume_text)]

def missing_skills_fn(resume_text, job_skills):
    return [s for s in job_skills if not re.search(rf'\b{re.escape(s)}\b', resume_text)]


# Section + Scoring

def check_sections(resume_text):
    important_sections = ["education", "experience", "projects", "skills"]
    return [s for s in important_sections if s not in resume_text]

def section_score(missing_sections):
    return (4 - len(missing_sections)) * 25

def calculate_ats_score(skill_percent, sec_score):
    return int((skill_percent * 0.8) + (sec_score * 0.2))

def profile_status(score, skill_percent):
    if score >= 75 and skill_percent >= 70:
        return "Strong Profile"
    elif score >= 55 and skill_percent >= 60:
        return "Moderate Profile"
    else:
        return "Weak Profile"


# Gemini AI Suggestions (Clean Output)

def get_ai_suggestions(role, missing_skills, missing_sections, score):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')

        missing_skills_text = ", ".join(missing_skills[:8]) if missing_skills else "None"
        missing_sections_text = ", ".join(missing_sections) if missing_sections else "None"

        prompt = f"""
You are an expert resume coach. Analyze this resume data and give exactly 3 short, clear, actionable tips.

Job Role: {role}
ATS Score: {score}/100
Missing Skills: {missing_skills_text}
Missing Sections: {missing_sections_text}

Rules:
- Give EXACTLY 3 tips numbered 1, 2, 3
- Each tip must be 1-2 sentences only
- Be specific and practical
- No extra text, no introduction, no conclusion
- Start directly with "1."

Example format:
1. Add Python and Machine Learning to your skills section as these are critical for this role.
2. Include a Projects section to showcase hands-on experience with real-world applications.
3. Mention specific tools like TensorFlow or Pandas in your experience to improve keyword matching.
"""
        response = model.generate_content(
            prompt,
            request_options={"timeout": 15}  # fail fast instead of hanging
        )
        raw = response.text.strip()

        # Clean up any markdown symbols like **, ##, etc.
        clean = re.sub(r'\*+', '', raw)
        clean = re.sub(r'#+\s?', '', clean)
        clean = re.sub(r'\n{3,}', '\n\n', clean)
        clean = clean.strip()

        return clean

    except Exception as e:
        return f"AI suggestions unavailable: {str(e)}"


# API Routes

@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Expects multipart/form-data with:
      - file: PDF resume
      - role: target job role string
    Returns JSON with score, status, matched, missing, sections, ai_suggestion
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files["file"]
    role = request.form.get("role", "").strip().lower()

    if not role:
        return jsonify({"error": "No role provided"}), 400

    # Read PDF bytes
    pdf_bytes = pdf_file.read()
    raw_text = extract_text_from_pdf_bytes(pdf_bytes)

    if not raw_text.strip():
        return jsonify({"error": "Could not extract text from PDF"}), 400

    clean = clean_text(raw_text)

    # Load job database
    job_db = load_job_data()

    if role not in job_db:
        available = list(job_db.keys())[:10]
        return jsonify({
            "error": f"Role '{role}' not found in database.",
            "available_roles": available
        }), 404

    needed_skills = job_db[role]
    matched = match_skills(clean, needed_skills)
    missing = missing_skills_fn(clean, needed_skills)
    missing_sec = check_sections(clean)

    total_needed = len(needed_skills)
    skill_percent = (len(matched) / total_needed * 100) if total_needed > 0 else 0
    sec_sc = section_score(missing_sec)
    final_score = calculate_ats_score(skill_percent, sec_sc)
    status = profile_status(final_score, skill_percent)

    # Get AI suggestions
    ai_tip = get_ai_suggestions(role, missing, missing_sec, final_score)

    return jsonify({
        "score": final_score,
        "status": status,
        "skill_match_percent": round(skill_percent, 1),
        "matched_skills": matched,
        "missing_skills": missing,
        "missing_sections": missing_sec,
        "ai_suggestion": ai_tip,
        "filename": pdf_file.filename
    })


@app.route("/api/roles", methods=["GET"])
def list_roles():
    """Returns all available job roles from the database."""
    job_db = load_job_data()
    return jsonify({"roles": sorted(job_db.keys())})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    # host="0.0.0.0" makes it reachable from other devices on the network / a hosting platform
    app.run(host="0.0.0.0", debug=debug, port=port)
