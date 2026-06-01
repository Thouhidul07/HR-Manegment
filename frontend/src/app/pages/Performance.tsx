import { Target, TrendingUp, Award, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const performanceData = [
  { id: 1, employee: "John Doe", avatar: "JD", department: "Engineering", role: "Senior Developer", overall: 4.5, technical: 4.8, communication: 4.2, leadership: 4.6, status: "Excellent" },
  { id: 2, employee: "Sarah Smith", avatar: "SS", department: "Marketing", role: "Marketing Manager", overall: 4.8, technical: 4.5, communication: 5.0, leadership: 4.9, status: "Outstanding" },
  { id: 3, employee: "Mike Johnson", avatar: "MJ", department: "Sales", role: "Sales Executive", overall: 3.8, technical: 3.5, communication: 4.2, leadership: 3.7, status: "Good" },
  { id: 4, employee: "Emily Brown", avatar: "EB", department: "HR", role: "HR Specialist", overall: 4.2, technical: 4.0, communication: 4.5, leadership: 4.1, status: "Excellent" },
];

const skillsData = [
  { skill: "Technical", current: 85, target: 90 },
  { skill: "Communication", current: 75, target: 85 },
  { skill: "Leadership", current: 70, target: 80 },
  { skill: "Problem Solving", current: 80, target: 85 },
  { skill: "Teamwork", current: 90, target: 95 },
  { skill: "Time Management", current: 78, target: 85 },
];

const goals = [
  { id: 1, title: "Complete React Advanced Course", progress: 75, dueDate: "Apr 15, 2026", status: "On Track" },
  { id: 2, title: "Lead 2 major projects", progress: 50, dueDate: "Jun 30, 2026", status: "On Track" },
  { id: 3, title: "Mentor 3 junior developers", progress: 33, dueDate: "Dec 31, 2026", status: "Behind" },
  { id: 4, title: "Improve code review quality", progress: 90, dueDate: "Mar 31, 2026", status: "Ahead" },
];

const reviewCycle = [
  { phase: "Self Assessment", status: "Completed", dueDate: "Mar 15, 2026" },
  { phase: "Manager Review", status: "In Progress", dueDate: "Mar 30, 2026" },
  { phase: "Calibration", status: "Pending", dueDate: "Apr 10, 2026" },
  { phase: "Final Review", status: "Pending", dueDate: "Apr 20, 2026" },
];

type PerformanceReview = {
  id: number;
  employee: string;
  reviewer: string | null;
  reviewPeriod: string;
  score: number | null;
  goals: string[];
  feedback: string;
  status: "draft" | "submitted" | "approved";
};

export function Performance() {
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const isEmployee = user?.role === "employee";
  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EU";
  const visiblePerformance = isEmployee
    ? [{ ...performanceData[0], employee: user?.name || "Employee User", avatar: initials, role: "Software Engineer" }]
    : performanceData;
  const reviewRows = reviews.length
    ? reviews.map((review) => ({
        id: review.id,
        employee: review.employee,
        avatar: review.employee
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        department: review.reviewPeriod,
        role: review.reviewer ? `Reviewer: ${review.reviewer}` : "Reviewer pending",
        overall: review.score ?? 0,
        technical: review.goals.length,
        communication: review.feedback ? 1 : 0,
        leadership: review.status === "approved" ? 1 : 0,
        status: review.status === "approved" ? "Excellent" : review.status === "submitted" ? "Good" : "Draft",
      }))
    : visiblePerformance;
  const scoredReviews = reviews.filter((review) => review.score !== null);
  const averageRating = scoredReviews.length
    ? (scoredReviews.reduce((sum, review) => sum + (review.score || 0), 0) / scoredReviews.length).toFixed(1)
    : reviews.length ? "0.0" : "4.3";
  const pendingReviews = reviews.filter((review) => review.status !== "approved").length;

  const loadReviews = () => {
    api.get("/performance/reviews")
      .then((response) => setReviews(response.data.reviews || []))
      .catch(() => {
        // Keep demo performance content visible when the API/database is unavailable.
      });
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleStartReview = async () => {
    const response = await api.post("/performance/review-cycles", {});
    setReviewMessage(`${response.data.reviewPeriod} review cycle started for ${response.data.employeesQueued} employees.`);
    loadReviews();
    window.setTimeout(() => setReviewMessage(""), 2600);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{isEmployee ? "My Performance" : "Performance Management"}</h1>
          <p className="text-muted-foreground">{isEmployee ? "Track your goals, skills, and review progress" : "Track and manage employee performance reviews"}</p>
        </div>
        {!isEmployee && <Button variant="primary" onClick={handleStartReview}>Start Review</Button>}
      </div>

      {reviewMessage && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {reviewMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <Target className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Overall Rating</p>
          </div>
          <p className="text-2xl text-foreground">{averageRating}/5.0</p>
          <p className="text-xs text-muted-foreground mt-1">Average score</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Goals Achieved</p>
          </div>
          <p className="text-2xl text-foreground">85%</p>
          <p className="text-xs text-muted-foreground mt-1">This quarter</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <Award className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">{isEmployee ? "Strongest Skill" : "Top Performers"}</p>
          </div>
          <p className="text-2xl text-foreground">{isEmployee ? "Teamwork" : "124"}</p>
          <p className="text-xs text-muted-foreground mt-1">{isEmployee ? "90% current score" : "4.5+ rating"}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-4)]/20">
              <Star className="w-5 h-5 text-[var(--chart-4)]" />
            </div>
            <p className="text-sm text-muted-foreground">{isEmployee ? "Review Status" : "Reviews Pending"}</p>
          </div>
          <p className="text-2xl text-foreground">{isEmployee ? (reviews[0]?.status || "In Progress") : pendingReviews}</p>
        </Card>
      </div>

      {/* Skills and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" stroke="var(--muted-foreground)" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value, name) => [`${value}%`, name === "current" ? "Current" : "Target"]}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                {showCurrent && <Radar name="Current" dataKey="current" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} />}
                {showTarget && <Radar name="Target" dataKey="target" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} />}
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-4">
              <button
                type="button"
                onClick={() => setShowCurrent((visible) => !visible)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${showCurrent ? "text-foreground" : "text-muted-foreground opacity-60"}`}
              >
                <div className="w-3 h-3 rounded-full bg-[var(--chart-1)]"></div>
                <span className="text-xs text-muted-foreground">Current</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTarget((visible) => !visible)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${showTarget ? "text-foreground" : "text-muted-foreground opacity-60"}`}
              >
                <div className="w-3 h-3 rounded-full bg-[var(--chart-2)]"></div>
                <span className="text-xs text-muted-foreground">Target</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Current Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => (
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
                  <p className="text-xs text-muted-foreground mb-2">Due: {goal.dueDate}</p>
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
              ))}
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
                      <p className="text-sm text-foreground mb-1">{phase.phase}</p>
                      <p className="text-xs text-muted-foreground">{phase.dueDate}</p>
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
                        phase.status === "Completed" ? "bg-[var(--success)]" : "bg-border"
                      }`}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isEmployee ? "My Performance Review" : "Team Performance Overview"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Review Period</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewRows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {record.avatar}
                      </div>
                      <span className="text-sm text-foreground">{record.employee}</span>
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
                  <TableCell className="text-sm">{record.technical}</TableCell>
                  <TableCell className="text-sm">{record.communication ? "Added" : "Pending"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === "Outstanding" || record.status === "Excellent"
                          ? "success"
                          : "info"
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
