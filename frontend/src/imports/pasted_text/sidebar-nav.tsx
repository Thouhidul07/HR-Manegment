You are rebuilding the Dashboard and Sidebar of HR Space to be fully role-aware.
The AuthContext already exists at src/app/contexts/AuthContext.tsx with:
  useAuth() → { user: { id, name, email, role }, isAuthenticated }
  Roles: 'admin' | 'hr_manager' | 'employee'

Brand colors:
  #262254 Midnight Blue  · #543884 Deep Purple · #9A77CF Medium Purple
  #A13670 Berry Rose     · #EC4176 Paradise Pink · #FFA45E Sandy Orange

Recharts is installed. Use it for all charts.
Icons: lucide-react only.
motion from "motion/react" for animations.

===================================================================
FILE 1: src/app/components/layout/Sidebar.tsx  (REPLACE EXISTING)
===================================================================
Replace the current flat navItems array with role-gated navigation.

const navConfig = {
  admin: [
    { path: '/dashboard',              label: 'Dashboard',          icon: LayoutDashboard },
    { path: '/dashboard/employees',    label: 'Employees',          icon: Users },
    { path: '/dashboard/onboarding',   label: 'Onboarding',         icon: UserPlus },
    { path: '/dashboard/attendance',   label: 'Attendance',         icon: Clock },
    { path: '/dashboard/leave',        label: 'Leave',              icon: Calendar },
    { path: '/dashboard/payroll',      label: 'Payroll',            icon: DollarSign },
    { path: '/dashboard/expense',      label: 'Expenses',           icon: Receipt },
    { path: '/dashboard/performance',  label: 'Performance',        icon: Target },
    { path: '/dashboard/training',     label: 'Training',           icon: GraduationCap },
    { path: '/dashboard/roles',        label: 'Roles & Permissions',icon: Shield },
    { path: '/dashboard/forum',        label: 'Forum',              icon: MessageSquare },
  ],
  hr_manager: [
    { path: '/dashboard',              label: 'Dashboard',          icon: LayoutDashboard },
    { path: '/dashboard/employees',    label: 'Employees',          icon: Users },
    { path: '/dashboard/onboarding',   label: 'Onboarding',         icon: UserPlus },
    { path: '/dashboard/attendance',   label: 'Attendance',         icon: Clock },
    { path: '/dashboard/leave',        label: 'Leave',              icon: Calendar },
    { path: '/dashboard/payroll',      label: 'Payroll',            icon: DollarSign },
    { path: '/dashboard/performance',  label: 'Performance',        icon: Target },
    { path: '/dashboard/training',     label: 'Training',           icon: GraduationCap },
    { path: '/dashboard/forum',        label: 'Forum',              icon: MessageSquare },
  ],
  employee: [
    { path: '/dashboard',              label: 'Dashboard',          icon: LayoutDashboard },
    { path: '/dashboard/attendance',   label: 'My Attendance',      icon: Clock },
    { path: '/dashboard/leave',        label: 'My Leave',           icon: Calendar },
    { path: '/dashboard/training',     label: 'My Training',        icon: GraduationCap },
    { path: '/dashboard/expense',      label: 'My Expenses',        icon: Receipt },
    { path: '/dashboard/performance',  label: 'My Performance',     icon: Target },
    { path: '/dashboard/forum',        label: 'Forum',              icon: MessageSquare },
  ],
};

Inside Sidebar component:
  const { user } = useAuth();
  const navItems = navConfig[user?.role ?? 'employee'];

Keep all existing sidebar styling (bg-[var(--sidebar)], NavLink active states, 
collapsed state, logo) — only the nav items logic changes.

===================================================================
FILE 2: src/app/pages/Dashboard.tsx  (REPLACE ENTIRELY)
===================================================================
One file, three completely different dashboard views based on role.
Use useAuth() to determine which to render.

export function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin')      return <AdminDashboard user={user} />;
  if (user?.role === 'hr_manager') return <HRManagerDashboard user={user} />;
  return <EmployeeDashboard user={user} />;
}

Each dashboard is a local const component in the same file.

-------------------------------------------------------------------
SHARED ELEMENTS (used by all three dashboards)
-------------------------------------------------------------------
PAGE HEADER component (const DashboardHeader):
  Props: title, subtitle, actions (ReactNode)
  <div className="flex items-start justify-between mb-8">
    Left:
      <h1> with gradient text (bg gradient(90deg,#543884,#EC4176), 
        bg-clip-text text-transparent, text-2xl font-bold)
      <p> subtitle — text-sm text-[#9A77CF] mt-1
    Right: actions slot (quick action buttons)

STAT CARD component (const StatCard):
  Props: label, value, change, trend ('up'|'down'|'neutral'), 
         icon (LucideIcon), iconColor, iconBg, subtitle?
  bg-card rounded-2xl border border-[#543884]/10 p-5 shadow-sm
  Top row: icon circle (w-10 h-10, rounded-xl, iconBg, iconColor icon w-5 h-5)
           + trend badge right (up=green, down=red, neutral=muted)
  Value: text-3xl font-bold text-[#262254] dark:text-white mt-3
  Label: text-sm text-[#9A77CF] mt-0.5
  Subtitle: text-xs muted mt-1 (optional)
  Trend badge: flex items-center gap-1 text-xs rounded-full px-2 py-0.5
    up   → bg-green-50 text-green-700, TrendingUp icon
    down → bg-[#EC4176]/10 text-[#EC4176], TrendingDown icon

SECTION CARD component (const SectionCard):
  Props: title, subtitle?, action? (ReactNode), children
  bg-card rounded-2xl border border-[#543884]/10 p-6 shadow-sm
  Header: title font-semibold text-[#262254] dark:text-white
          + subtitle text-xs text-[#9A77CF]
          + action slot right (ghost link/button)

RECHARTS theme config (const chartTheme):
  grid:    stroke="#543884" strokeOpacity=0.08 strokeDasharray="3 3"
  tooltip: contentStyle bg-card border-[#543884]/20 rounded-xl shadow-lg
  axis:    stroke="#9A77CF" fontSize=12
  colors:  ['#543884','#9A77CF','#EC4176','#FFA45E','#A13670']

-------------------------------------------------------------------
CONST AdminDashboard  (role: admin)
-------------------------------------------------------------------
Focus: full org health, system-level oversight, strategic metrics.

HEADER:
  Title: "Good morning, [user.name] 👋" (use current hour for greeting)
  Subtitle: "Here's your organization overview for today."
  Actions: 
    "Generate Report" button — border border-[#543884]/20 text-[#543884] 
      rounded-xl px-4 py-2 text-sm flex items-center gap-2, FileText icon
    "Add Employee" button — CTA gradient rounded-xl px-4 py-2 text-sm 
      white text, UserPlus icon

ROW 1 — 4 stat cards:
  Total Employees   | value: "1,234" | change: "+12 this month" | trend: up
    icon: Users, iconBg: #543884/10, iconColor: #543884
  Present Today     | value: "1,156" | change: "93.7% attendance" | trend: up  
    icon: UserCheck, iconBg: #9A77CF/10, iconColor: #9A77CF
  On Leave          | value: "48"    | change: "5 pending approval" | trend: neutral
    icon: UserX, iconBg: #FFA45E/10, iconColor: #FFA45E
  Open Positions    | value: "17"    | change: "3 offers out"| trend: neutral
    icon: Briefcase, iconBg: #EC4176/10, iconColor: #EC4176

ROW 2 — 3 col grid (2fr + 1fr):
  LEFT (col-span-2): SectionCard "Workforce Attendance — 6 Months"
    AreaChart height=260, data Jan-Jun:
      present line: stroke #543884, fill #543884/15
      absent line: stroke #EC4176, fill #EC4176/10
      Both lines shown, legend below chart (custom HTML legend)
    data: [ {month:'Jan',present:1150,absent:84}, {month:'Feb',present:1180,absent:54},
            {month:'Mar',present:1200,absent:34}, {month:'Apr',present:1220,absent:14},
            {month:'May',present:1180,absent:54}, {month:'Jun',present:1156,absent:78} ]

  RIGHT (col-span-1): SectionCard "Department Breakdown"
    PieChart (donut) height=200, innerRadius=55, outerRadius=85, paddingAngle=3
    data + legend list below:
      Engineering: 450, #543884
      Sales:       280, #9A77CF
      Marketing:   180, #EC4176
      HR:          120, #FFA45E
      Finance:     204, #A13670
    Legend: flex-col gap-2, each row: colored dot + name + count right-aligned

ROW 3 — 3 col grid (1fr each):
  CARD 1: SectionCard "Payroll Summary"
    action: "View Details →" link text-[#9A77CF] text-sm
    3 stat rows (flex justify-between border-b py-3 last:border-0):
      Total Disbursed: "$2,847,000" — font-semibold #262254
      Pending:         "$124,500"   — text-[#FFA45E]
      Deductions:      "$389,200"   — text-[#EC4176]
    BarChart height=100 at bottom (mini sparkbar, 6 months payroll totals)
      bar fill: #543884, no axes, no grid, no tooltip, just the shape

  CARD 2: SectionCard "Pending Approvals"
    action: "View All →"
    List of 4 approval items (flex gap-3 py-3 border-b last:border-0):
      Each: colored left-border accent div (w-1 rounded-full) + 
        col (title text-sm font-medium + subtitle text-xs muted) + 
        badge right
      Items:
        Leave Request × 12     → border #9A77CF, badge "Leave" bg-[#9A77CF]/10 text-[#9A77CF]
        Expense Claims × 8     → border #FFA45E, badge "Expense" bg-[#FFA45E]/10 text-[#A13670]
        Onboarding Tasks × 5   → border #543884, badge "Onboarding" bg-[#543884]/10 text-[#543884]
        Performance Reviews × 3→ border #EC4176, badge "Review" bg-[#EC4176]/10 text-[#EC4176]

  CARD 3: SectionCard "Hiring Pipeline"
    action: "Manage →"
    5 stage rows with progress bars:
      Applied:     142, bar width 100%, #543884
      Screening:    89, bar width  63%, #9A77CF
      Interview:    45, bar width  32%, #A13670
      Offer:        17, bar width  12%, #EC4176
      Hired:         9, bar width   6%, #FFA45E
    Each row: flex justify-between text-sm + progress bar below

ROW 4 — 2 col grid:
  LEFT: SectionCard "Recent Activity"
    action: "View All →"
    5 activity rows (flex items-start gap-3 py-3 border-b last:border-0):
      Left: icon circle w-8 h-8 rounded-full (type-colored bg + icon)
        leave=Calendar/#9A77CF, onboarding=UserPlus/#543884,
        expense=Receipt/#FFA45E, training=GraduationCap/#EC4176, 
        profile=User/#A13670
      Middle: "[Name] [action]" text-sm + time text-xs muted
      Right: type badge
    5 mock entries covering all types

  RIGHT: SectionCard "Upcoming Events"
    action: "Add Event →"
    4 event rows (flex items-center gap-3 p-3 rounded-xl 
      bg-[#543884]/5 hover:bg-[#543884]/10 mb-2 transition-colors):
      Left: date block (day number text-xl font-bold #543884, 
        month text-xs #9A77CF, bg-[#543884]/8 rounded-xl p-2 text-center w-12)
      Middle: title text-sm font-medium + description text-xs muted
      Right: type badge
    Events:
      Apr 5  — Payroll Processing / Monthly payroll run
      Apr 7  — New Hire Orientation / 4 new employees
      Apr 10 — Performance Reviews Due / Q1 cycle ends
      Apr 15 — Training Workshop / Leadership series

-------------------------------------------------------------------
CONST HRManagerDashboard  (role: hr_manager)
-------------------------------------------------------------------
Focus: people operations, team health, pending tasks.

HEADER:
  Title: "Good [morning/afternoon], [user.name]"
  Subtitle: "You have [N] pending approvals and [N] onboarding tasks today."
  Actions:
    "Approve Leaves" CTA gradient button + CheckCircle icon
    "Add Employee" ghost border button + UserPlus icon

ROW 1 — 4 stat cards:
  Team Size         | "247"   | "8 new this month" | up
    icon: Users, #543884
  Attendance Rate   | "94.2%" | "+1.2% vs last week"| up
    icon: Clock, #9A77CF
  Leave Requests    | "12"    | "5 urgent"         | down
    icon: Calendar, #FFA45E
  Training Progress | "73%"   | "18 completions"   | up
    icon: GraduationCap, #EC4176

ROW 2 — 2 col grid (3fr + 2fr):
  LEFT: SectionCard "Team Attendance This Week"
    BarChart height=240, grouped bars (present + on leave per day):
      data: Mon-Fri with present ~230-240, leave ~5-15
      present bars: fill #543884
      leave bars: fill #EC4176
      XAxis: day names, no YAxis label
    custom HTML legend below

  RIGHT: SectionCard "Leave Requests"
    action: "View All →"
    5 leave request rows:
      Each: avatar circle (initials, cycling gradient colors) +
        col (name font-medium text-sm + "X days · [type]" text-xs muted) +
        action buttons ("✓" approve bg-green-50 text-green-700 rounded-lg px-2 py-1 text-xs +
                        "✗" reject bg-[#EC4176]/10 text-[#EC4176] same)
      Entries (name, days, type):
        Rafi Ahmed, 3 days, Annual Leave
        Priya Sen, 1 day, Sick Leave
        Karim Hassan, 5 days, Annual Leave
        Nadia Malik, 2 days, Casual Leave
        Arif Islam, 4 days, Annual Leave

ROW 3 — 3 col grid:
  CARD 1: SectionCard "Onboarding Pipeline"
    action: "Manage →"
    Mini list of 4 new hires (avatar + name + start date + progress bar):
      Progress bar: filled #543884 on #543884/10 track, w-full h-1.5 rounded-full
      Each hire shows % completion
      Entries: Sofia Rahman 92%, James Okafor 68%, Mei Lin 45%, David Owusu 20%

  CARD 2: SectionCard "Department Health"
    RadarChart OR simple score cards (use score cards if radar is complex):
    5 departments with health score (0-100) shown as colored progress arcs:
      Engineering: 87% — #543884
      Sales:       79% — #9A77CF
      Marketing:   91% — #EC4176
      Finance:     83% — #FFA45E
      HR:          95% — #A13670
    Use simple bar-style rows: dept name + score badge + bar fill

  CARD 3: SectionCard "Today's Agenda"
    4 time-blocked items:
      09:00 — Interview: Senior Dev Role — badge "Interview" #9A77CF
      11:00 — Team Standup — badge "Meeting" #543884
      14:00 — Performance Review: Rafi A. — badge "Review" #EC4176
      16:00 — Payroll Sign-off — badge "Payroll" #FFA45E
    Each: time text-xs text-[#9A77CF] font-mono + title text-sm font-medium + badge

ROW 4: SectionCard "Headcount by Department" (full width)
  HorizontalBarChart height=(5 * 48 + 80):
    layout="vertical", 5 departments, single bar each
    fill: #543884, rounded feel via CSS if possible
    Show value labels at bar end

-------------------------------------------------------------------
CONST EmployeeDashboard  (role: employee)
-------------------------------------------------------------------
Focus: personal — MY attendance, MY leave, MY tasks, MY growth.
NO organization-wide data. NO other employees' data.

HEADER:
  Title: "Welcome back, [user.name] 👋"
  Subtitle: "[Day], [full date] · [greeting based on hour]"
  Actions:
    "Apply for Leave" CTA gradient + CalendarPlus icon
    "Log Attendance" ghost border + Clock icon

ROW 1 — 4 stat cards:
  My Attendance     | "23 / 25 days" | "92% this month" | up
    icon: Clock, #543884
  Leave Balance     | "12 days"      | "6 used this year"| neutral
    icon: Palmtree, #9A77CF  (use Umbrella if Palmtree unavailable)
  Tasks Due         | "3"            | "1 overdue"       | down
    icon: CheckSquare, #EC4176
  Training Progress | "2 / 5"        | "40% complete"    | neutral
    icon: BookOpen, #FFA45E

ROW 2 — 2 col grid:
  LEFT: SectionCard "My Attendance This Month"
    Mini calendar-style heatmap using a CSS grid (7 cols × 5 rows):
      Each cell: w-8 h-8 rounded-lg text-xs text-center flex items-center justify-center
      Present days: bg-[#543884] text-white
      Absent days:  bg-[#EC4176]/20 text-[#EC4176]
      Weekend days: bg-transparent text-[#9A77CF]/40
      Today: ring-2 ring-[#FFA45E]
      Populate with mock data for current month (mix of present/absent)
    Legend below: colored dot + "Present" / "Absent"

  RIGHT: SectionCard "Leave Balance"
    4 leave type rows (each: icon + type + days-used bar + remaining badge):
      Annual Leave:   12 remaining / 18 total — bar #543884 67%
      Sick Leave:     8 remaining / 10 total  — bar #9A77CF 80%
      Casual Leave:   3 remaining / 6 total   — bar #EC4176 50%
      Unpaid Leave:   Unlimited               — badge "As needed" #FFA45E
    Each row: icon (type-colored) + label text-sm + bar (h-2 rounded-full) + 
      "[N] days left" text-xs muted

ROW 3 — 3 col grid:
  CARD 1: SectionCard "My Tasks"
    action: "View All →"
    4 task rows (flex items-center gap-3 py-2.5 border-b last:border-0):
      Checkbox circle (w-5 h-5 rounded-full border-2):
        done: bg-[#543884] border-[#543884] with check icon white
        pending: border-[#9A77CF]/40
      Task text-sm (done: line-through text-muted) + due text-xs muted right
      Tasks:
        ✓ Complete Q1 self-review (done)
        ○ Submit expense report — Due today (border-[#EC4176])
        ○ Complete Safety Training — Due Apr 8
        ○ Update emergency contacts — Due Apr 12

  CARD 2: SectionCard "My Training"
    action: "Browse Courses →"
    3 course rows (flex gap-3 py-3 border-b last:border-0):
      Left: colored course icon square (rounded-lg w-10 h-10 flex center)
      Middle: course name text-sm font-medium + provider text-xs muted
      Right: progress % text-xs #543884 font-medium + 
             mini bar below (h-1.5 rounded full, fill based on %)
      Courses:
        Leadership Essentials — 78% — icon BookOpen #543884
        Data Privacy & GDPR   — 45% — icon Shield #9A77CF
        Excel Advanced        — 20% — icon BarChart2 #EC4176

  CARD 3: SectionCard "Today's Schedule"
    4 time slots:
      09:00 — Team Standup — 30 min — badge "Meeting" #9A77CF
      10:30 — Focus Work Block — badge "Focus" #543884
      14:00 — 1:1 with Manager — badge "Meeting" #9A77CF
      15:30 — Training: Leadership — badge "Training" #EC4176
    Same row style as HR Manager agenda

ROW 4 — 2 col grid:
  LEFT: SectionCard "Recent Payslips"
    action: "View All →"
    3 payslip rows (flex justify-between items-center py-3 border-b last:border-0):
      Left: FileText icon bg-[#543884]/10 #543884 rounded-lg p-2 +
        col (month/year text-sm font-medium + "Processed" green badge)
      Right: amount text-sm font-semibold #262254 dark:white +
        Download ghost icon button #9A77CF
      Entries: March 2026 $3,450 / February 2026 $3,450 / January 2026 $3,380

  RIGHT: SectionCard "Quick Actions"
    2×3 grid of action cards (each: rounded-xl border border-[#543884]/10
      p-4 flex flex-col items-center gap-2 hover:bg-[#543884]/5 
      hover:border-[#543884]/30 cursor-pointer transition-all):
      Icon circle (gradient bg, white icon) + label text-xs text-center font-medium
      Actions:
        CalendarPlus   → "Apply Leave"      — gradient #543884→#EC4176
        Clock          → "Log Attendance"   — gradient #9A77CF→#543884
        Receipt        → "Submit Expense"   — gradient #EC4176→#A13670
        FileText       → "Download Payslip" — gradient #FFA45E→#A13670
        MessageSquare  → "Go to Forum"      — gradient #9A77CF→#EC4176
        User           → "Update Profile"   — gradient #543884→#9A77CF

===================================================================
ANIMATIONS
===================================================================
Wrap each dashboard's outer div in:
  <motion.div initial={{opacity:0, y:16}} animate={{opacity:1, y:0}}
    transition={{duration:0.3}} key={user.role}>

Stat cards: stagger with index * 0.06s delay each
  (motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} 
   transition={{delay: index*0.06, duration:0.25}})

Section cards: whileInView opacity:0→1 y:12→0 once:true

===================================================================
TECHNICAL RULES
===================================================================
- Keep Dashboard.tsx under 600 lines. If longer, extract each role 
  dashboard into:
    src/app/pages/dashboard/AdminDashboard.tsx
    src/app/pages/dashboard/HRManagerDashboard.tsx
    src/app/pages/dashboard/EmployeeDashboard.tsx
  and import + render from Dashboard.tsx based on role.

- Use existing Card/CardHeader/CardContent from ui/Card.tsx
- Use existing Badge from ui/Badge.tsx
- Recharts charts must use chartTheme config — no hardcoded hex in chart 
  props (use the colors array from chartTheme)
- All chart tooltips: themed contentStyle matching the card bg
- Dark mode: all colors via dark: Tailwind variants
- No TypeScript errors — type all props, no implicit any
- Greeting: 
    hour < 12 → "Good morning"
    hour < 17 → "Good afternoon" 
    else      → "Good evening"
- Do NOT change any other page (Attendance, Payroll, etc.)
- Do NOT change AuthContext, routes, or Layout