import { useState, useEffect } from "react";
import api from "../services/api";
import {
  FolderGit2,
  ChevronRight,
  ChevronDown,
  Calendar,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  ClipboardList,
  Target,
  Folder,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";

type ProjectStatus = 'completed' | 'current' | 'planning';

interface WBSTask {
  id: string;
  name: string;
  duration: string;
  cost: string;
  assignee: string;
  status: 'completed' | 'in-progress' | 'not-started';
  children?: WBSTask[];
}

interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: string;
  spent: string;
  team: number;
  completion: number;
  description: string;
  wbs: WBSTask[];
}

export function ProjectHistory() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadSavedProjects = async (): Promise<Project[]> => {
    try {
      const [historyResponse, wbsResponse] = await Promise.all([
        api.get("/projects/history"),
        api.get("/projects/wbs"),
      ]);
      const workBreakdownStructures = wbsResponse.data.workBreakdownStructures || [];
      return (historyResponse.data.projects || []).map((project: any) => {
        const wbs = workBreakdownStructures.find((item: any) => Number(item.projectId) === Number(project.id));
        return {
          id: project.id,
          name: project.name,
          status: project.status === "completed" ? "completed" : project.status === "planning" ? "planning" : "current",
          startDate: project.startDate || "",
          endDate: project.endDate || "",
          budget: "",
          spent: "",
          team: Number(project.members || 0),
          completion: project.tasks ? Math.round((Number(project.completedTasks || 0) / Number(project.tasks)) * 100) : 0,
          description: project.description || "",
          wbs: wbs?.nodes || [],
        };
      });
    } catch (error) {
      console.error('Error loading saved projects:', error);
      return [];
    }
  };

  // Load projects on mount
  useEffect(() => {
    loadSavedProjects().then(setSavedProjects);
  }, []);

  // Refresh projects
  const handleRefresh = () => {
    loadSavedProjects().then(setSavedProjects);
  };

  // Check if project is deletable
  const isProjectDeletable = (projectId: number): boolean => {
    return savedProjects.some(p => p.id === projectId);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isProjectDeletable(project.id)) {
      alert("Only saved projects can be deleted.");
      return;
    }
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setProjectToDelete(null);
    setShowDeleteConfirm(false);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      const updatedProjects = savedProjects.filter(p => p.id !== projectToDelete.id);

      // Update state
      setSavedProjects(updatedProjects);

      // If deleted project was selected, clear selection
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(null);
      }

      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const projects: Project[] = savedProjects;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500' };
      case 'current': return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500' };
      case 'planning': return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500' };
    }
  };

  const getTaskStatusColor = (status: 'completed' | 'in-progress' | 'not-started') => {
    switch (status) {
      case 'completed': return { bg: 'bg-green-500/10', text: 'text-green-500' };
      case 'in-progress': return { bg: 'bg-blue-500/10', text: 'text-blue-500' };
      case 'not-started': return { bg: 'bg-gray-500/10', text: 'text-gray-500' };
    }
  };

  const renderWBSNode = (node: WBSTask, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const statusColors = getTaskStatusColor(node.status);

    return (
      <div key={node.id} className="mb-2">
        <div
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-accent transition-all cursor-pointer"
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <button
              type="button"
              className="p-0.5 hover:bg-accent rounded transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors.text.replace('text-', '') }} />

          <div className="flex-1 grid grid-cols-5 gap-4 items-center">
            <div className="col-span-2">
              <p className="text-sm font-semibold text-foreground">{node.name}</p>
              <p className="text-xs text-muted-foreground">ID: {node.id}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {node.duration}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              {node.cost}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{node.assignee}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}>
                {node.status === 'completed' ? 'Done' : node.status === 'in-progress' ? 'In Progress' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children!.map(child => renderWBSNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const groupedProjects = {
    current: projects.filter(p => p.status === 'current'),
    planning: projects.filter(p => p.status === 'planning'),
    completed: projects.filter(p => p.status === 'completed')
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">Delete Project</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ All WBS structure and cost estimations for this project will be permanently deleted.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all projects with their WBS breakdown and cost estimations
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-all flex items-center gap-2 text-sm"
          title="Refresh projects"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Current Projects */}
          {groupedProjects.current.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Current Projects ({groupedProjects.current.length})
              </h3>
              <div className="space-y-2">
                {groupedProjects.current.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedProject?.id === project.id
                        ? 'border-blue-500 shadow-md'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-foreground flex-1">{project.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text}`}>
                          Active
                        </span>
                        {isProjectDeletable(project.id) && (
                          <button
                            onClick={(e) => openDeleteConfirmation(project, e)}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {project.team} members
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">{project.completion}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#543884] to-[#9A77CF] rounded-full transition-all"
                          style={{ width: `${project.completion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Planning Projects */}
          {groupedProjects.planning.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-purple-500" />
                Planning ({groupedProjects.planning.length})
              </h3>
              <div className="space-y-2">
                {groupedProjects.planning.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedProject?.id === project.id
                        ? 'border-purple-500 shadow-md'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-foreground flex-1">{project.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text}`}>
                          Planning
                        </span>
                        {isProjectDeletable(project.id) && (
                          <button
                            onClick={(e) => openDeleteConfirmation(project, e)}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Starts {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        Budget: {project.budget}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {groupedProjects.completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Completed ({groupedProjects.completed.length})
              </h3>
              <div className="space-y-2">
                {groupedProjects.completed.map(project => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedProject?.id === project.id
                        ? 'border-green-500 shadow-md'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-foreground flex-1">{project.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(project.status).bg} ${getStatusColor(project.status).text}`}>
                          Done
                        </span>
                        {isProjectDeletable(project.id) && (
                          <button
                            onClick={(e) => openDeleteConfirmation(project, e)}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Budget vs Spent</span>
                        <span className="font-semibold text-foreground">{project.spent} / {project.budget}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Details & WBS */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Overview */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{selectedProject.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedProject.status).bg} ${getStatusColor(selectedProject.status).text}`}>
                    {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedProject.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End Date</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedProject.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Budget</p>
                    <p className="text-sm font-semibold text-foreground">{selectedProject.budget}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Spent</p>
                    <p className="text-sm font-semibold text-foreground">{selectedProject.spent}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Progress</span>
                    <span className="text-sm font-semibold text-foreground">{selectedProject.completion}%</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#543884] to-[#9A77CF] rounded-full transition-all"
                      style={{ width: `${selectedProject.completion}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* WBS Tree */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Folder className="w-5 h-5 text-[#9A77CF]" />
                      Work Breakdown Structure (WBS)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Detailed project phases and cost estimations</p>
                  </div>
                  <button
                    onClick={() => setExpandedNodes(new Set(selectedProject.wbs.map(n => n.id)))}
                    className="text-xs text-[#9A77CF] hover:text-[#EC4176] transition-colors"
                  >
                    Expand All
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedProject.wbs.map(node => renderWBSNode(node))}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#9A77CF]" />
                  Cost Estimation Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
                    <p className="text-2xl font-bold text-foreground">{selectedProject.budget}</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">{selectedProject.spent}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
              <FolderGit2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Select a Project</h3>
              <p className="text-sm text-muted-foreground">
                Choose a project from the list to view its WBS tree and cost estimations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
