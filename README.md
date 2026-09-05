# AI Resume Analyzer

A full-stack app: React frontend + Flask backend (with Gemini AI suggestions) that
scores a resume against a target job role.

## Run it locally (any OS: Windows/Mac/Linux)

### 1. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env        # then edit .env and add your key
python app.py                # runs on http://localhost:5000

Get a free Gemini API key from https://aistudio.google.com and put it in backend/.env:
GEMINI_API_KEY=your_gemini_api_key_here

### 2. Frontend
cd frontend
npm install
cp .env.example .env
npm start                    # opens http://localhost:3000

### Job Roles Available
Type these exactly in the app:
- data analyst
- ml intern
- software developer intern

## Deploying it live

1. Backend → Render: root directory `backend`, build command `pip install -r requirements.txt`, start command `gunicorn app:app`, add env var `GEMINI_API_KEY`
2. Frontend → Vercel: root directory `frontend`, add env var `REACT_APP_API_URL` pointing to your Render URL
