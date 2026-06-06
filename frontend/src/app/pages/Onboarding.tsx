import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const onboardingCandidates = [
  {
    id: 1,
    name: "Jannatul Ferdous",
    role: "Software Engineer",
    department: "Information Technology",
    startDate: "Apr 10, 2026",
    progress: 75,
    currentStep: 3,
    avatar: "JF",
  },
  {
    id: 2,
    name: "Sadia Rahman",
    role: "Marketing Executive",
    department: "Marketing",
    startDate: "Apr 12, 2026",
    progress: 50,
    currentStep: 2,
    avatar: "SR",
  },
  {
    id: 3,
    name: "Rafi Ahmed",
    role: "Sales Executive",
    department: "Sales",
    startDate: "Apr 15, 2026",
    progress: 25,
    currentStep: 1,
    avatar: "RA",
  },
];

const onboardingSteps = [
  { id: 1, title: "Document Verification", description: "Verify and upload all required documents" },
  { id: 2, title: "IT Setup", description: "Email, laptop, and system access setup" },
  { id: 3, title: "Orientation", description: "Complete company orientation program" },
  { id: 4, title: "Training", description: "Complete role-specific training modules" },
  { id: 5, title: "Team Introduction", description: "Meet team members and manager" },
];

const taskChecklist = [
  { id: 1, task: "Submit ID proof", status: "completed" },
  { id: 2, task: "Submit address proof", status: "completed" },
  { id: 3, task: "Complete tax forms", status: "completed" },
  { id: 4, task: "Setup email account", status: "in-progress" },
  { id: 5, task: "Laptop assignment", status: "pending" },
  { id: 6, task: "Complete orientation video", status: "pending" },
  { id: 7, task: "Meet with HR", status: "pending" },
];

export function Onboarding() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Onboarding & Offboarding</h1>
          <p className="text-muted-foreground">Manage employee onboarding and offboarding processes</p>
        </div>
        <Badge variant="secondary">Read-only workflow</Badge>
      </div>

      <div className="rounded-lg border border-[var(--info)]/25 bg-[var(--info)]/10 px-4 py-3 text-sm text-muted-foreground">
        Onboarding records are displayed from the current demo workflow. Creating or updating onboarding steps is hidden until the backend onboarding module is enabled.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Onboarding</p>
          <p className="text-2xl text-foreground mt-1">12</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Completed This Month</p>
          <p className="text-2xl text-foreground mt-1">23</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Tasks</p>
          <p className="text-2xl text-foreground mt-1">47</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Average Time</p>
          <p className="text-2xl text-foreground mt-1">5.2 days</p>
        </Card>
      </div>

      {/* Active Onboarding */}
      <Card>
        <CardHeader>
          <CardTitle>Active Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {onboardingCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {candidate.avatar}
                    </div>
                    <div>
                      <h3 className="text-foreground">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {candidate.role} • {candidate.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="text-sm text-foreground">{candidate.startDate}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground">{candidate.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${candidate.progress}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="flex gap-2">
                  {onboardingSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex-1 p-2 rounded text-center text-xs ${
                        step.id < candidate.currentStep
                          ? "bg-[var(--success)]/20 text-[var(--success)]"
                          : step.id === candidate.currentStep
                          ? "bg-[var(--info)]/20 text-[var(--info)]"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {step.id < candidate.currentStep ? "✓" : step.id}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onboardingSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm flex-shrink-0">
                      {step.id}
                    </div>
                    {index < onboardingSteps.length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Task Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taskChecklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                >
                  <div className="flex items-center gap-3">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                    ) : item.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-[var(--info)]" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span
                      className={`text-sm ${
                        item.status === "completed"
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {item.task}
                    </span>
                  </div>
                  <Badge
                    variant={
                      item.status === "completed"
                        ? "success"
                        : item.status === "in-progress"
                        ? "info"
                        : "secondary"
                    }
                    size="sm"
                  >
                    {item.status === "completed"
                      ? "Done"
                      : item.status === "in-progress"
                      ? "In Progress"
                      : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
