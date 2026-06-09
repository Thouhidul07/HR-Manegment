import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Calendar, Flag, Tag, FileText,
  AlertCircle, CheckCircle2, Briefcase, Clock
} from "lucide-react";
import api from "../services/api";

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'completed';

interface Employee {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

export function NewTask() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    assigneeRole: '',
    deadline: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    project: '',
    tags: [] as string[],
    estimatedHours: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectsList, setProjectsList] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    api.get("/employees")
      .then((response) => {
        if (!isMounted || !response.data.employees?.length) return;

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
      .catch(() => {});

    api.get("/projects")
      .then((response) => {
        if (!isMounted) return;
        const names = (response.data.projects || []).map((p: any) => p.name);
        setProjectsList(names);
        if (names.length > 0) {
          setFormData(prev => ({ ...prev, project: names[0] }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);



  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const assignee = employees.find((employee) => employee.name === formData.assignee);

    await api.post("/projects/tasks", {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      assignee: formData.assignee,
      assigneeAvatar: assignee?.avatar || formData.assignee.slice(0, 2).toUpperCase(),
      deadline: formData.deadline,
      project: formData.project,
      tags: formData.tags,
      estimatedHours: formData.estimatedHours,
    });
    setIsSubmitting(false);

    navigate('/dashboard/project-management');
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500' };
      case 'high': return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500' };
      case 'medium': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500' };
      case 'low': return { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/project-management')}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Task</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign a new task to your team members
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Task Title */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Task Title
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Implement user authentication"
                className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the task in detail..."
                rows={6}
                className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                required
              />
            </div>

            {/* Project and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Project
                </label>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {projectsList.length === 0 ? (
                    <option value="">No projects available</option>
                  ) : (
                    projectsList.map(project => (
                      <option key={project} value={project}>{project}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Assignee and Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assign To
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assignee}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.name === e.target.value);
                    setFormData({
                      ...formData,
                      assignee: e.target.value,
                      assigneeRole: employee?.role || ''
                    });
                  }}
                  className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select team member...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Deadline
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Priority and Estimated Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        formData.priority === priority
                          ? `${getPriorityColor(priority).bg} ${getPriorityColor(priority).text} border-2 ${getPriorityColor(priority).border}`
                          : 'bg-background border border-border text-foreground hover:bg-accent'
                      }`}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="e.g., 8"
                  min="1"
                  className="w-full px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-3 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-3 bg-[#543884] text-white rounded-lg hover:brightness-110 transition-all text-sm font-medium"
                >
                  Add Tag
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#543884]/10 text-[#543884] dark:text-[#9A77CF] rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/dashboard/project-management')}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-all text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Task...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
            <h3 className="font-semibold text-foreground mb-4">Task Preview</h3>

            <div className="space-y-4">
              {/* Title Preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Title</p>
                <p className="text-sm font-semibold text-foreground">
                  {formData.title || 'No title yet'}
                </p>
              </div>

              {/* Project & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Project</p>
                  <span className="text-xs px-2 py-1 bg-[#543884]/10 text-[#543884] dark:text-[#9A77CF] rounded">
                    {formData.project}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                    {formData.status === 'todo' ? 'To Do' : formData.status === 'in-progress' ? 'In Progress' : formData.status === 'in-review' ? 'In Review' : 'Completed'}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              {formData.assignee && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center text-white text-xs font-semibold">
                      {formData.assignee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formData.assignee}</p>
                      <p className="text-xs text-muted-foreground">{formData.assigneeRole}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Deadline & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                  <p className="text-sm text-foreground">
                    {formData.deadline ? new Date(formData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Priority</p>
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(formData.priority).bg} ${getPriorityColor(formData.priority).text}`}>
                    {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                  </span>
                </div>
              </div>

              {/* Estimated Hours */}
              {formData.estimatedHours && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estimated Time</p>
                  <p className="text-sm text-foreground">{formData.estimatedHours} hours</p>
                </div>
              )}

              {/* Tags */}
              {formData.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#543884]/10 text-[#543884] dark:text-[#9A77CF] rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Preview */}
              {formData.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-xs text-muted-foreground line-clamp-4">
                    {formData.description}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Quick Tips</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  Use clear, action-oriented titles
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  Set realistic deadlines
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  Add relevant tags for easy filtering
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
