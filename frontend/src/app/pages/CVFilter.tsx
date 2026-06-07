import { useEffect, useRef, useState } from "react";
import {
  Upload, FileText, Users, TrendingUp, Target,
  CheckCircle2, XCircle, Star, Search, Filter,
  Download, Eye, Brain, Sparkles, AlertCircle,
  BarChart3, Award, Briefcase, Calendar
} from "lucide-react";
import api from "../services/api";

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  score: number;
  skills: string[];
  experience: number;
  education: string;
  matchPercentage: number;
  status: 'pending' | 'shortlisted' | 'rejected';
  uploadDate: string;
  keyStrengths: string[];
  concerns: string[];
  cvUrl?: string | null;
}

export function CVFilter() {
  const [selectedJob, setSelectedJob] = useState("Software Engineer");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobPositions, setJobPositions] = useState([
    "Software Engineer",
    "Software Engineer",
    "Accounts Officer",
    "Operations Executive",
    "Support Executive"
  ]);
  const [apiCandidates, setApiCandidates] = useState<Candidate[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "Software Engineer",
    skills: "",
    experience: "0",
    education: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const fallbackCandidates: Candidate[] = [
    {
      id: 1,
      name: "Mahmudul Karim",
      email: "mahmudul.karim@hrspace.local",
      phone: "+8801711122233",
      position: "Software Engineer",
      score: 94,
      skills: ["React", "Node.js", "TypeScript", "AWS", "Docker", "PostgreSQL"],
      experience: 7,
      education: "M.S. Computer Science - BUET",
      matchPercentage: 94,
      status: 'shortlisted',
      uploadDate: "2026-05-28",
      keyStrengths: ["Strong full-stack experience", "Cloud architecture expertise", "Team leadership"],
      concerns: []
    },
    {
      id: 2,
      name: "Jannatul Ferdous",
      email: "jannatul.ferdous@hrspace.local",
      phone: "+8801811122233",
      position: "Software Engineer",
      score: 89,
      skills: ["React", "Python", "Django", "MySQL", "Redis", "Git"],
      experience: 6,
      education: "B.S. Software Engineering - University of Dhaka",
      matchPercentage: 89,
      status: 'shortlisted',
      uploadDate: "2026-05-27",
      keyStrengths: ["Solid backend skills", "Database optimization", "Agile methodology"],
      concerns: ["Limited AWS experience"]
    },
    {
      id: 3,
      name: "Rafi Ahmed",
      email: "rafi.ahmed@hrspace.local",
      phone: "+8801911122233",
      position: "Software Engineer",
      score: 86,
      skills: ["Vue.js", "Node.js", "MongoDB", "Express", "GraphQL"],
      experience: 5,
      education: "B.S. Computer Science - North South University",
      matchPercentage: 86,
      status: 'pending',
      uploadDate: "2026-05-26",
      keyStrengths: ["Modern tech stack", "API development", "Quick learner"],
      concerns: ["Less experience than preferred"]
    },
    {
      id: 4,
      name: "Tasmia Noor",
      email: "tasmia.noor@hrspace.local",
      phone: "+8801611122233",
      position: "Software Engineer",
      score: 82,
      skills: ["Angular", "Java", "Spring Boot", "Oracle", "Jenkins"],
      experience: 8,
      education: "M.S. Information Systems - BRAC University",
      matchPercentage: 82,
      status: 'pending',
      uploadDate: "2026-05-25",
      keyStrengths: ["Extensive experience", "Enterprise architecture", "Mentoring"],
      concerns: ["Technology stack mismatch", "No React experience"]
    },
    {
      id: 5,
      name: "Sharmin Sultana",
      email: "sharmin.sultana@hrspace.local",
      phone: "+8801511122233",
      position: "Software Engineer",
      score: 78,
      skills: ["React", "PHP", "Laravel", "MySQL", "jQuery"],
      experience: 4,
      education: "B.S. Computer Science - Daffodil International University",
      matchPercentage: 78,
      status: 'pending',
      uploadDate: "2026-05-24",
      keyStrengths: ["React proficiency", "Web development"],
      concerns: ["Limited modern tooling", "Below experience threshold"]
    },
    {
      id: 6,
      name: "Arif Hossain",
      email: "arif.hossain@hrspace.local",
      phone: "+8801311122233",
      position: "Software Engineer",
      score: 65,
      skills: ["HTML", "CSS", "JavaScript", "WordPress", "Bootstrap"],
      experience: 3,
      education: "B.Sc. Information Technology - East West University",
      matchPercentage: 65,
      status: 'rejected',
      uploadDate: "2026-05-23",
      keyStrengths: ["Web fundamentals"],
      concerns: ["Insufficient experience", "Skill gap too large", "No modern framework knowledge"]
    }
  ];

  useEffect(() => {
    api.get("/cv-filter/positions")
      .then((response) => {
        if (response.data.positions?.length) {
          setJobPositions(response.data.positions);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let isMounted = true;

    api.get("/cv-filter/candidates", { params: { position: selectedJob } })
      .then((response) => {
        if (isMounted) {
          setApiCandidates(response.data.candidates || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiCandidates([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedJob]);

  const candidates = apiCandidates.length ? apiCandidates : fallbackCandidates;

  const filteredCandidates = candidates
    .filter(c => c.position === selectedJob)
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const stats = {
    total: candidates.filter(c => c.position === selectedJob).length,
    pending: candidates.filter(c => c.position === selectedJob && c.status === 'pending').length,
    shortlisted: candidates.filter(c => c.position === selectedJob && c.status === 'shortlisted').length,
    rejected: candidates.filter(c => c.position === selectedJob && c.status === 'rejected').length,
    avgScore: candidates.filter(c => c.position === selectedJob).length
      ? Math.round(candidates.filter(c => c.position === selectedJob).reduce((acc, c) => acc + c.score, 0) / candidates.filter(c => c.position === selectedJob).length)
      : 0
  };

  const resetCandidateForm = () => {
    setCandidateForm({
      name: "",
      email: "",
      phone: "",
      position: selectedJob,
      skills: "",
      experience: "0",
      education: "",
    });
    setCvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadCandidate = async () => {
    const formData = new FormData();
    Object.entries(candidateForm).forEach(([key, value]) => formData.append(key, value));
    if (cvFile) {
      formData.append("cv", cvFile);
    }

    const response = await api.post("/cv-filter/candidates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const candidate = response.data.candidate;
    setApiCandidates((current) => [candidate, ...current]);
    setSelectedJob(candidate.position);
    setSelectedCandidate(candidate);
    setIsUploadOpen(false);
    resetCandidateForm();
  };

  const handleUpdateStatus = async (candidateId: number, status: "shortlisted" | "rejected") => {
    const response = await api.patch(`/cv-filter/candidates/${candidateId}/status`, { status });
    const updatedCandidate = response.data.candidate;
    setApiCandidates((current) => current.map((candidate) => candidate.id === candidateId ? updatedCandidate : candidate));
    setSelectedCandidate(updatedCandidate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CV Filtration (AI)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered resume screening to identify top candidates efficiently
          </p>
        </div>
        <button
          onClick={() => {
            setCandidateForm((form) => ({ ...form, position: selectedJob }));
            setIsUploadOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload CVs
        </button>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsUploadOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Upload Candidate CV</h2>
              <p className="text-sm text-muted-foreground mt-1">Add candidate details and attach a resume file for screening.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Candidate Name</label>
                  <input
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Email</label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Phone</label>
                  <input
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Position</label>
                  <select
                    value={candidateForm.position}
                    onChange={(e) => setCandidateForm({ ...candidateForm, position: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {jobPositions.map(job => (
                      <option key={job} value={job}>{job}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Experience</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={candidateForm.experience}
                    onChange={(e) => setCandidateForm({ ...candidateForm, experience: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">CV File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Skills</label>
                <input
                  value={candidateForm.skills}
                  onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })}
                  placeholder="React, Node.js, TypeScript, AWS"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Education</label>
                <input
                  value={candidateForm.education}
                  onChange={(e) => setCandidateForm({ ...candidateForm, education: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCandidate}
                disabled={!candidateForm.name || !candidateForm.email || !candidateForm.position}
                className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Save Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Features Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#543884]/10 to-[#9A77CF]/10 border border-[#543884]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AI Analysis</p>
              <p className="text-sm font-semibold text-foreground">Automated Parsing</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#EC4176]/10 to-[#A13670]/10 border border-[#EC4176]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EC4176] to-[#A13670] flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Smart Matching</p>
              <p className="text-sm font-semibold text-foreground">Skills & Requirements</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#9A77CF]/10 to-[#543884]/10 border border-[#9A77CF]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9A77CF] to-[#543884] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bias Reduction</p>
              <p className="text-sm font-semibold text-foreground">Fair Screening</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#FFA45E]/10 to-[#EC4176]/10 border border-[#FFA45E]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFA45E] to-[#EC4176] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ranking System</p>
              <p className="text-sm font-semibold text-foreground">Candidate Scoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total CVs</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shortlisted</p>
              <p className="text-2xl font-bold text-foreground">{stats.shortlisted}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#9A77CF]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#9A77CF]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-2 block">Job Position</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {jobPositions.map(job => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-2 block">Status Filter</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filterStatus === 'all'
                    ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white'
                    : 'bg-background border border-border text-foreground hover:bg-accent'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-background border border-border text-foreground hover:bg-accent'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('shortlisted')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filterStatus === 'shortlisted'
                    ? 'bg-green-500 text-white'
                    : 'bg-background border border-border text-foreground hover:bg-accent'
                }`}
              >
                Shortlisted
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filterStatus === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-background border border-border text-foreground hover:bg-accent'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredCandidates.map(candidate => (
            <div
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${
                selectedCandidate?.id === candidate.id
                  ? 'border-[#9A77CF] shadow-lg'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white font-semibold">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                    <p className="text-xs text-muted-foreground">{candidate.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-[#FFA45E] fill-[#FFA45E]" />
                    <span className="text-xl font-bold text-foreground">{candidate.score}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI Score</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {candidate.experience} years
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {candidate.education}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(candidate.uploadDate).toLocaleDateString()}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Skills Match</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-[#543884]/10 text-[#543884] dark:text-[#9A77CF] rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 w-32 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#543884] to-[#9A77CF] rounded-full transition-all"
                      style={{ width: `${candidate.matchPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{candidate.matchPercentage}% match</span>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    candidate.status === 'shortlisted'
                      ? 'bg-green-500/10 text-green-500'
                      : candidate.status === 'rejected'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                </span>
              </div>
            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No candidates found</p>
            </div>
          )}
        </div>

        {/* Candidate Detail Panel */}
        <div className="lg:col-span-1">
          {selectedCandidate ? (
            <div className="bg-card border border-border rounded-xl p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Candidate Details</h3>
                <button type="button" className="p-2 hover:bg-accent rounded-lg transition-colors" onClick={() => {
                  if (!selectedCandidate) return;
                  const content = [
                    `Candidate: ${selectedCandidate.name}`,
                    `Position: ${selectedCandidate.position}`,
                    `Score: ${selectedCandidate.score}`,
                    `Email: ${selectedCandidate.email}`,
                    `Phone: ${selectedCandidate.phone}`,
                  ].join("\n");
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = selectedCandidate.cvUrl || url;
                  anchor.download = `${selectedCandidate.name.replace(/\s+/g, "-").toLowerCase()}-cv.txt`;
                  if (selectedCandidate.cvUrl) {
                    anchor.target = "_blank";
                  }
                  anchor.click();
                  if (!selectedCandidate.cvUrl) URL.revokeObjectURL(url);
                }}>
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center mb-6 pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                  {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-semibold text-foreground mb-1">{selectedCandidate.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{selectedCandidate.position}</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-[#FFA45E] fill-[#FFA45E]" />
                  <span className="text-3xl font-bold text-foreground">{selectedCandidate.score}</span>
                </div>
                <p className="text-xs text-muted-foreground">AI Compatibility Score</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Key Strengths
                  </p>
                  <ul className="space-y-1 ml-6">
                    {selectedCandidate.keyStrengths.map((strength, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">• {strength}</li>
                    ))}
                  </ul>
                </div>

                {selectedCandidate.concerns.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Concerns
                    </p>
                    <ul className="space-y-1 ml-6">
                      {selectedCandidate.concerns.map((concern, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground">• {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Education</p>
                  <p className="text-xs text-muted-foreground">{selectedCandidate.education}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Experience</p>
                  <p className="text-xs text-muted-foreground">{selectedCandidate.experience} years</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Contact</p>
                  <p className="text-xs text-muted-foreground">{selectedCandidate.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedCandidate.phone}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedCandidate.id, "shortlisted")}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Shortlist
                </button>
                <button
                  onClick={() => selectedCandidate.cvUrl && window.open(selectedCandidate.cvUrl, "_blank")}
                  disabled={!selectedCandidate.cvUrl}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View CV
                </button>
              </div>
              <button
                onClick={() => handleUpdateStatus(selectedCandidate.id, "rejected")}
                className="w-full mt-2 px-4 py-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-all text-sm"
              >
                <XCircle className="w-4 h-4 inline mr-1" />
                Reject Candidate
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center sticky top-6">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a candidate to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
