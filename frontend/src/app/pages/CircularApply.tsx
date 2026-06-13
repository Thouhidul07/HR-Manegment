import { useEffect, useState } from "react";
import {
  Briefcase, MapPin, Clock, DollarSign, Users,
  Calendar, CheckCircle2, Send, FileText, AlertCircle,
  Building2, TrendingUp, Star, Filter, Search
} from "lucide-react";
import api from "../services/api";
interface JobCircular {
  id: number;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  experience: string;
  salary: string;
  deadline: string;
  posted: string;
  openings: number;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: 'open' | 'closing-soon' | 'closed';
  applied: boolean;
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
  const [selectedCircular, setSelectedCircular] = useState<JobCircular | null>(null);
  const [filterType, setFilterType] = useState<JobFilterType>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationStep, setApplicationStep] = useState(1);

  const [circulars, setCirculars] = useState<JobCircular[]>([]);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationForm, setApplicationForm] = useState({ firstName: "", lastName: "", email: "", phone: "", experienceYears: "0", coverLetter: "", cv: null as File | null });

  useEffect(() => {
    api.get("/jobs/public")
      .then((response) => {
        setCirculars((response.data.circulars || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          type: job.employmentType || job.jobType || "Full-time",
          experience: job.experience || "Not specified",
          salary: job.salaryRange || "Not specified",
          deadline: job.deadline || "",
          posted: job.createdAt || "",
          openings: Number(job.openings || 1),
          description: job.description || "",
          requirements: job.requirements || [],
          responsibilities: job.responsibilities || [],
          benefits: job.benefits || [],
          status: job.status === "published" ? "open" : "closed",
          applied: false,
        })));
      })
      .catch(() => setCirculars([]));
  }, []);

  const filteredCirculars = circulars
    .filter(c => {
      if (filterType === 'open') return c.status === 'open';
      if (filterType === 'applied') return c.applied;
      return true;
    })
    .filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: circulars.length,
    open: circulars.filter(c => c.status === 'open').length,
    applied: circulars.filter(c => c.applied).length,
    closingSoon: circulars.filter(c => c.status === 'closing-soon').length
  };

  const handleApply = () => {
    setShowApplicationModal(true);
    setApplicationStep(1);
  };

  const handleNextStep = () => {
    setApplicationStep(2);
  };

  const handleBackStep = () => {
    setApplicationStep(1);
  };

  const submitApplication = async () => {
    if (!selectedCircular) return;

    const formData = new FormData();
    formData.append("name", `${applicationForm.firstName} ${applicationForm.lastName}`.trim());
    formData.append("email", applicationForm.email);
    formData.append("phone", applicationForm.phone);
    formData.append("experienceYears", applicationForm.experienceYears);
    formData.append("coverLetter", applicationForm.coverLetter);
    if (applicationForm.cv) {
      formData.append("cv", applicationForm.cv);
    }

    try {
      await api.post(`/jobs/public/${selectedCircular.id}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCirculars((current) => current.map((job) => job.id === selectedCircular.id ? { ...job, applied: true } : job));
      setSelectedCircular({ ...selectedCircular, applied: true });
      setApplicationMessage("Application submitted successfully.");
      setShowApplicationModal(false);
      setApplicationStep(1);
    } catch (error: any) {
      setApplicationMessage(error.response?.data?.message || "Unable to submit application.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Circulars & Apply</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore internal job opportunities and apply for positions
        </p>
      </div>

      {applicationMessage && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
          {applicationMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Openings</p>
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
              <p className="text-xs text-muted-foreground">Open Positions</p>
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
              <p className="text-xs text-muted-foreground">My Applications</p>
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
              <p className="text-xs text-muted-foreground">Closing Soon</p>
              <p className="text-2xl font-bold text-foreground">{stats.closingSoon}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
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

      {/* Job Circulars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredCirculars.map(circular => (
            <div
              key={circular.id}
              onClick={() => setSelectedCircular(circular)}
              className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg ${
                selectedCircular?.id === circular.id
                  ? 'border-[#9A77CF] shadow-lg'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{circular.title}</h3>
                    {circular.applied && (
                      <span className="px-2 py-0.5 bg-[#9A77CF]/10 text-[#9A77CF] rounded-full text-xs font-semibold">
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
                      {circular.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {circular.experience}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    circular.status === 'open'
                      ? 'bg-green-500/10 text-green-500'
                      : circular.status === 'closing-soon'
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {circular.status === 'closing-soon' ? 'Closing Soon' : circular.status.charAt(0).toUpperCase() + circular.status.slice(1)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {circular.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {circular.salary}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {circular.openings} opening{circular.openings > 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline: {new Date(circular.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredCirculars.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No job circulars found</p>
            </div>
          )}
        </div>

        {/* Job Detail Panel */}
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
                    selectedCircular.status === 'open'
                      ? 'bg-green-500/10 text-green-500'
                      : selectedCircular.status === 'closing-soon'
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {selectedCircular.status === 'closing-soon' ? 'Closing Soon' : selectedCircular.status.charAt(0).toUpperCase() + selectedCircular.status.slice(1)}
                </span>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-semibold text-foreground">{selectedCircular.experience}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Salary Range</span>
                  <span className="font-semibold text-foreground">{selectedCircular.salary}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Job Type</span>
                  <span className="font-semibold text-foreground">{selectedCircular.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Openings</span>
                  <span className="font-semibold text-foreground">{selectedCircular.openings}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-semibold text-foreground">{new Date(selectedCircular.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Description</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedCircular.description}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Requirements</p>
                  <ul className="space-y-1">
                    {selectedCircular.requirements.slice(0, 3).map((req, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">• {req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Benefits</p>
                  <ul className="space-y-1">
                    {selectedCircular.benefits.slice(0, 3).map((benefit, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">• {benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedCircular.applied ? (
                <button
                  disabled
                  className="w-full px-4 py-3 bg-accent text-muted-foreground rounded-lg text-sm font-semibold cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  Already Applied
                </button>
              ) : (
                <button
                  onClick={handleApply}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold"
                >
                  <Send className="w-4 h-4 inline mr-2" />
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

      {/* Application Modal */}
      {showApplicationModal && selectedCircular && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Apply for {selectedCircular.title}</h3>
                <span className="text-sm text-muted-foreground">Step {applicationStep} of 2</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedCircular.department} • {selectedCircular.location}</p>

              {/* Progress Bar */}
              <div className="flex gap-2 mt-4">
                <div className={`flex-1 h-1 rounded-full ${applicationStep >= 1 ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF]' : 'bg-border'}`} />
                <div className={`flex-1 h-1 rounded-full ${applicationStep >= 2 ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF]' : 'bg-border'}`} />
              </div>
            </div>

            {applicationStep === 1 ? (
              // Step 1: Job Form Fill
              <div className="p-6 space-y-4">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-foreground mb-1">Personal Information</h4>
                  <p className="text-xs text-muted-foreground">Please fill out your details</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicationForm.firstName}
                      onChange={(event) => setApplicationForm({ ...applicationForm, firstName: event.target.value })}
                      placeholder="Tanvir"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicationForm.lastName}
                      onChange={(event) => setApplicationForm({ ...applicationForm, lastName: event.target.value })}
                      placeholder="Hasan"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={applicationForm.email}
                    onChange={(event) => setApplicationForm({ ...applicationForm, email: event.target.value })}
                    placeholder="tanvir.hasan@example.com"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={applicationForm.phone}
                    onChange={(event) => setApplicationForm({ ...applicationForm, phone: event.target.value })}
                    placeholder="+8801712345678"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Current Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Gulshan, Dhaka"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Years of Experience <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={applicationForm.experienceYears}
                      onChange={(event) => setApplicationForm({ ...applicationForm, experienceYears: event.target.value })}
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="0-1">0-1 years</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-7">5-7 years</option>
                      <option value="7-10">7-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Expected Salary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., ৳80,000 - ৳100,000"
                      className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/tanvirhasan"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Portfolio/Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://tanvirhasan.dev"
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    How did you hear about this position?
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="company-website">Company Website</option>
                    <option value="job-board">Job Board</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="referral">Employee Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            ) : (
              // Step 2: Application Documents
              <div className="p-6 space-y-4">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-foreground mb-1">Application Documents</h4>
                  <p className="text-xs text-muted-foreground">Upload your documents and cover letter</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applicationForm.coverLetter}
                    onChange={(event) => setApplicationForm({ ...applicationForm, coverLetter: event.target.value })}
                    placeholder="Why are you interested in this position?"
                    rows={6}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Resume/CV <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(event) => setApplicationForm({ ...applicationForm, cv: event.target.files?.[0] || null })}
                      className="mb-3 text-sm"
                    />
                    <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Additional Information</label>
                  <textarea
                    placeholder="Any additional information you'd like to share..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            )}

            <div className="p-6 border-t border-border flex gap-3">
              {applicationStep === 1 ? (
                <>
                  <button
                    onClick={() => {
                      setShowApplicationModal(false);
                      setApplicationStep(1);
                    }}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold"
                  >
                    Next: Documents →
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBackStep}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={submitApplication}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold"
                  >
                    Submit Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
