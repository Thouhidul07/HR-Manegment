import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

const onboardingCandidates = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Software Engineer",
    department: "Engineering",
    startDate: "Apr 10, 2026",
    progress: 75,
    currentStep: 3,
    avatar: "AJ",
  },
  {
    id: 2,
    name: "Maria Garcia",
    role: "Marketing Specialist",
    department: "Marketing",
    startDate: "Apr 12, 2026",
    progress: 50,
    currentStep: 2,
    avatar: "MG",
  },
  {
    id: 3,
    name: "Robert Chen",
    role: "Sales Associate",
    department: "Sales",
    startDate: "Apr 15, 2026",
    progress: 25,
    currentStep: 1,
    avatar: "RC",
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
  const [candidateList, setCandidateList] = useState(onboardingCandidates);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [showStartedMessage, setShowStartedMessage] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    name: "",
    role: "",
    department: "Engineering",
    startDate: "",
  });

  const formatDisplayDate = (dateValue: string) =>
    new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const resetOnboardingForm = () => {
    setOnboardingForm({ name: "", role: "", department: "Engineering", startDate: "" });
  };

  const handleStartOnboarding = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const initials = onboardingForm.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EU";

    setCandidateList((candidates) => [
      {
        id: Date.now(),
        name: onboardingForm.name,
        role: onboardingForm.role,
        department: onboardingForm.department,
        startDate: formatDisplayDate(onboardingForm.startDate),
        progress: 20,
        currentStep: 1,
        avatar: initials,
      },
      ...candidates,
    ]);
    resetOnboardingForm();
    setIsStartModalOpen(false);
    setShowStartedMessage(true);
    window.setTimeout(() => setShowStartedMessage(false), 2200);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Onboarding & Offboarding</h1>
          <p className="text-muted-foreground">Manage employee onboarding and offboarding processes</p>
        </div>
        <Button variant="primary" onClick={() => setIsStartModalOpen(true)}>Start New Onboarding</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Onboarding</p>
          <p className="text-2xl text-foreground mt-1">{candidateList.length}</p>
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
            {candidateList.map((candidate) => (
              <div
                key={candidate.id}
                className="p-4 rounded-lg border border-[#6B4A9A]/60 bg-[#261844]/55 hover:border-[#A77CE8]/80 hover:bg-[#2B1B4B]/75 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#9B73D4] text-white flex items-center justify-center font-medium shadow-lg shadow-[#9B73D4]/20">
                      {candidate.avatar}
                    </div>
                    <div>
                      <h3 className="text-foreground">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {candidate.role} - {candidate.department}
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
                  <div className="w-full h-2 bg-[#321E58] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#A77CE8] transition-all duration-300"
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
                          ? "bg-[#1F4752] text-[#27E18A]"
                          : step.id === candidate.currentStep
                          ? "bg-[#4C3472] text-[#C8A8FF]"
                          : "bg-[#321E58] text-[#B69AE3]"
                      }`}
                    >
                      {step.id < candidate.currentStep ? (
                        <CheckCircle2 className="mx-auto h-4 w-4" />
                      ) : (
                        step.id
                      )}
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
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    item.status === "completed"
                      ? "border-green-500/20 bg-green-500/10"
                      : item.status === "in-progress"
                      ? "border-[#A77CE8]/25 bg-[#A77CE8]/10"
                      : "border-[#FFA45E]/20 bg-[#FFA45E]/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                    ) : item.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-[#A77CE8]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#FFA45E]" />
                    )}
                    <span
                      className={`text-sm ${
                        item.status === "completed"
                          ? "text-green-200/80 line-through"
                          : "text-foreground"
                      }`}
                    >
                      {item.task}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "completed"
                        ? "border-green-500/40 bg-green-500/15 text-green-300"
                        : item.status === "in-progress"
                        ? "border-[#A77CE8]/45 bg-[#A77CE8]/15 text-[#D7C1FF]"
                        : "border-[#FFA45E]/45 bg-[#FFA45E]/15 text-[#FFD0A3]"
                    }
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

      {showStartedMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="relative overflow-hidden rounded-2xl bg-card border border-[#543884]/20 px-8 py-6 shadow-2xl text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#543884] via-[#EC4176] to-[#FFA45E]" />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-foreground">Onboarding started</p>
            <p className="mt-1 text-sm text-muted-foreground">The employee has been added to active onboarding.</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Start New Onboarding"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStartModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="start-onboarding-form" variant="primary">
              Start Onboarding
            </Button>
          </>
        }
      >
        <form id="start-onboarding-form" onSubmit={handleStartOnboarding} className="space-y-4">
          <Input
            label="Employee Name"
            required
            value={onboardingForm.name}
            onChange={(event) => setOnboardingForm((form) => ({ ...form, name: event.target.value }))}
            placeholder="Nadia Islam"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Role"
              required
              value={onboardingForm.role}
              onChange={(event) => setOnboardingForm((form) => ({ ...form, role: event.target.value }))}
              placeholder="Product Manager"
            />
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Department</label>
              <select
                value={onboardingForm.department}
                onChange={(event) => setOnboardingForm((form) => ({ ...form, department: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Engineering</option>
                <option>Marketing</option>
                <option>Sales</option>
                <option>HR</option>
                <option>Finance</option>
              </select>
            </div>
          </div>
          <Input
            label="Start Date"
            type="date"
            required
            value={onboardingForm.startDate}
            onChange={(event) => setOnboardingForm((form) => ({ ...form, startDate: event.target.value }))}
          />
        </form>
      </Modal>
    </div>
  );
}
