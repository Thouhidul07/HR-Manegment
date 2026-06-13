import { useState } from "react";
import { X, Shield, Info } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Switch } from "../ui/switch";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const permissions = [
  { id: 1, module: "Dashboard", category: "Core" },
  { id: 2, module: "Employee Management", category: "HR" },
  { id: 3, module: "Recruitment", category: "HR" },
  { id: 4, module: "Attendance", category: "Workforce" },
  { id: 5, module: "Leave Management", category: "Workforce" },
  { id: 6, module: "Payroll", category: "Finance" },
  { id: 7, module: "Performance", category: "HR" },
  { id: 8, module: "Training", category: "Development" },
  { id: 9, module: "Expense Management", category: "Finance" },
  { id: 10, module: "Reports & Analytics", category: "Core" },
];

export function CreateRoleModal({ isOpen, onClose }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [draftMessage, setDraftMessage] = useState("");

  if (!isOpen) return null;

  const togglePermission = (id: number) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    console.log("Creating role:", { roleName, roleDescription, selectedPermissions });
    onClose();
  };

  const saveDraft = () => {
    const draft = {
      roleName,
      roleDescription,
      selectedPermissions,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("hrspace-role-draft", JSON.stringify(draft));
    setDraftMessage("Draft saved on this device.");
    window.setTimeout(() => setDraftMessage(""), 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-[var(--primary)]/5 to-[var(--info)]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--info)] shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-foreground">Create New Role</h2>
                <p className="text-sm text-muted-foreground">Define a new role with specific permissions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              {draftMessage && (
                <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
                  {draftMessage}
                </div>
              )}
              <div>
                <label className="block text-sm text-foreground mb-2">
                  Role Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Department Manager"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this role..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Role Level */}
            <div>
              <label className="block text-sm text-foreground mb-2">
                Role Level <span className="text-destructive">*</span>
              </label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="">Select hierarchy level</option>
                <option value="1">Level 1 - Executive</option>
                <option value="2">Level 2 - Management</option>
                <option value="3">Level 3 - Team Lead</option>
                <option value="4">Level 4 - Individual Contributor</option>
              </select>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm text-foreground">
                    Permissions
                  </label>
                  <p className="text-sm text-muted-foreground">Select modules this role can access</p>
                </div>
                <Badge variant="secondary" className="bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20">
                  {selectedPermissions.length} selected
                </Badge>
              </div>

              <div className="space-y-3">
                {["Core", "HR", "Workforce", "Finance", "Development"].map((category) => {
                  const categoryPermissions = permissions.filter(p => p.category === category);
                  return (
                    <div key={category} className="border border-border rounded-lg p-4 bg-[var(--accent)]/30">
                      <h4 className="text-sm text-foreground mb-3">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((perm) => (
                          <div key={perm.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors">
                            <span className="text-sm text-foreground">{perm.module}</span>
                            <Switch
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex gap-3 p-4 rounded-lg bg-[var(--info)]/10 border border-[var(--info)]/20">
              <Info className="w-5 h-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground mb-1">Role Creation Guidelines</p>
                <p className="text-sm text-muted-foreground">
                  Ensure the role name is unique and clearly describes its purpose. Review permissions carefully before creating the role.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[var(--accent)]/30 flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={saveDraft}>Save as Draft</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!roleName}
              className="bg-[var(--action)] hover:bg-[var(--action)]/90"
            >
              Create Role
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
