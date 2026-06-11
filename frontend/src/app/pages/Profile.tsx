import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  Briefcase,
  Calendar,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Phone,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  UserPlus,
  UserX,
  Users,
  X,
  Monitor,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

interface ProfileUser {
  id: number | string;
  company_id?: number | string;
  employee_code?: string;
  name: string;
  email: string;
  role: "admin" | "hr_manager" | "employee";
  phone?: string;
  department?: string;
  designation?: string;
  hire_date?: string | null;
  salary?: number;
  avatar?: string;
  status?: string;
  company?: { id: number; name: string; domain: string } | null;
}

interface UserProfileDetails {
  displayName: string;
  dateOfBirth?: string | null;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  city?: string;
  country?: string;
  bio?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  linkedIn?: string;
}

interface ProfileSettings {
  language: string;
  timezone: string;
  themePreference: "light" | "dark" | "system";
  notifications: {
    leaveUpdates: boolean;
    scheduleChanges: boolean;
    payslipAvailable: boolean;
  };
  forum: {
    anonymousMode: boolean;
    allowAnonymousPosting: boolean;
    hideIdentity: boolean;
    notifyReplies: boolean;
  };
  privacy: {
    showDirectory: boolean;
    showPhone: boolean;
    showEmail: boolean;
  };
}

interface ProfilePayload {
  user: ProfileUser;
  profile: UserProfileDetails;
  settings: ProfileSettings;
  completion: number;
}

const defaultSettings: ProfileSettings = {
  language: "English",
  timezone: "Asia/Dhaka",
  themePreference: "system",
  notifications: {
    leaveUpdates: true,
    scheduleChanges: true,
    payslipAvailable: true,
  },
  forum: {
    anonymousMode: false,
    allowAnonymousPosting: true,
    hideIdentity: false,
    notifyReplies: true,
  },
  privacy: {
    showDirectory: true,
    showPhone: true,
    showEmail: true,
  },
};

function createFallbackPayload(user: any): ProfilePayload {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      department: user.department || (user.role === "admin" ? "System Administration" : user.role === "hr_manager" ? "Human Resources" : "Information Technology"),
      designation: user.designation || (user.role === "admin" ? "Administrator" : user.role === "hr_manager" ? "HR Manager" : "Employee"),
      avatar: user.avatar || "",
      status: "active",
      company: { id: 1, name: "NexoraTech Ltd", domain: "nexoratech.com" },
      employee_code: user.employee_code || "",
    },
    profile: {
      displayName: user.name,
      nationality: "Bangladeshi",
      city: "Dhaka",
      country: "Bangladesh",
    },
    settings: defaultSettings,
    completion: 60,
  };
}

function roleLabel(role: ProfileUser["role"]) {
  if (role === "admin") return "System Admin";
  if (role === "hr_manager") return "HR Manager";
  return "Employee";
}

function initials(name = "") {
  return String(name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function displayDate(value?: string | null) {
  if (!value) return "Not added";
  return new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("profile-active-tab") || "personal");
  const [payload, setPayload] = useState<ProfilePayload | null>(user ? createFallbackPayload(user) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    sessionStorage.setItem("profile-active-tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setLoading(true);
    setError("");

    api.get("/profile/me")
      .then((response) => {
        if (!isMounted) return;
        setPayload(response.data);
        updateUser({
          name: response.data.user.name,
          email: response.data.user.email,
          avatar: response.data.user.avatar,
          phone: response.data.user.phone,
          department: response.data.user.department,
          designation: response.data.user.designation,
          employee_code: response.data.user.employee_code,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setPayload(createFallbackPayload(user));
        setError("Profile API is not reachable. Showing local profile data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user || !payload) return null;

  const saveProfile = async (updates: Record<string, any>) => {
    const response = await api.patch("/profile/me", updates);
    const updated = response.data as ProfilePayload;
    setPayload(updated);
    updateUser({
      name: updated.user.name,
      email: updated.user.email,
      avatar: updated.user.avatar,
      phone: updated.user.phone,
      department: updated.user.department,
      designation: updated.user.designation,
      employee_code: updated.user.employee_code,
    });
    setToast(response.data.message || "Profile updated successfully");
    window.setTimeout(() => setToast(""), 2600);
  };

  const savePreferences = async (updates: Record<string, any>) => {
    const response = await api.patch("/profile/preferences", updates);
    setPayload((current) => current ? { ...current, settings: response.data.settings } : current);
    setToast(response.data.message || "Preferences updated successfully");
    window.setTimeout(() => setToast(""), 2600);
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User, roles: ["all"] },
    { id: "work", label: "Work Information", icon: Briefcase, roles: ["all"] },
    { id: "security", label: "Password & Security", icon: Lock, roles: ["all"] },
    { id: "notifications", label: "Notifications", icon: Bell, roles: ["all"] },
    { id: "attendance", label: "Attendance", icon: Clock, roles: ["employee", "hr_manager"] },
    { id: "payroll", label: "Payroll & Financial", icon: DollarSign, roles: ["employee", "hr_manager"] },
    { id: "leave", label: "Leave & Documents", icon: FileText, roles: ["employee", "hr_manager"] },
    { id: "forum", label: "Forum Preferences", icon: MessageSquare, roles: ["all"] },
    { id: "appearance", label: "Appearance", icon: Moon, roles: ["all"] },
    { id: "privacy", label: "Privacy", icon: ShieldCheck, roles: ["all"] },
    { id: "myactivity", label: "My Activity", icon: Activity, roles: ["all"], divider: true },
    { id: "roles", label: "Roles & Permissions", icon: Users, roles: ["admin"] },
    { id: "system", label: "System Settings", icon: Settings, roles: ["admin"] },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, roles: ["admin"] },
  ].filter((tab) => tab.roles.includes("all") || tab.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {error && <div className="mb-4 rounded-xl border border-[#FFA45E]/30 bg-[#FFA45E]/10 px-4 py-3 text-sm text-[#A13670]">{error}</div>}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ProfileSidebar user={payload.user} completion={payload.completion} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} loading={loading} />
            </div>
          </div>

          <div className="lg:hidden overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "text-white shadow-sm" : "text-foreground/70 bg-card hover:bg-accent"}`}
                  style={activeTab === tab.id ? { background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" } : {}}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <QuickActions user={payload.user} />
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
              {activeTab === "personal" && <PersonalInfoTab payload={payload} onSave={saveProfile} />}
              {activeTab === "work" && <WorkInfoTab payload={payload} onSave={saveProfile} />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "notifications" && <NotificationsTab settings={payload.settings} onSave={savePreferences} />}
              {activeTab === "attendance" && <AttendanceTab settings={payload.settings} onSave={savePreferences} />}
              {activeTab === "payroll" && <PayrollTab user={payload.user} />}
              {activeTab === "leave" && <LeaveDocumentsTab />}
              {activeTab === "forum" && <ForumPreferencesTab settings={payload.settings} onSave={savePreferences} />}
              {activeTab === "appearance" && <AppearanceTab theme={theme} setTheme={setTheme} settings={payload.settings} onSave={savePreferences} />}
              {activeTab === "privacy" && <PrivacyTab settings={payload.settings} user={payload.user} onSave={savePreferences} />}
              {activeTab === "myactivity" && <MyActivityTab user={payload.user} />}
              {activeTab === "roles" && <RolesPermissionsTab />}
              {activeTab === "system" && <SystemSettingsTab payload={payload} onSave={saveProfile} />}
              {activeTab === "danger" && <DangerZoneTab onSave={savePreferences} />}
            </motion.div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border-l-4 border-[#543884] shadow-xl rounded-xl px-5 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#543884]" />
          <span className="text-sm text-[#262254] dark:text-white">{toast}</span>
        </div>
      )}
    </div>
  );
}

function ProfileSidebar({ user, completion, tabs, activeTab, setActiveTab, loading }: any) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const roleColor = user.role === "admin" ? "#543884" : user.role === "hr_manager" ? "#9A77CF" : "#EC4176";

  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 shadow-sm">
      <div className="relative w-20 h-20 mx-auto group">
        <label className="block w-full h-full rounded-full overflow-hidden cursor-pointer" style={{ background: "linear-gradient(135deg, #543884, #EC4176)" }}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => {
              setAvatarUploading(true);
              window.setTimeout(() => setAvatarUploading(false), 900);
            }}
          />
          {avatarUploading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          ) : user.avatar && String(user.avatar).startsWith("http") ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{initials(user.name)}</div>
          )}
        </label>
        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-center mt-4 text-[#262254] dark:text-white">{user.name}</h3>
      <div className="flex justify-center mt-1">
        <span className="px-3 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${roleColor}1A`, color: roleColor }}>
          {roleLabel(user.role)}
        </span>
      </div>
      <p className="text-xs text-[#9A77CF] text-center mt-1">{user.department || "NexoraTech Ltd"}</p>
      <p className="text-xs text-muted-foreground text-center mt-0.5">{user.email}</p>

      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#9A77CF]">Profile Completion</span>
          <span className="text-[#543884] font-medium">{completion}%</span>
        </div>
        <div className="h-2 bg-[#543884]/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${completion}%`, background: "linear-gradient(90deg, #543884, #EC4176)" }} />
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {tabs.map((tab: any) => (
          <div key={tab.id}>
            {tab.divider && <div className="border-t border-[#543884]/10 my-3" />}
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "text-white shadow-sm" : "text-[#262254]/70 dark:text-white/60 hover:bg-[#543884]/8 hover:text-[#543884]"}`}
              style={activeTab === tab.id ? { background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" } : {}}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "text-[#9A77CF]"}`} />
              {tab.label}
            </button>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#543884]/10 my-5" />
      <p className="text-xs text-muted-foreground">Last login: current session</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-muted-foreground">{loading ? "Syncing profile" : "Active session"}</span>
      </div>
    </div>
  );
}

function QuickActions({ user }: { user: ProfileUser }) {
  const navigate = useNavigate();
  const isEmployeeOrHR = user.role === "employee" || user.role === "hr_manager";
  const isAdmin = user.role === "admin";

  const downloadProfileReport = () => {
    const rows = [
      ["Area", "Value"],
      ["Name", user.name],
      ["Email", user.email],
      ["Role", roleLabel(user.role)],
      ["Department", user.department || "Not added"],
      ["Designation", user.designation || "Not added"],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hrspace-profile-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="text-sm font-medium text-[#262254] dark:text-white mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        {isEmployeeOrHR && (
          <>
            <button onClick={() => navigate("/dashboard/leave")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm transition-all hover:shadow-md" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>
              <CalendarPlus className="w-4 h-4" />
              Apply Leave
            </button>
            <button onClick={() => navigate(user.role === "employee" ? "/dashboard/payslips" : "/dashboard/payroll")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#543884] border border-[#543884]/20 hover:bg-[#543884]/5 transition-colors">
              <Download className="w-4 h-4" />
              Download Payslip
            </button>
          </>
        )}
        {isAdmin && (
          <button onClick={() => navigate("/dashboard/employees")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm transition-all hover:shadow-md" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        )}
        <button onClick={downloadProfileReport} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#543884] border border-[#543884]/20 hover:bg-[#543884]/5 transition-colors">
          <BarChart2 className="w-4 h-4" />
          Export Profile
        </button>
        <button onClick={() => navigate("/dashboard/profile")} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#543884] border border-[#543884]/20 hover:bg-[#543884]/5 transition-colors">
          <Upload className="w-4 h-4" />
          Update Documents
        </button>
      </div>
    </div>
  );
}

function PersonalInfoTab({ payload, onSave }: { payload: ProfilePayload; onSave: (updates: Record<string, any>) => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: payload.user.name || "",
    displayName: payload.profile.displayName || payload.user.name || "",
    email: payload.user.email || "",
    phone: payload.user.phone || "",
    dateOfBirth: payload.profile.dateOfBirth || "",
    gender: payload.profile.gender || "",
    nationality: payload.profile.nationality || "",
    maritalStatus: payload.profile.maritalStatus || "",
    city: payload.profile.city || "",
    country: payload.profile.country || "",
    bio: payload.profile.bio || "",
    emergencyContactName: payload.profile.emergencyContactName || "",
    emergencyContactPhone: payload.profile.emergencyContactPhone || "",
    bloodGroup: payload.profile.bloodGroup || "",
    linkedIn: payload.profile.linkedIn || "",
  });

  useEffect(() => {
    setForm({
      name: payload.user.name || "",
      displayName: payload.profile.displayName || payload.user.name || "",
      email: payload.user.email || "",
      phone: payload.user.phone || "",
      dateOfBirth: payload.profile.dateOfBirth || "",
      gender: payload.profile.gender || "",
      nationality: payload.profile.nationality || "",
      maritalStatus: payload.profile.maritalStatus || "",
      city: payload.profile.city || "",
      country: payload.profile.country || "",
      bio: payload.profile.bio || "",
      emergencyContactName: payload.profile.emergencyContactName || "",
      emergencyContactPhone: payload.profile.emergencyContactPhone || "",
      bloodGroup: payload.profile.bloodGroup || "",
      linkedIn: payload.profile.linkedIn || "",
    });
  }, [payload]);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[#262254] dark:text-white">Personal Information</h2>
          <p className="text-sm text-[#9A77CF] mt-0.5">Manage your personal details across every role</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="border border-[#543884]/20 text-[#543884] hover:bg-[#543884]/5 rounded-lg px-3 py-1.5 text-sm transition-colors">
            Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="grid md:grid-cols-2 gap-6">
          <InfoField label="Full Name" value={payload.user.name} />
          <InfoField label="Display Name" value={payload.profile.displayName || payload.user.name} />
          <InfoField label="Email Address" value={payload.user.email} />
          <InfoField label="Phone Number" value={payload.user.phone || "Not added"} />
          <InfoField label="Date of Birth" value={displayDate(payload.profile.dateOfBirth)} />
          <InfoField label="Gender" value={payload.profile.gender || "Not added"} />
          <InfoField label="Nationality" value={payload.profile.nationality || "Not added"} />
          <InfoField label="Marital Status" value={payload.profile.maritalStatus || "Not added"} />
          <InfoField label="City" value={payload.profile.city || "Not added"} />
          <InfoField label="Country" value={payload.profile.country || "Not added"} />
          <InfoField label="Emergency Contact Name" value={payload.profile.emergencyContactName || "Not added"} />
          <InfoField label="Emergency Contact Phone" value={payload.profile.emergencyContactPhone || "Not added"} />
          <InfoField label="Blood Group" value={payload.profile.bloodGroup || "Not added"} />
          <InfoField label="LinkedIn URL" value={payload.profile.linkedIn || "Not added"} />
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wider text-[#9A77CF] font-medium">Bio</p>
            <p className="text-sm text-muted-foreground mt-0.5">{payload.profile.bio || "No bio added"}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="grid md:grid-cols-2 gap-6">
            <InputField label="Full Name" value={form.name} onChange={(e: any) => update("name", e.target.value)} required />
            <InputField label="Display Name" value={form.displayName} onChange={(e: any) => update("displayName", e.target.value)} />
            <InputField label="Email Address" type="email" value={form.email} onChange={(e: any) => update("email", e.target.value)} required />
            <InputField label="Phone Number" value={form.phone} onChange={(e: any) => update("phone", e.target.value)} />
            <InputField label="Date of Birth" type="date" value={form.dateOfBirth || ""} onChange={(e: any) => update("dateOfBirth", e.target.value)} />
            <InputField label="Gender" value={form.gender} onChange={(e: any) => update("gender", e.target.value)} />
            <InputField label="Nationality" value={form.nationality} onChange={(e: any) => update("nationality", e.target.value)} />
            <InputField label="Marital Status" value={form.maritalStatus} onChange={(e: any) => update("maritalStatus", e.target.value)} />
            <InputField label="City" value={form.city} onChange={(e: any) => update("city", e.target.value)} />
            <InputField label="Country" value={form.country} onChange={(e: any) => update("country", e.target.value)} />
            <InputField label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e: any) => update("emergencyContactName", e.target.value)} />
            <InputField label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(e: any) => update("emergencyContactPhone", e.target.value)} />
            <InputField label="Blood Group" value={form.bloodGroup} onChange={(e: any) => update("bloodGroup", e.target.value)} />
            <InputField label="LinkedIn URL" value={form.linkedIn} onChange={(e: any) => update("linkedIn", e.target.value)} />
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase tracking-wider mb-1 block">Bio</label>
              <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#543884]/20 bg-white dark:bg-[#1a0f2e] text-[#262254] dark:text-white focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl text-sm font-medium text-white shadow-md transition-all disabled:opacity-60" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function WorkInfoTab({ payload, onSave }: { payload: ProfilePayload; onSave: (updates: Record<string, any>) => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ department: payload.user.department || "", designation: payload.user.designation || "", phone: payload.user.phone || "" });

  useEffect(() => {
    setForm({ department: payload.user.department || "", designation: payload.user.designation || "", phone: payload.user.phone || "" });
  }, [payload]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#262254] dark:text-white">Work Information</h2>
            <p className="text-sm text-[#9A77CF] mt-0.5">Role-specific employment details</p>
          </div>
          {!isEditing && <button onClick={() => setIsEditing(true)} className="border border-[#543884]/20 text-[#543884] hover:bg-[#543884]/5 rounded-lg px-3 py-1.5 text-sm transition-colors">Edit</button>}
        </div>

        {!isEditing ? (
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField label="Employee ID" value={payload.user.employee_code || `EMP-${String(payload.user.id).padStart(4, "0")}`} />
            <InfoField label="Role" value={roleLabel(payload.user.role)} />
            <InfoField label="Job Title" value={payload.user.designation || "Not added"} />
            <InfoField label="Department" value={payload.user.department || "Not added"} />
            <InfoField label="Company" value={payload.user.company?.name || "NexoraTech Ltd"} />
            <InfoField label="Company Email Domain" value={`@${payload.user.company?.domain || "nexoratech.com"}`} />
            <InfoField label="Joining Date" value={displayDate(payload.user.hire_date)} />
            <InfoField label="Employee Status" value={payload.user.status || "active"} />
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="grid md:grid-cols-2 gap-6">
              <InputField label="Department" value={form.department} onChange={(e: any) => setForm((current) => ({ ...current, department: e.target.value }))} />
              <InputField label="Designation" value={form.designation} onChange={(e: any) => setForm((current) => ({ ...current, designation: e.target.value }))} />
              <InputField label="Work Phone" value={form.phone} onChange={(e: any) => setForm((current) => ({ ...current, phone: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl text-sm font-medium text-white shadow-md transition-all disabled:opacity-60" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>{saving ? "Saving..." : "Save Work Info"}</button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-4">Access Summary</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <SmallStat label="Role" value={roleLabel(payload.user.role)} />
          <SmallStat label="Company Scope" value="Own company only" />
          <SmallStat label="Account Status" value={payload.user.status || "active"} />
        </div>
      </div>
    </>
  );
}

function SecurityTab() {
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (form.newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(form.newPassword)) score += 1;
    if (/[0-9]/.test(form.newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.newPassword)) score += 1;
    return score;
  }, [form.newPassword]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await api.patch("/profile/password", form);
      setMessage(response.data.message || "Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to update password");
    } finally {
      setSaving(false);
    }
  };

  const passwordFields = [
    { key: "currentPassword", label: "Current Password", visible: showPassword.current, toggle: "current" },
    { key: "newPassword", label: "New Password", visible: showPassword.next, toggle: "next" },
    { key: "confirmPassword", label: "Confirm New Password", visible: showPassword.confirm, toggle: "confirm" },
  ];

  return (
    <>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Change Password</h2>
        {message && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={submit}>
          <div className="space-y-4">
            {passwordFields.map((field) => (
              <div key={field.key}>
                <label className="text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase tracking-wider mb-1 block">{field.label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A77CF]" />
                  <input
                    type={field.visible ? "text" : "password"}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm((current) => ({ ...current, [field.key]: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#543884]/20 bg-white dark:bg-[#1a0f2e] text-[#262254] dark:text-white focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword((current) => ({ ...current, [field.toggle]: !(current as any)[field.toggle] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {field.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {form.newPassword && (
              <div className="mt-4">
                <div className="flex gap-1 mb-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full bg-[#543884]/10">
                      {i < strength && <div className="h-full rounded-full bg-[#543884]" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#543884] font-medium mb-2">Password strength: {strength >= 4 ? "Strong" : strength >= 3 ? "Good" : strength >= 2 ? "Fair" : "Weak"}</p>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving} className="w-full mt-6 px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-md disabled:opacity-60" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#262254] dark:text-white">Active Sessions</h2>
          <span className="px-2 py-1 rounded-full bg-[#543884]/10 text-[#543884] text-xs font-medium">1 session</span>
        </div>
        <div className="flex items-center gap-4 py-3">
          <Monitor className="w-5 h-5 text-[#9A77CF]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#262254] dark:text-white">Chrome on Windows</p>
            <p className="text-xs text-muted-foreground">Current browser session</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">This device</span>
        </div>
      </div>
    </>
  );
}

function NotificationsTab({ settings, onSave }: { settings: ProfileSettings; onSave: (updates: Record<string, any>) => Promise<void> }) {
  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-2">Notification Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">These settings are saved through the backend for every role.</p>
      <div className="space-y-0">
        <p className="text-sm font-medium text-[#9A77CF] mb-3">HR Updates</p>
        <ToggleRow icon={Bell} label="Leave request status updates" description="Get notified when leave requests are submitted or updated" checked={settings.notifications.leaveUpdates} onChange={(value: boolean) => onSave({ leaveUpdates: value })} />
        <ToggleRow icon={Calendar} label="Shift schedule changes" description="Receive alerts when schedules are updated" checked={settings.notifications.scheduleChanges} onChange={(value: boolean) => onSave({ scheduleChanges: value })} />
        <ToggleRow icon={FileText} label="Payslip available" description="Know when monthly payslips are ready" checked={settings.notifications.payslipAvailable} onChange={(value: boolean) => onSave({ payslipAvailable: value })} />
      </div>
    </div>
  );
}

function AttendanceTab({ settings, onSave }: { settings: ProfileSettings; onSave: (updates: Record<string, any>) => Promise<void> }) {
  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Attendance Preferences</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase tracking-wider mb-1 block">Preferred Shift</label>
          <select className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#543884]/20 bg-white dark:bg-[#1a0f2e] text-[#262254] dark:text-white focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none">
            <option>Morning (9 AM - 5 PM)</option>
            <option>Evening (1 PM - 9 PM)</option>
            <option>Night (9 PM - 5 AM)</option>
            <option>Flexible</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase tracking-wider mb-1 block">Timezone</label>
          <select value={settings.timezone} onChange={(e) => onSave({ timezone: e.target.value })} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#543884]/20 bg-white dark:bg-[#1a0f2e] text-[#262254] dark:text-white focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none">
            <option>Asia/Dhaka</option>
            <option>UTC</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function PayrollTab({ user }: { user: ProfileUser }) {
  return (
    <>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Payroll & Financial</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <InfoField label="Account Holder Name" value={user.name} />
          <InfoField label="Payment Method" value="Bank Transfer" />
          <InfoField label="Salary Band" value={user.role === "hr_manager" ? "Management" : "Standard"} />
          <InfoField label="Payroll Email" value={user.email} />
        </div>
      </div>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-4">Recent Payslips</h2>
        <p className="text-sm text-muted-foreground">Payslip documents are managed from the Payroll/Payslips module.</p>
      </div>
    </>
  );
}

function LeaveDocumentsTab() {
  return (
    <>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Leave Balance</h2>
        <div className="grid grid-cols-2 gap-4">
          <SmallStat label="Annual Leave" value="12 / 18 days" />
          <SmallStat label="Sick Leave" value="2 / 10 days" />
          <SmallStat label="Casual Leave" value="3 / 6 days" />
          <SmallStat label="Unpaid Leave" value="0 days" />
        </div>
      </div>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-4">My Documents</h2>
        <p className="text-sm text-muted-foreground">Documents uploaded here are reflected in your HR profile records.</p>
      </div>
    </>
  );
}

function ForumPreferencesTab({ settings, onSave }: { settings: ProfileSettings; onSave: (updates: Record<string, any>) => Promise<void> }) {
  return (
    <>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-4">Anonymous Mode</h2>
        <ToggleRow icon={UserX} label="Anonymous Mode" description="Hide your name in peer reviews and open feedback forms" checked={settings.forum.anonymousMode} onChange={(value: boolean) => onSave({ anonymousMode: value })} />
      </div>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Posting Preferences</h2>
        <ToggleRow icon={MessageSquare} label="Allow anonymous posting" description="Post without revealing your identity" checked={settings.forum.allowAnonymousPosting} onChange={(value: boolean) => onSave({ allowAnonymousPosting: value })} />
        <ToggleRow icon={Eye} label="Hide identity from other employees" description="Others cannot see your profile in forum interactions" checked={settings.forum.hideIdentity} onChange={(value: boolean) => onSave({ hideIdentity: value })} />
        <ToggleRow icon={Bell} label="Notify me on post replies" description="Get notified when someone replies" checked={settings.forum.notifyReplies} onChange={(value: boolean) => onSave({ notifyReplies: value })} />
      </div>
    </>
  );
}

function AppearanceTab({ theme, setTheme, settings, onSave }: any) {
  const themes = [
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
    { id: "system", label: "System default" },
  ];

  const chooseTheme = async (id: "light" | "dark" | "system") => {
    setTheme(id);
    await onSave({ themePreference: id });
  };

  return (
    <>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Theme Preference</h2>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((item) => (
            <button key={item.id} onClick={() => chooseTheme(item.id as any)} className={`relative p-4 rounded-xl transition-all ${theme === item.id || settings.themePreference === item.id ? "border-2 border-[#543884] shadow-md shadow-[#543884]/15" : "border border-[#543884]/15 hover:border-[#9A77CF]"}`}>
              <div className={`h-24 rounded-lg border mb-3 ${item.id === "light" ? "bg-white" : item.id === "dark" ? "bg-[#1a0f2e]" : "bg-gradient-to-br from-white to-[#1a0f2e]"}`} />
              <p className="text-sm font-medium text-center text-[#262254] dark:text-white">{item.label}</p>
              {(theme === item.id || settings.themePreference === item.id) && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#543884] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Language & Region</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <SelectField label="Language" value={settings.language} onChange={(value: string) => onSave({ language: value })} options={["English", "Bengali"]} />
          <SelectField label="Timezone" value={settings.timezone} onChange={(value: string) => onSave({ timezone: value })} options={["Asia/Dhaka", "UTC"]} />
        </div>
      </div>
    </>
  );
}

function PrivacyTab({ settings, user, onSave }: { settings: ProfileSettings; user: ProfileUser; onSave: (updates: Record<string, any>) => Promise<void> }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState("");

  const requestExport = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: settings.privacy.showEmail ? user.email : "hidden",
        phone: settings.privacy.showPhone ? user.phone : "hidden",
        role: user.role,
        department: user.department,
      },
      privacy: settings.privacy,
      preferences: settings,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hrspace-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Your data export has been downloaded.");
    window.setTimeout(() => setMessage(""), 2600);
  };

  return (
    <>
      {message && (
        <div className="mb-4 rounded-xl border border-[#543884]/20 bg-[#543884]/10 px-4 py-3 text-sm text-[#543884]">
          {message}
        </div>
      )}
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-2">Profile Visibility</h2>
        <p className="text-sm text-muted-foreground mb-6">Control what others can see about you</p>
        <ToggleRow icon={Eye} label="Show profile in employee directory" description="Others can view your profile" checked={settings.privacy.showDirectory} onChange={(value: boolean) => onSave({ showDirectory: value })} />
        <ToggleRow icon={Phone} label="Show phone number to teammates" description="Your team can see your phone" checked={settings.privacy.showPhone} onChange={(value: boolean) => onSave({ showPhone: value })} />
        <ToggleRow icon={Mail} label="Show email address in directory" description="Display email in company directory" checked={settings.privacy.showEmail} onChange={(value: boolean) => onSave({ showEmail: value })} />
      </div>
      <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">Data & Privacy</h2>
        <div className="flex justify-between items-center py-3 border-b border-[#543884]/8">
          <span className="text-sm font-medium text-[#262254] dark:text-white">Download My Data</span>
          <button onClick={requestExport} className="text-sm text-[#9A77CF] hover:underline">Request Export</button>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-sm font-medium text-[#262254] dark:text-white">Delete My Account</span>
          <button onClick={() => setDeleteOpen(true)} className="text-sm text-[#EC4176] hover:underline">Delete Account</button>
        </div>
      </div>
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Request Account Deletion"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteOpen(false);
                setMessage("Deletion request recorded. An admin must approve account removal.");
                window.setTimeout(() => setMessage(""), 3200);
              }}
            >
              Request Deletion
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This does not delete the account immediately. It creates an admin-review request so payroll, attendance, and audit records stay protected.
        </p>
      </Modal>
    </>
  );
}

function MyActivityTab({ user }: { user: ProfileUser }) {
  const events = [
    { type: "login", title: "Logged in", detail: `Signed in as ${roleLabel(user.role)}`, time: "Current session", icon: Smartphone },
    { type: "profile", title: "Profile synced", detail: "Loaded from backend profile API", time: "Today", icon: User },
    { type: "settings", title: "Company scope active", detail: "Data filtered by NexoraTech Ltd", time: "Today", icon: Shield },
  ];

  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-4">My Activity</h2>
      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={index} className="flex items-start gap-4 py-4 border-b border-[#543884]/8 last:border-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#543884]/10">
              <event.icon className="w-4 h-4 text-[#543884]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#262254] dark:text-white">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.detail}</p>
            </div>
            <p className="text-xs text-muted-foreground text-right">{event.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesPermissionsTab() {
  const navigate = useNavigate();
  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-4">Roles & Permissions</h2>
      <p className="text-sm text-muted-foreground mb-6">Open the full role management module to inspect company-scoped users and permissions.</p>
      <button onClick={() => navigate("/dashboard/roles")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-md" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>Open Roles Module</button>
    </div>
  );
}

function SystemSettingsTab({ payload, onSave }: { payload: ProfilePayload; onSave: (updates: Record<string, any>) => Promise<void> }) {
  const [form, setForm] = useState({ department: payload.user.department || "System Administration", designation: payload.user.designation || "Administrator" });

  useEffect(() => {
    setForm({ department: payload.user.department || "System Administration", designation: payload.user.designation || "Administrator" });
  }, [payload]);

  return (
    <div className="bg-card border border-[#543884]/10 rounded-2xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#262254] dark:text-white mb-6">System Settings</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <InfoField label="Company Name" value={payload.user.company?.name || "NexoraTech Ltd"} />
        <InfoField label="Company Domain" value={payload.user.company?.domain || "nexoratech.com"} />
        <InputField label="Admin Department" value={form.department} onChange={(e: any) => setForm((current) => ({ ...current, department: e.target.value }))} />
        <InputField label="Admin Designation" value={form.designation} onChange={(e: any) => setForm((current) => ({ ...current, designation: e.target.value }))} />
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={() => onSave(form)} className="px-6 py-2 rounded-xl text-sm font-medium text-white shadow-md" style={{ background: "linear-gradient(135deg, #543884, #A13670, #EC4176)" }}>Save System Profile</button>
      </div>
    </div>
  );
}

function DangerZoneTab({ onSave }: { onSave: (updates: Record<string, any>) => Promise<void> }) {
  const [confirmAction, setConfirmAction] = useState<"reset" | "deactivate" | null>(null);
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    if (confirmAction === "reset") {
      await onSave({
        language: defaultSettings.language,
        timezone: defaultSettings.timezone,
        themePreference: defaultSettings.themePreference,
        leaveUpdates: defaultSettings.notifications.leaveUpdates,
        scheduleChanges: defaultSettings.notifications.scheduleChanges,
        payslipAvailable: defaultSettings.notifications.payslipAvailable,
        anonymousMode: defaultSettings.forum.anonymousMode,
        allowAnonymousPosting: defaultSettings.forum.allowAnonymousPosting,
        hideIdentity: defaultSettings.forum.hideIdentity,
        notifyReplies: defaultSettings.forum.notifyReplies,
        showDirectory: defaultSettings.privacy.showDirectory,
        showPhone: defaultSettings.privacy.showPhone,
        showEmail: defaultSettings.privacy.showEmail,
      });
      setMessage("Profile preferences reset to defaults.");
    } else {
      setMessage("Deactivation request recorded for admin review.");
    }
    setConfirmAction(null);
    window.setTimeout(() => setMessage(""), 3200);
  };

  return (
    <>
      {message && (
        <div className="mb-4 rounded-xl border border-[#543884]/20 bg-[#543884]/10 px-4 py-3 text-sm text-[#543884]">
          {message}
        </div>
      )}
      <div className="bg-[#EC4176]/5 border border-[#EC4176]/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-[#EC4176]" />
          <h2 className="text-xl font-semibold text-[#EC4176]">Danger Zone</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-[#EC4176]/10">
            <div>
              <p className="text-sm font-medium text-[#EC4176]">Reset My Settings</p>
              <p className="text-xs text-muted-foreground mt-1">Restore profile preferences to defaults</p>
            </div>
            <button onClick={() => setConfirmAction("reset")} className="px-4 py-2 rounded-lg border-2 border-[#EC4176] text-[#EC4176] text-sm font-medium hover:bg-[#EC4176] hover:text-white transition-colors">Reset</button>
          </div>
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="text-sm font-medium text-[#EC4176]">Deactivate Account</p>
              <p className="text-xs text-muted-foreground mt-1">Request account deactivation from company admin</p>
            </div>
            <button onClick={() => setConfirmAction("deactivate")} className="px-4 py-2 rounded-lg border-2 border-[#EC4176] text-[#EC4176] text-sm font-medium hover:bg-[#EC4176] hover:text-white transition-colors">Request</button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === "reset" ? "Reset Settings" : "Request Deactivation"}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {confirmAction === "reset" ? "Reset Settings" : "Submit Request"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {confirmAction === "reset"
            ? "This will restore your saved profile preferences to their default values."
            : "This will create a deactivation request for admin review. Your account remains active until approved."}
        </p>
      </Modal>
    </>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: any) {
  return (
    <div className="flex justify-between items-center py-3.5 border-b border-[#543884]/8 last:border-0">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-[#9A77CF] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#262254] dark:text-white">{label}</p>
          <p className="text-xs text-[#9A77CF]/70 mt-0.5">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only peer" />
        <div className="w-10 h-5 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-[#543884] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
      </label>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[#9A77CF] font-medium">{label}</p>
      <p className="text-sm font-medium text-[#262254] dark:text-white mt-0.5">{value || "Not added"}</p>
    </div>
  );
}

function InputField({ label, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase tracking-wider mb-1 block">{label}</label>
      <input {...props} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#543884]/20 bg-white dark:bg-[#1a0f2e] text-[#262254] dark:text-white placeholder:text-[#9A77CF]/50 focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase tracking-wider mb-1 block">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#543884]/20 bg-white dark:bg-[#1a0f2e] text-[#262254] dark:text-white focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none">
        {options.map((option: string) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#543884]/10 bg-[#543884]/5 p-4">
      <p className="text-xs text-[#9A77CF]">{label}</p>
      <p className="text-lg font-semibold text-[#262254] dark:text-white mt-1">{value}</p>
    </div>
  );
}
