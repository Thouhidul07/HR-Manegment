import { CheckCircle2, Play, Clock, Users, Award, BookOpen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Textarea } from "../components/ui/textarea";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const courses = [
  {
    id: 1,
    title: "Leadership & Management Fundamentals",
    categories: ["Leadership", "Soft Skills"],
    duration: "8 hours",
    enrolled: 45,
    completed: 32,
    progress: 71,
    instructor: "Sarah Johnson",
    level: "Intermediate",
  },
  {
    id: 2,
    title: "Advanced JavaScript & React",
    categories: ["Technical"],
    duration: "12 hours",
    enrolled: 78,
    completed: 45,
    progress: 58,
    instructor: "Mike Chen",
    level: "Advanced",
  },
  {
    id: 3,
    title: "Effective Communication Skills",
    categories: ["Soft Skills", "Leadership"],
    duration: "6 hours",
    enrolled: 92,
    completed: 88,
    progress: 96,
    instructor: "Emily Brown",
    level: "Beginner",
  },
  {
    id: 4,
    title: "Data Analysis with Python",
    categories: ["Technical"],
    duration: "10 hours",
    enrolled: 56,
    completed: 28,
    progress: 50,
    instructor: "David Lee",
    level: "Intermediate",
  },
];

const myTrainings = [
  { id: 1, course: "Leadership Fundamentals", progress: 75, dueDate: "Apr 15, 2026", status: "In Progress" },
  { id: 2, course: "Time Management", progress: 100, dueDate: "Mar 28, 2026", status: "Completed" },
  { id: 3, course: "Conflict Resolution", progress: 40, dueDate: "Apr 20, 2026", status: "In Progress" },
];

const upcomingSchedule = [
  { id: 1, title: "Product Training Workshop", date: "Apr 8, 2026", time: "10:00 AM", type: "Workshop" },
  { id: 2, title: "Safety & Compliance", date: "Apr 12, 2026", time: "2:00 PM", type: "Mandatory" },
  { id: 3, title: "Team Building Session", date: "Apr 18, 2026", time: "3:00 PM", type: "Workshop" },
];

export function Training() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState(courses);
  const [trainingList, setTrainingList] = useState(myTrainings);
  const [scheduleList, setScheduleList] = useState(upcomingSchedule);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [trainingForm, setTrainingForm] = useState({
    title: "",
    category: "Leadership",
    level: "Beginner",
    duration: "",
    instructor: "",
    date: "",
    time: "",
    description: "",
  });

  useEffect(() => {
    let isMounted = true;

    api.get("/training")
      .then((response) => {
        if (!isMounted) return;

        if (response.data.sessions?.length) {
          setCourseList(response.data.sessions.map((session: any) => ({
            id: session.id,
            title: session.title,
            categories: ["General"],
            duration: "8 hours",
            enrolled: session.enrolled,
            completed: session.completed,
            progress: session.enrolled ? Math.round((session.completed / session.enrolled) * 100) : 0,
            instructor: session.trainer,
            level: "Intermediate",
          })));
          setScheduleList(response.data.sessions.map((session: any) => ({
            id: session.id,
            title: session.title,
            date: formatDisplayDate(String(session.startsAt).slice(0, 10)),
            time: formatDisplayTime(String(session.startsAt).slice(11, 16) || "09:00"),
            type: "Training",
          })));
        }

        if (response.data.enrollments?.length) {
          setTrainingList(response.data.enrollments.map((enrollment: any) => ({
            id: enrollment.id,
            course: enrollment.course,
            progress: enrollment.progress,
            dueDate: formatDisplayDate(String(enrollment.dueDate).slice(0, 10)),
            status: enrollment.status,
          })));
        }
      })
      .catch(() => {
        // Keep demo training content available when the API/database is not ready.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showFloatingMessage = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 2200);
  };

  const resetTrainingForm = () => {
    setTrainingForm({
      title: "",
      category: "Leadership",
      level: "Beginner",
      duration: "",
      instructor: "",
      date: "",
      time: "",
      description: "",
    });
  };

  const formatDisplayDate = (dateValue: string) =>
    new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatDisplayTime = (timeValue: string) =>
    new Date(`2026-01-01T${timeValue}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const handleCreateTraining = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startsAt = `${trainingForm.date}T${trainingForm.time}:00`;
    const response = await api.post("/training", {
      title: trainingForm.title,
      description: trainingForm.description,
      trainer: trainingForm.instructor,
      startsAt,
    });
    const session = response.data.session;

    setCourseList((currentCourses) => [
      {
        id: session.id,
        title: session.title,
        categories: [trainingForm.category],
        duration: `${trainingForm.duration} hours`,
        enrolled: 0,
        completed: 0,
        progress: 0,
        instructor: session.trainer,
        level: trainingForm.level,
      },
      ...currentCourses,
    ]);

    setScheduleList((currentSchedule) => [
      {
        id: session.id,
        title: session.title,
        date: formatDisplayDate(trainingForm.date),
        time: formatDisplayTime(trainingForm.time),
        type: trainingForm.category === "Technical" ? "Workshop" : trainingForm.category,
      },
      ...currentSchedule,
    ]);

    resetTrainingForm();
    setIsCreateModalOpen(false);
    showFloatingMessage("Training created");
  };

  const handleContinueLearning = async (trainingId: number) => {
    const currentTraining = trainingList.find((training) => training.id === trainingId);
    const nextProgress = Math.min(100, (currentTraining?.progress || 0) + 10);
    const response = await api.patch(`/training/enrollments/${trainingId}/progress`, {
      progress: nextProgress,
    });
    const updatedEnrollment = response.data.enrollment;

    setTrainingList((currentTrainings) =>
      currentTrainings.map((training) => {
        if (training.id !== trainingId || training.status === "Completed") return training;
        return {
          ...training,
          progress: updatedEnrollment.progress,
          status: updatedEnrollment.status,
        };
      })
    );
    showFloatingMessage("Learning progress updated");
  };

  const handleStartCourse = async (course: (typeof courses)[number]) => {
    const response = await api.post(`/training/${course.id}/enroll`);
    const enrollment = response.data.enrollment;

    setCourseList((currentCourses) =>
      currentCourses.map((item) =>
        item.id === course.id ? { ...item, enrolled: item.enrolled + 1 } : item
      )
    );
    setTrainingList((currentTrainings) => {
      const alreadyStarted = currentTrainings.some((training) => training.course === course.title);
      if (alreadyStarted) return currentTrainings;

      return [
        {
          id: enrollment.id,
          course: enrollment.course,
          progress: enrollment.progress,
          dueDate: "Jun 30, 2026",
          status: enrollment.status,
        },
        ...currentTrainings,
      ];
    });
    showFloatingMessage("Course started");
  };
  const handleDeleteTraining = async (courseId: number) => {
    await api.delete(`/training/${courseId}`);
    setCourseList((currentCourses) => currentCourses.filter((course) => course.id !== courseId));
    setScheduleList((currentSchedule) => currentSchedule.filter((session) => session.id !== courseId));
    showFloatingMessage("Training deleted");
  };
  const canManageTraining = user?.role === "admin" || user?.role === "hr_manager";
  const visibleCourses = activeCategory === "All Categories"
    ? courseList
    : courseList.filter((course) => course.categories.includes(activeCategory));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Training & Development</h1>
          <p className="text-muted-foreground">Manage employee training programs and track progress</p>
        </div>
        {canManageTraining && <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create Training</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <BookOpen className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </div>
          <p className="text-2xl text-foreground">{48 + courseList.length - courses.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Users className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Active Learners</p>
          </div>
          <p className="text-2xl text-foreground">342</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <Award className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Certifications</p>
          </div>
          <p className="text-2xl text-foreground">156</p>
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
        {/* My Current Trainings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Current Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingList.map((training) => (
                <div
                  key={training.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-foreground mb-1">{training.course}</h3>
                      <p className="text-sm text-muted-foreground">Due: {training.dueDate}</p>
                    </div>
                    <Badge
                      variant={training.status === "Completed" ? "success" : "info"}
                      size="sm"
                    >
                      {training.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">Progress</span>
                      <span className="text-muted-foreground">{training.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${training.progress}%` }}
                      />
                    </div>
                  </div>
                  {training.status === "In Progress" && (
                    <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => handleContinueLearning(training.id)}>
                      <Play className="w-3 h-3" />
                      Continue Learning
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduleList.map((session) => (
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
            <CardTitle>Available Courses</CardTitle>
            <div className="flex gap-2">
              <select
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option>All Categories</option>
                <option>Leadership</option>
                <option>Technical</option>
                <option>Soft Skills</option>
                <option>Mandatory</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-foreground mb-2">{course.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.categories.map((category) => (
                        <Badge key={category} variant="secondary" size="sm">
                          {category}
                        </Badge>
                      ))}
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

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="text-foreground">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--chart-2)] transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="primary" className="flex-1 gap-2" onClick={() => handleStartCourse(course)}>
                    <Play className="w-4 h-4" />
                    Start Course
                  </Button>
                  {canManageTraining && (
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleDeleteTraining(course.id)}
                      aria-label="Delete training"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {visibleCourses.length === 0 && (
              <div className="lg:col-span-2 rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                No courses found for {activeCategory}.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="relative overflow-hidden rounded-2xl bg-card border border-[#543884]/20 px-8 py-6 shadow-2xl text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#543884] via-[#EC4176] to-[#FFA45E]" />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-foreground">{successMessage}</p>
            <p className="mt-1 text-sm text-muted-foreground">Your training dashboard has been updated.</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Training"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-training-form" variant="primary">
              Create Training
            </Button>
          </>
        }
      >
        <form id="create-training-form" onSubmit={handleCreateTraining} className="space-y-4">
          <Input
            label="Training Title"
            required
            value={trainingForm.title}
            onChange={(event) => setTrainingForm((form) => ({ ...form, title: event.target.value }))}
            placeholder="Workplace Safety Essentials"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Category</label>
              <select
                value={trainingForm.category}
                onChange={(event) => setTrainingForm((form) => ({ ...form, category: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Leadership</option>
                <option>Technical</option>
                <option>Soft Skills</option>
                <option>Mandatory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-foreground">Level</label>
              <select
                value={trainingForm.level}
                onChange={(event) => setTrainingForm((form) => ({ ...form, level: event.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Duration"
              type="number"
              min="1"
              required
              value={trainingForm.duration}
              onChange={(event) => setTrainingForm((form) => ({ ...form, duration: event.target.value }))}
              placeholder="8"
            />
            <Input
              label="Instructor"
              required
              value={trainingForm.instructor}
              onChange={(event) => setTrainingForm((form) => ({ ...form, instructor: event.target.value }))}
              placeholder="Sarah Johnson"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Schedule Date"
              type="date"
              required
              value={trainingForm.date}
              onChange={(event) => setTrainingForm((form) => ({ ...form, date: event.target.value }))}
            />
            <Input
              label="Schedule Time"
              type="time"
              required
              value={trainingForm.time}
              onChange={(event) => setTrainingForm((form) => ({ ...form, time: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-foreground">Description</label>
            <Textarea
              required
              value={trainingForm.description}
              onChange={(event) => setTrainingForm((form) => ({ ...form, description: event.target.value }))}
              placeholder="Briefly describe what employees will learn"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
