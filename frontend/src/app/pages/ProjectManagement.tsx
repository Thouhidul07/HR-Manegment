import { useEffect, useState } from "react";
import {
  Plus, Users, Calendar, Clock, AlertCircle,
  CheckCircle2, MoreVertical, Edit, Trash2,
  X, User, Flag, Tag, MessageSquare, Paperclip
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
  assignedTo: number | null;
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
  const [loadError, setLoadError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    api.get("/projects/tasks")
      .then((response) => {
        if (isMounted) {
          setTasks(response.data.tasks || []);
        }
      })
      .catch(() => {
        if (isMounted) setLoadError("Unable to load project tasks.");
      });

    api.get("/employees")
      .then((response) => {
        if (!isMounted) return;

        setEmployees((response.data.employees || []).map((employee: any) => ({
          id: employee.id,
          name: employee.name,
          role: employee.position || employee.department || "Team Member",
          avatar: employee.name
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        })));
      })
      .catch(() => {
        if (isMounted) setLoadError("Unable to load project employees.");
      });

    api.get("/projects")
      .then((response) => {
        if (!isMounted) return;
        setProjectOptions((response.data.projects || []).map((project: any) => project.name).filter(Boolean));
      })
      .catch(() => {
        if (isMounted) setLoadError("Unable to load projects.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const taskProjects = tasks.map((task) => task.project).filter(Boolean);
  const projects = ['all', ...Array.from(new Set([...projectOptions, ...taskProjects]))];

  const filteredTasks = filterProject === 'all'
    ? tasks
    : tasks.filter(task => task.project === filterProject);

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'in-review': filteredTasks.filter(t => t.status === 'in-review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    inReview: tasks.filter(t => t.status === 'in-review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign tasks, track progress, and manage project workflows
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowTaskModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {loadError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">To Do</p>
              <p className="text-2xl font-bold text-foreground">{stats.todo}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Review</p>
              <p className="text-2xl font-bold text-foreground">{stats.inReview}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-foreground">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Filter */}
      <div className="bg-card border border-border rounded-xl p-4">
        <label className="text-sm font-semibold text-foreground mb-3 block">Filter by Project</label>
        <div className="flex gap-2">
          {projects.map(project => (
            <button
              key={project}
              onClick={() => setFilterProject(project)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filterProject === project
                  ? 'bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white'
                  : 'bg-background border border-border text-foreground hover:bg-accent'
              }`}
            >
              {project === 'all' ? 'All Projects' : project}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
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

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          employees={employees}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask}
          projects={projects.filter((project) => project !== 'all')}
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
function TaskModal({ task, employees, projects, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo ? String(task.assignedTo) : '',
    assignee: task?.assignee || '',
    assigneeAvatar: task?.assigneeAvatar || '',
    deadline: task?.deadline || '',
    project: task?.project || '',
    tags: task?.tags || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, assignedTo: formData.assignedTo ? Number(formData.assignedTo) : null });
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
                value={formData.assignedTo}
                onChange={(e) => {
                  const employee = employees.find((emp: Employee) => String(emp.id) === e.target.value);
                  setFormData({
                    ...formData,
                    assignedTo: e.target.value,
                    assignee: employee?.name || '',
                    assigneeAvatar: employee?.avatar || ''
                  });
                }}
                className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select employee...</option>
                {employees.map((emp: Employee) => (
                  <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
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
              required
            >
              <option value="">Select project...</option>
              {projects.map((project: string) => (
                <option key={project} value={project}>{project}</option>
              ))}
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
