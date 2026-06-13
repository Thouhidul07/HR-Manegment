import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Filter, Calendar, TrendingUp,
  Users, CheckCircle2, Clock, Target, BarChart3,
  AlertCircle, Award, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import api from "../services/api";

export function ProjectReports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedProject, setSelectedProject] = useState('all');
  const [reportData, setReportData] = useState<any>({ byStatus: {}, projects: [] });
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.get("/projects/stats"), api.get("/projects/tasks")])
      .then(([statsResponse, tasksResponse]) => {
        setReportData(statsResponse.data || { byStatus: {}, projects: [] });
        setTasks(tasksResponse.data.tasks || []);
      })
      .catch((error) => console.warn("Unable to load project reports", error));
  }, []);

  const projects = ['all', ...(reportData.projects || []).map((project: any) => project.name)];

  const visibleTasks = selectedProject === "all" ? tasks : tasks.filter((task) => task.project === selectedProject);
  const taskCompletionData = Object.values(visibleTasks.reduce((groups: Record<string, any>, task) => {
    const date = task.createdDate ? new Date(task.createdDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unscheduled";
    groups[date] ||= { date, completed: 0, inProgress: 0, todo: 0 };
    if (task.status === "completed") groups[date].completed += 1;
    else if (task.status === "in-progress" || task.status === "in-review") groups[date].inProgress += 1;
    else groups[date].todo += 1;
    return groups;
  }, {}));

  const reportTotalTasks = (reportData.projects || []).reduce((sum: number, project: any) => sum + Number(project.total || 0), 0);
  const projectDistribution: Array<{ name: string; value: number; color: string }> = (reportData.projects || []).map((project: any, index: number) => ({
    name: project.name,
    value: reportTotalTasks ? Math.round((Number(project.total || 0) / reportTotalTasks) * 100) : 0,
    color: ['#543884', '#9A77CF', '#EC4176', '#FFA45E'][index % 4],
  }));

  const teamPerformance = Object.values(visibleTasks.reduce((members: Record<string, any>, task) => {
    const name = task.assignee || "Unassigned";
    members[name] ||= { name, completed: 0, pending: 0, efficiency: 0 };
    if (task.status === "completed") members[name].completed += 1;
    else members[name].pending += 1;
    const total = members[name].completed + members[name].pending;
    members[name].efficiency = total ? Math.round((members[name].completed / total) * 100) : 0;
    return members;
  }, {}));

  const priorityColors: Record<string, string> = { urgent: '#EC4176', high: '#FFA45E', medium: '#9A77CF', low: '#543884' };
  const priorityBreakdown = ["urgent", "high", "medium", "low"].map((priority) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count: visibleTasks.filter((task) => task.priority === priority).length,
    color: priorityColors[priority],
  }));

  const velocityData = (reportData.projects || []).map((project: any) => ({
    week: project.name,
    planned: Number(project.total || 0),
    completed: Number(project.completed || 0),
  }));
  const topPerformer = [...teamPerformance].sort((a: any, b: any) => b.completed - a.completed || b.efficiency - a.efficiency)[0] as any;

  const stats = [
    {
      label: 'Total Tasks',
      value: String(reportTotalTasks),
      change: 'Live',
      trend: 'up',
      icon: CheckCircle2,
      color: '#543884'
    },
    {
      label: 'Completed',
      value: String(reportData.byStatus?.completed || 0),
      change: 'Live',
      trend: 'up',
      icon: Target,
      color: '#00C853'
    },
    {
      label: 'In Progress',
      value: String(reportData.byStatus?.['in-progress'] || 0),
      change: 'Live',
      trend: 'down',
      icon: Clock,
      color: '#2196F3'
    },
    {
      label: 'Overdue',
      value: String((reportData.projects || []).reduce((sum: number, project: any) => sum + Number(project.overdue || 0), 0)),
      change: 'Live',
      trend: 'down',
      icon: AlertCircle,
      color: '#EC4176'
    },
    {
      label: 'Team Velocity',
      value: String(visibleTasks.length),
      change: 'Live',
      trend: 'up',
      icon: Zap,
      color: '#FFA45E'
    },
    {
      label: 'Avg Completion',
      value: visibleTasks.length ? `${Math.round((Number(reportData.byStatus?.completed || 0) / visibleTasks.length) * 100)}%` : '0%',
      change: 'Live',
      trend: 'up',
      icon: Award,
      color: '#9A77CF'
    }
  ];

  const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

  const downloadTextFile = (fileName: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const reportRows = (): Array<Array<string | number>> => [
    ["Report", "Project Reports & Analytics"],
    ["Date Range", dateRange],
    ["Project", selectedProject === "all" ? "All Projects" : selectedProject],
    ["Generated At", new Date().toLocaleString()],
    [],
    ["Metric", "Value", "Change"],
    ...stats.map((stat) => [stat.label, stat.value, stat.change]),
    [],
    ["Task Completion Trend"],
    ["Date", "Completed", "In Progress", "Todo"],
    ...taskCompletionData.map((item: { date: string; completed: number; inProgress: number; todo: number }) => [item.date, item.completed, item.inProgress, item.todo]),
    [],
    ["Project Distribution"],
    ["Project", "Percent"],
    ...projectDistribution.map((item: { name: string; value: number }) => [item.name, item.value]),
    [],
    ["Team Performance"],
    ["Name", "Completed", "Pending", "Efficiency"],
    ...teamPerformance.map((member) => [member.name, member.completed, member.pending, `${member.efficiency}%`]),
    [],
    ["Priority Breakdown"],
    ["Priority", "Count"],
    ...priorityBreakdown.map((item) => [item.priority, item.count]),
    [],
    ["Sprint Velocity"],
    ["Week", "Planned", "Completed"],
    ...velocityData.map((item) => [item.week, item.planned, item.completed]),
  ];

  const exportCsv = () => {
    const csv = reportRows().map((row) => row.map((cell: string | number) => csvCell(cell ?? "")).join(",")).join("\n");
    downloadTextFile(`project-report-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const exportPdf = () => {
    const printableRows = reportRows()
      .map((row) => {
        if (!row.length) return "<tr><td colspan=\"4\" class=\"spacer\"></td></tr>";
        if (row.length === 1) return `<tr><th colspan="4" class="section">${row[0]}</th></tr>`;
        return `<tr>${row.map((cell: string | number) => `<td>${String(cell)}</td>`).join("")}</tr>`;
      })
      .join("");
    const html = `<!doctype html>
      <html>
        <head>
          <title>Project Reports & Analytics</title>
          <style>
            body { font-family: Arial, sans-serif; color: #262254; margin: 32px; }
            h1 { margin: 0 0 8px; }
            p { color: #6f5b96; margin: 0 0 24px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            td, th { border: 1px solid #ded7ea; padding: 8px; text-align: left; }
            .section { background: #f2edf8; color: #543884; font-size: 14px; }
            .spacer { border: 0; height: 12px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Project Reports & Analytics</h1>
          <p>${dateRange} · ${selectedProject === "all" ? "All Projects" : selectedProject}</p>
          <table>${printableRows}</table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>`;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      downloadTextFile(`project-report-${new Date().toISOString().slice(0, 10)}.html`, html, "text/html;charset=utf-8;");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExport = (format: "pdf" | "csv") => {
    if (format === "csv") exportCsv();
    else exportPdf();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive insights into project performance and team productivity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {projects.map(project => (
                <option key={project} value={project}>
                  {project === 'all' ? 'All Projects' : project}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}1A` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Task Completion Trend</h3>
              <p className="text-xs text-muted-foreground mt-1">Tasks completed over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={taskCompletionData}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="inProgressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#543884" strokeOpacity={0.1} />
              <XAxis dataKey="date" stroke="#9A77CF" fontSize={12} />
              <YAxis stroke="#9A77CF" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: '#543884', borderRadius: '0.75rem' }} />
              <Legend />
              <Area type="monotone" dataKey="completed" stroke="#00C853" fillOpacity={1} fill="url(#completedGradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="inProgress" stroke="#2196F3" fillOpacity={1} fill="url(#inProgressGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Task Distribution by Project</h3>
              <p className="text-xs text-muted-foreground mt-1">Percentage of tasks per project</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={projectDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {projectDistribution.map((entry: { color: string }, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: '#543884', borderRadius: '0.75rem' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Performance & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Team Performance</h3>
              <p className="text-xs text-muted-foreground mt-1">Individual task completion rates</p>
            </div>
          </div>
          <div className="space-y-4">
            {teamPerformance.map((member: any, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white text-xs font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.completed} completed · {member.pending} pending
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#543884]">{member.efficiency}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#543884] to-[#9A77CF] rounded-full transition-all"
                    style={{ width: `${member.efficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sprint Velocity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Sprint Velocity</h3>
              <p className="text-xs text-muted-foreground mt-1">Planned vs completed tasks</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#543884" strokeOpacity={0.1} />
              <XAxis dataKey="week" stroke="#9A77CF" fontSize={12} />
              <YAxis stroke="#9A77CF" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: '#543884', borderRadius: '0.75rem' }} />
              <Legend />
              <Bar dataKey="planned" fill="#9A77CF" radius={[8, 8, 0, 0]} />
              <Bar dataKey="completed" fill="#543884" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Breakdown and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Task Priority Breakdown</h3>
          <div className="space-y-3">
            {priorityBreakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">{item.priority}</span>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${visibleTasks.length ? (item.count / visibleTasks.length) * 100 : 0}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Team Productivity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.byStatus?.completed || 0} completed tasks are currently recorded.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Current Workload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.byStatus?.['in-progress'] || 0} tasks are in progress across the selected project scope.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{stats[3].value} Tasks Overdue</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider reviewing task assignments and deadlines to prevent delays.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{topPerformer ? `${topPerformer.name} - Top Performer` : "No Top Performer Yet"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {topPerformer ? `Completed ${topPerformer.completed} tasks with ${topPerformer.efficiency}% completion efficiency.` : "Complete project tasks to generate performer insights."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
