import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, Menu, Sun, Moon, CheckCheck } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function relativeTime(value?: string) {
  if (!value) return "Just now";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function initials(name?: string) {
  return String(name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const loadNotifications = async () => {
    if (!user) return;
    setNotificationsLoading(true);
    setNotificationError("");
    try {
      const response = await api.get("/notifications", { params: { limit: 10 } });
      setNotifications(response.data.notifications || []);
      setUnreadCount(Number(response.data.unreadCount || 0));
    } catch (error) {
      setNotificationError("Unable to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markReadAndNavigate = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      setNotificationError("Could not update notification status");
    }

    if (notification.link) {
      setShowNotifications(false);
      navigate(notification.link);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      setNotificationError("Could not mark notifications as read");
    }
  };

  const runSearch = () => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return;

    if (query.includes("leave")) navigate("/dashboard/leave");
    else if (query.includes("attendance") || query.includes("clock")) navigate("/dashboard/attendance");
    else if (query.includes("payroll") || query.includes("payslip")) navigate(user?.role === "employee" ? "/dashboard/payslips" : "/dashboard/payroll");
    else if (query.includes("expense")) navigate("/dashboard/expense");
    else if (query.includes("training") || query.includes("course")) navigate("/dashboard/training");
    else if (query.includes("role") || query.includes("permission")) navigate(user?.role === "admin" ? "/dashboard/roles" : "/dashboard");
    else if (query.includes("approval") || query.includes("account")) navigate(user?.role === "admin" ? "/dashboard/account-approvals" : "/dashboard");
    else if (query.includes("cv") || query.includes("candidate")) navigate(user?.role === "employee" ? "/dashboard/circular-apply" : "/dashboard/cv-filter");
    else navigate(user?.role === "employee" ? "/dashboard/profile" : "/dashboard/employees");
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-accent rounded-lg transition-colors group"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees, documents..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") runSearch();
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) loadNotifications();
            }}
            className="p-2 hover:bg-accent rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-96 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm text-popover-foreground">Notifications</h3>
                    <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                  </div>
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="text-xs text-primary disabled:text-muted-foreground flex items-center gap-1 hover:underline"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading && (
                    <div className="p-4 text-sm text-muted-foreground">Loading notifications...</div>
                  )}
                  {!notificationsLoading && notificationError && (
                    <div className="p-4 text-sm text-destructive">{notificationError}</div>
                  )}
                  {!notificationsLoading && !notificationError && notifications.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
                  )}
                  {!notificationsLoading && !notificationError && notifications.map((notif) => (
                    <button
                      type="button"
                      key={notif.id}
                      onClick={() => markReadAndNavigate(notif)}
                      className={`w-full text-left p-4 hover:bg-accent/50 transition-colors border-b border-border last:border-0 ${!notif.isRead ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex gap-3">
                        {!notif.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm text-popover-foreground">{notif.title}</p>
                          {notif.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.body}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{relativeTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              {initials(user?.name)}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm text-foreground">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.email || ""} {user?.employee_code ? `(${user.employee_code})` : ""} • {user?.company_name || "NexoraTech Ltd"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      sessionStorage.setItem("profile-active-tab", "appearance");
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground transition-colors"
                  >
                    Preferences
                  </button>
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-destructive transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
