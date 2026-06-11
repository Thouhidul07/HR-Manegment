import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, RefreshCcw, Plus, UserMinus, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import api from "../services/api";

type LifecycleType = "onboarding" | "offboarding";
type TaskStatus = "pending" | "in_progress" | "completed";

type LifecycleTask = {
  id: number;
  stepId: number;
  stepOrder: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
};

type LifecycleCase = {
  id: number;
  type: LifecycleType;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  startDate?: string | null;
  targetDate?: string | null;
  completedAt?: string | null;
  progress: number;
  currentStep: number;
  employee: {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string;
    designation: string;
    avatar?: string;
  };
  tasks: LifecycleTask[];
};

type EligibleUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  avatar?: string;
};

type LifecycleStats = {
  activeOnboarding: number;
  completedThisMonth: number;
  pendingTasks: number;
  averageTimeDays: number;
};

const emptyStats: LifecycleStats = {
  activeOnboarding: 0,
  completedThisMonth: 0,
  pendingTasks: 0,
  averageTimeDays: 0,
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const anyError = error as { response?: { data?: { message?: string } } };
  return anyError?.response?.data?.message || fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status: string) {
  if (status === "in_progress") return "In Progress";
  if (status === "not_started") return "Not Started";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function taskIcon(status: TaskStatus) {
  if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />;
  if (status === "in_progress") return <Clock className="w-5 h-5 text-[var(--info)]" />;
  return <Circle className="w-5 h-5 text-muted-foreground" />;
}

function taskBadgeClass(status: TaskStatus) {
  if (status === "completed") return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20";
  if (status === "in_progress") return "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20";
  return "bg-secondary text-secondary-foreground";
}

function initials(name = "") {
  return String(name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Onboarding() {
  const [activeType, setActiveType] = useState<LifecycleType>("onboarding");
  const [stats, setStats] = useState<LifecycleStats>(emptyStats);
  const [cases, setCases] = useState<LifecycleCase[]>([]);
  const [caseFilter, setCaseFilter] = useState<"all" | "active" | "completed">("all");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ userId: "", startDate: "", targetDate: "" });

  const filteredCases = useMemo(() => {
    if (caseFilter === "active") {
      return cases.filter((item) => item.status === "in_progress" || item.status === "not_started");
    }
    if (caseFilter === "completed") {
      return cases.filter((item) => item.status === "completed");
    }
    return cases;
  }, [cases, caseFilter]);

  const selectedCase = useMemo(() => {
    const found = cases.find((item) => item.id === selectedCaseId);
    if (found && filteredCases.some((item) => item.id === selectedCaseId)) {
      return found;
    }
    return filteredCases[0] || null;
  }, [cases, filteredCases, selectedCaseId]);

  async function loadData(type: LifecycleType = activeType) {
    setLoading(true);
    setError("");
    try {
      const [statsResponse, casesResponse, usersResponse] = await Promise.all([
        api.get<LifecycleStats>(`/onboarding/stats?type=${type}`),
        api.get<{ cases: LifecycleCase[] }>(`/onboarding/cases?type=${type}`),
        api.get<{ users: EligibleUser[] }>(`/onboarding/eligible-users?type=${type}`),
      ]);
      setStats(statsResponse.data || emptyStats);
      setCases(casesResponse.data.cases || []);
      setEligibleUsers(usersResponse.data.users || []);
      setSelectedCaseId((currentId) => {
        const freshCases = casesResponse.data.cases || [];
        if (currentId && freshCases.some((item) => item.id === currentId)) return currentId;
        return freshCases[0]?.id || null;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load onboarding/offboarding data from the backend."));
      setStats(emptyStats);
      setCases([]);
      setEligibleUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCaseFilter("all");
    loadData(activeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  const createCase = async () => {
    if (!form.userId) {
      setError("Select an eligible employee first.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await api.post<{ case: LifecycleCase }>("/onboarding/cases", {
        userId: Number(form.userId),
        type: activeType,
        startDate: form.startDate || null,
        targetDate: form.targetDate || null,
      });
      setForm({ userId: "", startDate: "", targetDate: "" });
      await loadData(activeType);
      setSelectedCaseId(response.data.case?.id || null);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, `Unable to create ${activeType} case.`));
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId: number, status: TaskStatus) => {
    setSaving(true);
    setError("");
    try {
      const response = await api.patch<{ case: LifecycleCase }>(`/onboarding/tasks/${taskId}`, { status });
      setCases((current) => current.map((item) => item.id === response.data.case.id ? response.data.case : item));
      setSelectedCaseId(response.data.case.id);
      const statsResponse = await api.get<LifecycleStats>(`/onboarding/stats?type=${activeType}`);
      setStats(statsResponse.data || emptyStats);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to update lifecycle task."));
    } finally {
      setSaving(false);
    }
  };

  const completeAll = async () => {
    if (!selectedCaseId) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.patch<{ case: LifecycleCase }>(`/onboarding/cases/${selectedCaseId}/complete-all`);
      setCases((current) => current.map((item) => item.id === response.data.case.id ? response.data.case : item));
      setSelectedCaseId(response.data.case.id);
      const statsResponse = await api.get<LifecycleStats>(`/onboarding/stats?type=${activeType}`);
      setStats(statsResponse.data || emptyStats);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to complete all tasks."));
    } finally {
      setSaving(false);
    }
  };

  const cancelCase = async () => {
    if (!selectedCaseId) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.patch<{ case: LifecycleCase }>(`/onboarding/cases/${selectedCaseId}/cancel`);
      setCases((current) => current.map((item) => item.id === response.data.case.id ? response.data.case : item));
      setSelectedCaseId(response.data.case.id);
      const statsResponse = await api.get<LifecycleStats>(`/onboarding/stats?type=${activeType}`);
      setStats(statsResponse.data || emptyStats);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to cancel case."));
    } finally {
      setSaving(false);
    }
  };

  const reopenCase = async () => {
    if (!selectedCaseId) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.patch<{ case: LifecycleCase }>(`/onboarding/cases/${selectedCaseId}/reopen`);
      setCases((current) => current.map((item) => item.id === response.data.case.id ? response.data.case : item));
      setSelectedCaseId(response.data.case.id);
      const statsResponse = await api.get<LifecycleStats>(`/onboarding/stats?type=${activeType}`);
      setStats(statsResponse.data || emptyStats);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Unable to reopen case."));
    } finally {
      setSaving(false);
    }
  };

  const workflowSteps = selectedCase?.tasks.length
    ? selectedCase.tasks
    : activeType === "onboarding"
      ? [
          { id: 1, stepId: 1, stepOrder: 1, title: "Document Verification", description: "Verify and upload all required documents", status: "pending" as TaskStatus },
          { id: 2, stepId: 2, stepOrder: 2, title: "IT Setup", description: "Email, laptop, and system access setup", status: "pending" as TaskStatus },
          { id: 3, stepId: 3, stepOrder: 3, title: "Orientation", description: "Complete company orientation program", status: "pending" as TaskStatus },
          { id: 4, stepId: 4, stepOrder: 4, title: "Training", description: "Complete role-specific training modules", status: "pending" as TaskStatus },
          { id: 5, stepId: 5, stepOrder: 5, title: "Team Introduction", description: "Meet team members and manager", status: "pending" as TaskStatus },
        ]
      : [
          { id: 1, stepId: 1, stepOrder: 1, title: "Resignation/Termination Confirmation", description: "Confirm exit request and final working date", status: "pending" as TaskStatus },
          { id: 2, stepId: 2, stepOrder: 2, title: "Knowledge Transfer", description: "Complete handover of responsibilities", status: "pending" as TaskStatus },
          { id: 3, stepId: 3, stepOrder: 3, title: "Asset Return", description: "Return company assets", status: "pending" as TaskStatus },
          { id: 4, stepId: 4, stepOrder: 4, title: "Account Deactivation", description: "Disable internal system access", status: "pending" as TaskStatus },
          { id: 5, stepId: 5, stepOrder: 5, title: "Final Settlement", description: "Complete final clearance", status: "pending" as TaskStatus },
        ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Onboarding & Offboarding</h1>
          <p className="text-muted-foreground">Manage lifecycle cases through the backend workflow API</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => loadData(activeType)} disabled={loading || saving}>
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveType("onboarding")}
          className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2 ${activeType === "onboarding" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
        >
          <UserPlus className="w-4 h-4" /> Onboarding
        </button>
        <button
          onClick={() => setActiveType("offboarding")}
          className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2 ${activeType === "offboarding" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
        >
          <UserMinus className="w-4 h-4" /> Offboarding
        </button>
      </div>

      {error && <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            caseFilter === "active" ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onClick={() => setCaseFilter(caseFilter === "active" ? "all" : "active")}
        >
          <p className="text-sm text-muted-foreground">Active {activeType === "onboarding" ? "Onboarding" : "Offboarding"}</p>
          <p className="text-2xl text-foreground mt-1">{loading ? "..." : stats.activeOnboarding}</p>
        </Card>
        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            caseFilter === "completed" ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onClick={() => setCaseFilter(caseFilter === "completed" ? "all" : "completed")}
        >
          <p className="text-sm text-muted-foreground">Completed This Month</p>
          <p className="text-2xl text-foreground mt-1">{loading ? "..." : stats.completedThisMonth}</p>
        </Card>
        <Card className="p-4 bg-card"><p className="text-sm text-muted-foreground">Pending Tasks</p><p className="text-2xl text-foreground mt-1">{loading ? "..." : stats.pendingTasks}</p></Card>
        <Card className="p-4 bg-card"><p className="text-sm text-muted-foreground">Average Time</p><p className="text-2xl text-foreground mt-1">{loading ? "..." : `${stats.averageTimeDays || 0} days`}</p></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create {activeType === "onboarding" ? "Onboarding" : "Offboarding"} Case</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Only eligible users from NexoraTech Ltd are listed.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
            <label className="space-y-1">
              <span className="text-sm text-foreground">Employee</span>
              <select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select employee</option>
                {eligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm text-foreground">Start Date</span>
              <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-foreground">Target Date</span>
              <input type="date" value={form.targetDate} onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <Button className="gap-2" onClick={createCase} disabled={saving || !form.userId}><Plus className="w-4 h-4" />Create Case</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active {activeType === "onboarding" ? "Onboarding" : "Offboarding"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading {activeType} cases...
            </div>
          ) : filteredCases.length ? (
            <div className="space-y-4">
              {filteredCases.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${selectedCase?.id === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{item.employee.avatar || initials(item.employee.name)}</div>
                      <div>
                        <h3 className="text-foreground">{item.employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.employee.designation || item.employee.role} • {item.employee.department || "No department"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="text-sm text-foreground">{formatDate(item.startDate)}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{statusLabel(item.status)}</Badge>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1"><span className="text-sm text-foreground">Progress</span><span className="text-sm text-muted-foreground">{item.progress}%</span></div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} /></div>
                  </div>
                  <div className="flex gap-2">
                    {item.tasks.map((task) => (
                      <div key={task.id} className={`flex-1 p-2 rounded text-center text-xs ${task.status === "completed" ? "bg-[var(--success)]/20 text-[var(--success)]" : task.status === "in_progress" ? "bg-[var(--info)]/20 text-[var(--info)]" : "bg-secondary text-muted-foreground"}`}>{task.status === "completed" ? "✓" : task.stepOrder}</div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {cases.length ? "No cases match the selected filter." : `No ${activeType} cases yet. Create one from the form above.`}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{activeType === "onboarding" ? "Onboarding" : "Offboarding"} Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflowSteps.map((step, index) => (
                <div key={`${step.stepId}-${step.title}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${step.status === "completed" ? "bg-[var(--success)] text-white" : step.status === "in_progress" ? "bg-[var(--info)] text-white" : "bg-primary text-primary-foreground"}`}>{step.status === "completed" ? "✓" : step.stepOrder}</div>
                    {index < workflowSteps.length - 1 && <div className="w-0.5 h-12 bg-border mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle>Task Checklist {selectedCase ? `— ${selectedCase.employee.name}` : ""}</CardTitle>
              {selectedCase && (
                <div className="flex gap-2">
                  {selectedCase.status !== "completed" && selectedCase.status !== "cancelled" && (
                    <>
                      <Button size="sm" onClick={completeAll} disabled={saving}>Complete All</Button>
                      <Button size="sm" variant="destructive" onClick={cancelCase} disabled={saving}>Cancel Case</Button>
                    </>
                  )}
                  {(selectedCase.status === "completed" || selectedCase.status === "cancelled") && (
                    <Button size="sm" variant="outline" onClick={reopenCase} disabled={saving}>Reopen Case</Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedCase ? (
              <div className="space-y-3">
                {selectedCase.tasks.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-accent/30 text-card-foreground">
                    <div className="flex items-center gap-3 min-w-0">
                      {taskIcon(item.status)}
                      <div className="min-w-0">
                        <span className={`text-sm block ${item.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</span>
                        <span className="text-xs text-muted-foreground">Due: {formatDate(item.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge variant="secondary" className={taskBadgeClass(item.status)}>{statusLabel(item.status)}</Badge>
                      {item.status !== "completed" && selectedCase.status !== "cancelled" && (
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => updateTask(item.id, "completed")} disabled={saving}>Mark Complete</Button>
                      )}
                      <select value={item.status} disabled={saving || selectedCase.status === "cancelled"} onChange={(event) => updateTask(item.id, event.target.value as TaskStatus)} className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">Select or create a lifecycle case to update tasks.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
