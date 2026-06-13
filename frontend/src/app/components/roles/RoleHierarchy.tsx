import { Shield, ChevronRight, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface Role {
  id: number;
  name: string;
  users: number;
  description: string;
  level: number;
  status: string;
}

interface RoleHierarchyProps {
  roles: Role[];
}

export function RoleHierarchy({ roles }: RoleHierarchyProps) {
  const rolesByLevel = roles.reduce((acc, role) => {
    if (!acc[role.level]) {
      acc[role.level] = [];
    }
    acc[role.level].push(role);
    return acc;
  }, {} as Record<number, Role[]>);

  const levels = Object.keys(rolesByLevel).sort((a, b) => Number(a) - Number(b));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Hierarchy</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Organizational role structure and reporting relationships</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {levels.map((level, levelIndex) => (
            <div key={level} className="relative">
              {/* Level Label */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                  Level {level}
                </Badge>
                <div className="h-px flex-1 bg-border"></div>
              </div>

              {/* Roles at this level */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolesByLevel[Number(level)].map((role) => (
                  <div
                    key={role.id}
                    className="relative p-5 rounded-xl border-2 border-border bg-card hover:bg-accent/20 hover:border-[var(--primary)]/50 transition-all hover:shadow-md"
                  >
                    {/* Connector line to next level */}
                    {levelIndex < levels.length - 1 && (
                      <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-border"></div>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--info)] shadow-sm">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground mb-1 truncate">{role.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{role.users} users</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 rounded-lg bg-[var(--muted)] border border-border">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--primary)]"></div>
              <span className="text-muted-foreground">Higher privilege level</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-6 bg-border"></div>
              <span className="text-muted-foreground">Reports to / Inherits from</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
