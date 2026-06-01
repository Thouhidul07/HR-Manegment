import { Check, Clock, FileText, GraduationCap, Receipt, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const tasks = [
  {
    title: "Complete Q1 self-review",
    area: "Performance",
    due: "Completed",
    done: true,
    icon: Target,
    link: "/dashboard/performance",
  },
  {
    title: "Submit expense report",
    area: "Expenses",
    due: "Due today",
    done: false,
    icon: Receipt,
    link: "/dashboard/expense",
  },
  {
    title: "Complete Safety Training",
    area: "Training",
    due: "Due Apr 8",
    done: false,
    icon: GraduationCap,
    link: "/dashboard/training",
  },
];

export function Tasks() {
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
          <p className="text-2xl text-foreground">{tasks.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Check className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <p className="text-2xl text-foreground">{completedCount}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <Clock className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl text-foreground">{tasks.length - completedCount}</p>
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
                key={task.title}
                to={task.link}
                className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${task.done ? "bg-[#543884]" : "bg-[#543884]/10"}`}>
                  <task.icon className={`w-5 h-5 ${task.done ? "text-white" : "text-[#543884]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{task.area}</p>
                </div>
                <Badge variant={task.done ? "secondary" : "outline"}>{task.due}</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
