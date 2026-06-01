import { useState } from "react";
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

export function ProjectReports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedProject, setSelectedProject] = useState('all');

  const projects = ['all', 'Website Redesign', 'User Portal', 'Mobile App'];

  // Sample data for charts
  const taskCompletionData = [
    { date: 'May 1', completed: 12, inProgress: 8, todo: 5 },
    { date: 'May 8', completed: 18, inProgress: 10, todo: 7 },
    { date: 'May 15', completed: 25, inProgress: 12, todo: 6 },
    { date: 'May 22', completed: 32, inProgress: 9, todo: 4 },
    { date: 'May 29', completed: 38, inProgress: 8, todo: 3 }
  ];

  const projectDistribution = [
    { name: 'Website Redesign', value: 45, color: '#543884' },
    { name: 'User Portal', value: 35, color: '#9A77CF' },
    { name: 'Mobile App', value: 20, color: '#EC4176' }
  ];

  const teamPerformance = [
    { name: 'Sarah Johnson', completed: 18, pending: 3, efficiency: 94 },
    { name: 'Michael Chen', completed: 15, pending: 5, efficiency: 88 },
    { name: 'Emily Rodriguez', completed: 12, pending: 2, efficiency: 92 },
    { name: 'David Kim', completed: 10, pending: 4, efficiency: 85 },
    { name: 'Jessica Martinez', completed: 8, pending: 3, efficiency: 90 }
  ];

  const priorityBreakdown = [
    { priority: 'Urgent', count: 5, color: '#EC4176' },
    { priority: 'High', count: 12, color: '#FFA45E' },
    { priority: 'Medium', count: 18, color: '#9A77CF' },
    { priority: 'Low', count: 8, color: '#543884' }
  ];

  const velocityData = [
    { week: 'Week 1', planned: 20, completed: 18 },
    { week: 'Week 2', planned: 22, completed: 20 },
    { week: 'Week 3', planned: 25, completed: 23 },
    { week: 'Week 4', planned: 20, completed: 22 }
  ];

  const stats = [
    {
      label: 'Total Tasks',
      value: '156',
      change: '+12%',
      trend: 'up',
      icon: CheckCircle2,
      color: '#543884'
    },
    {
      label: 'Completed',
      value: '89',
      change: '+18%',
      trend: 'up',
      icon: Target,
      color: '#00C853'
    },
    {
      label: 'In Progress',
      value: '45',
      change: '-5%',
      trend: 'down',
      icon: Clock,
      color: '#2196F3'
    },
    {
      label: 'Overdue',
      value: '8',
      change: '-25%',
      trend: 'down',
      icon: AlertCircle,
      color: '#EC4176'
    },
    {
      label: 'Team Velocity',
      value: '22.5',
      change: '+8%',
      trend: 'up',
      icon: Zap,
      color: '#FFA45E'
    },
    {
      label: 'Avg Completion',
      value: '4.2 days',
      change: '-12%',
      trend: 'up',
      icon: Award,
      color: '#9A77CF'
    }
  ];

  const handleExport = (format: string) => {
    console.log(`Exporting report as ${format}`);
    // Implement export logic here
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
            {teamPerformance.map((member, idx) => (
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
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Team Productivity Up 18%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your team completed 18% more tasks this month compared to last month. Great work!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">On Track for Sprint Goal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current velocity indicates you'll complete 95% of planned tasks by sprint end.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">8 Tasks Overdue</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider reviewing task assignments and deadlines to prevent delays.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Sarah Johnson - Top Performer</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed 18 tasks with 94% efficiency rating this month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
