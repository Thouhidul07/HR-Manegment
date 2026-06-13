import { Target, TrendingUp, Award, Star } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

type PerformanceReview = {
  id: number;
  userId: number;
  employee: string;
  reviewer?: string | null;
  reviewPeriod: string;
  score: number | null;
  goals: string[];
  feedback: string;
  status: "draft" | "submitted" | "approved" | string;
};

type PerformanceRecord = {
  id: number;
  employee: string;
  avatar: string;
  department: string;
  role: string;
  overall: number;
  technical: number;
  communication: number;
  leadership: number;
  status: string;
};

type GoalRecord = {
  id: number;
  title: string;
  progress: number;
  dueDate: string;
  status: string;
};

type EmployeeOption = {
  id: number;
  name: string;
  department?: string;
  designation?: string;
};

type SkillAssessmentView = "current" | "target" | "both";
type ReviewCyclePhase = {
  phase: string;
  dueDate: string;
  status: string;
};

const getDefaultReviewPeriod = () =>
  `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

const emptyStartReviewForm = () => ({
  userId: "",
  reviewPeriod: getDefaultReviewPeriod(),
  goals: "",
  feedback: "",
});

const emptySelfAssessmentForm = () => ({
  goals: "",
  feedback: "",
});

const emptyFinalizeForm = () => ({
  score: "",
  feedback: "",
});

export function Performance() {
  const { user } = useAuth();
  const [reviewFilter, setReviewFilter] = useState<"All" | "Pending" | "Top Performers">("All");
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState<PerformanceReview | null>(null);
  const [startReviewForm, setStartReviewForm] = useState(
    emptyStartReviewForm(),
  );
  const [selfAssessmentForm, setSelfAssessmentForm] = useState(
    emptySelfAssessmentForm(),
  );
  const [finalizeForm, setFinalizeForm] = useState(emptyFinalizeForm());
  const [savingReview, setSavingReview] = useState(false);
  const [performanceMessage, setPerformanceMessage] = useState("");
  const [performanceError, setPerformanceError] = useState("");
  const [skillAssessmentView, setSkillAssessmentView] =
    useState<SkillAssessmentView>("both");
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isHRManager = user?.role === "hr_manager";
  const canManageReviews = isAdmin || isHRManager;

  const getPerformanceStatus = (review: PerformanceReview) => {
    const score = Number(review.score || 0);

    if (review.status === "draft") return "Pending";
    if (review.status === "submitted") return "Submitted";
    if (score >= 4.7) return "Outstanding";
    if (score >= 4.2) return "Excellent";
    if (score >= 3.5) return "Good";
    return review.status === "approved" ? "Finalized" : "Pending";
  };

  const performanceStatusClass = (status: string) => {
    if (["Outstanding", "Excellent", "Finalized"].includes(status)) {
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-300";
    }

    if (status === "Submitted") {
      return "border-amber-400/30 bg-amber-400/15 text-amber-300";
    }

    if (status === "Good") {
      return "border-sky-400/30 bg-sky-400/15 text-sky-300";
    }

    return "border-rose-400/30 bg-rose-400/15 text-rose-300";
  };

  const mapReviewToRecord = (review: PerformanceReview): PerformanceRecord => {
    const score = Number(review.score || 0);
    const initials = (review.employee || "Employee")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: review.id,
      employee: review.employee || "Employee",
      avatar: initials,
      department: review.reviewPeriod || "Review",
      role: review.reviewer ? `Reviewer: ${review.reviewer}` : "Pending reviewer",
      overall: score,
      technical: score,
      communication: score,
      leadership: score,
      status: getPerformanceStatus(review),
    };
  };

  const mapReviewsToGoals = (items: PerformanceReview[]): GoalRecord[] =>
    items.flatMap((review) =>
      (review.goals?.length
        ? review.goals
        : [`Complete ${review.reviewPeriod || "review"} goals`]
      ).map((goal, index) => ({
        id: Number(`${review.id}${index}`),
        title: goal,
        progress:
          review.status === "approved"
            ? 100
            : review.status === "submitted"
              ? 75
              : 35,
        dueDate: review.reviewPeriod || "Current cycle",
        status:
          review.status === "approved"
            ? "Ahead"
            : review.status === "draft"
              ? "Behind"
              : "On Track",
      })),
    );

  const loadReviews = useCallback(async () => {
    const response = await api.get("/performance/reviews");
    const nextReviews = response.data.reviews || [];

    setReviews(nextReviews);
    setPerformanceData(
      nextReviews.length ? nextReviews.map(mapReviewToRecord) : [],
    );
    const mappedGoals = mapReviewsToGoals(nextReviews);
    setGoals(mappedGoals.length ? mappedGoals : []);
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!canManageReviews) return;

    const response = await api.get("/employees");
    setEmployees(
      (response.data.employees || []).filter(
        (employee: EmployeeOption & { role?: string; status?: string }) =>
          employee.role !== "admin" && employee.status !== "inactive",
      ),
    );
  }, [canManageReviews]);

  useEffect(() => {
    loadReviews().catch(() => {});
    loadEmployees().catch(() => {});
  }, [loadEmployees, loadReviews]);

  const averageRating = performanceData.length
    ? (
        performanceData.reduce(
          (total, record) => total + Number(record.overall || 0),
          0,
        ) / performanceData.length
      ).toFixed(1)
    : "0.0";
  const goalsAchieved = goals.length
    ? Math.round(
        goals.reduce((total, goal) => total + Number(goal.progress || 0), 0) /
          goals.length,
      )
    : 0;
  const topPerformers = performanceData.filter(
    (record) => Number(record.overall || 0) >= 4.5,
  ).length;
  const reviewsPending = performanceData.filter((record) =>
    ["draft", "Pending", "Submitted"].includes(record.status),
  ).length;
  const skillsData = reviews
    .flatMap((review) => {
      const reviewWithSkills = review as PerformanceReview & {
        skills?: unknown[];
        skillRatings?: unknown[];
      };

      return Array.isArray(reviewWithSkills.skills)
        ? reviewWithSkills.skills
        : Array.isArray(reviewWithSkills.skillRatings)
          ? reviewWithSkills.skillRatings
          : [];
    })
    .map((skill) => {
      const skillRecord = skill as {
        skill?: string;
        name?: string;
        rating?: number | string;
        score?: number | string;
        current?: number | string;
        target?: number | string;
      };
      const current = Number(
        skillRecord.current ?? skillRecord.rating ?? skillRecord.score ?? 0,
      );
      const target = Number(skillRecord.target ?? current);

      return {
        skill: skillRecord.skill || skillRecord.name || "Skill",
        current,
        target,
      };
    })
    .filter((item) => item.current > 0 || item.target > 0);
  const currentSkillAverage = skillsData.length
    ? Math.round(
        skillsData.reduce((sum, skill) => sum + skill.current, 0) /
          skillsData.length,
      )
    : 0;
  const targetSkillAverage = skillsData.length
    ? Math.round(
        skillsData.reduce((sum, skill) => sum + skill.target, 0) /
          skillsData.length,
      )
    : 0;
  const reviewCycle: ReviewCyclePhase[] | null = null;

  const filteredPerformanceData = useMemo(() => {
    if (reviewFilter === "Pending") {
      return performanceData.filter((record) =>
        ["draft", "Pending", "Submitted"].includes(record.status)
      );
    }
    if (reviewFilter === "Top Performers") {
      return performanceData.filter((record) =>
        Number(record.overall || 0) >= 4.5
      );
    }
    return performanceData;
  }, [performanceData, reviewFilter]);

  const showPerformanceFeedback = (message: string, isError = false) => {
    if (isError) {
      setPerformanceError(message);
      setPerformanceMessage("");
    } else {
      setPerformanceMessage(message);
      setPerformanceError("");
    }

    window.setTimeout(() => {
      setPerformanceMessage("");
      setPerformanceError("");
    }, 3000);
  };

  const getApiErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;

  const splitGoals = (value: string) =>
    value
      .split("\n")
      .map((goal) => goal.trim())
      .filter(Boolean);

  const openStartReviewModal = () => {
    setStartReviewForm(emptyStartReviewForm());
    setPerformanceError("");
    setIsStartModalOpen(true);
  };

  const openSelfAssessmentModal = (review: PerformanceReview) => {
    setSelectedReview(review);
    setSelfAssessmentForm({
      goals: (review.goals || []).join("\n"),
      feedback: review.feedback || "",
    });
    setPerformanceError("");
    setIsSelfModalOpen(true);
  };

  const openFinalizeModal = (review: PerformanceReview) => {
    setSelectedReview(review);
    setFinalizeForm({
      score: review.score ? String(review.score) : "",
      feedback: review.feedback || "",
    });
    setPerformanceError("");
    setIsFinalizeModalOpen(true);
  };

  const openViewReviewModal = (review: PerformanceReview | null) => {
    if (!review) return;
    setSelectedReview(review);
    setPerformanceError("");
    setIsViewModalOpen(true);
  };

  const closeReviewModals = () => {
    if (savingReview) return;
    setIsStartModalOpen(false);
    setIsSelfModalOpen(false);
    setIsFinalizeModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedReview(null);
  };

  const handleStartReview = async () => {
    if (!canManageReviews) return;

    if (!startReviewForm.userId) {
      setPerformanceError("Select an employee for this review.");
      return;
    }

    if (!startReviewForm.reviewPeriod.trim()) {
      setPerformanceError("Review period is required.");
      return;
    }

    setSavingReview(true);
    setPerformanceError("");

    try {
      await api.post("/performance/reviews", {
        userId: Number(startReviewForm.userId),
        reviewPeriod: startReviewForm.reviewPeriod.trim(),
        goals: splitGoals(startReviewForm.goals),
        feedback: startReviewForm.feedback.trim(),
        status: "draft",
      });

      await loadReviews();
      setIsStartModalOpen(false);
      showPerformanceFeedback("Performance review started successfully.");
    } catch (error) {
      setPerformanceError(
        getApiErrorMessage(error, "Unable to start this review."),
      );
    } finally {
      setSavingReview(false);
    }
  };

  const handleSubmitSelfAssessment = async () => {
    if (!selectedReview || !isEmployee) return;

    if (!selfAssessmentForm.feedback.trim()) {
      setPerformanceError("Self-assessment comments are required.");
      return;
    }

    setSavingReview(true);
    setPerformanceError("");

    try {
      await api.patch(`/performance/reviews/${selectedReview.id}`, {
        goals: splitGoals(selfAssessmentForm.goals),
        feedback: selfAssessmentForm.feedback.trim(),
        status: "submitted",
      });

      await loadReviews();
      setIsSelfModalOpen(false);
      setSelectedReview(null);
      showPerformanceFeedback("Self-assessment submitted successfully.");
    } catch (error) {
      setPerformanceError(
        getApiErrorMessage(error, "Unable to submit self-assessment."),
      );
    } finally {
      setSavingReview(false);
    }
  };

  const handleFinalizeReview = async () => {
    if (!selectedReview || !canManageReviews) return;

    const score = Number(finalizeForm.score);
    if (!score || score < 0 || score > 5) {
      setPerformanceError("Enter a final score between 0 and 5.");
      return;
    }

    setSavingReview(true);
    setPerformanceError("");

    try {
      await api.patch(`/performance/reviews/${selectedReview.id}`, {
        score,
        feedback: finalizeForm.feedback.trim(),
        status: "approved",
      });

      await loadReviews();
      setIsFinalizeModalOpen(false);
      setSelectedReview(null);
      showPerformanceFeedback("Performance review finalized successfully.");
    } catch (error) {
      setPerformanceError(
        getApiErrorMessage(error, "Unable to finalize this review."),
      );
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">
            {canManageReviews ? "Performance Management" : "My Performance"}
          </h1>
          <p className="text-muted-foreground">
            {canManageReviews
              ? "Track and manage employee performance reviews"
              : "Track your performance reviews, goals, and development progress"}
          </p>
        </div>
        {canManageReviews && (
          <Button variant="primary" onClick={openStartReviewModal}>
            Start Review
          </Button>
        )}
      </div>

      {performanceMessage && (
        <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          {performanceMessage}
        </div>
      )}

      {performanceError &&
        !isStartModalOpen &&
        !isSelfModalOpen &&
        !isFinalizeModalOpen && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {performanceError}
          </div>
        )}
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${reviewFilter === "All" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => setReviewFilter("All")}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <Target className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{averageRating}/5.0</p>
          <p className="text-xs text-muted-foreground mt-1">Average score</p>
        </Card>

        <Card className="p-4 bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Goals Achieved</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{goalsAchieved}%</p>
          <p className="text-xs text-muted-foreground mt-1">This quarter</p>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${reviewFilter === "Top Performers" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => setReviewFilter(reviewFilter === "Top Performers" ? "All" : "Top Performers")}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <Award className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Top Performers</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{topPerformers}</p>
          <p className="text-xs text-muted-foreground mt-1">4.5+ rating</p>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all hover:scale-102 hover:shadow-sm border-2 ${reviewFilter === "Pending" ? "border-primary bg-primary/5" : "border-transparent"}`}
          onClick={() => setReviewFilter(reviewFilter === "Pending" ? "All" : "Pending")}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-4)]/20">
              <Star className="w-5 h-5 text-[var(--chart-4)]" />
            </div>
            <p className="text-sm text-muted-foreground">Reviews Pending</p>
          </div>
          <p className="text-2xl text-foreground font-bold">{reviewsPending}</p>
        </Card>
      </div>

      {/* Skills and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Assessment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Skills Assessment</CardTitle>
              <div className="flex rounded-xl border border-border bg-background/40 p-1">
                {[
                  { key: "current", label: "Current" },
                  { key: "target", label: "Target" },
                  { key: "both", label: "Both" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSkillAssessmentView(option.key as SkillAssessmentView)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      skillAssessmentView === option.key
                        ? "bg-[#9A77CF]/25 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {skillsData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No skills performance data found.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillsData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      stroke="var(--muted-foreground)"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      stroke="var(--muted-foreground)"
                    />
                    {(skillAssessmentView === "current" ||
                      skillAssessmentView === "both") && (
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="var(--chart-1)"
                        fill="var(--chart-1)"
                        fillOpacity={0.3}
                      />
                    )}
                    {(skillAssessmentView === "target" ||
                      skillAssessmentView === "both") && (
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="var(--chart-2)"
                        fill="var(--chart-2)"
                        fillOpacity={0.2}
                      />
                    )}
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-4">
                  {(skillAssessmentView === "current" ||
                    skillAssessmentView === "both") && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--chart-1)]"></div>
                      <span className="text-xs text-muted-foreground">
                        Current avg: {currentSkillAverage}%
                      </span>
                    </div>
                  )}
                  {(skillAssessmentView === "target" ||
                    skillAssessmentView === "both") && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--chart-2)]"></div>
                      <span className="text-xs text-muted-foreground">
                        Target avg: {targetSkillAverage}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Current Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.length > 0 ? (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm text-foreground">{goal.title}</h4>
                      <Badge
                        variant={
                          goal.status === "Ahead"
                            ? "success"
                            : goal.status === "On Track"
                              ? "info"
                              : "warning"
                        }
                        size="sm"
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Due: {goal.dueDate}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">{goal.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No goals added.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Cycle */}
      <Card>
        <CardHeader>
          <CardTitle>Current Review Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewCycle ? (
            <div className="flex gap-4 items-center">
              {reviewCycle.map((phase, index) => (
              <div key={phase.phase} className="flex-1">
                <div className="relative">
                  <div
                    className={`p-4 rounded-lg border-2 transition-all ${
                      phase.status === "Completed"
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : phase.status === "In Progress"
                          ? "border-[var(--info)] bg-[var(--info)]/10"
                          : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="text-center">
                      <div
                        className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          phase.status === "Completed"
                            ? "bg-[var(--success)] text-white"
                            : phase.status === "In Progress"
                              ? "bg-[var(--info)] text-white"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="text-sm text-foreground mb-1">
                        {phase.phase}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {phase.dueDate}
                      </p>
                      <Badge
                        variant={
                          phase.status === "Completed"
                            ? "success"
                            : phase.status === "In Progress"
                              ? "info"
                              : "secondary"
                        }
                        size="sm"
                        className="mt-2"
                      >
                        {phase.status}
                      </Badge>
                    </div>
                  </div>
                  {index < reviewCycle.length - 1 && (
                    <div
                      className={`absolute top-8 left-full w-full h-0.5 ${
                        phase.status === "Completed"
                          ? "bg-[var(--success)]"
                          : "bg-border"
                      }`}
                    ></div>
                  )}
                </div>
              </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active review cycle found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {canManageReviews
              ? "Team Performance Overview"
              : "My Performance Overview"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead>Technical</TableHead>
                <TableHead>Communication</TableHead>
                <TableHead>Leadership</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPerformanceData.map((record) => {
                const review = reviews.find((item) => item.id === record.id);
                const canSubmitSelfAssessment =
                  isEmployee && review?.status === "draft";
                const canFinalizeReview =
                  canManageReviews && review?.status !== "approved";

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          {record.avatar}
                        </div>
                        <span className="text-sm text-foreground">
                          {record.employee}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" size="sm">
                        {record.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{record.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[var(--warning)] text-[var(--warning)]" />
                        <span className="text-sm">{record.overall}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.technical}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.communication}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.leadership}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={performanceStatusClass(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {review && canSubmitSelfAssessment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSelfAssessmentModal(review)}
                        >
                          Submit Review
                        </Button>
                      )}
                      {review && canFinalizeReview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openFinalizeModal(review)}
                        >
                          Finalize
                        </Button>
                      )}
                      {(!review ||
                        (!canSubmitSelfAssessment && !canFinalizeReview)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewReviewModal(review || null)}
                          disabled={!review}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filteredPerformanceData.length && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No performance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={canManageReviews && isStartModalOpen}
        onClose={closeReviewModals}
        title="Start Performance Review"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeReviewModals}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStartReview}
              disabled={savingReview}
            >
              {savingReview ? "Starting..." : "Start Review"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {performanceError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {performanceError}
            </div>
          )}
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Employee
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={startReviewForm.userId}
              onChange={(event) =>
                setStartReviewForm((form) => ({
                  ...form,
                  userId: event.target.value,
                }))
              }
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Review Period"
            value={startReviewForm.reviewPeriod}
            onChange={(event) =>
              setStartReviewForm((form) => ({
                ...form,
                reviewPeriod: event.target.value,
              }))
            }
          />
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Goals / Notes
            </label>
            <textarea
              className="w-full min-h-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={startReviewForm.goals}
              onChange={(event) =>
                setStartReviewForm((form) => ({
                  ...form,
                  goals: event.target.value,
                }))
              }
              placeholder="Add one goal per line."
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Manager Notes
            </label>
            <textarea
              className="w-full min-h-20 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={startReviewForm.feedback}
              onChange={(event) =>
                setStartReviewForm((form) => ({
                  ...form,
                  feedback: event.target.value,
                }))
              }
              placeholder="Optional context for this review."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEmployee && isSelfModalOpen}
        onClose={closeReviewModals}
        title="Submit Self Assessment"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeReviewModals}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitSelfAssessment}
              disabled={savingReview}
            >
              {savingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {performanceError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {performanceError}
            </div>
          )}
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Goals Progress
            </label>
            <textarea
              className="w-full min-h-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={selfAssessmentForm.goals}
              onChange={(event) =>
                setSelfAssessmentForm((form) => ({
                  ...form,
                  goals: event.target.value,
                }))
              }
              placeholder="Update your goals, one per line."
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Self Assessment Comments
            </label>
            <textarea
              className="w-full min-h-28 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={selfAssessmentForm.feedback}
              onChange={(event) =>
                setSelfAssessmentForm((form) => ({
                  ...form,
                  feedback: event.target.value,
                }))
              }
              placeholder="Summarize your achievements, blockers, and development needs."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={canManageReviews && isFinalizeModalOpen}
        onClose={closeReviewModals}
        title="Finalize Performance Review"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeReviewModals}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleFinalizeReview}
              disabled={savingReview}
            >
              {savingReview ? "Finalizing..." : "Finalize Review"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {performanceError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {performanceError}
            </div>
          )}
          <Input
            label="Final Score"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={finalizeForm.score}
            onChange={(event) =>
              setFinalizeForm((form) => ({
                ...form,
                score: event.target.value,
              }))
            }
            placeholder="4.5"
          />
          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Final Comments
            </label>
            <textarea
              className="w-full min-h-28 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={finalizeForm.feedback}
              onChange={(event) =>
                setFinalizeForm((form) => ({
                  ...form,
                  feedback: event.target.value,
                }))
              }
              placeholder="Add final manager comments for this performance cycle."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={closeReviewModals}
        title="Performance Review Details"
        size="lg"
        footer={
          <Button variant="outline" onClick={closeReviewModals}>
            Close
          </Button>
        }
      >
        {selectedReview && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-accent/20 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Employee</p>
                <p className="text-lg font-medium text-foreground">{selectedReview.employee}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReview.reviewPeriod}
                </p>
              </div>
              <Badge variant="outline" className={performanceStatusClass(getPerformanceStatus(selectedReview))}>
                {getPerformanceStatus(selectedReview)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Reviewer</p>
                <p className="text-sm text-foreground">{selectedReview.reviewer || "Not assigned"}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-sm text-foreground">
                  {selectedReview.score ? `${Number(selectedReview.score).toFixed(1)} / 5.0` : "Pending"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Raw Status</p>
                <p className="text-sm capitalize text-foreground">{selectedReview.status}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Goals</p>
              <div className="space-y-2">
                {(selectedReview.goals?.length ? selectedReview.goals : ["No goals added."]).map((goal, index) => (
                  <div key={`${goal}-${index}`} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                    {goal}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">Feedback / Comments</p>
              <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                {selectedReview.feedback || "No feedback added yet."}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
