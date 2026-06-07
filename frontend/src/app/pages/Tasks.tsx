import { useEffect, useState } from "react";
import { Check, Clock, FileText, GraduationCap, Receipt, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import api from "../services/api";

type TaskItem = {
  id: string;
  title: string;
  area: string;
  due: string;
  done: boolean;
  icon: typeof Target;
  link: string;
};

const iconByArea: Record<string, typeof Target> = {
  Performance: Target,
  Expenses: Receipt,
  Training: GraduationCap,
  Leave: FileText,
};

export function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get("/performance/reviews").catch(() => ({ data: { reviews: [] } })),
      api.get("/training").catch(() => ({ data: { enrollments: [] } })),
      api.get("/expenses").catch(() => ({ data: { expenses: [] } })),
      api.get("/leave").catch(() => ({ data: { requests: [] } })),
    ]).then(([performance, training, expenses, leave]) => {
      if (!isMounted) return;

      const nextTasks: TaskItem[] = [];

      (performance.data.reviews || []).forEach((review: { id: number; reviewPeriod: string; status: string }) => {
        if (review.status === "approved") return;
        nextTasks.push({
          id: `review-${review.id}`,
          title: `Complete ${review.reviewPeriod} self-review`,
          area: "Performance",
          due: review.status === "draft" ? "Due soon" : "In progress",
          done: review.status === "submitted",
          icon: iconByArea.Performance,
          link: "/dashboard/performance",
        });
      });

      (training.data.enrollments || []).forEach((course: { id: number; title?: string; progress?: number }) => {
        if (Number(course.progress || 0) >= 100) return;
        nextTasks.push({
          id: `training-${course.id}`,
          title: `Complete ${course.title || "training course"}`,
          area: "Training",
          due: `${100 - Number(course.progress || 0)}% remaining`,
          done: false,
          icon: iconByArea.Training,
          link: "/dashboard/training",
        });
      });

      const pendingExpense = (expenses.data.expenses || []).find(
        (expense: { status: string }) => expense.status?.toLowerCase() === "pending"
      );
      if (pendingExpense) {
        nextTasks.push({
          id: "expense-pending",
          title: "Track pending expense claim",
          area: "Expenses",
          due: "Awaiting approval",
          done: false,
          icon: iconByArea.Expenses,
          link: "/dashboard/expense",
        });
      } else {
        nextTasks.push({
          id: "expense-submit",
          title: "Submit expense report",
          area: "Expenses",
          due: "Due today",
          done: false,
          icon: iconByArea.Expenses,
          link: "/dashboard/expense",
        });
      }

      const pendingLeave = (leave.data.requests || []).find(
        (request: { status: string }) => request.status === "Pending"
      );
      if (pendingLeave) {
        nextTasks.push({
          id: `leave-${pendingLeave.id}`,
          title: "Follow up on leave request",
          area: "Leave",
          due: "Pending approval",
          done: false,
          icon: iconByArea.Leave,
          link: "/dashboard/leave",
        });
      }

      setTasks(nextTasks.length ? nextTasks : [{
        id: "none",
        title: "You are all caught up",
        area: "General",
        due: "",
        done: true,
        icon: Check,
        link: "/dashboard",
      }]);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const completedCount = tasks.filter((task) => task.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-2">My Tasks</h1>
        <p className="text-muted-foreground">Track your pending work across reviews, expenses, and training.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <FileText className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
          <p className="text-2xl text-foreground">{loading ? "…" : tasks.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Check className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <p className="text-2xl text-foreground">{loading ? "…" : completedCount}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <Clock className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl text-foreground">{loading ? "…" : tasks.length - completedCount}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={task.link}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-[var(--primary)]/30 hover:bg-accent/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                    <task.icon className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className={`text-foreground group-hover:text-[var(--primary)] transition-colors ${task.done ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{task.area}{task.due ? ` · ${task.due}` : ""}</p>
                  </div>
                </div>
                <Badge variant={task.done ? "success" : "warning"}>
                  {task.done ? "Done" : "Pending"}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
