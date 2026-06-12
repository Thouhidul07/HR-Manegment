import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Edit2, Loader2, Network, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import api from "../services/api";

type WbsStatus = "todo" | "in-progress" | "in-review" | "completed";
type WbsPriority = "low" | "medium" | "high" | "urgent";

interface Project { id: number; name: string; }
interface Employee { id: number; name: string; email?: string; }

interface WBSItem {
  id: number;
  projectId: number;
  projectName: string;
  parentId: number | null;
  title: string;
  description: string;
  assignedTo: number | null;
  assignedToName: string | null;
  status: WbsStatus;
  priority: WbsPriority;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  children?: WBSItem[];
}

interface WBSForm {
  id?: number;
  parentId: string;
  title: string;
  description: string;
  assignedTo: string;
  status: WbsStatus;
  priority: WbsPriority;
  startDate: string;
  dueDate: string;
  progress: string;
}

const emptyForm: WBSForm = {
  parentId: "",
  title: "",
  description: "",
  assignedTo: "",
  status: "todo",
  priority: "medium",
  startDate: "",
  dueDate: "",
  progress: "0",
};

function toDateInput(value: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

function statusLabel(status: WbsStatus) {
  if (status === "todo") return "To do";
  if (status === "in-progress") return "In progress";
  if (status === "in-review") return "In review";
  return "Completed";
}

function buildTree(items: WBSItem[]) {
  const byId = new Map(items.map((item) => [Number(item.id), { ...item, children: [] as WBSItem[] }]));
  const roots: WBSItem[] = [];
  byId.forEach((item) => {
    if (item.parentId && byId.has(Number(item.parentId))) byId.get(Number(item.parentId))?.children?.push(item);
    else roots.push(item);
  });
  return roots;
}

export function DesignWBS() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [items, setItems] = useState<WBSItem[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<WBSForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tree = useMemo(() => buildTree(items), [items]);
  const selectedProject = projects.find((project) => String(project.id) === selectedProjectId);
  const activeItems = items.filter((item) => item.status !== "completed").length;
  const completedItems = items.filter((item) => item.status === "completed").length;
  const overdueItems = items.filter((item) => item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "completed").length;

  async function loadProjects() {
    const response = await api.get("/projects");
    const loadedProjects = response.data.projects || [];
    setProjects(loadedProjects);
    if (!selectedProjectId && loadedProjects.length) {
      setSelectedProjectId(String(loadedProjects[0].id));
      return String(loadedProjects[0].id);
    }
    return selectedProjectId;
  }

  async function loadEmployees() {
    const response = await api.get("/employees");
    setEmployees(response.data.employees || []);
  }

  async function loadWbs(projectId: string) {
    if (!projectId) {
      setItems([]);
      return;
    }
    const response = await api.get(`/projects/${projectId}/wbs`);
    const loadedItems = response.data.wbsItems || [];
    setItems(loadedItems);
    setExpanded(new Set(loadedItems.map((item: WBSItem) => Number(item.id))));
  }

  async function loadPage(projectId = selectedProjectId) {
    setLoading(true);
    setError("");
    try {
      const [nextProjectId] = await Promise.all([loadProjects(), loadEmployees()]);
      await loadWbs(projectId || nextProjectId || "");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load WBS data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      setForm(emptyForm);
      loadWbs(selectedProjectId).catch((err) => setError(err?.response?.data?.message || "Unable to load project WBS."));
    }
  }, [selectedProjectId]);

  function updateForm(updates: Partial<WBSForm>) {
    setForm((current) => ({ ...current, ...updates }));
  }

  function editItem(item: WBSItem) {
    setForm({
      id: item.id,
      parentId: item.parentId ? String(item.parentId) : "",
      title: item.title,
      description: item.description || "",
      assignedTo: item.assignedTo ? String(item.assignedTo) : "",
      status: item.status,
      priority: item.priority,
      startDate: toDateInput(item.startDate),
      dueDate: toDateInput(item.dueDate),
      progress: String(item.progress || 0),
    });
  }

  async function saveItem() {
    if (!selectedProjectId) {
      setError("Select a project before adding WBS items.");
      return;
    }
    if (!form.title.trim()) {
      setError("WBS title is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        parentId: form.parentId ? Number(form.parentId) : null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        progress: Number(form.progress || 0),
      };

      if (form.id) {
        await api.put(`/projects/wbs/${form.id}`, { ...payload, projectId: Number(selectedProjectId) });
        setSuccess("WBS item updated.");
      } else {
        await api.post(`/projects/${selectedProjectId}/wbs`, payload);
        setSuccess("WBS item created.");
      }

      setForm(emptyForm);
      await loadWbs(selectedProjectId);
      window.setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to save WBS item.");
    } finally {
      setSaving(false);
    }
  }

  function addChild(parent: WBSItem) {
    setForm({
      ...emptyForm,
      parentId: String(parent.id),
      title: "New WBS task",
      startDate: toDateInput(parent.startDate),
      dueDate: toDateInput(parent.dueDate),
    });
    setExpanded((current) => new Set([...current, parent.id]));
  }

  async function deleteItem(item: WBSItem) {
    if (!window.confirm(`Delete "${item.title}" and any nested WBS items?`)) return;
    setError("");
    try {
      await api.delete(`/projects/wbs/${item.id}`);
      setSuccess("WBS item deleted.");
      await loadWbs(selectedProjectId);
      window.setTimeout(() => setSuccess(""), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to delete WBS item.");
    }
  }

  function toggle(id: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderItem(item: WBSItem, level = 0) {
    const children = item.children || [];
    const isOpen = expanded.has(item.id);
    return (
      <div key={item.id} className="space-y-2">
        <div className="rounded-xl border border-border bg-card p-4" style={{ marginLeft: level ? Math.min(level * 24, 96) : 0 }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toggle(item.id)} className="rounded p-1 hover:bg-accent disabled:opacity-40" disabled={!children.length}>
                  {children.length && isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <span className="rounded-full bg-[#543884]/10 px-2 py-0.5 text-xs font-semibold text-[#543884]">Level {level + 1}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{statusLabel(item.status)}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{item.priority}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">{item.title}</h3>
              {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <span>Assignee: {item.assignedToName || "Unassigned"}</span>
                <span>Start: {toDateInput(item.startDate) || "Not set"}</span>
                <span>Due: {toDateInput(item.dueDate) || "Not set"}</span>
                <span>Progress: {item.progress}%</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addChild(item)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"><Plus className="mr-1 inline h-4 w-4" /> Child</button>
              <button type="button" onClick={() => editItem(item)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"><Edit2 className="mr-1 inline h-4 w-4" /> Edit</button>
              <button type="button" onClick={() => deleteItem(item)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"><Trash2 className="mr-1 inline h-4 w-4" /> Delete</button>
            </div>
          </div>
        </div>
        {children.length > 0 && isOpen && <div className="space-y-2">{children.map((child) => renderItem(child, level + 1))}</div>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#543884] to-[#9A77CF]"><Network className="h-5 w-5 text-white" /></div>
          <div>
            <h1 className="text-3xl font-bold">Design WBS</h1>
            <p className="text-muted-foreground">Project Manager workspace for database-backed Work Breakdown Structures.</p>
          </div>
        </div>
        <button type="button" onClick={() => loadPage()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      {success && <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> {success}</div>}
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {error}</div>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Project</h2>
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#9A77CF]">
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            {selectedProject && <p className="mt-3 text-xs text-muted-foreground">Managing WBS for {selectedProject.name}</p>}
          </section>

          <section className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border bg-card p-3 text-center"><p className="text-2xl font-bold">{activeItems}</p><p className="text-xs text-muted-foreground">Active</p></div>
            <div className="rounded-xl border border-border bg-card p-3 text-center"><p className="text-2xl font-bold">{overdueItems}</p><p className="text-xs text-muted-foreground">Overdue</p></div>
            <div className="rounded-xl border border-border bg-card p-3 text-center"><p className="text-2xl font-bold">{completedItems}</p><p className="text-xs text-muted-foreground">Done</p></div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">{form.id ? "Edit WBS Item" : "Add WBS Item"}</h2>
            <div className="space-y-3">
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Parent</span><select value={form.parentId} onChange={(event) => updateForm({ parentId: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">Root item</option>{items.filter((item) => item.id !== form.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Title</span><input value={form.title} onChange={(event) => updateForm({ title: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="WBS task name" /></label>
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Description</span><textarea value={form.description} onChange={(event) => updateForm({ description: event.target.value })} className="h-20 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Scope or deliverable details" /></label>
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Assignee</span><select value={form.assignedTo} onChange={(event) => updateForm({ assignedTo: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Status</span><select value={form.status} onChange={(event) => updateForm({ status: event.target.value as WbsStatus })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="todo">To do</option><option value="in-progress">In progress</option><option value="in-review">In review</option><option value="completed">Completed</option></select></label>
                <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Priority</span><select value={form.priority} onChange={(event) => updateForm({ priority: event.target.value as WbsPriority })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Start date</span><input type="date" value={form.startDate} onChange={(event) => updateForm({ startDate: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" /></label>
                <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Due date</span><input type="date" value={form.dueDate} onChange={(event) => updateForm({ dueDate: event.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" /></label>
              </div>
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">Progress: {form.progress || 0}%</span><input type="range" min="0" max="100" value={form.progress} onChange={(event) => updateForm({ progress: event.target.value })} className="w-full" /></label>
              <div className="flex gap-2">
                <button type="button" onClick={() => saveItem()} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#543884] to-[#9A77CF] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{form.id ? "Update" : "Create"}</button>
                <button type="button" onClick={() => setForm(emptyForm)} className="rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-accent">Clear</button>
              </div>
            </div>
          </section>
        </aside>

        <main className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="font-semibold">WBS Structure</h2><p className="text-sm text-muted-foreground">Stored in MySQL and reloaded from the backend API.</p></div>
            <button type="button" onClick={() => setForm(emptyForm)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"><Plus className="h-4 w-4" /> Root Item</button>
          </div>
          {loading && <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading WBS data...</div>}
          {!loading && !selectedProjectId && <div className="min-h-[320px] rounded-xl border border-dashed border-border p-10 text-center"><Network className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h3 className="font-semibold">No project selected</h3><p className="mt-1 text-sm text-muted-foreground">Choose a project to manage its WBS items.</p></div>}
          {!loading && selectedProjectId && !items.length && <div className="min-h-[320px] rounded-xl border border-dashed border-border p-10 text-center"><Network className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h3 className="font-semibold">No WBS items yet</h3><p className="mt-1 text-sm text-muted-foreground">Create the first root item for this project.</p></div>}
          {!loading && tree.length > 0 && <div className="space-y-3">{tree.map((item) => renderItem(item))}</div>}
        </main>
      </div>
    </div>
  );
}
