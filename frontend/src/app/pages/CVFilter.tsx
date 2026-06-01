import { useState } from "react";
import {
  Upload, FileText, Users, TrendingUp, Target,
  CheckCircle2, XCircle, Star, Search, Filter,
  Download, Eye, Brain, Sparkles, AlertCircle,
  BarChart3, Award, Briefcase, Calendar
} from "lucide-react";

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
}

export function CVFilter() {
  const [selectedJob, setSelectedJob] = useState("Senior Full Stack Developer");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const jobPositions = [
    "Senior Full Stack Developer",
    "Product Manager",
    "UI/UX Designer",
    "Data Scientist",
    "DevOps Engineer"
  ];

  const candidates: Candidate[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 234 567 8901",
      position: "Senior Full Stack Developer",
      score: 94,
      skills: ["React", "Node.js", "TypeScript", "AWS", "Docker", "PostgreSQL"],
      experience: 7,
      education: "M.S. Computer Science - Stanford University",
      matchPercentage: 94,
      status: 'shortlisted',
      uploadDate: "2026-05-28",
      keyStrengths: ["Strong full-stack experience", "Cloud architecture expertise", "Team leadership"],
      concerns: []
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "+1 234 567 8902",
      position: "Senior Full Stack Developer",
      score: 89,
      skills: ["React", "Python", "Django", "MySQL", "Redis", "Git"],
      experience: 6,
      education: "B.S. Software Engineering - MIT",
      matchPercentage: 89,
      status: 'shortlisted',
      uploadDate: "2026-05-27",
      keyStrengths: ["Solid backend skills", "Database optimization", "Agile methodology"],
      concerns: ["Limited AWS experience"]
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "+1 234 567 8903",
      position: "Senior Full Stack Developer",
      score: 86,
      skills: ["Vue.js", "Node.js", "MongoDB", "Express", "GraphQL"],
      experience: 5,
      education: "B.S. Computer Science - UC Berkeley",
      matchPercentage: 86,
      status: 'pending',
      uploadDate: "2026-05-26",
      keyStrengths: ["Modern tech stack", "API development", "Quick learner"],
      concerns: ["Less experience than preferred"]
    },
    {
      id: 4,
      name: "David Kim",
      email: "d.kim@email.com",
      phone: "+1 234 567 8904",
      position: "Senior Full Stack Developer",
      score: 82,
      skills: ["Angular", "Java", "Spring Boot", "Oracle", "Jenkins"],
      experience: 8,
      education: "M.S. Information Systems - Carnegie Mellon",
      matchPercentage: 82,
      status: 'pending',
      uploadDate: "2026-05-25",
      keyStrengths: ["Extensive experience", "Enterprise architecture", "Mentoring"],
      concerns: ["Technology stack mismatch", "No React experience"]
    },
    {
      id: 5,
      name: "Jessica Martinez",
      email: "j.martinez@email.com",
      phone: "+1 234 567 8905",
      position: "Senior Full Stack Developer",
      score: 78,
      skills: ["React", "PHP", "Laravel", "MySQL", "jQuery"],
      experience: 4,
      education: "B.S. Computer Science - University of Texas",
      matchPercentage: 78,
      status: 'pending',
      uploadDate: "2026-05-24",
      keyStrengths: ["React proficiency", "Web development"],
      concerns: ["Limited modern tooling", "Below experience threshold"]
    },
    {
      id: 6,
      name: "Robert Lee",
      email: "r.lee@email.com",
      phone: "+1 234 567 8906",
      position: "Senior Full Stack Developer",
      score: 65,
      skills: ["HTML", "CSS", "JavaScript", "WordPress", "Bootstrap"],
      experience: 3,
      education: "B.A. Information Technology - State University",
      matchPercentage: 65,
      status: 'rejected',
      uploadDate: "2026-05-23",
      keyStrengths: ["Web fundamentals"],
      concerns: ["Insufficient experience", "Skill gap too large", "No modern framework knowledge"]
    }
  ];

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
    avgScore: Math.round(candidates.filter(c => c.position === selectedJob).reduce((acc, c) => acc + c.score, 0) / candidates.filter(c => c.position === selectedJob).length)
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
        <button className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload CVs
        </button>
      </div>

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
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
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
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Shortlist
                </button>
                <button className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm">
                  <Eye className="w-4 h-4 inline mr-1" />
                  View CV
                </button>
              </div>
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
