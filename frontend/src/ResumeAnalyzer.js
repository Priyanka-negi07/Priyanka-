import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Zap, FileText, ChevronRight, CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Backend URL: set REACT_APP_API_URL in frontend/.env (or as an env var on your
// hosting platform) so this works from any device, not just your own machine.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { alert("Please upload a resume first!"); return; }
    if (!jobDescription.trim()) { alert("Please enter a job role!"); return; }

    setLoading(true);
    setResults(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', jobDescription);

    try {
      const response = await axios.post(`${API_URL}/api/analyze`, formData);
      setResults(response.data);
    } catch (error) {
      console.error("Backend Error:", error);
      const msg = error.response?.data?.error || `Could not connect to backend at ${API_URL}`;
      alert("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#94a3b8';
    if (status.toLowerCase().includes('strong')) return '#34d399';
    if (status.toLowerCase().includes('moderate')) return '#facc15';
    return '#f87171';
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#34d399';
    if (score >= 55) return '#facc15';
    return '#f87171';
  };

  // Parse AI suggestions into a clean array of tips
  const parseSuggestions = (text) => {
    if (!text) return [];
    const lines = text.split('\n').filter(line => line.trim());
    const tips = lines.filter(line => /^\d\./.test(line.trim()));
    if (tips.length > 0) return tips.map(t => t.replace(/^\d\.\s*/, '').trim());
    return lines.filter(l => l.trim().length > 10);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">

          {/* Left: Hero Text */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Powered by Artificial Intelligence
            </div>
            <h1 className="text-6xl font-black tracking-tight text-white leading-[1.1]">
              ANALYSE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">YOUR RESUME</span> <br />
              INSTANTLY
            </h1>
            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              Upload your resume and get a deep AI-powered breakdown — skills matched, gaps identified, and score calculated in seconds.
            </p>
            <div className="grid grid-cols-3 gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-emerald-400">98%</div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mt-1 font-semibold">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">&lt;5S</div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mt-1 font-semibold">Analysis</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">50+</div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mt-1 font-semibold">Skills</div>
              </div>
            </div>
          </div>

          {/* Right: Upload Form */}
          <div className="space-y-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />

            {/* Upload Box */}
            <div onClick={handleUploadClick}
              className="group relative bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{file ? file.name : "Upload Resume"}</h3>
                  <p className="text-slate-500 text-sm">PDF format only</p>
                </div>
              </div>
            </div>

            {/* Job Role Box */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <FileText size={24} />
                </div>
                <h3 className="font-bold text-white text-lg">Job Description</h3>
              </div>
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500/50 text-slate-300 h-24"
                placeholder="Enter target job role e.g. web developer, data scientist..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Analyze Button */}
            <button onClick={handleAnalyze} disabled={loading}
              className="w-full group bg-gradient-to-r from-cyan-500 to-emerald-500 p-6 rounded-2xl flex items-center justify-between hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Zap size={24} fill="currentColor" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-lg">{loading ? "Analysing..." : "Get Instant Analysis"}</h3>
                  <p className="text-white/70 text-sm">Score, skills, gaps & AI suggestions</p>
                </div>
              </div>
              <ChevronRight className="text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* RESULTS SECTION */}
        {results && (
          <div className="space-y-6">

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-500 text-sm uppercase tracking-widest">Analysis Results</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Score + Status + Counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* ATS Score Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-slate-500 text-xs uppercase tracking-widest mb-2">ATS Score</div>
                <div className="text-7xl font-black" style={{ color: getScoreColor(results.score) }}>
                  {results.score}
                </div>
                <div className="text-slate-500 text-sm">out of 100</div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
                  <div className="h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${results.score}%`, background: `linear-gradient(90deg, #06b6d4, ${getScoreColor(results.score)})` }} />
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-slate-500 text-xs uppercase tracking-widest mb-2">Profile Status</div>
                <div className="text-3xl font-black mt-2" style={{ color: getStatusColor(results.status) }}>
                  {results.status}
                </div>
                <div className="text-slate-500 text-sm mt-2">Skill Match: {results.skill_match_percent}%</div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
                  <div className="h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${results.skill_match_percent}%`, background: `linear-gradient(90deg, #06b6d4, #10b981)` }} />
                </div>
              </div>

              {/* Counts Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-slate-400 text-sm">Matched Skills</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-xl">{results.matched_skills.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-slate-400 text-sm">Missing Skills</span>
                  </div>
                  <span className="text-red-400 font-bold text-xl">{results.missing_skills.length}</span>
                </div>
                {results.missing_sections?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-yellow-400" />
                      <span className="text-slate-400 text-sm">Missing Sections</span>
                    </div>
                    <span className="text-yellow-400 font-bold text-xl">{results.missing_sections.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggestions Section */}
            {results.ai_suggestion && (
              <div className="bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-cyan-400" />
                  <div className="text-cyan-400 text-xs uppercase tracking-widest font-semibold">AI Suggestions to Improve Your Resume</div>
                </div>
                <div className="space-y-3">
                  {parseSuggestions(results.ai_suggestion).map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="min-w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-slate-300 text-sm leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Bar Chart */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-4">Skill Comparison</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: 'Matched', value: results.matched_skills.length },
                    { name: 'Missing', value: results.missing_skills.length }
                  ]}>
                    <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#34d399" />
                      <Cell fill="#f87171" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="text-slate-400 text-xs uppercase tracking-widest mb-4">Skill Breakdown</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Matched', value: results.matched_skills.length },
                        { name: 'Missing', value: results.missing_skills.length }
                      ]}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#475569' }}
                    >
                      <Cell fill="#34d399" />
                      <Cell fill="#f87171" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skills Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Matched Skills */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <div className="text-slate-400 text-xs uppercase tracking-widest">Matched Skills</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.matched_skills.length > 0
                    ? results.matched_skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {skill}
                      </span>
                    ))
                    : <span className="text-slate-500 text-sm">No skills matched</span>
                  }
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle size={14} className="text-red-400" />
                  <div className="text-slate-400 text-xs uppercase tracking-widest">Missing Skills</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.missing_skills.length > 0
                    ? results.missing_skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        {skill}
                      </span>
                    ))
                    : <span className="text-slate-500 text-sm">No missing skills!</span>
                  }
                </div>
              </div>
            </div>

            {/* Missing Sections Warning */}
            {results.missing_sections?.length > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <div className="text-yellow-400 text-xs uppercase tracking-widest font-semibold">Missing Resume Sections</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.missing_sections.map((sec, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      {sec}
                    </span>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-3">Add these section headings to your resume to improve ATS score.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
