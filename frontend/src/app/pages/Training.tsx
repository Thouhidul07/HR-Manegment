import { Play, Clock, Users, Award, BookOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

type Course = {
  id: number;
  title: string;
  category: string;
  duration: string;
  enrolled: number;
  completed: number;
  progress: number;
  instructor: string;
  level: string;
};

type MyTraining = {
  id: number;
  course: string;
  progress: number;
  dueDate: string;
  status: string;
};

type TrainingForm = {
  title: string;
  description: string;
  trainer: string;
  startsAt: string;
  endsAt: string;
};

const getDefaultTrainingForm = (): TrainingForm => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return {
    title: "",
    description: "",
    trainer: "HR Team",
    startsAt: now.toISOString().slice(0, 16),
    endsAt: endsAt.toISOString().slice(0, 16),
  };
};

const fallbackCourses = [
  {
    id: 1,
    title: "Leadership & Management Fundamentals",
    category: "Leadership",
    duration: "8 hours",
    enrolled: 4,
    completed: 2,
    progress: 50,
    instructor: "Farhana Akter",
    level: "Intermediate",
  },
  {
    id: 2,
    title: "Advanced JavaScript & React",
    category: "Technical",
    duration: "12 hours",
    enrolled: 3,
    completed: 1,
    progress: 33,
    instructor: "Tanvir Hasan",
    level: "Advanced",
  },
  {
    id: 3,
    title: "Effective Communication Skills",
    category: "Soft Skills",
    duration: "6 hours",
    enrolled: 5,
    completed: 4,
    progress: 80,
    instructor: "Nusrat Jahan",
    level: "Beginner",
  },
  {
    id: 4,
    title: "Data Analysis with Python",
    category: "Technical",
    duration: "10 hours",
    enrolled: 2,
    completed: 1,
    progress: 50,
    instructor: "Mehedi Hasan",
    level: "Intermediate",
  },
];

const fallbackMyTrainings = [
  {
    id: 1,
    course: "Leadership Fundamentals",
    progress: 75,
    dueDate: "Apr 15, 2026",
    status: "In Progress",
  },
  {
    id: 2,
    course: "Time Management",
    progress: 100,
    dueDate: "Mar 28, 2026",
    status: "Completed",
  },
  {
    id: 3,
    course: "Conflict Resolution",
    progress: 40,
    dueDate: "Apr 20, 2026",
    status: "In Progress",
  },
];

const upcomingSchedule = [
  {
    id: 1,
    title: "Employee Service Workflow Workshop",
    date: "Apr 8, 2026",
    time: "10:00 AM",
    type: "Workshop",
  },
  {
    id: 2,
    title: "Safety & Compliance",
    date: "Apr 12, 2026",
    time: "2:00 PM",
    type: "Mandatory",
  },
  {
    id: 3,
    title: "Team Building Session",
    date: "Apr 18, 2026",
    time: "3:00 PM",
    type: "Workshop",
  },
];

export function Training() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>(fallbackCourses);
  const [myTrainings, setMyTrainings] =
    useState<MyTraining[]>(fallbackMyTrainings);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [trainingForm, setTrainingForm] = useState<TrainingForm>(
    getDefaultTrainingForm(),
  );
  const [savingTraining, setSavingTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState("");
  const [trainingError, setTrainingError] = useState("");
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isHRManager = user?.role === "hr_manager";
  const canManageTraining = isAdmin || isHRManager;
  const canUseTrainingSelfService = isEmployee && !isAdmin;
  const pageTitle = canManageTraining
    ? "Training & Development"
    : "My Training";
  const pageSubtitle = canManageTraining
    ? "Manage employee training programs and schedules"
    : "View available trainings and track your progress";

  const mapSessionToCourse = useCallback(
    (session: any): Course => ({
      id: session.id,
      title: session.title,
      category: "Training",
      duration: session.endsAt ? "Scheduled" : "Self-paced",
      enrolled: session.enrolled || 0,
      completed: session.completed || 0,
      progress: session.enrolled
        ? Math.round(((session.completed || 0) / session.enrolled) * 100)
        : 0,
      instructor: session.trainer || "HR Team",
      level: "Intermediate",
    }),
    [],
  );

  const loadTraining = useCallback(async () => {
    const response = await api.get("/training");

    if (response.data.sessions?.length) {
      setCourses(response.data.sessions.map(mapSessionToCourse));
    }

    if (response.data.enrollments?.length) {
      setMyTrainings(response.data.enrollments);
    }
  }, [mapSessionToCourse]);

  useEffect(() => {
    loadTraining().catch(() => {});
  }, [loadTraining]);

  const filteredCourses =
    activeCategory === "All Categories"
      ? courses
      : courses.filter((course) => course.category === activeCategory);
  const totalLearners = courses.reduce(
    (total, course) => total + course.enrolled,
    0,
  );
  const totalCertifications = courses.reduce(
    (total, course) => total + course.completed,
    0,
  );

  const showTrainingFeedback = (message: string, isError = false) => {
    if (isError) {
      setTrainingError(message);
      setTrainingMessage("");
    } else {
      setTrainingMessage(message);
      setTrainingError("");
    }

    window.setTimeout(() => {
      setTrainingMessage("");
      setTrainingError("");
    }, 3000);
  };

  const getApiErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;

  const openCreateTrainingModal = () => {
    setTrainingForm(getDefaultTrainingForm());
    setTrainingError("");
    setIsCreateModalOpen(true);
  };

  const closeCreateTrainingModal = () => {
    if (savingTraining) return;
    setIsCreateModalOpen(false);
  };

  const handleTrainingFormChange = (
    field: keyof TrainingForm,
    value: string,
  ) => {
    setTrainingForm((form) => ({ ...form, [field]: value }));
  };

  const handleCreateTraining = async () => {
    if (!canManageTraining) return;

    if (!trainingForm.title.trim()) {
      setTrainingError("Training title is required.");
      return;
    }

    if (!trainingForm.startsAt) {
      setTrainingError("Start date and time is required.");
      return;
    }

    if (
      trainingForm.endsAt &&
      new Date(trainingForm.endsAt).getTime() <=
        new Date(trainingForm.startsAt).getTime()
    ) {
      setTrainingError("End date and time must be after the start time.");
      return;
    }

    setSavingTraining(true);
    setTrainingError("");

    try {
      await api.post("/training", {
        title: trainingForm.title.trim(),
        description: trainingForm.description.trim(),
        trainer: trainingForm.trainer.trim(),
        startsAt: trainingForm.startsAt,
        endsAt: trainingForm.endsAt || null,
      });

      await loadTraining();
      setIsCreateModalOpen(false);
      setTrainingForm(getDefaultTrainingForm());
      showTrainingFeedback("Training created successfully.");
    } catch (error) {
      setTrainingError(
        getApiErrorMessage(error, "Unable to create training right now."),
      );
    } finally {
      setSavingTraining(false);
    }
  };

  const handleContinueLearning = async (training: MyTraining) => {
    if (!canUseTrainingSelfService) return;

    try {
      const nextProgress = Math.min(100, Number(training.progress || 0) + 10);
      const response = await api.patch(
        `/training/enrollments/${training.id}/progress`,
        {
          progress: nextProgress,
        },
      );

      setMyTrainings((currentTrainings) =>
        currentTrainings.map((item) =>
          item.id === training.id ? response.data.enrollment : item,
        ),
      );
    } catch (error) {
      showTrainingFeedback(
        getApiErrorMessage(error, "Unable to update training progress."),
        true,
      );
    }
  };

  const handleStartCourse = async (course: Course) => {
    if (!canUseTrainingSelfService) return;

    try {
      const response = await api.post(`/training/${course.id}/enroll`);
      const enrollment = response.data.enrollment;

      setMyTrainings((currentTrainings) => {
        const exists = currentTrainings.some(
          (item) => item.id === enrollment.id,
        );
        return exists
          ? currentTrainings.map((item) =>
              item.id === enrollment.id ? enrollment : item,
            )
          : [enrollment, ...currentTrainings];
      });
      await loadTraining();
      showTrainingFeedback("Training enrollment started.");
    } catch (error) {
      showTrainingFeedback(
        getApiErrorMessage(error, "Unable to start this training."),
        true,
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
        </div>
        {canManageTraining && (
          <Button variant="primary" onClick={openCreateTrainingModal}>
            Create Training
          </Button>
        )}
      </div>

      {trainingMessage && (
        <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          {trainingMessage}
        </div>
      )}

      {trainingError && !isCreateModalOpen && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {trainingError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <BookOpen className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </div>
          <p className="text-2xl text-foreground">{courses.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Users className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Active Learners</p>
          </div>
          <p className="text-2xl text-foreground">{totalLearners}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <Award className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Certifications</p>
          </div>
          <p className="text-2xl text-foreground">{totalCertifications}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-4)]/20">
              <Clock className="w-5 h-5 text-[var(--chart-4)]" />
            </div>
            <p className="text-sm text-muted-foreground">Avg. Hours/Month</p>
          </div>
          <p className="text-2xl text-foreground">8.5</p>
        </Card>
      </div>

      {/* My Trainings & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canUseTrainingSelfService && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Current Trainings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-foreground mb-1">
                          {training.course}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Due: {training.dueDate}
                        </p>
                      </div>
                      <Badge
                        variant={
                          training.status === "Completed" ? "success" : "info"
                        }
                        size="sm"
                      >
                        {training.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">Progress</span>
                        <span className="text-muted-foreground">
                          {training.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${training.progress}%` }}
                        />
                      </div>
                    </div>
                    {training.status === "In Progress" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => handleContinueLearning(training)}
                      >
                        <Play className="w-3 h-3" />
                        Continue Learning
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Schedule */}
        <Card className={canManageTraining ? "lg:col-span-3" : ""}>
          <CardHeader>
            <CardTitle>{canManageTraining ? "Program Schedule" : "Upcoming Schedule"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedule.map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm text-foreground">{session.title}</h4>
                    <Badge variant="secondary" size="sm">
                      {session.type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.date} at {session.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{canManageTraining ? "Training Programs" : "Available Courses"}</CardTitle>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
              >
                <option>All Categories</option>
                <option>Leadership</option>
                <option>Technical</option>
                <option>Soft Skills</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2">{course.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" size="sm">
                        {course.category}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {course.level}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {course.enrolled} enrolled • {course.completed} completed
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-4 h-4" />
                    Instructor: {course.instructor}
                  </div>
                </div>

                {!canManageTraining && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Completion Rate
                      </span>
                      <span className="text-foreground">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--chart-2)] transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {canUseTrainingSelfService && (
                  <Button
                    variant="primary"
                    className="w-full gap-2"
                    onClick={() => handleStartCourse(course)}
                  >
                    <Play className="w-4 h-4" />
                    Start Course
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={canManageTraining && isCreateModalOpen}
        onClose={closeCreateTrainingModal}
        title="Create Training"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeCreateTrainingModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTraining}
              disabled={savingTraining}
            >
              {savingTraining ? "Creating..." : "Create Training"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {trainingError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {trainingError}
            </div>
          )}

          <Input
            label="Training Title"
            value={trainingForm.title}
            onChange={(event) =>
              handleTrainingFormChange("title", event.target.value)
            }
            placeholder="Employee Service Workflow Workshop"
          />

          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Description
            </label>
            <textarea
              className="w-full min-h-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={trainingForm.description}
              onChange={(event) =>
                handleTrainingFormChange("description", event.target.value)
              }
              placeholder="Briefly describe the training goals and expected outcomes."
            />
          </div>

          <Input
            label="Trainer / Instructor"
            value={trainingForm.trainer}
            onChange={(event) =>
              handleTrainingFormChange("trainer", event.target.value)
            }
            placeholder="HR Team"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={trainingForm.startsAt}
              onChange={(event) =>
                handleTrainingFormChange("startsAt", event.target.value)
              }
            />
            <Input
              label="End Date & Time"
              type="datetime-local"
              value={trainingForm.endsAt}
              onChange={(event) =>
                handleTrainingFormChange("endsAt", event.target.value)
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
