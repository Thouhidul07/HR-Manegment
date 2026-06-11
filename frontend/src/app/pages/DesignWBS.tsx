import { useState } from "react";
import {
  Network,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  FileDown,
  Upload,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  Users,
  Edit2,
} from "lucide-react";

interface WBSNode {
  id: string;
  name: string;
  duration: string;
  cost: string;
  assignee: string;
  status: 'not-started' | 'in-progress' | 'completed';
  children: WBSNode[];
}

export function DesignWBS() {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [projectStatus, setProjectStatus] = useState<'current' | 'planning'>('planning');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [wbsTree, setWbsTree] = useState<WBSNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Generate unique ID
  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Maximum WBS levels
  const MAX_WBS_LEVEL = 4;

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
      alert(`Maximum WBS level (${MAX_WBS_LEVEL}) reached. Cannot add more sub-levels.`);
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

  // Save WBS
  const handleSave = () => {
    if (!projectName || !startDate || !endDate || !totalBudget) {
      alert("Please fill in all required fields: Project Name, Start Date, End Date, and Total Budget");
      return;
    }

    const wbsData = {
      id: Date.now(),
      name: projectName,
      description: projectDescription,
      status: projectStatus,
      startDate,
      endDate,
      budget: totalBudget,
      spent: "$0",
      team: parseInt(teamSize) || 0,
      completion: projectStatus === 'planning' ? 0 : calculateCompletion(wbsTree),
      wbs: wbsTree,
      createdAt: new Date().toISOString()
    };

    // Get existing projects from localStorage
    const existingProjects = JSON.parse(localStorage.getItem('wbsProjects') || '[]');

    // Add new project
    const updatedProjects = [...existingProjects, wbsData];

    // Save to localStorage
    localStorage.setItem('wbsProjects', JSON.stringify(updatedProjects));

    console.log("Saving WBS:", wbsData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Reset form
    setTimeout(() => {
      setProjectName("");
      setProjectDescription("");
      setTotalBudget("");
      setProjectStatus('planning');
      setStartDate("");
      setEndDate("");
      setTeamSize("");
      setWbsTree([]);
    }, 1000);
  };

  // Calculate completion percentage based on completed tasks
  const calculateCompletion = (nodes: WBSNode[]): number => {
    let total = 0;
    let completed = 0;

    const countNodes = (nodeList: WBSNode[]) => {
      nodeList.forEach(node => {
        total++;
        if (node.status === 'completed') completed++;
        if (node.children.length > 0) countNodes(node.children);
      });
    };

    countNodes(nodes);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Export to JSON
  const handleExport = () => {
    const wbsData = {
      projectName,
      projectDescription,
      totalBudget,
      wbsTree,
      createdAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(wbsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'wbs'}-${Date.now()}.json`;
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

    // Level labels for WBS
    const getLevelLabel = (lvl: number): string => {
      const labels = ['Phase', 'Activity', 'Task', 'Sub-task'];
      return labels[lvl - 1] || 'Item';
    };

    // Level colors
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
                  {/* Level Badge */}
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
                          canAddChild
                            ? 'hover:bg-accent'
                            : 'opacity-50 cursor-not-allowed'
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

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span>WBS saved successfully! Project added to Project History.</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#543884] to-[#9A77CF] flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Design WBS</h1>
            <p className="text-muted-foreground">Create and design Work Breakdown Structure with cost and time estimations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Project Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Details */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Project Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF] resize-none"
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as 'current' | 'planning')}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                >
                  <option value="planning">Planning</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Total Budget <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                  placeholder="e.g., $100,000"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Team Size</label>
                <input
                  type="number"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
                  placeholder="Number of team members"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#9A77CF]" />
              Cost Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <span className="text-sm text-muted-foreground">Total Budget</span>
                <span className="font-semibold">{totalBudget || "$0"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="font-semibold">${totalEstimatedCost.toLocaleString()}</span>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                totalEstimatedCost > parseFloat(totalBudget?.replace(/[$,]/g, '') || '0')
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-green-500/10 text-green-600'
              }`}>
                <span className="text-sm font-medium">
                  {totalEstimatedCost > parseFloat(totalBudget?.replace(/[$,]/g, '') || '0')
                    ? 'Over Budget'
                    : 'Within Budget'}
                </span>
                <span className="font-semibold">
                  {totalBudget
                    ? `${((totalEstimatedCost / parseFloat(totalBudget.replace(/[$,]/g, '') || '1')) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleSave}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save WBS
              </button>
              <button
                onClick={handleExport}
                className="w-full px-4 py-2.5 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-all flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export to JSON
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Saved projects will automatically appear in <strong>Project History</strong> page
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - WBS Tree */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Network className="w-5 h-5 text-[#9A77CF]" />
                  WBS Tree Structure
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Build your project breakdown structure with phases and tasks
                </p>
              </div>
              <button
                onClick={addRootNode}
                className="px-4 py-2 bg-gradient-to-r from-[#543884] to-[#9A77CF] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-sm"
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
                  Start by adding a phase to begin building your Work Breakdown Structure
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
              <div className="space-y-2">
                {wbsTree.map(node => renderWBSNode(node))}
              </div>
            )}

            {wbsTree.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Click <strong>Edit</strong> to modify a task, <strong>+</strong> to add a sub-task, or <strong>Delete</strong> to remove.
                    Use the expand/collapse arrows for nodes with children.
                  </p>
                </div>

                {/* WBS Level Guide */}
                <div className="bg-accent/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">WBS Level Structure (Max 4 Levels)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold border bg-purple-500/10 text-purple-600 border-purple-500/20">
                        Level 1
                      </span>
                      <span className="text-xs text-muted-foreground">Phase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold border bg-blue-500/10 text-blue-600 border-blue-500/20">
                        Level 2
                      </span>
                      <span className="text-xs text-muted-foreground">Activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold border bg-green-500/10 text-green-600 border-green-500/20">
                        Level 3
                      </span>
                      <span className="text-xs text-muted-foreground">Task</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-semibold border bg-orange-500/10 text-orange-600 border-orange-500/20">
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
