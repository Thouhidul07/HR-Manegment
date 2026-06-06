import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const notifications = [
    { id: 1, title: "New leave request from Tanvir Hasan", time: "5 min ago" },
    { id: 2, title: "Payroll processing completed", time: "1 hour ago" },
    { id: 3, title: "3 employees on leave today", time: "2 hours ago" },
  ];

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
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-accent rounded-lg transition-colors group"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Search */}
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

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-accent rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm text-popover-foreground">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border last:border-0"
                    >
                      <p className="text-sm text-popover-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              {user?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-sm text-foreground">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/dashboard/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground transition-colors"
                  >
                    View Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm text-popover-foreground transition-colors">
                    Preferences
                  </button>
                  <div className="border-t border-border my-2"></div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
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
