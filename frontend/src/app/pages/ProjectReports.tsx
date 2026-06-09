import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    api.get('/projects/stats', {
      params: {
        dateRange,
        project: selectedProject
      }
    })
    .then((response) => {
      if (isMounted) {
        setReportData(response.data);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (isMounted) {
        console.error(err);
        setError("Failed to load reports. Please try again.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [dateRange, selectedProject]);

  const handleExport = (format: string) => {
    console.log(`Exporting report as ${format}`);
    // Implement export logic here
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading reports and analytics...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "No report data available."}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            api.get('/projects/stats', { params: { dateRange, project: selectedProject } })
              .then(res => { setReportData(res.data); setLoading(false); })
              .catch(err => { console.error(err); setError("Failed to load reports."); setLoading(false); });
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    projects = ['all'],
    stats = { totalTasks: 0, completed: 0, inProgress: 0, overdue: 0, teamVelocity: 0, avgCompletionTime: '0 days' },
    taskCompletionData = [],
    projectDistribution = [],
    teamPerformance = [],
    velocityData = [],
    priorityBreakdown = [],
    insights = []
  } = reportData;

  const statsList = [
    {
      label: 'Total Tasks',
      value: String(stats.totalTasks),
      change: '+10%',
      trend: 'up',
      icon: CheckCircle2,
      color: '#543884'
    },
    {
      label: 'Completed',
      value: String(stats.completed),
      change: '+15%',
      trend: 'up',
      icon: Target,
      color: '#00C853'
    },
    {
      label: 'In Progress',
      value: String(stats.inProgress),
      change: '-5%',
      trend: 'down',
      icon: Clock,
      color: '#2196F3'
    },
    {
      label: 'Overdue',
      value: String(stats.overdue),
      change: '-20%',
      trend: 'down',
      icon: AlertCircle,
      color: '#EC4176'
    },
    {
      label: 'Team Velocity',
      value: String(stats.teamVelocity),
      change: '+5%',
      trend: 'up',
      icon: Zap,
      color: '#FFA45E'
    },
    {
      label: 'Avg Completion',
      value: stats.avgCompletionTime,
      change: '-10%',
      trend: 'up',
      icon: Award,
      color: '#9A77CF'
    }
  ];

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
            <h1 className="text-2xl font-bold text-foreground">Work Reports &amp; Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze work progress, task completion, and team productivity
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
        {statsList.map((stat, idx) => (
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
                {projectDistribution.map((entry, index) => (
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
            {teamPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assigned task performance data available yet.
              </p>
            ) : (
              teamPerformance.map((member, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white text-xs font-semibold">
                        {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
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
              ))
            )}
          </div>
        </div>

        {/* Sprint Velocity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Weekly Work Completion</h3>
              <p className="text-xs text-muted-foreground mt-1">Completed work items by week</p>
            </div>
          </div>
          {velocityData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Not enough historical task data to generate this chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#543884" strokeOpacity={0.1} />
                <XAxis dataKey="week" stroke="#9A77CF" fontSize={12} />
                <YAxis stroke="#9A77CF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: '#543884', borderRadius: '0.75rem' }} />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#543884" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
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
                      width: `${(item.count / 43) * 100}%`,
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
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No insights available for the selected period.</p>
            ) : (
              insights.map((insight: any, idx: number) => {
                const insightIcons: Record<string, any> = {
                  TrendingUp,
                  Target,
                  AlertCircle,
                  Users
                };
                const Icon = insightIcons[insight.icon] || TrendingUp;
                const colorClasses: Record<string, string> = {
                  green: 'bg-green-500/10 border-green-500/20 text-green-500',
                  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
                  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
                  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
                };
                const classStr = colorClasses[insight.color] || 'bg-green-500/10 border-green-500/20 text-green-500';
                return (
                  <div key={idx} className={`flex items-start gap-3 p-3 border rounded-lg ${classStr}`}>
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.desc}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
