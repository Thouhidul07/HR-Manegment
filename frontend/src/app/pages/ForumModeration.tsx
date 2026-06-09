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
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "../components/ui/Modal";
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
  const [reports, setReports] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    severity: "",
    keyword: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextReportId, setContextReportId] = useState<number | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextError, setContextError] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.keyword) params.keyword = filters.keyword;

      const response = await api.get("/forum/reports", { params });
      const mapped = (response.data.reports || []).map((report: any) => ({
        id: report.id,
        type: report.target_type,
        title: `${report.target_type} #${report.target_id}`,
        reportReason: report.reason,
        reporter: "Anonymous User Report",
        timestamp: new Date(report.created_at).toLocaleString(),
        status: report.status,
        action: report.action_taken,
        toxicityScore: report.toxicityScore || 0.25,
        sentimentScore: -0.25,
        content: report.notes || "Reported forum content awaiting review.",
        flags: [report.reason],
        severity: report.severity || "low",
      }));
      setReports(mapped);
    } catch (err: any) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchContext = async (reportId: number) => {
    setLoadingContext(true);
    setContextError("");
    setContextData(null);
    try {
      const response = await api.get(`/forum/reports/${reportId}/context`);
      setContextData(response.data);
    } catch (err: any) {
      setContextError(err?.response?.data?.message || "Failed to load report context");
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    if (contextReportId) {
      fetchContext(contextReportId);
      setIsContextModalOpen(true);
    }
  }, [contextReportId]);

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
        <Button variant="outline" className="gap-2" onClick={() => setIsFilterOpen(!isFilterOpen)}>
          <Filter className="w-4 h-4" />
          {isFilterOpen ? "Hide Filters" : "Filters"}
        </Button>
      </div>

      {isFilterOpen && (
        <Card className="p-4 border border-border bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Content Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All Types</option>
                <option value="post">Post</option>
                <option value="reply">Reply</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Severity / Risk
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All Severities</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Toxicity</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Search Keyword
              </label>
              <input
                type="text"
                placeholder="Reason or notes..."
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters({ status: "", type: "", severity: "", keyword: "" })
              }
            >
              Clear Filters
            </Button>
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
          <p className="text-2xl mb-1">{reports.filter(r => r.status === 'pending').length}</p>
          <p className="text-sm text-white/80">Pending Review</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/20">
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
            </div>
            <Badge variant="success" className="text-xs">Today</Badge>
          </div>
          <p className="text-2xl text-foreground mb-1">{reports.filter(r => r.status === 'reviewed' || r.status === 'dismissed').length}</p>
          <p className="text-sm text-muted-foreground">Resolved</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--info)]/20">
              <Clock className="w-5 h-5 text-[var(--info)]" />
            </div>
          </div>
          <p className="text-2xl text-foreground mb-1">1.2h</p>
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <Badge variant="success" className="text-xs">-8%</Badge>
          </div>
          <p className="text-2xl text-foreground mb-1">78%</p>
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
              {reports
                .filter(item => activeTab === 'pending' ? item.status === 'pending' : (item.status === 'reviewed' || item.status === 'dismissed'))
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
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => setContextReportId(item.id)}
                          >
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
                              Action taken: <strong className="capitalize">{item.action}</strong>
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setContextReportId(item.id)}>
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
              <Button variant="ghost" size="sm" className="w-full mt-2">
                View Full Policy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isContextModalOpen}
        onClose={() => {
          setIsContextModalOpen(false);
          setContextReportId(null);
        }}
        title="Reported Content Context"
        size="lg"
        footer={
          <div className="flex gap-2 w-full justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                setIsContextModalOpen(false);
                setContextReportId(null);
              }}
            >
              Close
            </Button>
            {contextData?.report?.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-[var(--success)] border-[var(--success)]/30 hover:bg-[var(--success)]/10"
                  onClick={async () => {
                    await handleModerationAction(contextData.report.id, "approve");
                    setIsContextModalOpen(false);
                    setContextReportId(null);
                  }}
                >
                  Approve / Dismiss
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    await handleModerationAction(contextData.report.id, "remove");
                    setIsContextModalOpen(false);
                    setContextReportId(null);
                  }}
                >
                  Remove Content
                </Button>
              </div>
            )}
          </div>
        }
      >
        {loadingContext ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading context details...
          </div>
        ) : contextError ? (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {contextError}
          </div>
        ) : contextData ? (
          <div className="space-y-6 text-foreground">
            {/* Report Summary */}
            <div className="p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-foreground">
                <Flag className="w-4 h-4 text-[var(--warning)]" />
                Report Details
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  <span className="font-semibold">{contextData.report.reason}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reporter:</span>{" "}
                  <span>{contextData.report.reporter_name || "Anonymous"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Reporter Notes:</span>{" "}
                  <span className="italic">{contextData.report.notes || "No additional notes provided."}</span>
                </div>
              </div>
            </div>

            {/* Reported Item Content */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Reported {contextData.report.target_type} content
              </h3>
              <div className="p-5 rounded-xl border border-border bg-card">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{contextData.author?.name || "Anonymous"}</span>
                    <Badge variant="secondary" className="capitalize">
                      {contextData.author?.role}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(contextData.content?.created_at || contextData.report.created_at).toLocaleString()}
                  </span>
                </div>
                {contextData.content?.title && (
                  <h4 className="text-base font-bold mb-2">{contextData.content.title}</h4>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {contextData.content?.body || "Content not found or deleted."}
                </p>
              </div>
            </div>

            {/* Thread/Parent Context */}
            {contextData.threadContext && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Original Post Thread Context
                </h3>
                <div className="p-5 rounded-xl border border-border bg-accent/20">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{contextData.threadContext.postAuthor?.name}</span>
                      <Badge variant="secondary" className="capitalize">
                        {contextData.threadContext.postAuthor?.role}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(contextData.threadContext.post.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold mb-2">{contextData.threadContext.post.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {contextData.threadContext.post.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No context data available.
          </div>
        )}
      </Modal>
    </div>
  );
}
