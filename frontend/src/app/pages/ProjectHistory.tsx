import { useState, useEffect } from "react";
import {
  FolderGit2,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ClipboardList,
  Target,
  Folder,
  RefreshCw,
  AlertCircle,
  Tag,
  Search
} from "lucide-react";
import api from "../services/api";

type HistoryItemType = 'project' | 'task';

interface HistoryItem {
  id: number;
  type: HistoryItemType;
  title: string;
  status: string;
  priority: string;
  assigneeName: string;
  startDate: string;
  completedDate: string;
  updatedAt: string;
  projectName?: string;
  description?: string;
}

interface Summary {
  totalHistoryItems: number;
  completedProjects: number;
  completedTasks: number;
  archivedItems: number;
}

export function ProjectHistory() {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [expandedGroups, setExpandedGroups] = useState({
    projects: true,
    tasks: true
  });
  
  // Filters
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<{ summary: Summary; items: HistoryItem[] } | null>(null);
  const [uniqueProjects, setUniqueProjects] = useState<string[]>([]);

  const fetchHistory = () => {
    setLoading(true);
    setError(null);
    api.get('/projects/history', {
      params: {
        project: projectFilter,
        assignee: assigneeFilter || undefined,
        priority: priorityFilter,
        dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined
      }
    })
    .then((response) => {
      if (response.data?.success) {
        setHistoryData(response.data.data);
        
        // Extract unique project names from items to populate project filter dropdown
        const items = response.data.data.items || [];
        const projectsSet = new Set<string>();
        items.forEach((item: HistoryItem) => {
          if (item.type === 'project') {
            projectsSet.add(item.title);
          } else if (item.projectName) {
            projectsSet.add(item.projectName);
          }
        });
        setUniqueProjects(Array.from(projectsSet));
      } else {
        setError("Failed to parse history data.");
      }
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setError("Failed to load project history. Please check database connection and try again.");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchHistory();
  }, [projectFilter, priorityFilter, dateRangeFilter]); // Fetch when these dropdowns change

  // Handle Search submit or Enter key for Assignee text input
  const handleAssigneeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const toggleGroup = (group: 'projects' | 'tasks') => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return { bg: 'bg-red-500/10', text: 'text-red-500' };
      case 'high': return { bg: 'bg-orange-500/10', text: 'text-orange-500' };
      case 'medium': return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
      case 'low': return { bg: 'bg-gray-500/10', text: 'text-gray-500' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-500' };
    }
  };

  const getTypeColor = (type: HistoryItemType) => {
    return type === 'project' 
      ? { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Project' }
      : { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Task' };
  };

  if (loading && !historyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading project history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h3 className="font-semibold text-foreground text-lg">Error loading history</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  const summary = historyData?.summary || { totalHistoryItems: 0, completedProjects: 0, completedTasks: 0, archivedItems: 0 };
  const items = historyData?.items || [];

  const completedProjectsList = items.filter(i => i.type === 'project');
  const completedTasksList = items.filter(i => i.type === 'task');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Work History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View completed and archived work assignments from the database
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-all flex items-center gap-2 text-sm"
          title="Refresh Project History"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total History */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total History Items</p>
              <p className="text-2xl font-bold text-foreground">{summary.totalHistoryItems}</p>
            </div>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Projects</p>
              <p className="text-2xl font-bold text-foreground">{summary.completedProjects}</p>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Tasks</p>
              <p className="text-2xl font-bold text-foreground">{summary.completedTasks}</p>
            </div>
          </div>
        </div>

        {/* Archived Items */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Archived Items</p>
              <p className="text-2xl font-bold text-foreground">{summary.archivedItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <form onSubmit={handleAssigneeSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Project Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map(proj => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Task Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Completion Date</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Time</option>
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
            </select>
          </div>

          {/* Assignee Search */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Assignee Name</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search assignee..."
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-3" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all"
              >
                Go
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar List */}
        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No completed work history found yet.
            </div>
          ) : (
            <>
              {/* Completed Projects Group */}
              {completedProjectsList.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleGroup('projects')}
                    className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-3 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-purple-500" />
                      Completed Projects ({completedProjectsList.length})
                    </span>
                    {expandedGroups.projects ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedGroups.projects && (
                    <div className="space-y-2">
                      {completedProjectsList.map(project => (
                        <div
                          key={`project-${project.id}`}
                          onClick={() => setSelectedItem(project)}
                          className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedItem?.type === 'project' && selectedItem?.id === project.id
                              ? 'border-purple-500 shadow-md'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm text-foreground flex-1 line-clamp-1">{project.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500">
                              Project
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Manager: {project.assigneeName}</span>
                              <span>{new Date(project.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed Tasks Group */}
              {completedTasksList.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => toggleGroup('tasks')}
                    className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-3 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      Completed Tasks ({completedTasksList.length})
                    </span>
                    {expandedGroups.tasks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedGroups.tasks && (
                    <div className="space-y-2">
                      {completedTasksList.map(task => (
                        <div
                          key={`task-${task.id}`}
                          onClick={() => setSelectedItem(task)}
                          className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedItem?.type === 'task' && selectedItem?.id === task.id
                              ? 'border-blue-500 shadow-md'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm text-foreground flex-1 line-clamp-1">{task.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500">
                              Task
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Assignee: {task.assigneeName}</span>
                              <span>{new Date(task.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            {task.projectName && (
                              <div className="text-[10px] text-[#9A77CF] font-medium uppercase tracking-wider">
                                {task.projectName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail View Pane */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Detailed Overview */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTypeColor(selectedItem.type).bg} ${getTypeColor(selectedItem.type).text}`}>
                        {getTypeColor(selectedItem.type).label}
                      </span>
                      {selectedItem.type === 'task' && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(selectedItem.priority).bg} ${getPriorityColor(selectedItem.priority).text}`}>
                          {selectedItem.priority.charAt(0).toUpperCase() + selectedItem.priority.slice(1)} Priority
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{selectedItem.title}</h2>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-semibold">
                    Completed
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed bg-accent/40 p-4 rounded-lg border border-border">
                  {selectedItem.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedItem.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completion Date</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedItem.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {selectedItem.type === 'project' ? 'Project Lead' : 'Assigned Member'}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{selectedItem.assigneeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-sm font-semibold text-[#9A77CF]">
                      {new Date(selectedItem.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {selectedItem.type === 'task' && selectedItem.projectName && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#9A77CF]" />
                    <span className="text-xs text-muted-foreground">Belongs to Project:</span>
                    <span className="text-xs font-semibold text-foreground">{selectedItem.projectName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <FolderGit2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Select a Work Log</h3>
              <p className="text-sm text-muted-foreground">
                Choose a completed project or task from the list on the left to inspect its detailed metrics
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
