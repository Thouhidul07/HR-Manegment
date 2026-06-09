import { useState, useEffect, useRef } from "react";
import {
  Briefcase, MapPin, Clock, DollarSign, Users,
  Calendar, CheckCircle2, Send, FileText, AlertCircle,
  Building2, TrendingUp, Star, Filter, Search, Plus,
  ArrowLeft, Trash2, Edit, XCircle, ChevronRight, Eye, Download
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface JobCircular {
  id: number;
  companyId: number;
  title: string;
  department: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  location: string;
  salaryRange: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  deadline: string;
  status: 'draft' | 'published' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

interface JobApplication {
  id: number;
  companyId: number;
  circularId: number;
  circularTitle: string;
  applicantName: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvFile: string | null;
  skills: string[];
  experienceYears: number;
  status: 'submitted' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  score: number;
  createdAt: string;
  updatedAt?: string;
}

type JobFilterType = 'all' | 'open' | 'applied';

const jobFilterStyles: Record<
  JobFilterType,
  { label: string; active: string; idle: string; dot: string }
> = {
  all: {
    label: "All Jobs",
    active: "border-[#9A77CF] bg-[#9A77CF]/25 text-white shadow-sm shadow-[#9A77CF]/20",
    idle: "border-[#9A77CF]/25 bg-[#9A77CF]/10 text-[#CBB7FF] hover:border-[#9A77CF]/60",
    dot: "bg-[#9A77CF]",
  },
  open: {
    label: "Open",
    active: "border-emerald-400 bg-emerald-400/20 text-emerald-100 shadow-sm shadow-emerald-950/20",
    idle: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/60",
    dot: "bg-emerald-400",
  },
  applied: {
    label: "Applied",
    active: "border-sky-400 bg-sky-400/20 text-sky-100 shadow-sm shadow-sky-950/20",
    idle: "border-sky-400/25 bg-sky-400/10 text-sky-300 hover:border-sky-400/60",
    dot: "bg-sky-400",
  },
};

export function CircularApply() {
  const { user, isAuthenticated } = useAuth();
  const isAdminOrHR = isAuthenticated && (user?.role === "admin" || user?.role === "hr_manager");

  // State
  const [circulars, setCirculars] = useState<JobCircular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCircular, setSelectedCircular] = useState<JobCircular | null>(null);
  const [filterType, setFilterType] = useState<JobFilterType>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationStep, setApplicationStep] = useState(1);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccessMessage, setAppSuccessMessage] = useState<string | null>(null);

  // Application Form State
  const [appForm, setAppForm] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    experience_years: "0",
    cover_letter: "",
    education: ""
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  // Management Mode States
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [submittingCircular, setSubmittingCircular] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);

  // Circular Form State
  const [circForm, setCircForm] = useState({
    title: "",
    department: "",
    employmentType: "Full-time" as 'Full-time' | 'Part-time' | 'Contract',
    location: "",
    salaryRange: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    deadline: "",
    status: "draft" as 'draft' | 'published' | 'closed'
  });

  // Fetch Jobs
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isAdminOrHR ? "/jobs" : "/jobs/public";
      const response = await api.get(endpoint);
      setCirculars(response.data.circulars || []);
      
      // Select first circular by default if available
      if (response.data.circulars?.length > 0) {
        setSelectedCircular(response.data.circulars[0]);
      } else {
        setSelectedCircular(null);
      }
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load job circulars. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Applications (For Admin/HR)
  const fetchApplications = async (circularId: number) => {
    setLoadingApps(true);
    setSelectedApplication(null);
    try {
      const response = await api.get(`/jobs/${circularId}/applications`);
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Load previously applied jobs from memory/session to display status correctly
    const localApplied = localStorage.getItem("hrspace_applied_jobs");
    if (localApplied) {
      try {
        setAppliedJobs(JSON.parse(localApplied));
      } catch {}
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isAdminOrHR && selectedCircular) {
      fetchApplications(selectedCircular.id);
    }
  }, [selectedCircular, isAdminOrHR]);

  const handleApplyClick = () => {
    if (user) {
      setAppForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        skills: "",
        experience_years: "0",
        cover_letter: "",
        education: ""
      });
    } else {
      setAppForm({
        name: "",
        email: "",
        phone: "",
        skills: "",
        experience_years: "0",
        cover_letter: "",
        education: ""
      });
    }
    setCvFile(null);
    setShowApplicationModal(true);
    setApplicationStep(1);
    setAppSuccessMessage(null);
  };

  const submitApplication = async () => {
    if (!selectedCircular) return;
    setSubmittingApp(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", appForm.name);
      formData.append("email", appForm.email);
      formData.append("phone", appForm.phone);
      formData.append("skills", appForm.skills);
      formData.append("experience_years", appForm.experience_years);
      formData.append("cover_letter", appForm.cover_letter);
      formData.append("education", appForm.education);
      if (cvFile) {
        formData.append("cv", cvFile);
      }

      await api.post(`/jobs/public/${selectedCircular.id}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Update local tracking
      const newApplied = [...appliedJobs, selectedCircular.id];
      setAppliedJobs(newApplied);
      localStorage.setItem("hrspace_applied_jobs", JSON.stringify(newApplied));

      setAppSuccessMessage("Application submitted successfully. HR will review your profile.");
      setApplicationStep(3); // success screen
    } catch (err: any) {
      console.error("Application error:", err);
      setError(err.response?.data?.message || "Failed to submit application. Please check input fields.");
    } finally {
      setSubmittingApp(false);
    }
  };

  // Admin/HR Action - Create/Update Circular
  const handleSaveCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCircular(true);
    try {
      const payload = {
        ...circForm,
        requirements: circForm.requirements.split("\n").map(line => line.trim()).filter(Boolean),
        responsibilities: circForm.responsibilities.split("\n").map(line => line.trim()).filter(Boolean),
        benefits: circForm.benefits.split("\n").map(line => line.trim()).filter(Boolean)
      };

      if (viewMode === 'create') {
        const response = await api.post("/jobs", payload);
        setCirculars([response.data.circular, ...circulars]);
        setSelectedCircular(response.data.circular);
      } else if (viewMode === 'edit' && selectedCircular) {
        const response = await api.put(`/jobs/${selectedCircular.id}`, payload);
        setCirculars(circulars.map(c => c.id === selectedCircular.id ? response.data.circular : c));
        setSelectedCircular(response.data.circular);
      }

      setViewMode('list');
    } catch (err) {
      console.error("Failed to save circular:", err);
      setError("Failed to save circular details.");
    } finally {
      setSubmittingCircular(false);
    }
  };

  const handleEditClick = () => {
    if (!selectedCircular) return;
    setCircForm({
      title: selectedCircular.title,
      department: selectedCircular.department,
      employmentType: selectedCircular.employmentType,
      location: selectedCircular.location,
      salaryRange: selectedCircular.salaryRange || "",
      description: selectedCircular.description || "",
      requirements: selectedCircular.requirements.join("\n"),
      responsibilities: selectedCircular.responsibilities.join("\n"),
      benefits: selectedCircular.benefits.join("\n"),
      deadline: selectedCircular.deadline || "",
      status: selectedCircular.status
    });
    setViewMode('edit');
  };

  const handleCreateClick = () => {
    setCircForm({
      title: "",
      department: "",
      employmentType: "Full-time",
      location: "",
      salaryRange: "",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      deadline: "",
      status: "draft"
    });
    setViewMode('create');
  };

  const handleDeleteCircular = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this job circular? This cannot be undone.")) return;
    try {
      await api.delete(`/jobs/${id}`);
      const updated = circulars.filter(c => c.id !== id);
      setCirculars(updated);
      setSelectedCircular(updated.length > 0 ? updated[0] : null);
    } catch (err) {
      console.error("Error deleting circular:", err);
      setError("Failed to delete circular.");
    }
  };

  const handleUpdateAppStatus = async (appId: number, status: JobApplication['status']) => {
    try {
      const response = await api.patch(`/jobs/applications/${appId}/status`, { status });
      setApplications(applications.map(app => app.id === appId ? response.data.application : app));
      setSelectedApplication(response.data.application);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateAppScore = async (appId: number, score: number) => {
    try {
      const response = await api.post(`/jobs/applications/${appId}/score`, { score });
      setApplications(applications.map(app => app.id === appId ? response.data.application : app));
      setSelectedApplication(response.data.application);
    } catch (err) {
      console.error("Failed to update score:", err);
    }
  };

  // Filter & Search Logic
  const filteredCirculars = circulars
    .filter(c => {
      if (filterType === 'open') return c.status === 'published';
      if (filterType === 'applied') return appliedJobs.includes(c.id);
      return true;
    })
    .filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: circulars.length,
    open: circulars.filter(c => c.status === 'published').length,
    applied: appliedJobs.length,
    drafts: circulars.filter(c => c.status === 'draft').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdminOrHR ? "Recruitment & Job Circulars" : "Job Circulars & Apply"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdminOrHR 
              ? "Manage circulars, view applications and run candidate evaluations." 
              : "Explore career opportunities and apply directly."}
          </p>
        </div>

        {isAdminOrHR && viewMode === 'list' && (
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Job Circular
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm">{error}</span>
          </div>
          <button 
            onClick={() => fetchJobs()} 
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/35 transition-colors rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <div className="w-10 h-10 border-4 border-[#9A77CF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading job circulars...</p>
        </div>
      ) : viewMode !== 'list' ? (
        // Circular Form (Create/Edit)
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setViewMode('list')}
              className="p-2 hover:bg-accent rounded-lg text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-foreground">
              {viewMode === 'create' ? "Create New Job Circular" : "Edit Job Circular"}
            </h2>
          </div>

          <form onSubmit={handleSaveCircular} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Job Title *</label>
                <input
                  type="text"
                  required
                  value={circForm.title}
                  onChange={(e) => setCircForm({...circForm, title: e.target.value})}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Department *</label>
                <input
                  type="text"
                  required
                  value={circForm.department}
                  onChange={(e) => setCircForm({...circForm, department: e.target.value})}
                  placeholder="e.g. Information Technology"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Employment Type</label>
                <select
                  value={circForm.employmentType}
                  onChange={(e) => setCircForm({...circForm, employmentType: e.target.value as any})}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Location *</label>
                <input
                  type="text"
                  required
                  value={circForm.location}
                  onChange={(e) => setCircForm({...circForm, location: e.target.value})}
                  placeholder="e.g. Banani, Dhaka"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Salary Range</label>
                <input
                  type="text"
                  value={circForm.salaryRange}
                  onChange={(e) => setCircForm({...circForm, salaryRange: e.target.value})}
                  placeholder="e.g. ৳90,000 - ৳120,000"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Deadline *</label>
                <input
                  type="date"
                  required
                  value={circForm.deadline}
                  onChange={(e) => setCircForm({...circForm, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Status</label>
                <select
                  value={circForm.status}
                  onChange={(e) => setCircForm({...circForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Job Description</label>
              <textarea
                value={circForm.description}
                onChange={(e) => setCircForm({...circForm, description: e.target.value})}
                rows={4}
                placeholder="Brief summary of the role..."
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Requirements (One item per line)</label>
              <textarea
                value={circForm.requirements}
                onChange={(e) => setCircForm({...circForm, requirements: e.target.value})}
                rows={4}
                placeholder="e.g. 3+ years of React experience"
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Responsibilities (One item per line)</label>
              <textarea
                value={circForm.responsibilities}
                onChange={(e) => setCircForm({...circForm, responsibilities: e.target.value})}
                rows={4}
                placeholder="e.g. Develop new user interface modules"
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Benefits (One item per line)</label>
              <textarea
                value={circForm.benefits}
                onChange={(e) => setCircForm({...circForm, benefits: e.target.value})}
                rows={4}
                placeholder="e.g. Two festival bonuses"
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCircular}
                className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50"
              >
                {submittingCircular ? "Saving..." : "Save Circular"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // List Mode
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAdminOrHR ? "Total Circulars" : "Total Openings"}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-foreground">{stats.open}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#9A77CF]/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#9A77CF]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAdminOrHR ? "Applied Tracker" : "My Applications"}</p>
                  <p className="text-2xl font-bold text-foreground">{stats.applied}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAdminOrHR ? "Drafts" : "Closing Soon"}</p>
                  <p className="text-2xl font-bold text-foreground">{isAdminOrHR ? stats.drafts : circulars.length > 0 ? stats.open : 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {!isAdminOrHR && (
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-2 block">Filter By</label>
                  <div className="flex gap-2">
                    {(Object.keys(jobFilterStyles) as JobFilterType[]).map((filter) => {
                      const styles = jobFilterStyles[filter];
                      const isActive = filterType === filter;

                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setFilterType(filter)}
                          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                            isActive ? styles.active : styles.idle
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                          {styles.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by title, department, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid Layout (List left, detail right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredCirculars.map(circular => {
                const isSelected = selectedCircular?.id === circular.id;
                const hasApplied = appliedJobs.includes(circular.id);

                return (
                  <div
                    key={circular.id}
                    onClick={() => setSelectedCircular(circular)}
                    className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected
                        ? 'border-[#9A77CF] shadow-lg'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{circular.title}</h3>
                          {hasApplied && (
                            <span className="px-2 py-0.5 bg-[#9A77CF]/10 text-[#9A77CF] rounded-full text-xs font-semibold animate-pulse">
                              Applied
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {circular.department}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {circular.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {circular.employmentType}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          circular.status === 'published'
                            ? 'bg-green-500/10 text-green-500'
                            : circular.status === 'closed'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {circular.status === 'published' ? 'Published' : circular.status.charAt(0).toUpperCase() + circular.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {circular.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {circular.salaryRange && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {circular.salaryRange}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Deadline: {circular.deadline ? new Date(circular.deadline).toLocaleDateString() : "No limit"}
                        </div>
                      </div>

                      {isAdminOrHR && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedCircular(circular);
                              handleEditClick();
                            }}
                            className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCircular(circular.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredCirculars.length === 0 && (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No open job circulars are available right now.</p>
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              {selectedCircular ? (
                <div className="bg-card border border-border rounded-xl p-5 sticky top-6">
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg text-foreground mb-2">{selectedCircular.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Building2 className="w-3.5 h-3.5" />
                      {selectedCircular.department} • {selectedCircular.location}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedCircular.status === 'published'
                          ? 'bg-green-500/10 text-green-500'
                          : selectedCircular.status === 'closed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {selectedCircular.status.charAt(0).toUpperCase() + selectedCircular.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6 pb-6 border-b border-border text-sm">
                    {selectedCircular.salaryRange && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Salary Range</span>
                        <span className="font-semibold text-foreground">{selectedCircular.salaryRange}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Job Type</span>
                      <span className="font-semibold text-foreground">{selectedCircular.employmentType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-semibold text-foreground">
                        {selectedCircular.deadline ? new Date(selectedCircular.deadline).toLocaleDateString() : "No limit"}
                      </span>
                    </div>
                  </div>

                  {/* Panel Sections */}
                  <div className="space-y-6 mb-6">
                    {selectedCircular.description && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Description</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedCircular.description}</p>
                      </div>
                    )}

                    {selectedCircular.requirements?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Requirements</p>
                        <ul className="space-y-1">
                          {selectedCircular.requirements.map((req, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedCircular.responsibilities?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Responsibilities</p>
                        <ul className="space-y-1">
                          {selectedCircular.responsibilities.map((resp, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {resp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedCircular.benefits?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Benefits</p>
                        <ul className="space-y-1">
                          {selectedCircular.benefits.map((benefit, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {isAdminOrHR ? (
                    // Admin/HR View Applications Link
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          fetchApplications(selectedCircular.id);
                          setViewMode('list'); // ensures viewing right detail
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Applications Received ({applications.length})
                      </button>

                      {/* Display application list inside detail panel */}
                      {applications.length > 0 && (
                        <div className="border-t border-border pt-4 mt-4">
                          <h4 className="text-xs font-semibold text-foreground mb-3">Applicants</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {applications.map(app => (
                              <div
                                key={app.id}
                                onClick={() => setSelectedApplication(app)}
                                className={`p-2 rounded-lg border text-left transition-all ${
                                  selectedApplication?.id === app.id
                                    ? 'bg-accent/40 border-[#9A77CF]'
                                    : 'border-border bg-accent/10 hover:bg-accent/25'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-semibold text-foreground line-clamp-1">{app.applicantName}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-card rounded text-muted-foreground font-mono">
                                    Score: {app.score}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                  <span>{app.experienceYears} yrs exp</span>
                                  <span className={`capitalize ${
                                    app.status === 'shortlisted' ? 'text-green-400' :
                                    app.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                                  }`}>{app.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : appliedJobs.includes(selectedCircular.id) ? (
                    <button
                      disabled
                      className="w-full px-4 py-3 bg-accent text-muted-foreground rounded-lg text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Already Applied
                    </button>
                  ) : (
                    <button
                      onClick={handleApplyClick}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Apply Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 text-center sticky top-6">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Select a job circular to view details</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedCircular && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setShowApplicationModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Apply for {selectedCircular.title}</h3>
                {applicationStep <= 2 && (
                  <span className="text-sm text-muted-foreground">Step {applicationStep} of 2</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedCircular.department} • {selectedCircular.location}</p>

              {applicationStep <= 2 && (
                <div className="flex gap-2 mt-4">
                  <div className={`flex-1 h-1 rounded-full ${applicationStep >= 1 ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF]' : 'bg-border'}`} />
                  <div className={`flex-1 h-1 rounded-full ${applicationStep >= 2 ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF]' : 'bg-border'}`} />
                </div>
              )}
            </div>

            {applicationStep === 1 ? (
              // Step 1: Personal Details
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={appForm.name}
                      onChange={(e) => setAppForm({...appForm, name: e.target.value})}
                      placeholder="e.g. Tanvir Hasan"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={appForm.email}
                      onChange={(e) => setAppForm({...appForm, email: e.target.value})}
                      placeholder="e.g. tanvir@example.com"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={appForm.phone}
                      onChange={(e) => setAppForm({...appForm, phone: e.target.value})}
                      placeholder="e.g. +8801712345678"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Years of Experience <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.5"
                      value={appForm.experience_years}
                      onChange={(e) => setAppForm({...appForm, experience_years: e.target.value})}
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Education / Highest Degree</label>
                  <input
                    type="text"
                    value={appForm.education}
                    onChange={(e) => setAppForm({...appForm, education: e.target.value})}
                    placeholder="e.g. B.S. Computer Science - University of Dhaka"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={appForm.skills}
                    onChange={(e) => setAppForm({...appForm, skills: e.target.value})}
                    placeholder="e.g. React, Node.js, TypeScript, AWS"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ) : applicationStep === 2 ? (
              // Step 2: Documents & Cover Letter
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={appForm.cover_letter}
                    onChange={(e) => setAppForm({...appForm, cover_letter: e.target.value})}
                    placeholder="Why are you a good fit for this role?"
                    rows={5}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Upload CV (PDF, DOC, DOCX - Max 5MB) <span className="text-red-500">*</span>
                  </label>
                  <div 
                    onClick={() => cvInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={cvInputRef}
                      accept=".pdf,.doc,.docx"
                      required
                      className="hidden"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    />
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      {cvFile ? cvFile.name : "Click to upload your CV"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cvFile ? `${(cvFile.size / (1024 * 1024)).toFixed(2)} MB` : "Only PDF, DOC, and DOCX are accepted"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Step 3: Success Screen
              <div className="p-10 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h4 className="text-xl font-bold text-foreground">Application Submitted!</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {appSuccessMessage || "Application submitted successfully. HR will review your profile."}
                </p>
              </div>
            )}

            <div className="p-6 border-t border-border flex gap-3">
              {applicationStep === 1 ? (
                <>
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setApplicationStep(2)}
                    disabled={!appForm.name || !appForm.email || !appForm.phone}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50"
                  >
                    Next: Documents →
                  </button>
                </>
              ) : applicationStep === 2 ? (
                <>
                  <button
                    onClick={() => setApplicationStep(1)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={submitApplication}
                    disabled={submittingApp || !appForm.cover_letter || !cvFile}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50"
                  >
                    {submittingApp ? "Submitting..." : "Submit Application"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    fetchJobs(); // reload list
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold text-center"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Evaluation Detail Panel (For Admin/HR) */}
      {isAdminOrHR && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="text-center mb-6 pb-6 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {selectedApplication.applicantName.split(' ').map(n => n[0]).join('')}
              </div>
              <h4 className="font-semibold text-lg text-foreground mb-1">{selectedApplication.applicantName}</h4>
              <p className="text-xs text-muted-foreground">{selectedApplication.circularTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedApplication.email} • {selectedApplication.phone}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-accent/20 p-3 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Compatibility Score</p>
                  <p className="text-lg font-bold text-foreground">{selectedApplication.score}%</p>
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] text-muted-foreground block mb-1">Adjust Score</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedApplication.score}
                    onChange={(e) => handleUpdateAppScore(selectedApplication.id, Number(e.target.value))}
                    className="w-full accent-[#9A77CF]"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Experience</p>
                <p className="text-xs text-muted-foreground">{selectedApplication.experienceYears} years</p>
              </div>

              {selectedApplication.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplication.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#543884]/15 text-[#9A77CF] rounded text-[10px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Cover Letter</p>
                <div className="p-3 bg-accent/10 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar">
                  {selectedApplication.coverLetter}
                </div>
              </div>

              {selectedApplication.cvFile && (
                <div className="flex justify-between items-center border border-border p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#9A77CF]" />
                    <span className="text-xs text-foreground font-semibold">Attached Resume</span>
                  </div>
                  <button
                    onClick={() => selectedApplication.cvFile && window.open(selectedApplication.cvFile, "_blank")}
                    className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-[#9A77CF] transition-colors"
                    title="View CV"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-foreground">Change Application Status</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateAppStatus(selectedApplication.id, "reviewing")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedApplication.status === 'reviewing' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                      : 'border border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Reviewing
                </button>
                <button
                  onClick={() => handleUpdateAppStatus(selectedApplication.id, "shortlisted")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedApplication.status === 'shortlisted' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                      : 'border border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Shortlist
                </button>
                <button
                  onClick={() => handleUpdateAppStatus(selectedApplication.id, "rejected")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedApplication.status === 'rejected' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                      : 'border border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateAppStatus(selectedApplication.id, "hired")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedApplication.status === 'hired' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                      : 'border border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Hire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
