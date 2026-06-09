import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Search, Calendar, User, CheckCircle2, Clock, AlertCircle, XCircle, Tag, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskCategory = "general" | "performance" | "expense" | "training" | "attendance" | "leave" | "onboarding" | "offboarding" | "custom";

interface Task {
  id: number;
  company_id: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: number;
  assigned_by: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee_name: string;
  assignee_email: string;
  assigner_name: string;
  assigner_email: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
}

interface TasksSummary {
  totalTasks: number;
  todo: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  urgent: number;
  overdue: number;
}

const statusMap: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" }> = {
  todo: { label: "To Do", variant: "outline" },
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const priorityMap: Record<TaskPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "info" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "destructive" },
};

const categoryMap: Record<TaskCategory, string> = {
  general: "General",
  performance: "Performance",
  expense: "Expenses",
  training: "Training",
  attendance: "Attendance",
  leave: "Leave",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  custom: "Custom",
};

const getDueDateLabel = (dueDateStr: string | null, status: string) => {
  if (!dueDateStr) return { text: "No due date", color: "text-muted-foreground" };
  if (status === "completed" || status === "cancelled") {
    return {
      text: new Date(dueDateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      color: "text-muted-foreground"
    };
  }
  
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const dateFormatted = dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  
  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      text: `${dateFormatted} (Overdue by ${days} day${days > 1 ? 's' : ''})`,
      color: "text-red-500 font-semibold"
    };
  } else if (diffDays === 0) {
    return {
      text: `${dateFormatted} (Due Today)`,
      color: "text-amber-500 font-semibold animate-pulse"
    };
  } else if (diffDays === 1) {
    return {
      text: `${dateFormatted} (Due Tomorrow)`,
      color: "text-amber-500 font-semibold"
    };
  } else if (diffDays <= 3) {
    return {
      text: `${dateFormatted} (Due in ${diffDays} days)`,
      color: "text-amber-500/80"
    };
  } else {
    return {
      text: `${dateFormatted} (Due in ${diffDays} days)`,
      color: "text-muted-foreground"
    };
  }
};

export function Tasks() {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<TasksSummary>({
    totalTasks: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    urgent: 0,
    overdue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false);
  const [myTasksOnly, setMyTasksOnly] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalForm, setModalForm] = useState({
    title: "",
    description: "",
    category: "general" as TaskCategory,
    priority: "medium" as TaskPriority,
    status: "todo" as TaskStatus,
    assignedTo: "",
    dueDate: "",
  });

  const isAdmin = currentUser?.role === "admin";
  const isHR = currentUser?.role === "hr_manager";
  const canAssign = isAdmin || isHR;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (priorityFilter !== "All") params.priority = priorityFilter;
      if (categoryFilter !== "All") params.category = categoryFilter;
      
      if (myTasksOnly) {
        params.assignedTo = String(currentUser?.id);
      } else if (assigneeFilter !== "All") {
        params.assignedTo = assigneeFilter;
      }

      if (search) params.search = search;
      if (overdueFilter) params.overdue = "true";

      const [tasksRes, summaryRes] = await Promise.all([
        api.get("/tasks", { params }),
        api.get("/tasks/summary"),
      ]);

      setTasks(tasksRes.data.tasks || []);
      setSummary(summaryRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, assigneeFilter, search, overdueFilter, myTasksOnly, currentUser]);

  const loadEmployees = useCallback(async () => {
    if (!canAssign) return;
    try {
      const res = await api.get("/employees");
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error("Failed to load employees for assignment", err);
    }
  }, [canAssign]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccessMessage("");
    } else {
      setSuccessMessage(msg);
      setError("");
      window.setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const openCreateModal = () => {
    setSelectedTask(null);
    setModalForm({
      title: "",
      description: "",
      category: "general",
      priority: "medium",
      status: "todo",
      assignedTo: "",
      dueDate: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setModalForm({
      title: task.title,
      description: task.description || "",
      category: task.category,
      priority: task.priority,
      status: task.status,
      assignedTo: String(task.assigned_to),
      dueDate: task.due_date || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!modalForm.title.trim()) {
      showFeedback("Title is required", true);
      return;
    }

    const payload = {
      title: modalForm.title,
      description: modalForm.description || null,
      category: modalForm.category,
      priority: modalForm.priority,
      status: modalForm.status,
      assignedTo: modalForm.assignedTo ? Number(modalForm.assignedTo) : null,
      dueDate: modalForm.dueDate || null,
    };

    try {
      if (selectedTask) {
        await api.patch(`/tasks/${selectedTask.id}`, payload);
        showFeedback("Task updated successfully");
      } else {
        await api.post("/tasks", payload);
        showFeedback("Task created successfully");
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err: any) {
      showFeedback(err?.response?.data?.message || "Failed to save task", true);
    }
  };

  const handleQuickStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      showFeedback("Status updated successfully");
      loadTasks();
    } catch (err: any) {
      showFeedback(err?.response?.data?.message || "Failed to update status", true);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      showFeedback("Task deleted successfully");
      loadTasks();
    } catch (err: any) {
      showFeedback(err?.response?.data?.message || "Failed to delete task", true);
    }
  };

  const getEditDisableReason = (task: Task): string | null => {
    if (canAssign) return null; // Admin/HR can edit any company task
    // Employee can edit only own self-created or assigned tasks
    const currentUserIdNum = Number(currentUser?.id);
    if (task.assigned_to === currentUserIdNum || task.assigned_by === currentUserIdNum) {
      return null;
    }
    return "You do not have permission to edit this task";
  };

  const getDeleteDisableReason = (task: Task): string | null => {
    if (canAssign) return null; // Admin/HR can delete any company task
    // Employee can delete only self-created tasks
    const currentUserIdNum = Number(currentUser?.id);
    if (task.assigned_by === currentUserIdNum) {
      return null;
    }
    return "Only the task creator can delete this task";
  };

  const getNeedsAttentionTasks = () => {
    return tasks.filter(task => {
      if (task.status === "completed" || task.status === "cancelled") return false;
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 2; // Overdue (<0) or Due Soon (0, 1, 2)
    });
  };
  
  const needsAttentionTasks = getNeedsAttentionTasks();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl text-foreground font-bold mb-2">
            {canAssign ? "Task Management" : "My Tasks"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {canAssign
              ? "View, track, and manage operational task administration and employee assignments"
              : "Track and update your assigned and self-created tasks"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canAssign && (
            <div className="bg-card border border-border p-1 rounded-lg flex gap-1 shadow-sm">
              <button
                onClick={() => setMyTasksOnly(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !myTasksOnly
                    ? "bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setMyTasksOnly(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  myTasksOnly
                    ? "bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                My Tasks
              </button>
            </div>
          )}
          <Button variant="primary" className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            {canAssign ? "Assign Task" : "Create Task"}
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards — clickable to filter */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            statusFilter === "All" && !overdueFilter ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onClick={() => { setStatusFilter("All"); setOverdueFilter(false); }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
                <Clock className="w-5 h-5 text-[var(--chart-1)]" />
              </div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </div>
          <p className="text-2xl text-foreground font-bold">{summary.totalTasks}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            statusFilter === "todo" ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onClick={() => { setStatusFilter(statusFilter === "todo" ? "All" : "todo"); setOverdueFilter(false); }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--warning)]/20">
                <Clock className="w-5 h-5 text-[var(--warning)]" />
              </div>
              <p className="text-sm text-muted-foreground">To Do</p>
            </div>
            {statusFilter === "todo" && <Badge variant="warning" size="sm">Filtered</Badge>}
          </div>
          <p className="text-2xl text-foreground font-bold">{summary.todo}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            statusFilter === "in_progress" ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onClick={() => { setStatusFilter(statusFilter === "in_progress" ? "All" : "in_progress"); setOverdueFilter(false); }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--info)]/20">
                <Clock className="w-5 h-5 text-[var(--info)]" />
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            {statusFilter === "in_progress" && <Badge variant="info" size="sm">Filtered</Badge>}
          </div>
          <p className="text-2xl text-foreground font-bold">{summary.inProgress}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            statusFilter === "completed" ? "border-primary bg-primary/5" : "border-transparent"
          }`}
          onClick={() => { setStatusFilter(statusFilter === "completed" ? "All" : "completed"); setOverdueFilter(false); }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--success)]/20">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            {statusFilter === "completed" && <Badge variant="success" size="sm">Filtered</Badge>}
          </div>
          <p className="text-2xl text-foreground font-bold">{summary.completed}</p>
        </Card>

        <Card
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${
            overdueFilter ? "border-destructive bg-destructive/5" : "border-transparent"
          }`}
          onClick={() => { setOverdueFilter(!overdueFilter); setStatusFilter("All"); }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
            {overdueFilter && <Badge variant="error" size="sm">Filtered</Badge>}
          </div>
          <p className="text-2xl text-foreground font-bold text-destructive">{summary.overdue}</p>
        </Card>
      </div>

      {/* Needs Attention Panel */}
      {needsAttentionTasks.length > 0 && (
        <Card className="border-l-4 border-red-500 bg-red-500/5 overflow-hidden">
          <div className="bg-red-500/10 px-6 py-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-red-500">Needs Attention ({needsAttentionTasks.length})</h3>
            </div>
            <p className="text-xs text-red-400">Tasks overdue or due within 48 hours</p>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {needsAttentionTasks.slice(0, 3).map((task) => {
                const dueInfo = getDueDateLabel(task.due_date, task.status);
                return (
                  <div key={task.id} className="bg-background border border-border p-3 rounded-lg flex flex-col justify-between hover:shadow-sm transition-all relative pl-5">
                    <div className="w-1 h-12 bg-red-500 rounded-full absolute left-1.5 top-3"></div>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">{task.title}</span>
                        <Badge variant={priorityMap[task.priority]?.variant || "default"} size="sm">
                          {priorityMap[task.priority]?.label || task.priority}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{task.description || "No description provided."}</p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-2 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                          {task.assignee_name ? task.assignee_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "U"}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[85px]">{task.assignee_name || "Unassigned"}</span>
                      </div>
                      <span className={`text-[10px] ${dueInfo.color}`}>{dueInfo.text}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/20">
                      <button
                        onClick={() => handleQuickStatusChange(task.id, "in_progress")}
                        className="px-2 py-0.5 rounded bg-info/20 text-info text-[10px] hover:bg-info/30 transition-all font-semibold"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(task.id, "completed")}
                        className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] hover:bg-success/30 transition-all font-semibold"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {needsAttentionTasks.length > 3 && (
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                And {needsAttentionTasks.length - 3} more task(s) requiring attention. Check the main list below.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter and search bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <select
            value={overdueFilter ? "overdue" : statusFilter}
            onChange={(e) => {
              if (e.target.value === "overdue") {
                setOverdueFilter(true);
                setStatusFilter("All");
              } else {
                setOverdueFilter(false);
                setStatusFilter(e.target.value);
              }
            }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            aria-label="Status filter"
          >
            <option value="All">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="overdue">⚠ Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            aria-label="Priority filter"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            aria-label="Category filter"
          >
            <option value="All">All Categories</option>
            {Object.entries(categoryMap).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>

          {canAssign ? (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              aria-label="Assignee filter"
            >
              <option value="All">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center justify-center border border-border bg-accent/20 px-3 py-2 rounded-lg text-xs text-muted-foreground gap-2">
              <Shield className="w-3.5 h-3.5" />
              Employee-scoped
            </div>
          )}
        </div>
      </Card>

      {/* Task List Content */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No tasks found matching current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Task Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Assigned To</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task) => {
                    const editDisableReason = getEditDisableReason(task);
                    const deleteDisableReason = getDeleteDisableReason(task);

                    return (
                      <tr key={task.id} className="hover:bg-accent/10 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="gap-1">
                            <Tag className="w-3 h-3" />
                            {categoryMap[task.category] || task.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={priorityMap[task.priority]?.variant || "default"}>
                            {priorityMap[task.priority]?.label || task.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                              {task.assignee_name ? task.assignee_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "EU"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{task.assignee_name || "Unassigned"}</p>
                              <p className="text-[10px] text-muted-foreground">{task.assignee_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {task.due_date ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                              <span className={`text-[10px] ${getDueDateLabel(task.due_date, task.status).color}`}>
                                {getDueDateLabel(task.due_date, task.status).text.includes("(")
                                  ? getDueDateLabel(task.due_date, task.status).text.split("(")[1].replace(")", "")
                                  : ""}
                              </span>
                            </div>
                          ) : (
                            "No due date"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusMap[task.status]?.variant || "default"}>
                              {statusMap[task.status]?.label || task.status}
                            </Badge>
                            <select
                              value={task.status}
                              onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                              className="px-2 py-0.5 rounded border border-border bg-background text-foreground text-xs focus:outline-none"
                              aria-label="Quick status update"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editDisableReason ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-50 cursor-not-allowed text-muted-foreground"
                                title={editDisableReason}
                                disabled
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(task)}
                                title="Edit Task"
                              >
                                <Edit className="w-4 h-4 text-primary" />
                              </Button>
                            )}

                            {deleteDisableReason ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-50 cursor-not-allowed text-muted-foreground"
                                title={deleteDisableReason}
                                disabled
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task.id)}
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? "Edit Task" : (canAssign ? "Assign Task" : "Create Task")}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {selectedTask ? "Save Changes" : "Create Task"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={modalForm.title}
            onChange={(e) => setModalForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Enter task title"
            required
          />

          <div>
            <label className="block text-sm mb-1.5 text-foreground">Description</label>
            <textarea
              value={modalForm.description}
              onChange={(e) => setModalForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Task details and deliverables"
              className="w-full min-h-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Category</label>
              <select
                value={modalForm.category}
                onChange={(e) => setModalForm((f) => ({ ...f, category: e.target.value as TaskCategory }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                {Object.entries(categoryMap).map(([key, val]) => (
                  <option key={key} value={key}>{val}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-foreground">Priority</label>
              <select
                value={modalForm.priority}
                onChange={(e) => setModalForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Status</label>
              <select
                value={modalForm.status}
                onChange={(e) => setModalForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <Input
              label="Due Date"
              type="date"
              value={modalForm.dueDate}
              onChange={(e) => setModalForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          {canAssign && (
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Assign Employee</label>
              <select
                value={modalForm.assignedTo}
                onChange={(e) => setModalForm((f) => ({ ...f, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Assign to Self</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || emp.role})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
