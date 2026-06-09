import { useEffect, useState } from "react";
import {
  Plus, Users, Calendar, Clock, AlertCircle,
  CheckCircle2, MoreVertical, Edit, Trash2,
  X, User, Flag, Tag, MessageSquare, Paperclip, Folder
} from "lucide-react";
import api from "../services/api";

type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeAvatar: string;
  deadline: string;
  createdDate: string;
  tags: string[];
  comments: number;
  attachments: number;
  project: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

export function ProjectManagement() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let isMounted = true;

    api.get("/projects/tasks")
      .then((response) => {
        if (isMounted) {
          setTasks(response.data.tasks || []);
          setLoadingTasks(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingTasks(false);
      });

    api.get("/projects")
      .then((response) => {
        if (isMounted && response.data.projects?.length) {
          setProjectsList(response.data.projects);
        }
      })
      .catch(() => {});

    api.get("/employees")
      .then((response) => {
        if (!isMounted || !response.data.employees?.length) return;
        setLoadingEmployees(false);
        setEmployees(response.data.employees.map((employee: any) => ({
          id: employee.id,
          name: employee.name,
          role: employee.designation || employee.department || "Team Member",
          avatar: employee.name
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        })));
      })
      .catch(() => {
        if (isMounted) setLoadingEmployees(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTasks = filterProject === 'all'
    ? tasks
    : tasks.filter(task => task.project === filterProject);

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'in-review': filteredTasks.filter(t => t.status === 'in-review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  const activeProjectsCount = projectsList.filter(p => p.status === 'active').length;

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  const getDelayedProjectsCount = () => {
    if (projectsList.length === 0) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    return projectsList.filter(p => p.status === 'active' && p.endDate && new Date(p.endDate) < today).length;
  };
  const delayedProjectsCount = getDelayedProjectsCount();

  const getMilestonesThisWeekCount = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.deadline) return false;
      const deadlineDate = new Date(t.deadline);
      return deadlineDate >= today && deadlineDate <= sevenDaysFromNow;
    }).length;
  };
  const milestonesThisWeekCount = getMilestonesThisWeekCount();

  // Selected project details
  const selectedProjInfo = projectsList.find(p => p.name === filterProject) || {
    id: 0,
    name: filterProject === 'all' ? "All Projects" : filterProject,
    description: filterProject === 'all' 
      ? "Multi-project tracking dashboard for operations and planning" 
      : `${filterProject} delivery workspace and planning dashboard`,
    startDate: null,
    endDate: null,
    owner: "System Administrator",
    status: "active",
    tasks: filterProject === 'all' ? tasks.length : tasks.filter(t => t.project === filterProject).length,
    completedTasks: filterProject === 'all' ? tasks.filter(t => t.status === 'completed').length : tasks.filter(t => t.project === filterProject && t.status === 'completed').length
  };

  const getProjectHealth = (projName: string) => {
    const projTasks = projName === 'all' ? tasks : tasks.filter(t => t.project === projName);
    const overdueTasks = projTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed');
    
    if (overdueTasks.length > 0) {
      return { label: "At Risk", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" };
    }
    
    if (projName !== 'all') {
      const proj = projectsList.find(p => p.name === projName);
      if (proj && proj.endDate && new Date(proj.endDate) < new Date() && proj.completedTasks < proj.tasks) {
        return { label: "Delayed", bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30" };
      }
    }
    
    return { label: "Stable", bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30" };
  };
  const healthInfo = getProjectHealth(filterProject);
  
  const projProgress = selectedProjInfo.tasks > 0 
    ? Math.round((selectedProjInfo.completedTasks / selectedProjInfo.tasks) * 100)
    : 0;

  // Team Workload calculation
  const getTeamWorkload = () => {
    const workloadMap: Record<string, { total: number; completed: number; avatar: string }> = {};
    filteredTasks.forEach(task => {
      if (!task.assignee) return;
      if (!workloadMap[task.assignee]) {
        workloadMap[task.assignee] = { total: 0, completed: 0, avatar: task.assigneeAvatar || "TM" };
      }
      workloadMap[task.assignee].total++;
      if (task.status === 'completed') {
        workloadMap[task.assignee].completed++;
      }
    });
    return Object.entries(workloadMap).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      avatar: stats.avatar,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));
  };
  const teamWorkload = getTeamWorkload();

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return '#EC4176';
      case 'high': return '#FFA45E';
      case 'medium': return '#9A77CF';
      case 'low': return '#543884';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return { bg: 'bg-gray-500/10', text: 'text-gray-500' };
      case 'in-progress': return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
      case 'in-review': return { bg: 'bg-yellow-500/10', text: 'text-yellow-500' };
      case 'completed': return { bg: 'bg-green-500/10', text: 'text-green-500' };
    }
  };

  const moveTask = async (taskId: number, newStatus: TaskStatus) => {
    const previousTasks = tasks;
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    try {
      const response = await api.patch(`/projects/tasks/${taskId}`, { status: newStatus });
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? response.data.task : task))
      );
    } catch {
      setTasks(previousTasks);
    }
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdDate' | 'comments' | 'attachments'>) => {
    setIsSavingTask(true);
    try {
      if (selectedTask) {
        const response = await api.patch(`/projects/tasks/${selectedTask.id}`, taskData);
        setTasks(tasks.map(t => t.id === selectedTask.id ? response.data.task : t));
      } else {
        const response = await api.post("/projects/tasks", taskData);
        setTasks([...tasks, response.data.task]);
      }
      setShowTaskModal(false);
      setSelectedTask(null);
    } finally {
      setIsSavingTask(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Work Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan and monitor work assignments, workflows, and team progress
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowTaskModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 text-sm font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Folder className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Projects</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{activeProjectsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Work Items</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totalTasksCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Delayed Projects</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{delayedProjectsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Milestones This Week</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{milestonesThisWeekCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Context details, Selector, Kanban */}
        <div className="lg:col-span-3 space-y-6">
          {/* Project Selector tabs */}
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">Selected Project Workspace</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterProject('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  filterProject === 'all'
                    ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white shadow-md'
                    : 'bg-background border border-border text-foreground hover:bg-accent'
                }`}
              >
                <Users className="w-4 h-4" />
                All Projects
              </button>
              
              {projectsList.map(project => (
                <button
                  key={project.id}
                  onClick={() => setFilterProject(project.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    filterProject === project.name
                      ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white shadow-md'
                      : 'bg-background border border-border text-foreground hover:bg-accent'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  {project.name}
                </button>
              ))}
            </div>
          </div>

          {/* Project Context Detail Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#9A77CF]/5 to-[#EC4176]/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/40">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">{filterProject === 'all' ? 'All Projects' : filterProject}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${healthInfo.bg} ${healthInfo.text} ${healthInfo.border}`}>
                    {healthInfo.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{selectedProjInfo.description}</p>
              </div>
              
              <div className="flex flex-col text-xs md:text-right text-muted-foreground gap-1">
                <p>Owner: <span className="font-semibold text-foreground">{selectedProjInfo.owner || "Unassigned"}</span></p>
                {selectedProjInfo.startDate && selectedProjInfo.endDate && (
                  <p>Timeline: <span className="font-semibold text-foreground">
                    {new Date(selectedProjInfo.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(selectedProjInfo.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span></p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold">Workflow Completion Progress</span>
                <span className="font-bold text-foreground">{projProgress}%</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#543884] via-[#9A77CF] to-[#EC4176] h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${projProgress}%` }}
                ></div>
              </div>
              <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
                <span>Tasks: <strong>{selectedProjInfo.tasks}</strong></span>
                <span>Completed: <strong className="text-green-500">{selectedProjInfo.completedTasks}</strong></span>
                <span>Active: <strong className="text-[#9A77CF]">{selectedProjInfo.tasks - selectedProjInfo.completedTasks}</strong></span>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          {loadingTasks ? (
            <div className="flex items-center justify-center py-16 col-span-4">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Loading work items...</p>
              </div>
            </div>
          ) : tasks.length === 0 && filterProject === 'all' ? (
            <div className="col-span-4 flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl bg-card/50 text-center gap-3">
              <Folder className="w-10 h-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-semibold text-foreground">No work projects found.</p>
                <p className="text-xs text-muted-foreground mt-1">Create a project to begin.</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="col-span-4 flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl bg-card/50 text-center gap-2">
              <p className="text-sm font-semibold text-foreground">No work items found for this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* To Do Column */}
              <KanbanColumn
                title="To Do"
                count={tasksByStatus.todo.length}
                color="gray"
                tasks={tasksByStatus.todo}
                onTaskClick={(task: Task) => {
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
                onMoveTask={moveTask}
                getPriorityColor={getPriorityColor}
              />

              {/* In Progress Column */}
              <KanbanColumn
                title="In Progress"
                count={tasksByStatus['in-progress'].length}
                color="blue"
                tasks={tasksByStatus['in-progress']}
                onTaskClick={(task: Task) => {
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
                onMoveTask={moveTask}
                getPriorityColor={getPriorityColor}
              />

              {/* In Review Column */}
              <KanbanColumn
                title="In Review"
                count={tasksByStatus['in-review'].length}
                color="yellow"
                tasks={tasksByStatus['in-review']}
                onTaskClick={(task: Task) => {
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
                onMoveTask={moveTask}
                getPriorityColor={getPriorityColor}
              />

              {/* Completed Column */}
              <KanbanColumn
                title="Completed"
                count={tasksByStatus.completed.length}
                color="green"
                tasks={tasksByStatus.completed}
                onTaskClick={(task: Task) => {
                  setSelectedTask(task);
                  setShowTaskModal(true);
                }}
                onMoveTask={moveTask}
                getPriorityColor={getPriorityColor}
              />
            </div>
          )}
        </div>

        {/* Right Column: Widgets / Sidebars */}
        <div className="space-y-6">
          {/* Team Workload Widget */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border/40">
              <Users className="w-4 h-4 text-[#9A77CF]" />
              Team Workload
            </h3>
            <div className="space-y-3.5">
              {teamWorkload.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No active tasks assigned.</p>
              ) : (
                teamWorkload.map(user => (
                  <div key={user.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                          {user.avatar}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-[100px]" title={user.name}>{user.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold">{user.total} task{user.total > 1 ? 's' : ''} ({user.rate}%)</span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${user.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Projects Directory Widget */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2 pb-2 border-b border-border/40">
              <Folder className="w-4 h-4 text-[#EC4176]" />
              Projects Directory
            </h3>
            <div className="space-y-2">
              {projectsList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No projects found.</p>
              ) : (
                projectsList.map(proj => {
                  const projProgress = proj.tasks > 0 ? Math.round((proj.completedTasks / proj.tasks) * 100) : 0;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => setFilterProject(proj.name)}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex justify-between items-center text-xs ${
                        filterProject === proj.name
                          ? 'border-[#9A77CF] bg-[#9A77CF]/5 font-semibold text-foreground'
                          : 'border-border/60 hover:bg-accent text-muted-foreground'
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{proj.name}</span>
                      <span className="text-foreground font-bold bg-accent px-2 py-0.5 rounded-full">{projProgress}%</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          employees={employees}
          projectsList={projectsList}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  title,
  count,
  color,
  tasks,
  onTaskClick,
  onMoveTask,
  getPriorityColor
}: any) {
  const colorMap: any = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colorMap[color]}`}></div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-accent px-2 py-1 rounded-full">
          {count}
        </span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {tasks.map((task: Task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onMove={onMoveTask}
            getPriorityColor={getPriorityColor}
          />
        ))}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onClick, onMove, getPriorityColor }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div
      onClick={onClick}
      className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all relative group"
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-1 h-8 rounded-full absolute left-0 top-3"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        ></div>
        <h4 className="text-sm font-semibold text-foreground ml-3 flex-1 line-clamp-2">
          {task.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 hover:bg-accent rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-8 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[120px]"
          >
            <button
              onClick={() => {
                if (task.status !== 'in-progress') onMove(task.id, 'in-progress');
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Move to In Progress
            </button>
            <button
              onClick={() => {
                if (task.status !== 'in-review') onMove(task.id, 'in-review');
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Move to Review
            </button>
            <button
              onClick={() => {
                if (task.status !== 'completed') onMove(task.id, 'completed');
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              Mark Complete
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3 ml-3 line-clamp-2">
        {task.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-3 ml-3">
        {task.tags.map((tag: string, idx: number) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-[#543884]/10 text-[#543884] dark:text-[#9A77CF] rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between ml-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white text-xs">
            {task.assigneeAvatar}
          </div>
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {task.comments}
            </div>
          )}
          {task.attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {task.attachments}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Task Modal Component
function TaskModal({ task, employees, projectsList, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee || '',
    assigneeAvatar: task?.assigneeAvatar || '',
    deadline: task?.deadline || '',
    project: task?.project || (projectsList && projectsList.length > 0 ? projectsList[0].name : 'Website Redesign'),
    tags: task?.tags || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description..."
              rows={4}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Assign To</label>
              <select
                value={formData.assignee}
                onChange={(e) => {
                  const employee = employees.find((emp: Employee) => emp.name === e.target.value);
                  setFormData({
                    ...formData,
                    assignee: e.target.value,
                    assigneeAvatar: employee?.avatar || ''
                  });
                }}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select employee...</option>
                {employees.map((emp: Employee) => (
                  <option key={emp.id} value={emp.name}>{emp.name} - {emp.role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Project</label>
            <select
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {projectsList && projectsList.length > 0 ? (
                projectsList.map((p: any) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))
              ) : (
                <option value="">No projects available</option>
              )}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold"
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
