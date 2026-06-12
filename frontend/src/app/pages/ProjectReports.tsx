import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Clock, Download, Filter, Loader2, RefreshCw, Target, Users, Zap } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../services/api";

interface ReportSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  teamVelocity: number;
  averageCompletionDays: number;
  totalWbsItems: number;
  completedWbsItems: number;
  overdueWbsItems: number;
}

interface ProjectMetric {
  id: number;
  name: string;
  status: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

interface AssigneeMetric {
  name: string;
  total: number;
  completed: number;
  pending: number;
  efficiency: number;
}

interface TrendPoint {
  date: string;
  completed: number;
  inProgress: number;
  todo: number;
}

interface ReportData {
  summary: ReportSummary;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  projects: ProjectMetric[];
  assignees: AssigneeMetric[];
  trend: TrendPoint[];
  filters: { projects: string[]; assignees: string[]; statuses: string[] };
}

const emptySummary: ReportSummary = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  overdueProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  overdueTasks: 0,
  completionRate: 0,
  teamVelocity: 0,
  averageCompletionDays: 0,
  totalWbsItems: 0,
  completedWbsItems: 0,
  overdueWbsItems: 0,
};

const colors = ["#543884", "#9A77CF", "#EC4176", "#FFA45E", "#00C853", "#2196F3"];

export function ProjectReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ project: "", assignee: "", status: "", startDate: "", endDate: "" });

  const summary = data?.summary || emptySummary;
  const priorityData = useMemo(() => Object.entries(data?.byPriority || {}).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] })), [data]);
  const statusData = useMemo(() => Object.entries(data?.byStatus || {}).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] })), [data]);

  async function loadReports(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
      const response = await api.get("/projects/reports", { params });
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load project reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function exportCsv() {
    const rows: Array<Array<string | number>> = [
      ["Metric", "Value"],
      ["Total Projects", summary.totalProjects],
      ["Active Projects", summary.activeProjects],
      ["Completed Projects", summary.completedProjects],
      ["Overdue Projects", summary.overdueProjects],
      ["Total Tasks", summary.totalTasks],
      ["Completed Tasks", summary.completedTasks],
      ["In Progress Tasks", summary.inProgressTasks],
      ["Overdue Tasks", summary.overdueTasks],
      ["Completion Rate", summary.completionRate + "%"],
      ["Team Velocity", summary.teamVelocity],
      ["Average Completion Days", summary.averageCompletionDays],
      [],
      ["Project", "Total", "Completed", "In Progress", "Overdue", "Completion Rate"],
      ...(data?.projects || []).map((project) => [project.name, project.total, project.completed, project.inProgress, project.overdue, project.completionRate + "%"]),
    ];
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell ?? "").replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project-report-" + new Date().toISOString().slice(0, 10) + ".csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Total Projects", value: summary.totalProjects, icon: BarChart3, color: "#543884" },
    { label: "Active Projects", value: summary.activeProjects, icon: Target, color: "#2196F3" },
    { label: "Completed Tasks", value: summary.completedTasks, icon: CheckCircle2, color: "#00C853" },
    { label: "In Progress", value: summary.inProgressTasks, icon: Clock, color: "#9A77CF" },
    { label: "Overdue Tasks", value: summary.overdueTasks, icon: AlertCircle, color: "#EC4176" },
    { label: "Velocity", value: summary.teamVelocity, icon: Zap, color: "#FFA45E" },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Reports & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live database-backed project, task, WBS, and team performance reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => loadReports()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"><RefreshCw className="h-4 w-4" /> Retry</button>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-[#543884] px-4 py-2 text-sm font-medium text-white"><Download className="h-4 w-4" /> Export CSV</button>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2"><Filter className="h-4 w-4 text-[#9A77CF]" /><h2 className="font-semibold">Filters</h2></div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <select value={filters.project} onChange={(event) => updateFilter("project", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All projects</option>{(data?.filters?.projects || []).map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={filters.assignee} onChange={(event) => updateFilter("assignee", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All assignees</option>{(data?.filters?.assignees || []).map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All statuses</option>{(data?.filters?.statuses || []).map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => loadReports(filters)} className="rounded-lg bg-[#543884] px-4 py-2 text-sm font-medium text-white">Apply</button>
          <button type="button" onClick={() => { const empty = { project: "", assignee: "", status: "", startDate: "", endDate: "" }; setFilters(empty); loadReports(empty); }} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Reset</button>
        </div>
      </section>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {error}</div>}

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading live reports...</div>
      ) : !data || summary.totalTasks === 0 ? (
        <div className="min-h-[360px] rounded-xl border border-dashed border-border bg-card p-12 text-center"><BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground" /><h2 className="font-semibold">No report data found</h2><p className="mt-1 text-sm text-muted-foreground">Add project tasks or adjust filters, then retry.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return <div key={card.label} className="rounded-xl border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: card.color + "1A" }}><Icon className="h-5 w-5" style={{ color: card.color }} /></div><span className="text-xs text-muted-foreground">Live</span></div><p className="text-2xl font-bold">{card.value}</p><p className="text-xs text-muted-foreground">{card.label}</p></div>;
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-1 font-semibold">Task Completion Trend</h3>
              <p className="mb-4 text-xs text-muted-foreground">Grouped by task update date</p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.trend || []}><CartesianGrid strokeDasharray="3 3" stroke="#543884" strokeOpacity={0.1} /><XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend /><Area type="monotone" dataKey="completed" stroke="#00C853" fill="#00C85333" /><Area type="monotone" dataKey="inProgress" stroke="#2196F3" fill="#2196F333" /><Area type="monotone" dataKey="todo" stroke="#9A77CF" fill="#9A77CF33" /></AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-1 font-semibold">Task Distribution by Status</h3>
              <p className="mb-4 text-xs text-muted-foreground">Live status totals</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>{statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Project Completion</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.projects || []}><CartesianGrid strokeDasharray="3 3" stroke="#543884" strokeOpacity={0.1} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip /><Legend /><Bar dataKey="completed" fill="#543884" /><Bar dataKey="overdue" fill="#EC4176" /></BarChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">Team Performance</h3>
              <div className="space-y-4">
                {(data.assignees || []).map((member) => <div key={member.name}><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#543884] text-xs font-semibold text-white">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><p className="text-sm font-medium">{member.name}</p><p className="text-xs text-muted-foreground">{member.completed} completed - {member.pending} pending</p></div></div><span className="text-sm font-semibold text-[#543884]">{member.efficiency}%</span></div><div className="h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-gradient-to-r from-[#543884] to-[#9A77CF]" style={{ width: member.efficiency + "%" }} /></div></div>)}
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Priority Breakdown</h3>
            <div className="grid gap-3 md:grid-cols-4">
              {priorityData.map((item) => <div key={item.name} className="rounded-lg border border-border p-4"><p className="text-sm capitalize text-muted-foreground">{item.name}</p><p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p></div>)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
