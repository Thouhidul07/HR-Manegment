import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./Card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, subtitle, icon: Icon, iconColor = "text-[var(--chart-1)]", trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-accent/50 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className="ml-auto flex items-center gap-1 text-sm">
              <span className={trend.isPositive ? "text-[var(--success)]" : "text-[var(--warning)]"}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
