import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../app/components/ui/Card';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const C = {
  primary:   '#543884',
  mid:       '#9A77CF',
  action:    '#EC4176',
  warm:      '#FFA45E',
  berry:     '#A13670',
  dark:      '#262254',
} as const;

// Used in recharts — CSS vars don't resolve inside SVG attributes
export const CHART_COLORS = [C.primary, C.mid, C.action, C.warm, C.berry];

export const chartStyle = {
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--card)',
      border: '1px solid rgba(84,56,132,0.15)',
      borderRadius: '12px',
      fontSize: '12px',
    },
    labelStyle: { color: 'var(--foreground)', fontWeight: 500 },
  },
  grid: { strokeDasharray: '3 3', stroke: 'rgba(84,56,132,0.08)' },
  axis: { stroke: '#9A77CF', fontSize: 12, tickLine: false, axisLine: false },
};

// ─── Greeting Helper ──────────────────────────────────────────────────────────
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── DashboardHeader ──────────────────────────────────────────────────────────
interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold" style={{
          background: `linear-gradient(90deg, ${C.primary}, ${C.action})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {title}
        </h1>
        <p className="text-sm mt-1" style={{ color: C.mid }}>{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  trend: { value: string; isPositive: boolean };
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export function StatCard({ label, value, subtitle, trend, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: trend.isPositive ? 'rgba(29,158,117,0.1)' : 'rgba(236,65,118,0.1)',
              color: trend.isPositive ? '#0F6E56' : '#EC4176',
            }}>
            {trend.isPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </span>
        </div>
        <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        <p className="text-xs mt-1" style={{ color: C.mid }}>{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, action, children, className = '' }: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: C.mid }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── GhostLink ────────────────────────────────────────────────────────────────
export function GhostLink({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="text-xs font-medium transition-colors hover:opacity-80 flex-shrink-0"
      style={{ color: C.mid }}>
      {children}
    </button>
  );
}

// ─── AgendaRow ────────────────────────────────────────────────────────────────
export function AgendaRow({ time, title, badge, color }: {
  time: string; title: string; badge: string; color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span className="text-xs font-mono w-12 flex-shrink-0" style={{ color: C.mid }}>{time}</span>
      <span className="text-sm text-foreground flex-1 min-w-0 truncate">{title}</span>
      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
        style={{ background: `${color}18`, color }}>
        {badge}
      </span>
    </div>
  );
}

// ─── CTA Button ──────────────────────────────────────────────────────────────
export function CTAButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 hover:shadow-md"
      style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.berry}, ${C.action})` }}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-accent"
      style={{ border: `1px solid rgba(84,56,132,0.2)`, color: C.primary }}>
      {children}
    </button>
  );
}
