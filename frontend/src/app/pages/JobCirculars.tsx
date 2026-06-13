import { useEffect, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  Edit3,
  Eye,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";

type JobStatus = "draft" | "published" | "closed";
type ApplicationStatus = "submitted" | "reviewing" | "shortlisted" | "rejected" | "hired";

interface JobCircular {
  id: number;
  title: string;
  department: string;
  employmentType: "Full-time" | "Part-time" | "Contract";
  location: string;
  salaryRange: string | null;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  deadline: string;
  status: JobStatus;
}

interface JobApplication {
  id: number;
  applicantName: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  status: ApplicationStatus;
  score: number;
  cvUrl: string | null;
  appliedAt: string;
}

const emptyForm = {
  title: "",
  department: "",
  employmentType: "Full-time" as JobCircular["employmentType"],
  location: "",
  salaryRange: "",
  description: "",
  requirements: "",
  responsibilities: "",
  benefits: "",
  deadline: "",
  status: "draft" as JobStatus,
};

type JobForm = typeof emptyForm;

const fieldClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-[#9A77CF]";

function listText(items: string[]) {
  return items.join("\n");
}

function payload(form: JobForm) {
  return {
    ...form,
    requirements: form.requirements.split("\n").map((item) => item.trim()).filter(Boolean),
    responsibilities: form.responsibilities.split("\n").map((item) => item.trim()).filter(Boolean),
    benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
  };
}

export function JobCirculars() {
  const [jobs, setJobs] = useState<JobCircular[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobCircular | null>(null);
  const [editingJob, setEditingJob] = useState<JobCircular | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<{ circulars: JobCircular[] }>("/jobs");
      setJobs(response.data.circulars || []);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to load job circulars.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const openCreate = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (job: JobCircular) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      department: job.department,
      employmentType: job.employmentType,
      location: job.location,
      salaryRange: job.salaryRange || "",
      description: job.description,
      requirements: listText(job.requirements),
      responsibilities: listText(job.responsibilities),
      benefits: listText(job.benefits),
      deadline: job.deadline,
      status: job.status,
    });
    setFormOpen(true);
  };

  const saveJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, payload(form));
      } else {
        await api.post("/jobs", payload(form));
      }
      setFormOpen(false);
      await loadJobs();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to save this job circular.");
    } finally {
      setSaving(false);
    }
  };

  const changeJobStatus = async (job: JobCircular, status: JobStatus) => {
    setError("");
    try {
      const response = await api.patch<{ circular: JobCircular }>(`/jobs/${job.id}/status`, { status });
      setJobs((current) => current.map((item) => item.id === job.id ? response.data.circular : item));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to update job status.");
    }
  };

  const removeJob = async (job: JobCircular) => {
    if (!window.confirm(`Delete ${job.title}? This also removes its applications.`)) return;
    setError("");
    try {
      await api.delete(`/jobs/${job.id}`);
      setJobs((current) => current.filter((item) => item.id !== job.id));
      if (selectedJob?.id === job.id) setSelectedJob(null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to delete this job circular.");
    }
  };

  const viewApplications = async (job: JobCircular) => {
    setSelectedJob(job);
    setApplicationsLoading(true);
    setError("");
    try {
      const response = await api.get<{ applications: JobApplication[] }>(`/jobs/${job.id}/applications`);
      setApplications(response.data.applications || []);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to load applications.");
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const updateApplication = async (application: JobApplication, status: ApplicationStatus) => {
    const response = await api.patch<{ application: JobApplication }>(`/jobs/applications/${application.id}/status`, { status });
    setApplications((current) => current.map((item) => item.id === application.id ? response.data.application : item));
  };

  const updateScore = async (application: JobApplication, score: number) => {
    const response = await api.post<{ application: JobApplication }>(`/jobs/applications/${application.id}/score`, { score });
    setApplications((current) => current.map((item) => item.id === application.id ? response.data.application : item));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Circulars</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create openings and manage candidate applications.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadJobs} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#543884] to-[#9A77CF] px-4 py-2 text-sm text-white hover:brightness-110">
            <Plus className="h-4 w-4" /> New Circular
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#9A77CF]" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-semibold text-foreground">No job circulars yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create the first opening for your company.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${job.status === "published" ? "bg-emerald-100 text-emerald-700" : job.status === "closed" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-700"}`}>{job.status}</span>
                    <span className="text-xs text-muted-foreground">{job.employmentType}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{job.title}</h2>
                  <p className="text-sm text-muted-foreground">{job.department}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(job)} aria-label={`Edit ${job.title}`} className="rounded-lg p-2 hover:bg-accent"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => removeJob(job)} aria-label={`Delete ${job.title}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{job.deadline || "No deadline"}</span>
              </div>
              {job.salaryRange && <p className="mt-3 text-sm font-medium text-foreground">{job.salaryRange}</p>}
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description || "No description provided."}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <button onClick={() => viewApplications(job)} className="flex items-center gap-2 text-sm font-medium text-[#543884] hover:text-[#9A77CF]"><Users className="h-4 w-4" />View Applications</button>
                <select value={job.status} onChange={(event) => changeJobStatus(job, event.target.value as JobStatus)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
                  <option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <form onSubmit={saveJob} className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
              <div><h2 className="text-xl font-semibold">{editingJob ? "Edit Job Circular" : "New Job Circular"}</h2><p className="text-sm text-muted-foreground">Fields marked required must be completed.</p></div>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-2 hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="text-sm">Title *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm">Department *<input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm">Location *<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm">Employment Type<select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as JobForm["employmentType"] })} className={`${fieldClass} mt-1.5`}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></label>
              <label className="text-sm">Salary Range<input value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} className={`${fieldClass} mt-1.5`} placeholder="e.g. BDT 60,000 - 90,000" /></label>
              <label className="text-sm">Deadline<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              <label className="text-sm">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })} className={`${fieldClass} mt-1.5`}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
              <label className="text-sm md:col-span-2">Description<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${fieldClass} mt-1.5`} /></label>
              {(["requirements", "responsibilities", "benefits"] as const).map((field) => <label key={field} className="text-sm capitalize">{field}<textarea rows={4} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className={`${fieldClass} mt-1.5`} placeholder="One item per line" /></label>)}
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card p-5">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
              <button disabled={saving} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#543884] to-[#9A77CF] px-4 py-2 text-sm text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingJob ? "Save Changes" : "Create Circular"}</button>
            </div>
          </form>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
              <div><p className="text-sm text-muted-foreground">Applications for</p><h2 className="text-xl font-semibold">{selectedJob.title}</h2></div>
              <button onClick={() => setSelectedJob(null)} className="rounded-lg p-2 hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              {applicationsLoading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#9A77CF]" /></div> : applications.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No applications have been submitted.</p> : (
                <div className="space-y-3">{applications.map((application) => (
                  <div key={application.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div><h3 className="font-semibold">{application.applicantName}</h3><p className="text-sm text-muted-foreground">{application.email} · {application.phone}</p><p className="mt-1 text-xs text-muted-foreground">{application.experienceYears} years · {application.skills.join(", ") || "No skills listed"}</p></div>
                      <div className="flex flex-wrap items-center gap-2">
                        {application.cvUrl && <a href={application.cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"><Eye className="h-4 w-4" />CV</a>}
                        <label className="flex items-center gap-2 text-sm">Score<input type="number" min="0" max="100" defaultValue={application.score} onBlur={(e) => updateScore(application, Math.max(0, Math.min(100, Number(e.target.value))))} className="w-20 rounded-lg border border-border bg-background px-2 py-1.5" /></label>
                        <select value={application.status} onChange={(e) => updateApplication(application, e.target.value as ApplicationStatus)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="submitted">Submitted</option><option value="reviewing">Reviewing</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option><option value="hired">Hired</option></select>
                      </div>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
