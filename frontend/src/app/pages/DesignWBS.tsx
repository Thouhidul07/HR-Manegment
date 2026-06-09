import { useState, useEffect } from "react";
import {
  Network,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  FileDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  Users,
  Edit2,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import api from "../services/api";

interface WBSNode {
  id: string;
  name: string;
  duration: string;
  cost: string;
  assignee: string;
  status: 'not-started' | 'in-progress' | 'completed';
  children: WBSNode[];
}

interface WbsDesign {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string;
  nodes: WBSNode[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function DesignWBS() {
  const [projects, setProjects] = useState<any[]>([]);
  const [savedWbsList, setSavedWbsList] = useState<WbsDesign[]>([]);
  const [activeWbsId, setActiveWbsId] = useState<number | null>(null);

  // Form states
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [wbsTitle, setWbsTitle] = useState("");
  const [wbsDescription, setWbsDescription] = useState("");
  const [wbsTree, setWbsTree] = useState<WBSNode[]>([]);
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Maximum WBS levels
  const MAX_WBS_LEVEL = 4;

  const loadInitialData = () => {
    setLoading(true);
    setError(null);
    
    // Fetch projects and WBS lists in parallel
    Promise.all([
      api.get("/projects"),
      api.get("/projects/wbs")
    ])
    .then(([projectsRes, wbsRes]) => {
      setProjects(projectsRes.data.projects || []);
      if (wbsRes.data?.success) {
        setSavedWbsList(wbsRes.data.data || []);
      } else {
        setError("Failed to parse WBS list from server.");
      }
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setError("Failed to load WBS data. Please check connection and try again.");
      setLoading(false);
    });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectWbs = (wbs: WbsDesign) => {
    setActiveWbsId(wbs.id);
    setSelectedProjectId(String(wbs.projectId));
    setWbsTitle(wbs.title);
    setWbsDescription(wbs.description);
    setWbsTree(wbs.nodes || []);
    setExpandedNodes(new Set());
    setEditingNode(null);
  };

  const handleStartNew = () => {
    setActiveWbsId(null);
    setSelectedProjectId("");
    setWbsTitle("");
    setWbsDescription("");
    setWbsTree([]);
    setExpandedNodes(new Set());
    setEditingNode(null);
  };

  // Generate unique ID
  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Calculate node level
  const getNodeLevel = (nodeId: string, nodes: WBSNode[] = wbsTree, level: number = 1): number => {
    for (const node of nodes) {
      if (node.id === nodeId) return level;
      if (node.children.length > 0) {
        const childLevel = getNodeLevel(nodeId, node.children, level + 1);
        if (childLevel > 0) return childLevel;
      }
    }
    return 0;
  };

  // Add root node
  const addRootNode = () => {
    const newNode: WBSNode = {
      id: generateId(),
      name: "New Phase",
      duration: "0 weeks",
      cost: "$0",
      assignee: "Unassigned",
      status: 'not-started',
      children: []
    };
    setWbsTree([...wbsTree, newNode]);
    setEditingNode(newNode.id);
  };

  // Add child node
  const addChildNode = (parentId: string, nodes: WBSNode[] = wbsTree): WBSNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        const newChild: WBSNode = {
          id: generateId(),
          name: "New Task",
          duration: "0 weeks",
          cost: "$0",
          assignee: "Unassigned",
          status: 'not-started',
          children: []
        };
        return {
          ...node,
          children: [...node.children, newChild]
        };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: addChildNode(parentId, node.children)
        };
      }
      return node;
    });
  };

  const handleAddChild = (parentId: string) => {
    const currentLevel = getNodeLevel(parentId);
    if (currentLevel >= MAX_WBS_LEVEL) {
      alert(`Maximum WBS level (${MAX_WBS_LEVEL}) reached. Cannot add sub-levels.`);
      return;
    }
    setWbsTree(addChildNode(parentId));
    setExpandedNodes(new Set([...expandedNodes, parentId]));
  };

  // Delete node
  const deleteNode = (nodeId: string, nodes: WBSNode[] = wbsTree): WBSNode[] => {
    return nodes.filter(node => node.id !== nodeId).map(node => ({
      ...node,
      children: deleteNode(nodeId, node.children)
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setWbsTree(deleteNode(nodeId));
    setEditingNode(null);
  };

  // Update node
  const updateNode = (
    nodeId: string,
    updates: Partial<WBSNode>,
    nodes: WBSNode[] = wbsTree
  ): WBSNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: updateNode(nodeId, updates, node.children)
        };
      }
      return node;
    });
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<WBSNode>) => {
    setWbsTree(updateNode(nodeId, updates));
  };

  // Toggle expand/collapse
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Calculate total cost
  const calculateTotalCost = (nodes: WBSNode[] = wbsTree): number => {
    return nodes.reduce((total, node) => {
      const nodeCost = parseFloat(node.cost.replace(/[$,]/g, '')) || 0;
      const childrenCost = calculateTotalCost(node.children);
      return total + nodeCost + childrenCost;
    }, 0);
  };

  // Save/Update WBS
  const handleSave = () => {
    if (!selectedProjectId || !wbsTitle) {
      alert("Please select a Project and enter a WBS Title.");
      return;
    }

    const payload = {
      projectId: parseInt(selectedProjectId),
      title: wbsTitle,
      description: wbsDescription,
      nodes: wbsTree
    };

    setLoading(true);

    const apiCall = activeWbsId 
      ? api.put(`/projects/wbs/${activeWbsId}`, payload)
      : api.post('/projects/wbs', payload);

    apiCall.then((response) => {
      if (response.data?.success) {
        setSuccessMessage(activeWbsId ? "WBS updated successfully!" : "WBS created successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Refresh WBS list and set active WBS
        api.get("/projects/wbs")
        .then(wbsRes => {
          if (wbsRes.data?.success) {
            setSavedWbsList(wbsRes.data.data || []);
            const matched = wbsRes.data.data.find((w: any) => 
              activeWbsId ? w.id === activeWbsId : w.title === wbsTitle
            );
            if (matched) {
              handleSelectWbs(matched);
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
      } else {
        alert(response.data?.message || "Failed to save WBS.");
        setLoading(false);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to save WBS structure. Please verify connection and fields.");
      setLoading(false);
    });
  };

  // Delete WBS
  const handleDeleteWBS = () => {
    if (!activeWbsId) return;
    if (!confirm("Are you sure you want to delete this WBS structure? This action cannot be undone.")) return;

    setLoading(true);
    api.delete(`/projects/wbs/${activeWbsId}`)
    .then((response) => {
      if (response.data?.success) {
        setSuccessMessage("WBS deleted successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        handleStartNew();
        
        // Refresh WBS list
        api.get("/projects/wbs")
        .then(wbsRes => {
          if (wbsRes.data?.success) {
            setSavedWbsList(wbsRes.data.data || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
      } else {
        alert(response.data?.message || "Failed to delete WBS.");
        setLoading(false);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to delete WBS.");
      setLoading(false);
    });
  };

  // Export to JSON
  const handleExport = () => {
    const wbsData = {
      title: wbsTitle,
      description: wbsDescription,
      projectId: selectedProjectId,
      wbsTree,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(wbsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wbsTitle || 'wbs'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render WBS Node
  const renderWBSNode = (node: WBSNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isEditing = editingNode === node.id;
    const currentLevel = level + 1; // Level starts from 1
    const canAddChild = currentLevel < MAX_WBS_LEVEL;

    const getLevelLabel = (lvl: number): string => {
      const labels = ['Phase', 'Activity', 'Task', 'Sub-task'];
      return labels[lvl - 1] || 'Item';
    };

    const getLevelColor = (lvl: number): string => {
      const colors = [
        'bg-purple-500/10 text-purple-600 border-purple-500/20',
        'bg-blue-500/10 text-blue-600 border-blue-500/20',
        'bg-green-500/10 text-green-600 border-green-500/20',
        'bg-orange-500/10 text-orange-600 border-orange-500/20'
      ];
      return colors[lvl - 1] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    };

    return (
      <div key={node.id} className="mb-2">
        <div
          className="bg-card border border-border rounded-lg p-4 hover:border-[#9A77CF]/50 transition-all"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-start gap-3">
            {/* Expand/Collapse */}
            <div className="flex items-center gap-2 pt-1">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(node.id)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}
            </div>

            {/* Node Content */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getLevelColor(currentLevel)}`}>
                      Level {currentLevel}: {getLevelLabel(currentLevel)}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={node.name}
                    onChange={(e) => handleUpdateNode(node.id, { name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                    placeholder="Task name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                      <input
                        type="text"
                        value={node.duration}
                        onChange={(e) => handleUpdateNode(node.id, { duration: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                        placeholder="e.g., 2 weeks"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Cost</label>
                      <input
                        type="text"
                        value={node.cost}
                        onChange={(e) => handleUpdateNode(node.id, { cost: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                        placeholder="e.g., $10,000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
                      <input
                        type="text"
                        value={node.assignee}
                        onChange={(e) => handleUpdateNode(node.id, { assignee: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                        placeholder="Team member"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                      <select
                        value={node.status}
                        onChange={(e) => handleUpdateNode(node.id, { status: e.target.value as WBSNode['status'] })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingNode(null)}
                    className="text-xs text-[#9A77CF] hover:text-[#EC4176] transition-colors"
                  >
                    Done Editing
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getLevelColor(currentLevel)}`}>
                          L{currentLevel}: {getLevelLabel(currentLevel)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground">{node.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingNode(node.id)}
                        className="p-1.5 hover:bg-accent rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleAddChild(node.id)}
                        className={`p-1.5 rounded transition-colors ${
                          canAddChild ? 'hover:bg-accent' : 'opacity-50 cursor-not-allowed'
                        }`}
                        title={canAddChild ? "Add sub-task" : `Maximum level (${MAX_WBS_LEVEL}) reached`}
                        disabled={!canAddChild}
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="p-1.5 hover:bg-accent rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{node.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{node.cost}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{node.assignee}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map(child => renderWBSNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalEstimatedCost = calculateTotalCost();

  if (loading && savedWbsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading WBS configs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h3 className="font-semibold text-foreground text-lg">Failed to load WBS</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <button
          onClick={loadInitialData}
          className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  // Find active project details to show budget comparison
  const activeProject = projects.find(p => String(p.id) === selectedProjectId);
  const activeProjectBudgetStr = activeProject?.budget || "$0";
  const activeProjectBudget = parseFloat(activeProjectBudgetStr.replace(/[$,]/g, '')) || 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Design WBS</h1>
          <p className="text-muted-foreground">Construct and schedule WBS configurations and sync them with MySQL</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leftmost Sidebar - Saved WBS configs list */}
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-1">
          <button
            onClick={handleStartNew}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create New WBS
          </button>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#9A77CF]" />
              Saved Designs ({savedWbsList.length})
            </h3>
            
            {savedWbsList.length === 0 ? (
              <p className="text-xs text-muted-foreground pt-2 text-center">
                No WBS designs found yet. Create one to start planning work structure.
              </p>
            ) : (
              <div className="space-y-2">
                {savedWbsList.map(wbs => (
                  <div
                    key={wbs.id}
                    onClick={() => handleSelectWbs(wbs)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:bg-accent ${
                      activeWbsId === wbs.id
                        ? 'border-purple-500 bg-[#543884]/5 font-semibold'
                        : 'border-border bg-card'
                    }`}
                  >
                    <p className="text-sm text-foreground line-clamp-1">{wbs.title}</p>
                    <p className="text-[10px] text-[#9A77CF] mt-1 truncate">{wbs.projectName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Metadata & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata Form */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">
              {activeWbsId ? 'Edit Configuration' : 'WBS Configuration'}
            </h3>
            
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Link to Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
              >
                <option value="">Select real project...</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                WBS Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={wbsTitle}
                onChange={(e) => setWbsTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                placeholder="e.g. Next-Gen Portal WBS"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={wbsDescription}
                onChange={(e) => setWbsDescription(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF] resize-none"
                placeholder="Scope or planning guidelines..."
                rows={4}
              />
            </div>

            {activeProject && (
              <div className="bg-accent/40 border border-border rounded-lg p-3 space-y-2 text-xs">
                <p className="font-bold text-foreground">Active Linked Project Details:</p>
                <p><span className="text-muted-foreground">Status:</span> <span className="font-semibold">{activeProject.status}</span></p>
                <p><span className="text-muted-foreground">Timeline:</span> <span className="font-semibold">{new Date(activeProject.startDate).toLocaleDateString()} - {new Date(activeProject.endDate).toLocaleDateString()}</span></p>
                <p><span className="text-muted-foreground">Budget Limit:</span> <span className="font-semibold">{activeProject.budget || "No limit set"}</span></p>
              </div>
            )}
          </div>

          {/* Costs Summary */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-foreground border-b border-border pb-2">
              <DollarSign className="w-5 h-5 text-[#9A77CF]" />
              Cost Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg text-sm">
                <span className="text-muted-foreground">Project Budget</span>
                <span className="font-semibold text-foreground">{activeProjectBudgetStr}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg text-sm">
                <span className="text-muted-foreground">Estimated WBS Cost</span>
                <span className="font-semibold text-foreground">${totalEstimatedCost.toLocaleString()}</span>
              </div>
              
              {activeProjectBudget > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                  totalEstimatedCost > activeProjectBudget
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-green-500/10 text-green-600'
                }`}>
                  <span className="font-medium">
                    {totalEstimatedCost > activeProjectBudget ? 'Over Budget' : 'Within Budget'}
                  </span>
                  <span className="font-semibold">
                    {((totalEstimatedCost / activeProjectBudget) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Triggers */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Save className="w-4 h-4" />
              {activeWbsId ? 'Update WBS' : 'Save WBS'}
            </button>
            
            {activeWbsId && (
              <button
                onClick={handleDeleteWBS}
                className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete WBS Design
              </button>
            )}

            <button
              onClick={handleExport}
              disabled={wbsTree.length === 0}
              className="w-full px-4 py-2.5 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              Export to JSON
            </button>
          </div>
        </div>

        {/* Right Panel - Tree Builder */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-foreground text-lg">
                  <Network className="w-5 h-5 text-[#9A77CF]" />
                  WBS Tree Builder
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Click Add Phase to begin building your task structural breakdown hierarchy.
                </p>
              </div>
              <button
                onClick={addRootNode}
                className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Phase
              </button>
            </div>

            {wbsTree.length === 0 ? (
              <div className="text-center py-16">
                <Network className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No WBS Structure Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add a root level phase, then construct activities, tasks, and sub-tasks.
                </p>
                <button
                  onClick={addRootNode}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Phase
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {wbsTree.map(node => renderWBSNode(node))}
              </div>
            )}

            {wbsTree.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Click <strong>Edit</strong> to modify node attributes, <strong>+</strong> to add a sub-task, or <strong>Delete</strong> to remove.
                    Use collapsible arrows on nodes that contain children.
                  </p>
                </div>

                {/* Level Guide Legend */}
                <div className="bg-accent/50 rounded-lg p-4">
                  <h4 className="text-xs font-bold uppercase text-foreground mb-3">WBS Level Reference</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-purple-500/10 text-purple-600 border-purple-500/20">
                        Level 1
                      </span>
                      <span className="text-xs text-muted-foreground">Phase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                        Level 2
                      </span>
                      <span className="text-xs text-muted-foreground">Activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-green-500/10 text-green-600 border-green-500/20">
                        Level 3
                      </span>
                      <span className="text-xs text-muted-foreground">Task</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-orange-500/10 text-orange-600 border-orange-500/20">
                        Level 4
                      </span>
                      <span className="text-xs text-muted-foreground">Sub-task</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
