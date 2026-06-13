import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Briefcase, Building2, Calendar, CheckCircle2, DollarSign, Loader2, MapPin, RefreshCw, Search, Send } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

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
  status: "published" | "closed";
  createdAt: string;
}

export function CircularApply() {
  const { user } = useAuth();
  const [circulars, setCirculars] = useState<JobCircular[]>([]);
  const [selectedCircular, setSelectedCircular] = useState<JobCircular | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    coverLetter: "",
    skills: "",
    experienceYears: "0",
  });
  const [cv, setCv] = useState<File | null>(null);

  const filteredCirculars = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return circulars;
    return circulars.filter((circular) =>
      [circular.title, circular.department, circular.location].some((value) => value.toLowerCase().includes(term))
    );
  }, [circulars, searchQuery]);

  async function loadCirculars() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/jobs/public");
      const loaded = response.data.circulars || [];
      setCirculars(loaded);
      setSelectedCircular((current) => current && loaded.some((item: JobCircular) => item.id === current.id) ? current : loaded[0] || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load job circulars.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCirculars();
  }, []);

  async function submitApplication(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCircular) return;
    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("email", form.email);
    payload.append("phone", form.phone);
    payload.append("coverLetter", form.coverLetter);
    payload.append("skills", form.skills);
    payload.append("experienceYears", form.experienceYears);
    if (cv) payload.append("cv", cv);

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.post("/jobs/public/" + selectedCircular.id + "/apply", payload);
      setSuccess(response.data.message || "Application submitted successfully.");
      setForm((current) => ({ ...current, phone: "", coverLetter: "", skills: "", experienceYears: "0" }));
      setCv(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Circulars & Apply</h1>
          <p className="mt-1 text-sm text-muted-foreground">Published opportunities and applications loaded from the recruitment database.</p>
        </div>
        <button type="button" onClick={loadCirculars} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> {success}</div>}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search title, department, or location" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm" />
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading published jobs...</div>
      ) : !filteredCirculars.length ? (
        <div className="min-h-[320px] rounded-xl border border-dashed border-border bg-card p-12 text-center"><Briefcase className="mx-auto mb-3 h-12 w-12 text-muted-foreground" /><h2 className="font-semibold">No published jobs found</h2><p className="mt-1 text-sm text-muted-foreground">HR can publish a job circular from the recruitment APIs.</p></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            {filteredCirculars.map((circular) => {
              const selected = selectedCircular?.id === circular.id;
              return (
                <button key={circular.id} type="button" onClick={() => { setSelectedCircular(circular); setSuccess(""); }} className={"w-full rounded-xl border p-5 text-left transition hover:bg-accent " + (selected ? "border-[#9A77CF] bg-[#9A77CF]/10" : "border-border bg-card")}>
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{circular.title}</h3><p className="mt-1 text-sm text-muted-foreground">{circular.description}</p></div>
                    <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-700">Published</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {circular.department}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {circular.location}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {circular.deadline || "No deadline"}</span>
                    <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> {circular.salaryRange || "Not disclosed"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCircular && (
            <aside className="space-y-5 rounded-xl border border-border bg-card p-6">
              <div><h2 className="text-lg font-bold">{selectedCircular.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedCircular.employmentType} - {selectedCircular.location}</p></div>
              {selectedCircular.requirements.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Requirements</h3><ul className="space-y-1 text-sm text-muted-foreground">{selectedCircular.requirements.map((item) => <li key={item}>- {item}</li>)}</ul></div>}
              {selectedCircular.responsibilities.length > 0 && <div><h3 className="mb-2 text-sm font-semibold">Responsibilities</h3><ul className="space-y-1 text-sm text-muted-foreground">{selectedCircular.responsibilities.map((item) => <li key={item}>- {item}</li>)}</ul></div>}

              <form onSubmit={submitApplication} className="space-y-3 border-t border-border pt-5">
                <h3 className="font-semibold">Apply</h3>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
                <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Skills, comma separated" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="number" min="0" step="0.5" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} placeholder="Experience years" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea value={form.coverLetter} onChange={(event) => setForm({ ...form, coverLetter: event.target.value })} placeholder="Cover letter" className="h-24 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setCv(event.target.files?.[0] || null)} className="w-full text-sm" />
                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#543884] to-[#9A77CF] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit Application
                </button>
              </form>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
