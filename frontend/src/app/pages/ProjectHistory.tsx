import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Clock, FolderGit2, Loader2, RefreshCw, Search, User } from "lucide-react";
import api from "../services/api";

type ProjectStatus = "planning" | "active" | "on-hold" | "completed";
type TaskStatus = "todo" | "in-progress" | "in-review" | "completed";

interface ProjectTask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string;
  deadline: string;
  project: string;
  createdDate: string;
}

interface ProjectActivity {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  description: string;
  created_at: string;
}

interface ProjectHistoryItem {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  owner: string | null;
  startDate: string | null;
  endDate: string | null;
  tasks: ProjectTask[];
  completedTasksList: ProjectTask[];
  overdueTasks: number;
  completionDate: string | null;
  lastActivity: string | null;
  activities: ProjectActivity[];
}

interface HistoryFilters {
  project: string;
  assignee: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
}

const emptyFilters: HistoryFilters = { project: "", assignee: "", status: "", priority: "", startDate: "", endDate: "" };

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function actionLabel(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusBadge(status: string) {
  if (status === "completed") return "bg-green-500/10 text-green-700";
  if (status === "in-progress" || status === "active") return "bg-blue-500/10 text-blue-700";
  if (status === "in-review" || status === "planning") return "bg-purple-500/10 text-purple-700";
  if (status === "urgent" || status === "on-hold") return "bg-red-500/10 text-red-700";
  return "bg-muted text-muted-foreground";
}

export function ProjectHistory() {
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ProjectTask[]>([]);
  const [availableFilters, setAvailableFilters] = useState({ projects: [] as string[], assignees: [] as string[], statuses: [] as string[], priorities: [] as string[] });
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) || projects[0] || null, [projects, selectedProjectId]);

  async function loadHistory(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const response = await api.get("/projects/history", { params });
      const loadedProjects = response.data.projects || [];
      setProjects(loadedProjects);
      setCompletedTasks(response.data.completedTasks || []);
      setAvailableFilters(response.data.filters || { projects: [], assignees: [], statuses: [], priorities: [] });
      setSelectedProjectId((current) => current && loadedProjects.some((project: ProjectHistoryItem) => project.id === current) ? current : loadedProjects[0]?.id || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load project history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(key: keyof HistoryFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters() {
    loadHistory(filters);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    loadHistory(emptyFilters);
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#543884] to-[#9A77CF]">
            <FolderGit2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project History</h1>
            <p className="text-sm text-muted-foreground">DB-backed project, task, WBS, and Project Manager activity history.</p>
          </div>
        </div>
        <button type="button" onClick={() => loadHistory()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-[#9A77CF]" />
          <h2 className="font-semibold">Filters</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Project</span><select value={filters.project} onChange={(event) => updateFilter("project", event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All projects</option>{availableFilters.projects.map((project) => <option key={project} value={project}>{project}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Assignee</span><select value={filters.assignee} onChange={(event) => updateFilter("assignee", event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All assignees</option>{availableFilters.assignees.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Status</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All statuses</option>{availableFilters.statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Priority</span><select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All priorities</option>{availableFilters.priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">From</span><input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted-foreground">To</span><input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={applyFilters} className="rounded-lg bg-[#543884] px-4 py-2 text-sm font-medium text-white">Apply Filters</button>
          <button type="button" onClick={resetFilters} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Reset</button>
        </div>
      </section>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {error}</div>}

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading project history...</div>
      ) : !projects.length ? (
        <div className="min-h-[360px] rounded-xl border border-dashed border-border bg-card p-12 text-center"><FolderGit2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground" /><h2 className="font-semibold">No project history found</h2><p className="mt-1 text-sm text-muted-foreground">Try changing filters or completing a project task.</p></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-3">
            {projects.map((project) => {
              const selectedClass = selectedProject?.id === project.id ? "border-[#9A77CF] bg-[#9A77CF]/10" : "border-border bg-card";
              return (
                <button key={project.id} type="button" onClick={() => setSelectedProjectId(project.id)} className={"w-full rounded-xl border p-4 text-left transition hover:bg-accent " + selectedClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold text-foreground">{project.name}</h3><p className="mt-1 text-xs text-muted-foreground">Last activity: {formatDate(project.lastActivity)}</p></div>
                    <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + statusBadge(project.status)}>{project.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-background p-2"><strong>{project.tasks?.length || 0}</strong><br />Tasks</div>
                    <div className="rounded-lg bg-background p-2"><strong>{project.completedTasksList?.length || 0}</strong><br />Done</div>
                    <div className="rounded-lg bg-background p-2"><strong>{project.overdueTasks || 0}</strong><br />Overdue</div>
                  </div>
                </button>
              );
            })}
          </aside>

          <main className="space-y-6">
            {selectedProject && (
              <>
                <section className="rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div><h2 className="text-xl font-bold">{selectedProject.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedProject.description || "No description provided."}</p></div>
                    <span className={"rounded-full px-3 py-1 text-sm font-semibold " + statusBadge(selectedProject.status)}>{selectedProject.status}</span>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">Owner</p><p className="font-semibold">{selectedProject.owner || "Unassigned"}</p></div>
                    <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">Start</p><p className="font-semibold">{formatDate(selectedProject.startDate)}</p></div>
                    <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">End</p><p className="font-semibold">{formatDate(selectedProject.endDate)}</p></div>
                    <div className="rounded-lg bg-accent p-3"><p className="text-xs text-muted-foreground">Completion</p><p className="font-semibold">{formatDate(selectedProject.completionDate)}</p></div>
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-green-600" /> Completed Tasks</h3>
                  {!selectedProject.completedTasksList?.length ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No completed tasks match the current filters.</p> : (
                    <div className="space-y-3">
                      {selectedProject.completedTasksList.map((task) => (
                        <div key={task.id} className="rounded-xl border border-border p-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div><h4 className="font-semibold">{task.title}</h4><p className="mt-1 text-sm text-muted-foreground">{task.description}</p></div>
                            <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + statusBadge(task.priority)}>{task.priority}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {task.assignee}</span>
                            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Due {formatDate(task.deadline)}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Last updated {formatDate(task.createdDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold"><FolderGit2 className="h-5 w-5 text-[#9A77CF]" /> Project Manager Activity</h3>
                  {!selectedProject.activities?.length ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No project manager activity has been logged for this project yet.</p> : (
                    <div className="space-y-3">
                      {selectedProject.activities.slice(0, 12).map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div><p className="font-semibold">{actionLabel(activity.action)}</p><p className="mt-1 text-sm text-muted-foreground">{activity.description}</p></div>
                            <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{activity.actor_name} - {activity.actor_role}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Completed Task Index</h3>
        <p className="text-sm text-muted-foreground">{completedTasks.length} completed task(s) returned by the current backend filters.</p>
      </section>
    </div>
  );
}
