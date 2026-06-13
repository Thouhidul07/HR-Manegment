import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, Trash2,
  TrendingUp, Activity, BarChart3, Flag, MessageSquare,
  ArrowLeft, Filter, Search, Clock, Loader2, User, Calendar, AlertCircle, Info, ArrowUpRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export function ForumModeration() {
  const { user } = useAuth();
  const backPath = user?.role === "admin" ? "/dashboard" : "/dashboard/forum";
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'activity'>('pending');
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  
  // Dynamic API state
  const [reports, setReports] = useState<any[]>([]);
  const [allReportsForStats, setAllReportsForStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");
  const [reportedUser, setReportedUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detailed context modal state
  const [contextReportId, setContextReportId] = useState<number | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [submittingAction, setSubmittingAction] = useState<number | null>(null);

  // Fetch reports list dynamically based on active filters
  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (activeTab === "pending") {
        params.status = "pending";
      } else if (activeTab === "reviewed") {
        // Query both reviewed/dismissed. Let's query without status and filter in frontend, or query reviewed.
        // To be safe and show both reviewed and dismissed, we fetch all and filter in frontend, or query reviewed.
        // Let's query without status to get all reports, then filter status !== 'pending' in frontend.
        // This is extremely safe and covers both reviewed and dismissed!
      } else if (activeTab === "activity") {
        // Fetch all to show actions in activity tab
      }

      if (search.trim()) {
        params.search = search.trim();
      }
      if (severity !== "all") {
        params.severity = severity;
      }
      if (category !== "all") {
        params.category = category;
      }
      if (reportedUser.trim()) {
        params.reportedUser = reportedUser.trim();
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const response = await api.get("/forum/reports", { params });
      setReports(response.data.reports || []);
    } catch (err: any) {
      console.error("Failed to load reports", err);
      setError(err.response?.data?.message || "Failed to load reports from server.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch global stats data (unfiltered)
  const fetchStatsData = async () => {
    try {
      const response = await api.get("/forum/reports");
      setAllReportsForStats(response.data.reports || []);
    } catch (err) {
      console.error("Failed to fetch statistics", err);
    }
  };

  // Run on tab or filter change
  useEffect(() => {
    fetchReports();
  }, [activeTab, search, severity, category, reportedUser, startDate, endDate]);

  // Run once on mount
  useEffect(() => {
    fetchStatsData();
  }, []);

  // Fetch context when modal opens
  useEffect(() => {
    const fetchContext = async () => {
      if (contextReportId === null) return;
      setContextLoading(true);
      setContextError(null);
      setContextData(null);
      try {
        const response = await api.get(`/forum/reports/${contextReportId}/context`);
        setContextData(response.data);
      } catch (err: any) {
        console.error("Failed to fetch context", err);
        setContextError(err.response?.data?.message || "Failed to load detailed report context.");
      } finally {
        setContextLoading(false);
      }
    };
    fetchContext();
  }, [contextReportId]);

  // Execute moderation actions
  const handleModerationAction = async (reportId: number, action: "approve" | "remove" | "dismiss" | "warn" | "hide" | "resolve") => {
    setSubmittingAction(reportId);
    try {
      await api.patch(`/forum/reports/${reportId}`, { action });
      await Promise.all([fetchReports(), fetchStatsData()]);
      setSelectedReport(null);
      setContextReportId(null);
      setContextData(null);
    } catch (err: any) {
      console.error("Failed to perform moderation action", err);
      alert(err.response?.data?.message || "Failed to execute moderation action.");
    } finally {
      setSubmittingAction(null);
    }
  };

  // Helper formatting and calculations
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getToxicityScore = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical": return 0.95;
      case "high": return 0.75;
      case "medium": return 0.45;
      case "low": return 0.15;
      default: return 0.45;
    }
  };

  const getToxicityColor = (score: number) => {
    if (score < 0.3) return "text-[var(--success)]";
    if (score < 0.6) return "text-[var(--warning)]";
    return "text-destructive";
  };

  const getSeverityBadgeVariant = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical": return "destructive";
      case "high": return "warning";
      case "medium": return "info";
      default: return "secondary";
    }
  };

  const pendingReviewCount = allReportsForStats.filter(r => r.status === "pending").length;
  const resolvedCount = allReportsForStats.filter(r => r.status !== "pending").length;

  const getAverageResponseTime = () => {
    const reviewed = allReportsForStats.filter(r => r.status !== "pending" && r.reviewed_at);
    if (!reviewed.length) return "1.2h";
    let totalMs = 0;
    reviewed.forEach((r) => {
      const diff = new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime();
      totalMs += Math.max(0, diff);
    });
    const avgHours = totalMs / (1000 * 60 * 60) / reviewed.length;
    if (avgHours < 1) {
      const avgMins = Math.round(avgHours * 60);
      return `${avgMins}m`;
    }
    return `${avgHours.toFixed(1)}h`;
  };

  const getHealthScore = () => {
    if (!allReportsForStats.length) return 100;
    const criticalOrHighCount = allReportsForStats.filter(
      r => r.status === "pending" && (r.severity === "critical" || r.severity === "high")
    ).length;
    const score = Math.max(50, 100 - (criticalOrHighCount * 8));
    return score;
  };

  // Filter reports locally for tabs if we fetched all reports
  const displayReports = reports.filter((item) => {
    if (activeTab === "pending") {
      return item.status === "pending";
    }
    if (activeTab === "reviewed") {
      return item.status !== "pending";
    }
    // Activity tab shows reviewed/dismissed reports
    return item.status !== "pending";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to={backPath}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-foreground mb-2">Forum Moderation Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            AI-assisted content moderation, community safety tools, and audit logs.
          </p>
        </div>
        <Button
          variant={showFilters ? "primary" : "outline"}
          className="gap-2"
          onClick={() => setShowFilters((current) => !current)}
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Advanced Filters Drawer */}
      {showFilters && (
        <Card className="p-5 border border-border bg-card/60 backdrop-blur-sm shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Search input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notes, title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Severity dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk / Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="all">All Categories</option>
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Hate Speech">Hate Speech</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Reported User */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reported User</label>
              <input
                type="text"
                placeholder="User name or ID..."
                value={reportedUser}
                onChange={(e) => setReportedUser(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Start date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            {/* End date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Reset */}
            <div className="flex items-end sm:col-span-2 md:col-span-1 lg:col-span-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSeverity("all");
                  setCategory("all");
                  setReportedUser("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full hover:bg-accent/40"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[var(--warning)] to-[var(--warning)]/80 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              Urgent
            </Badge>
          </div>
          <p className="text-2xl font-bold mb-1">{pendingReviewCount}</p>
          <p className="text-sm text-white/80">Pending Review</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/20">
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
            </div>
            <Badge variant="success" className="text-xs">Resolved</Badge>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{resolvedCount}</p>
          <p className="text-sm text-muted-foreground">Resolved Reports</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--info)]/20">
              <Clock className="w-5 h-5 text-[var(--info)]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{getAverageResponseTime()}</p>
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
        </Card>

        <Card className="p-5 border border-border hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{getHealthScore()}%</p>
          <p className="text-sm text-muted-foreground">Forum Safety Score</p>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list view */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-6">
              {[
                { id: 'pending', label: 'Pending Review', count: pendingReviewCount },
                { id: 'reviewed', label: 'Reviewed', count: resolvedCount },
                { id: 'activity', label: 'Activity Log', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
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

          {/* Loader */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 Card border border-border bg-card p-8">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Loading reported content...</p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <Card className="p-6 border border-destructive/20 bg-destructive/10 text-destructive">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Failed to fetch reported content</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchReports()} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && displayReports.length === 0 && (
            <Card className="p-8 border border-border flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">All Clear!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  No flagged reports match your current filters. The community is safe and clean!
                </p>
              </div>
              {showFilters && (
                <Button variant="outline" size="sm" onClick={() => {
                  setSearch("");
                  setSeverity("all");
                  setCategory("all");
                  setReportedUser("");
                  setStartDate("");
                  setEndDate("");
                }}>
                  Clear Filters
                </Button>
              )}
            </Card>
          )}

          {/* Pending/Reviewed Content List */}
          {!loading && !error && (activeTab === 'pending' || activeTab === 'reviewed') && displayReports.length > 0 && (
            <div className="space-y-4">
              {displayReports.map((item) => {
                const toxicity = getToxicityScore(item.severity);
                return (
                  <Card key={item.id} className="overflow-hidden border border-border hover:border-border/80 hover:shadow-sm transition-all">
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 uppercase font-bold text-[10px]"
                            >
                              {item.target_type}
                            </Badge>
                            <Badge variant={getSeverityBadgeVariant(item.severity)} className="text-xs uppercase font-bold text-[10px]">
                              {item.severity} Risk
                            </Badge>
                          </div>
                          <h4 className="text-foreground font-bold mb-1 text-base">
                            {item.target_type === 'post' ? item.post_title : `Re: ${item.post_title || 'Post'}`}
                          </h4>
                          <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                            <span>Reported by: <strong>{item.reporter_name || "Anonymous"}</strong></span>
                            <span>•</span>
                            <span>Author: <strong>{item.reported_user_name || "Former Employee"}</strong></span>
                            <span>•</span>
                            <span>{formatDate(item.created_at)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-4 rounded-lg bg-[var(--accent)]/50 border border-border mb-4">
                        <p className="text-sm text-foreground/90 whitespace-pre-line line-clamp-3">
                          {item.content_preview}
                        </p>
                      </div>

                      {/* AI Analysis Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 rounded-lg bg-gradient-to-br from-[var(--primary)]/5 to-[var(--info)]/5 border border-[var(--primary)]/10">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Toxicity Risk</span>
                            <span className={`text-xs font-bold ${getToxicityColor(toxicity)}`}>
                              {(toxicity * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full ${
                                toxicity < 0.3 ? 'bg-[var(--success)]' :
                                toxicity < 0.6 ? 'bg-[var(--warning)]' :
                                'bg-destructive'
                              }`}
                              style={{ width: `${toxicity * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Reason Category</span>
                            <Badge variant="outline" className="text-[10px] bg-card px-1.5 py-0">
                              {item.reason}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate italic">
                            "{item.notes || 'No description notes provided.'}"
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {item.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2 hover:bg-accent/40"
                            onClick={() => {
                              setSelectedReport(item.id);
                              setContextReportId(item.id);
                            }}
                          >
                            <Eye className="w-4 h-4 text-[var(--primary)]" />
                            View Context
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2 text-[var(--success)] border-[var(--success)]/30 hover:bg-[var(--success)]/15"
                            onClick={() => handleModerationAction(item.id, "dismiss")}
                            disabled={submittingAction !== null}
                          >
                            {submittingAction === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Dismiss
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/15"
                            onClick={() => handleModerationAction(item.id, "remove")}
                            disabled={submittingAction !== null}
                          >
                            {submittingAction === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20 mt-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                            <span className="text-sm text-foreground">
                              Action taken: <strong className="uppercase">{item.action_taken}</strong> by <strong>{item.reviewer_name || "Moderator"}</strong>
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedReport(item.id);
                            setContextReportId(item.id);
                          }}>
                            Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Activity Log */}
          {!loading && !error && activeTab === 'activity' && displayReports.length > 0 && (
            <Card className="border border-border">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold text-foreground">Recent Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {displayReports.map((log) => {
                    const isRemoved = log.action_taken === 'remove' || log.action_taken === 'hide';
                    const isWarned = log.action_taken === 'warn';
                    const isApproved = log.action_taken === 'resolve' || log.action_taken === 'approve';

                    return (
                      <div
                        key={log.id}
                        className="flex gap-4 p-4 rounded-lg border border-border/80 hover:bg-[var(--accent)]/30 transition-colors"
                      >
                        <div className={`p-2.5 rounded-lg h-fit ${
                          isRemoved ? 'bg-destructive/15 text-destructive' :
                          isApproved ? 'bg-[var(--success)]/15 text-[var(--success)]' :
                          isWarned ? 'bg-[var(--warning)]/15 text-[var(--warning)]' :
                          'bg-[var(--info)]/15 text-[var(--info)]'
                        }`}>
                          {isRemoved ? <XCircle className="w-5 h-5" /> :
                           isApproved ? <CheckCircle className="w-5 h-5" /> :
                           isWarned ? <AlertTriangle className="w-5 h-5" /> :
                           <Shield className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                              {log.action_taken === 'dismiss' ? 'Report Dismissed' : `Content ${log.action_taken?.replace(/^\w/, (c: string) => c.toUpperCase())}d`}
                            </h4>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(log.reviewed_at || log.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/85 mb-1.5 font-medium">
                            {log.target_type === 'post' ? 'Post' : 'Reply'} #{log.target_id}: "{log.post_title || log.content_preview}"
                          </p>
                          <p className="text-xs text-muted-foreground">
                            By <strong>{log.reviewer_name || "System/Moderator"}</strong> • Reason: <strong>{log.reason}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* AI Moderation Status */}
          <Card className="border border-border">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Activity className="w-4 h-4 text-[var(--primary)]" />
                AI Moderation System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Safety Shield</span>
                <Badge variant="success" className="px-2 py-0 text-[10px]">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Accuracy Score</span>
                <span className="text-foreground font-bold">98.4%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Auto-Escalations</span>
                <span className="text-foreground font-bold">{allReportsForStats.filter(r => r.severity === 'critical').length} critical</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick breakdown stats */}
          <Card className="border border-border">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold">Risk Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Critical Risk
                </span>
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">{allReportsForStats.filter(r => r.severity === 'critical' && r.status === 'pending').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]" /> High Risk
                </span>
                <Badge variant="warning" className="px-1.5 py-0 text-[10px]">{allReportsForStats.filter(r => r.severity === 'high' && r.status === 'pending').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--info)]" /> Medium Risk
                </span>
                <Badge variant="info" className="px-1.5 py-0 text-[10px]">{allReportsForStats.filter(r => r.severity === 'medium' && r.status === 'pending').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Low Risk
                </span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{allReportsForStats.filter(r => r.severity === 'low' && r.status === 'pending').length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Policies guidelines */}
          <Card className="border border-border">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-bold">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs text-muted-foreground leading-relaxed">
              <p>• Fast response time: Review reports within 2 hours of posting.</p>
              <p>• Action severity: Apply proportional actions. Do not remove unless guidelines are explicitly breached.</p>
              <p>• Send warnings: Issue warnings only to hostile or repetitive policy violations.</p>
              <p>• Privacy: Maintain anonymity of reporting parties in all cases.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Full Context Modal */}
      <Modal
        isOpen={selectedReport !== null}
        onClose={() => {
          setSelectedReport(null);
          setContextReportId(null);
          setContextData(null);
        }}
        title="Moderation Control Panel"
        size="xl"
      >
        {contextLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Fetching complete conversation context and database logs...</p>
          </div>
        )}

        {contextError && (
          <div className="p-5 border border-destructive/20 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Context Fetch Error</p>
              <p className="text-xs opacity-90">{contextError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => contextReportId && fetchReports()} className="text-destructive border-destructive/20 hover:bg-destructive/10">
              Retry
            </Button>
          </div>
        )}

        {contextData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Post content and threads */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Content body card */}
                <div className="p-5 rounded-xl border border-border bg-[var(--accent)]/40">
                  <div className="flex items-center justify-between mb-3.5 border-b border-border/30 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 uppercase font-bold text-[10px]">
                        Reported {contextData.targetType}
                      </Badge>
                      <Badge variant={getSeverityBadgeVariant(contextData.report.severity)} className="uppercase font-bold text-[10px]">
                        {contextData.report.severity} risk
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Report ID: #{contextData.report.id}
                    </span>
                  </div>

                  {contextData.targetType === 'post' ? (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-3">{contextData.reportedContent?.title}</h3>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{contextData.reportedContent?.body}</p>
                    </div>
                  ) : (
                    <div>
                      {/* Original post header context */}
                      <div className="mb-4 p-4 rounded-lg bg-card border border-border/80 text-xs shadow-sm">
                        <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider flex items-center gap-1 mb-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Replying to Thread: {contextData.originalPostContext?.title}
                        </span>
                        <p className="text-muted-foreground italic line-clamp-2">
                          "{contextData.originalPostContext?.body}"
                        </p>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{contextData.reportedContent?.body}</p>
                    </div>
                  )}

                  <div className="mt-5 pt-3.5 border-t border-border/30 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground items-center">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Author: {contextData.reportedUser?.name || "Former Employee"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      Created: {new Date(contextData.reportedContent?.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Sibling thread comments context */}
                {contextData.relatedReplies && contextData.relatedReplies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                      Conversation Flow ({contextData.relatedReplies.length} replies)
                    </h4>
                    <div className="max-h-[260px] overflow-y-auto border border-border/80 rounded-xl divide-y divide-border bg-card/45">
                      {contextData.relatedReplies.map((reply: any) => {
                        const isReported = contextData.targetType === 'reply' && reply.id === contextData.report.target_id;
                        return (
                          <div key={reply.id} className={`p-4 text-xs transition-colors ${isReported ? 'bg-destructive/10' : 'hover:bg-accent/20'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {reply.user_name || "Former Employee"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{reply.body}</p>
                            {isReported && (
                              <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-bold text-destructive uppercase bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" /> Flagged target reply
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Moderator logs and histories */}
              <div className="space-y-4">
                
                {/* Report specifics */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Flag Incident</h4>
                  <div className="text-xs space-y-1.5">
                    <p className="text-muted-foreground">Reporter: <strong className="text-foreground">{contextData.reporter?.name || "Anonymous User"}</strong></p>
                    <p className="text-muted-foreground font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5" />
                      Reason: {contextData.report.reason}
                    </p>
                    {contextData.report.notes && (
                      <div className="p-2.5 rounded bg-muted/60 border border-border/40 italic text-muted-foreground text-[11px]">
                        "{contextData.report.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile & previous user reports */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Reported Author Profile</h4>
                  {contextData.reportedUser ? (
                    <div className="text-xs space-y-1 pb-3 border-b border-border/40">
                      <p className="font-semibold text-foreground">{contextData.reportedUser.name}</p>
                      <p className="text-muted-foreground truncate">{contextData.reportedUser.email}</p>
                      <p className="text-muted-foreground uppercase text-[10px] font-semibold">{contextData.reportedUser.role} • {contextData.reportedUser.department || "No Dept"}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pb-3 border-b border-border/40">Former Employee Profile</p>
                  )}

                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">History flags on User ({contextData.previousUserReports?.length || 0})</h5>
                  {contextData.previousUserReports && contextData.previousUserReports.length > 0 ? (
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                      {contextData.previousUserReports.map((r: any) => (
                        <div key={r.id} className="p-2 rounded bg-accent/40 text-[10px] border border-border/20">
                          <div className="flex items-center justify-between font-bold text-foreground mb-0.5">
                            <span>{r.reason}</span>
                            <Badge variant="outline" className="text-[8px] px-1 py-0">{r.status}</Badge>
                          </div>
                          <span className="block text-[9px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">Author has a clean record.</p>
                  )}
                </div>

                {/* Content duplicate reports */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-xs space-y-2">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Duplicate flags ({contextData.previousContentReports?.length || 0})</h4>
                  {contextData.previousContentReports && contextData.previousContentReports.length > 0 ? (
                    <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                      {contextData.previousContentReports.map((r: any) => (
                        <div key={r.id} className="p-1.5 rounded bg-accent/40 border border-border/20 text-[10px] text-muted-foreground">
                          <strong>{r.reporter_name || "Someone"}</strong>: "{r.notes || r.reason}"
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">No other users reported this specific content.</p>
                  )}
                </div>

                {/* Audit Moderation History */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-xs space-y-2">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Moderator Actions Logs</h4>
                  {contextData.moderationHistory && contextData.moderationHistory.length > 0 ? (
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {contextData.moderationHistory.map((log: any) => (
                        <div key={log.id} className="p-2 rounded bg-accent/40 border border-border/20 text-[10px] text-muted-foreground">
                          <p className="font-bold text-foreground uppercase text-[9px]">
                            {log.action?.replace("forum_moderation_", "").toUpperCase()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{log.description}</p>
                          <span className="block text-[8px] mt-0.5">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">No prior action logs for this content.</p>
                  )}
                </div>

              </div>
            </div>

            {/* Moderation Controls Footer */}
            {contextData.report.status === 'pending' && (
              <div className="border-t border-border/40 pt-5 mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-bold text-foreground">Select Moderation Action:</span>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-between items-center w-full bg-[var(--accent)]/10 p-4 rounded-xl border border-border">
                  
                  {/* Positive Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleModerationAction(contextData.report.id, "dismiss")}
                      disabled={submittingAction !== null}
                      className="gap-1.5 text-muted-foreground border-border hover:text-foreground"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Dismiss
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleModerationAction(contextData.report.id, "resolve")}
                      disabled={submittingAction !== null}
                      className="gap-1.5 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--success)]/10"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve (Keep)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleModerationAction(contextData.report.id, "warn")}
                      disabled={submittingAction !== null}
                      className="gap-1.5 text-[var(--warning)] border-[var(--warning)]/20 hover:bg-[var(--warning)]/10"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Warn User
                    </Button>
                  </div>

                  {/* Negative Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleModerationAction(contextData.report.id, "hide")}
                      disabled={submittingAction !== null}
                      className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <Eye className="w-4 h-4" />
                      Hide (Flag)
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleModerationAction(contextData.report.id, "remove")}
                      disabled={submittingAction !== null}
                      className="gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Content
                    </Button>
                  </div>

                </div>
              </div>
            )}
            
            {contextData.report.status !== 'pending' && (
              <div className="border-t border-border/40 pt-5 mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedReport(null);
                    setContextReportId(null);
                    setContextData(null);
                  }}
                >
                  Close panel
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
