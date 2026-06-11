import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, Trash2,
  TrendingUp, Activity, BarChart3, Flag, MessageSquare,
  ArrowLeft, Filter, Search, Clock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const reportedContent = [
  {
    id: 1,
    type: "post",
    title: "Concerns about management decisions in marketing department",
    reportReason: "Potentially identifying information",
    reporter: "System Auto-Detection",
    timestamp: "15 minutes ago",
    status: "pending",
    toxicityScore: 0.23,
    sentimentScore: -0.45,
    content: "The recent decision by our marketing leadership to cut the budget by 40% seems very short-sighted...",
    flags: ["indirect-identification", "negative-sentiment"]
  },
  {
    id: 2,
    type: "reply",
    title: "Re: New performance review system",
    reportReason: "Hostile tone",
    reporter: "Anonymous User Report",
    timestamp: "1 hour ago",
    status: "pending",
    toxicityScore: 0.67,
    sentimentScore: -0.82,
    content: "This is absolutely ridiculous. Whoever came up with this system clearly has no idea what they're doing.",
    flags: ["high-toxicity", "negative-sentiment"]
  },
  {
    id: 3,
    type: "post",
    title: "Issues with new HR policies",
    reportReason: "Inappropriate language",
    reporter: "Anonymous User Report",
    timestamp: "3 hours ago",
    status: "reviewed",
    action: "edited",
    toxicityScore: 0.45,
    sentimentScore: -0.34,
    content: "The new policies are terrible and make no sense for our team structure...",
    flags: ["moderate-toxicity"]
  }
];

const moderationStats = {
  totalReports: 47,
  pendingReview: 12,
  resolvedToday: 23,
  averageResponseTime: "1.2h",
  toxicityTrend: -8,
  sentimentScore: 78
};

const activityLog = [
  {
    id: 1,
    action: "Content Removed",
    moderator: "HR Team",
    target: "Post: 'Salary disparities in engineering'",
    reason: "Policy violation - compensation discussion",
    timestamp: "30 minutes ago"
  },
  {
    id: 2,
    action: "Content Approved",
    moderator: "Auto-Moderation",
    target: "Post: 'Mental health resources request'",
    reason: "Passed toxicity screening",
    timestamp: "1 hour ago"
  },
  {
    id: 3,
    action: "User Warning Issued",
    moderator: "HR Team",
    target: "Anonymous Tiger - Multiple reports",
    reason: "Repeated hostile tone in replies",
    timestamp: "2 hours ago"
  },
  {
    id: 4,
    action: "Content Edited",
    moderator: "HR Team",
    target: "Post: 'Team restructure concerns'",
    reason: "Removed identifying details",
    timestamp: "3 hours ago"
  }
];

export function ForumModeration() {
  const { user } = useAuth();
  const backPath = user?.role === "admin" ? "/dashboard" : "/dashboard/forum";
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'activity'>('pending');
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [reports, setReports] = useState(reportedContent);
  const [showFilters, setShowFilters] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api.get("/forum/reports")
      .then((response) => {
        if (!isMounted || !response.data.reports?.length) return;

        setReports(response.data.reports.map((report: any) => ({
          id: report.id,
          type: report.target_type,
          title: `${report.target_type} #${report.target_id}`,
          reportReason: report.reason,
          reporter: "Anonymous User Report",
          timestamp: new Date(report.created_at).toLocaleString(),
          status: report.status === "pending" ? "pending" : "reviewed",
          action: report.action_taken,
          toxicityScore: 0.25,
          sentimentScore: -0.25,
          content: report.notes || "Reported forum content awaiting review.",
          flags: [report.reason],
        })));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleModerationAction = async (reportId: number, action: "approve" | "remove" | "dismiss") => {
    await api.patch(`/forum/reports/${reportId}`, { action });
    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === reportId
          ? { ...report, status: "reviewed", action }
          : report
      )
    );
  };

  const getToxicityColor = (score: number) => {
    if (score < 0.3) return "text-[var(--success)]";
    if (score < 0.6) return "text-[var(--warning)]";
    return "text-destructive";
  };

  const selectedReportDetails = reports.find((report) => report.id === selectedReport);
  const visibleReports = reports.filter((item) => {
    if (riskFilter === "high") return item.toxicityScore > 0.6;
    if (riskFilter === "moderate") return item.toxicityScore >= 0.3 && item.toxicityScore <= 0.6;
    if (riskFilter === "low") return item.toxicityScore < 0.3;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to={backPath}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-foreground mb-2">Forum Moderation Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered content moderation and community safety tools
          </p>
        </div>
        <Button variant={showFilters ? "primary" : "outline"} className="gap-2" onClick={() => setShowFilters((current) => !current)}>
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Risk level</span>
            {[
              ["all", "All"],
              ["high", "High"],
              ["moderate", "Moderate"],
              ["low", "Low"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRiskFilter(value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  riskFilter === value
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-border text-muted-foreground hover:border-[var(--primary)]/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[var(--warning)] to-[var(--warning)]/80 text-white border-0 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              Urgent
            </Badge>
          </div>
          <p className="text-2xl mb-1">{moderationStats.pendingReview}</p>
          <p className="text-sm text-white/80">Pending Review</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/20">
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
            </div>
            <Badge variant="success" className="text-xs">Today</Badge>
          </div>
          <p className="text-2xl text-foreground mb-1">{moderationStats.resolvedToday}</p>
          <p className="text-sm text-muted-foreground">Resolved</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--info)]/20">
              <Clock className="w-5 h-5 text-[var(--info)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">{moderationStats.averageResponseTime}</p>
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <Badge variant="success" className="text-xs">-8%</Badge>
          </div>
          <p className="text-2xl text-foreground mb-1">{moderationStats.sentimentScore}%</p>
          <p className="text-sm text-muted-foreground">Health Score</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-6">
              {[
                { id: 'pending', label: 'Pending Review', count: moderationStats.pendingReview },
                { id: 'reviewed', label: 'Reviewed', count: 35 },
                { id: 'activity', label: 'Activity Log', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-sm">{tab.label}</span>
                  {tab.count !== null && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pending/Reviewed Content */}
          {(activeTab === 'pending' || activeTab === 'reviewed') && (
            <div className="space-y-4">
              {visibleReports
                .filter(item => activeTab === 'pending' ? item.status === 'pending' : item.status === 'reviewed')
                .map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20"
                            >
                              {item.type}
                            </Badge>
                            {item.toxicityScore > 0.6 && (
                              <Badge variant="destructive" className="text-xs">
                                High Toxicity
                              </Badge>
                            )}
                            {item.toxicityScore >= 0.3 && item.toxicityScore <= 0.6 && (
                              <Badge variant="warning" className="text-xs">
                                Moderate Risk
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-foreground mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Reported by {item.reporter} • {item.timestamp}
                          </p>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-4 rounded-lg bg-[var(--accent)]/50 border border-border mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.content}
                        </p>
                      </div>

                      {/* AI Analysis */}
                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-lg bg-gradient-to-br from-[var(--primary)]/5 to-[var(--info)]/5 border border-[var(--primary)]/20">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Toxicity Score</span>
                            <span className={`text-sm ${getToxicityColor(item.toxicityScore)}`}>
                              {(item.toxicityScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full ${
                                item.toxicityScore < 0.3 ? 'bg-[var(--success)]' :
                                item.toxicityScore < 0.6 ? 'bg-[var(--warning)]' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${item.toxicityScore * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Sentiment</span>
                            <span className="text-sm text-foreground">
                              {(item.sentimentScore * 100).toFixed(0)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full bg-[var(--info)]"
                              style={{ width: `${Math.abs(item.sentimentScore) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Detection Flags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.flags.map((flag) => (
                          <Badge key={flag} variant="secondary" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {flag}
                          </Badge>
                        ))}
                      </div>

                      {/* Report Reason */}
                      <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 mb-4">
                        <p className="text-sm text-foreground">
                          <Flag className="w-4 h-4 inline-block mr-2 text-[var(--warning)]" />
                          <strong>Report Reason:</strong> {item.reportReason}
                        </p>
                      </div>

                      {/* Actions */}
                      {item.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 gap-2" onClick={() => setSelectedReport(item.id)}>
                            <Eye className="w-4 h-4" />
                            View Full Context
                          </Button>
                          <Button variant="outline" className="gap-2 text-[var(--success)] hover:bg-[var(--success)]/10" onClick={() => handleModerationAction(item.id, "approve")}>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive/10" onClick={() => handleModerationAction(item.id, "remove")}>
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                            <span className="text-sm text-foreground">
                              Action taken: <strong>{item.action}</strong>
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(item.id)}>
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          )}

          {/* Activity Log */}
          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Moderation Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-4 p-4 rounded-lg border border-border hover:bg-[var(--accent)]/30 transition-colors"
                    >
                      <div className={`p-2 rounded-lg h-fit ${
                        log.action.includes('Removed') ? 'bg-destructive/20' :
                        log.action.includes('Approved') ? 'bg-[var(--success)]/20' :
                        log.action.includes('Warning') ? 'bg-[var(--warning)]/20' :
                        'bg-[var(--info)]/20'
                      }`}>
                        {log.action.includes('Removed') ? <XCircle className="w-5 h-5 text-destructive" /> :
                         log.action.includes('Approved') ? <CheckCircle className="w-5 h-5 text-[var(--success)]" /> :
                         log.action.includes('Warning') ? <AlertTriangle className="w-5 h-5 text-[var(--warning)]" /> :
                         <Shield className="w-5 h-5 text-[var(--info)]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm text-foreground">{log.action}</h4>
                          <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{log.target}</p>
                        <p className="text-xs text-muted-foreground">
                          By {log.moderator} • {log.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Auto-Moderation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--primary)]" />
                AI Moderation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto-Flags</span>
                <span className="text-sm text-foreground">156 today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">False Positives</span>
                <span className="text-sm text-foreground">2.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="text-sm text-[var(--success)]">97.7%</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">High Toxicity</span>
                <Badge variant="destructive" className="text-xs">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Moderate Risk</span>
                <Badge variant="warning" className="text-xs">7</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Reports</span>
                <Badge variant="secondary" className="text-xs">5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Policy Violations</span>
                <Badge variant="secondary" className="text-xs">2</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Moderation Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Review flagged content within 2 hours</p>
              <p>• Preserve anonymity in all actions</p>
              <p>• Document all moderation decisions</p>
              <p>• Escalate threats to security team</p>
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setPolicyOpen(true)}>
                View Full Policy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Modal
        isOpen={Boolean(selectedReportDetails)}
        onClose={() => setSelectedReport(null)}
        title="Moderation Context"
        size="lg"
        footer={<Button variant="primary" onClick={() => setSelectedReport(null)}>Done</Button>}
      >
        {selectedReportDetails && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-accent/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reported item</p>
              <h3 className="mt-1 text-foreground">{selectedReportDetails.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{selectedReportDetails.content}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Report reason</p>
                <p className="text-sm text-foreground">{selectedReportDetails.reportReason}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm text-foreground">{selectedReportDetails.status}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={policyOpen}
        onClose={() => setPolicyOpen(false)}
        title="Moderation Policy"
        size="lg"
        footer={<Button variant="primary" onClick={() => setPolicyOpen(false)}>Close</Button>}
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Review flagged content quickly, preserve anonymity, and document every moderation action.</p>
          <p>Approve content when it is safe, remove content that violates policy, and escalate credible threats or harassment to the security team.</p>
          <p>When in doubt, choose the least invasive action that protects employees and keeps the forum useful.</p>
        </div>
      </Modal>
    </div>
  );
}
