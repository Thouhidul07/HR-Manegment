You are building a Profile & Settings page for HR Space, a React + TypeScript + 
Tailwind CSS v4 HRMS. The page lives inside the authenticated Layout shell.
It is ONE adaptive page — tabs shown depend entirely on the user's role from useAuth().

Roles: 'admin' | 'hr_manager' | 'employee'
Stack: react-hook-form, motion from "motion/react", lucide-react

Colors:
  #262254  → headings, darkest text, footer bg
  #543884  → primary buttons, active tab, sidebar elements
  #9A77CF  → focus rings, links, icon tints, secondary
  #A13670  → gradient bridge, hover states, tags
  #EC4176  → CTA buttons, badges, highlights
  #FFA45E  → warnings, status dots, star ratings

Gradient recipes:
  CTA buttons:    linear-gradient(135deg, #543884, #A13670, #EC4176)
  Left sidebar:   linear-gradient(145deg, #262254, #543884)
  Active tab:     linear-gradient(135deg, #543884, #A13670, #EC4176)
  Headline text:  gradient clip-text #9A77CF → #EC4176

=== TAB VISIBILITY RULES ===

ALL roles see:
  Personal Info · Password & Security · Notifications
  Appearance · Privacy · Forum Preferences

employee + hr_manager ONLY (they are actual payroll employees):
  Work Information   (employee: read-only | hr_manager: editable)
  Attendance Preferences
  Payroll & Financial (both: read-only — sensitive data)
  Leave & Documents
  My Activity        (own events only, no IP, no export)

admin ONLY (platform owner, NOT an employee):
  Roles & Permissions
  Activity Log       (system-wide, all users, IPs, exportable)
  System Settings
  Danger Zone

admin does NOT get: Work Information, Attendance, Payroll, Leave & Documents, My Activity.
Enforce with conditional rendering (ternary/&&) — never with CSS display:none.

===================================================================
FILE: src/app/pages/Profile.tsx
===================================================================

--- PAGE LAYOUT ---
Two columns on lg+: left fixed sidebar (w-72, sticky top-24) + right scrollable content.
Mobile: sidebar collapses into a horizontal scrollable tab strip at top.
Page bg: var(--background). Padding: px-4 md:px-8 py-8.

-------------------------------------------------------------------
LEFT SIDEBAR CARD
-------------------------------------------------------------------
bg-card, border border-[#543884]/10, rounded-2xl, p-6, shadow-sm

AVATAR BLOCK:
  Circle w-20 h-20, rounded-full, mx-auto:
    Has avatar URL → <img> with object-cover
    No avatar → initials (first letter of first + last name),
      bg: linear-gradient(135deg, #543884, #EC4176), text-white text-2xl font-bold
  Hover: dark/40 overlay + Camera icon (#EC4176) centered, cursor-pointer
    Clicking triggers hidden <input type="file" accept="image/*">
  Uploading: animate-spin Loader2 icon overlay

  Name: font-semibold text-lg text-[#262254] dark:text-white text-center mt-4
  Role badge (text-center mt-1, rounded-full px-3 py-0.5 text-xs font-medium):
    admin      → bg-[#543884]/10 text-[#543884]  "Administrator"
    hr_manager → bg-[#9A77CF]/10 text-[#9A77CF]  "HR Manager"
    employee   → bg-[#EC4176]/10 text-[#EC4176]  "Employee"
  Department: text-xs text-[#9A77CF] text-center mt-1 (if available)
  "Member since [date]": text-xs muted text-center mt-0.5

  Profile completion bar (mt-4):
    Label row: "Profile Completion" text-xs muted + "78%" text-xs #543884 font-medium
    Track: h-1.5 bg-[#543884]/10 rounded-full
    Fill: h-1.5 bg gradient(90deg, #543884, #EC4176) rounded-full width=78%

Divider: border-t border-[#543884]/10 my-5

NAVIGATION (flex-col gap-0.5):
  Tab item (each):
    flex items-center gap-3, px-3.5 py-2.5, rounded-xl, cursor-pointer, 
    text-sm font-medium, transition-all duration-150, select-none
    
    Active:   bg gradient(135deg,#543884,#A13670,#EC4176), text-white, shadow-sm
    Inactive: text-[#262254]/70 dark:text-white/60
              hover:bg-[#543884]/8 hover:text-[#543884]
    
    Icon: w-4 h-4, active=white, inactive=#9A77CF

  Group 1 — ALL roles:
    [User]          Personal Info
    [Briefcase]     Work Information      (skip for admin)
    [Lock]          Password & Security
    [Bell]          Notifications
    [Clock]         Attendance            (skip for admin)
    [DollarSign]    Payroll & Financial   (skip for admin)
    [FileText]      Leave & Documents     (skip for admin)
    [MessageSquare] Forum Preferences
    [Moon]          Appearance
    [ShieldCheck]   Privacy

  Group 2 — role-specific (thin divider above):
    employee/hr_manager: [Activity]    My Activity
    admin:               [Activity]    Activity Log
    admin:               [Users]       Roles & Permissions
    admin:               [Settings]    System Settings
    admin:               [AlertTriangle] Danger Zone

SIDEBAR BOTTOM:
  "Last login: [datetime]" text-xs muted
  Green dot (w-2 h-2 animate-pulse) + "Active session" text-xs muted

-------------------------------------------------------------------
RIGHT CONTENT AREA
-------------------------------------------------------------------
Each panel: motion.div key=activeTab, initial opacity:0 y:12, animate opacity:1 y:0, 
  duration 0.22s.
Card pattern: bg-card rounded-2xl border border-[#543884]/10 p-6 md:p-8 mb-6 shadow-sm

Section header pattern (every tab):
  flex justify-between items-center mb-6
  Left: H2 (font-semibold text-xl text-[#262254] dark:text-white)
        + p (text-sm text-[#9A77CF] mt-0.5)
  Right: "Edit" ghost button when editable
    (border border-[#543884]/20, text-[#543884], hover:bg-[#543884]/5, rounded-lg, px-3 py-1.5)

Input style (all forms):
  w-full px-4 py-2.5 text-sm rounded-xl
  border border-[#543884]/20 bg-white dark:bg-[#1a0f2e]
  focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent outline-none
  text-[#262254] dark:text-white
  placeholder:text-[#9A77CF]/50

Label style: text-xs font-medium text-[#262254]/70 dark:text-white/60 uppercase 
  tracking-wider mb-1 block

Toggle switch component:
  Track: w-10 h-5 rounded-full transition-colors
    checked: bg-[#543884]  unchecked: bg-gray-200 dark:bg-gray-700
  Knob: w-4 h-4 bg-white rounded-full shadow-sm, 
    translate-x-5 when checked, translate-x-0.5 when not

Toast notification (success):
  fixed bottom-6 right-6 z-50, bg-card border-l-4 border-[#543884]
  shadow-xl rounded-xl px-5 py-3, flex items-center gap-3
  CheckCircle2 icon #543884 + message text-sm #262254/dark:white
  motion: x 60→0 on enter, auto-dismiss setTimeout 3000ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: PERSONAL INFO  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Two states toggled by isEditing boolean.

VIEW mode — info grid 2-col (1-col mobile):
  Each field: label (uppercase tracking-wider #9A77CF text-xs)
              value (text-sm font-medium #262254 dark:white mt-0.5)
  Fields: Full Name · Display Name · Email · Phone
          Date of Birth · Gender (badge) · Nationality · Marital Status
          City · Country
          Bio (full-width, italic if empty "No bio added")
          Emergency Contact Name · Emergency Contact Phone
          Blood Group · LinkedIn URL

EDIT mode (react-hook-form):
  Same fields as inputs. Gender: segmented (Male/Female/Prefer not to say).
  Bio: textarea rows=3 resize-none.
  Action row (flex justify-end gap-3 mt-6):
    Cancel ghost → isEditing=false + form.reset()
    Save: CTA gradient button, loading spinner state → success toast

AVATAR CARD (separate card below):
  Left: avatar w-16 h-16 + name + role badge
  Right: "Upload Photo" CTA gradient button + "Remove Photo" #EC4176 ghost
  Preview: URL.createObjectURL on select, file size shown
  Constraints text: "JPG, PNG, WEBP · Max 5MB" text-xs muted

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: WORK INFORMATION  (employee: read-only | hr_manager: editable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Info grid 2-col:
  Employee ID · Job Title / Designation
  Department · Reporting Manager
  Employment Type (Full-time/Part-time/Intern/Contract — shown as badge)
  Joining Date · Work Location
  Shift Schedule · Employee Status (Active/On Leave/Resigned — colored badge)
    Active → bg-green-50 text-green-700
    On Leave → bg-[#FFA45E]/10 text-[#A13670]
    Resigned → bg-[#EC4176]/10 text-[#EC4176]
  Notice Period · Contract End Date

hr_manager: Edit button + same form pattern, all fields editable
employee: read-only view only, no Edit button, no form

EMPLOYMENT TIMELINE (card below, all who see this tab):
  Header: "Employment History" + count badge
  Vertical timeline (border-l-2 border-[#543884]/20, pl-6):
    3 mock entries, each:
      Dot: w-2.5 h-2.5 rounded-full bg-[#543884], absolute -left-[5px]
      Current role dot: bg-[#EC4176]
      Date range: text-xs text-[#9A77CF] font-medium
      Role + Department: text-sm font-semibold #262254 dark:white
      Description: text-xs muted

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: PASSWORD & SECURITY  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE PASSWORD CARD:
  3 inputs with Lock icon left + Eye/EyeOff right: 
    Current Password · New Password · Confirm New Password

  Strength meter (below New Password):
    4 segments, bg-[#543884]/10 track, filled colors:
      1 → #EC4176 "Weak"
      2 → #FFA45E "Fair"  
      3 → #9A77CF "Good"
      4 → #543884 "Strong"
    Rules checklist (text-xs, Check2/X icons):
      8+ characters · Uppercase · Number · Special character
      Met: Check2 #543884 · Not met: X #EC4176/40

  "Update Password" CTA gradient full-width → loading → toast

ACTIVE SESSIONS CARD:
  Header: "Active Sessions" + badge count
  Session rows (flex, border-b):
    Monitor/Smartphone icon (#9A77CF) · Device name text-sm bold
    Location + time text-xs muted
    Right: "This device" green badge OR "Revoke" #EC4176 ghost text-xs
  Footer: "Sign out all other sessions" #EC4176 text-sm link

TWO-FACTOR AUTH CARD:
  Toggle row: Shield icon + label + desc + toggle right
  Enabled state: green "Enabled" badge + "Authenticator app connected"

ADMIN-ONLY section in this tab (below 2FA):
  "Admin Security Controls" card with border-[#EC4176]/20:
    Suspend Account toggle (with confirmation expand)
    Force Password Reset button → #EC4176 ghost

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: NOTIFICATIONS  (all roles, sections filtered by role)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Toggle row pattern:
  flex justify-between items-center py-3.5 border-b border-[#543884]/8 last:border-0
  Left: icon (#9A77CF w-4 h-4) + col (label text-sm font-medium + desc text-xs muted)
  Right: toggle switch

Group "HR Updates" (all roles):
  Bell → Leave request status updates
  Calendar → Shift schedule changes
  FileText → Payslip available
  Award → Performance review reminders

Group "Team Activity" (hr_manager only):
  Users → New employee onboarding alerts
  UserMinus → Resignation/offboarding notifications
  AlertCircle → Policy violation flags

Group "System Alerts" (admin only):
  Server → System health alerts
  Shield → Security breach notifications
  Database → Backup completion reports
  AlertTriangle → Failed login attempts

Separate card "Delivery Channels" (all):
  Mail · Smartphone · MessageSquare toggles

"Save Preferences" CTA gradient bottom-right → toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: ATTENDANCE PREFERENCES  (employee + hr_manager)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fields (2-col grid, editable for both roles):
  Preferred Shift (select: Morning/Evening/Night/Flexible)
  Working Hours per Day (number input, min 1 max 12)
  Timezone (select: major timezones, default Asia/Dhaka)
  Work Mode (segmented: Remote/On-site/Hybrid)
  Auto Check-in Reminder (toggle + time picker shown when on)
  Overtime Preference (select: Not Available/Available/Manager Decides)

"Save Preferences" CTA gradient → toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: PAYROLL & FINANCIAL  (employee + hr_manager, read-only for both)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READ-ONLY for all who see this tab.
Info grid 2-col:
  Bank Account (masked: ••••••1234) · Account Holder Name
  Bank Name · Branch
  Mobile Banking (toggle: shown/masked)
  Payment Method: Bank Transfer/Mobile Banking badge
  Salary Band: shown as range "#262254" bold
  Tax Identification Number (masked)

"Contact HR to update financial information" notice:
  bg-[#9A77CF]/8 border border-[#9A77CF]/20 rounded-xl p-4
  Info icon #9A77CF + text-sm muted

Download Payslips section (card below):
  Header: "Recent Payslips"
  Table rows (month · amount · status · download button):
    3-4 mock entries
    Status: "Processed" bg-green-50 text-green-700 badge
    Download: ghost button, Download icon #9A77CF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: LEAVE & DOCUMENTS  (employee + hr_manager)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAVE BALANCE CARD:
  4 stat cards in 2×2 grid (each: rounded-xl bg-card border p-4):
    Annual Leave: "12 / 18 days" — icon Palmtree #543884
    Sick Leave: "2 / 10 days" — icon Thermometer #EC4176
    Casual Leave: "3 / 6 days" — icon Coffee #9A77CF
    Unpaid Leave: "0 days" — icon Minus #FFA45E
  Each card: icon tinted circle + label text-xs muted + value text-xl font-bold #262254
  Small progress bar below value (same color as icon)

LEAVE HISTORY table below:
  Cols: Type · From · To · Days · Status · Reason
  4 mock rows. Status badges:
    Approved → bg-green-50 text-green-700
    Pending → bg-[#FFA45E]/10 text-[#A13670]
    Rejected → bg-[#EC4176]/10 text-[#EC4176]

DOCUMENTS card (separate):
  Header: "My Documents" + "Upload" CTA gradient button right
  Document list rows (flex, border-b):
    File icon (type-colored) · filename · filesize · uploaded date
    Right: Download ghost + Delete ghost (#EC4176)
  Document types with icons+colors:
    PDF → FileText #EC4176 · DOCX → FileText #543884 
    Image → Image #9A77CF
  Upload: hidden input[type=file], click triggers it, 
    shows filename + size preview before confirming

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: FORUM PREFERENCES  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANONYMOUS MODE card:
  Toggle row: UserX icon (#A13670) + "Anonymous Mode" + desc + toggle
    (toggle checked: bg gradient #A13670→#EC4176)
  When ON — animated expand (motion height 0→auto):
    bg-[#FFA45E]/10 border border-[#FFA45E]/30 rounded-xl p-4
    AlertTriangle #FFA45E + warning text-sm

  Alias/Nickname input (shown when anonymous ON):
    "Your anonymous alias" label + text input
    Help: "Shown instead of your name in forum posts"

POSTING PREFERENCES card:
  Toggles:
    MessageSquare → Allow anonymous posting
    Eye → Hide identity from other employees
    Shield → Allow moderators to see my identity
    Bell → Notify me on post replies
    VolumeX → Mute specific topics (input shown when ON)
    UserX → Muted users list (text input + tag display)

CONTENT PREFERENCES card:
  "Default post visibility" select: Public/Department Only/Team Only
  "Show my activity status" toggle

"Save Preferences" CTA gradient → toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: APPEARANCE  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THEME card — 3 selectable cards (1fr grid, gap-4):
  Selected: border-2 border-[#543884] shadow-md shadow-[#543884]/15
  Unselected: border border-[#543884]/15 hover:border-[#9A77CF]

  "Light" — mini preview (bg-white, sidebar #543884/10, content rows gray-100)
  "Dark"  — mini preview (bg-[#1a0f2e], sidebar #543884/60, content rows white/10)
  "System" — mini preview split diagonally half+half

  Selected: Check circle top-right (bg-[#543884] white check icon)
  On select: call ThemeContext setTheme()

LANGUAGE & REGION card:
  Language select (English US default)
  Timezone select (Asia/Dhaka default)
  Font Scale select (Small/Default/Large/Extra Large) → apply rem scale via CSS var
  "Save" CTA gradient → toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: PRIVACY  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISIBILITY card — toggles:
  Eye → Show profile in employee directory
  Phone → Show phone number to teammates
  Mail → Show email address in directory
  MapPin → Show timezone/location

DATA & PRIVACY card — action rows (flex justify-between py-3 border-b last:border-0):
  "Download My Data" → "Request Export" #9A77CF ghost
  "Delete My Account" → "Delete Account" #EC4176 ghost
  "Privacy Policy" → ExternalLink link #9A77CF

  Delete Account: inline confirmation expand on click (motion height):
    Red warning text + input placeholder "Type DELETE to confirm"
    border border-[#EC4176]/30, "Permanently Delete" red button + Cancel link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: MY ACTIVITY  (employee + hr_manager — own events only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Filter pill strip (no export button):
  "All" | "Login" | "Profile" | "Settings" | "Security"

Event rows (flex items-start gap-4 py-4 border-b border-[#543884]/8):
  Left: icon circle w-9 h-9 rounded-full:
    Login → LogIn #543884/10 #543884
    Profile update → Edit3 #9A77CF/10 #9A77CF
    Password → Lock #A13670/10 #A13670
    Settings → Settings #FFA45E/10 #FFA45E
    Security → Shield #EC4176/10 #EC4176
  Middle: title text-sm font-medium + detail text-xs muted
    NO IP address shown
  Right: relative time text-xs muted + full datetime on hover

8 mock entries. "Load more" ghost center.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: ACTIVITY LOG  (admin only — system-wide)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Same layout as My Activity PLUS:
  Filter strip: All / Login / Profile / Settings / Security / System
  Date range inputs (from/to)
  "Export Log" CTA gradient button with Download icon (right of filters)
  Each row shows: IP address + Location text-xs text-[#9A77CF]
  User column: avatar circle + name (since admin sees all users' events)
10 mock entries covering mixed users.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: ROLES & PERMISSIONS  (admin only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role overview cards (3 cards — one per role, flex row 1-col mobile):
  Each card: bg-card border rounded-2xl p-5
  Role badge (large) + user count + description
  "View Users" ghost button → would navigate to user management

PERMISSION MATRIX card:
  Header: "Feature Access Control"
  Table:
    Cols: Feature | Employee | HR Manager | Admin
    Rows (12 features):
      View own profile · Edit profile · View org chart
      Submit leave · Approve leave · Manage employees
      View payroll · Process payroll · Generate reports
      Access settings · Manage roles · Delete records
    Cells: 
      ✓ checkmark circle (bg-green-50 text-green-700, w-6 h-6 rounded-full)
      ✗ x circle (bg-[#EC4176]/10 text-[#EC4176], w-6 h-6 rounded-full)
    "Edit Permissions" CTA gradient button top-right of card

ASSIGN ROLE card (below matrix):
  "Change user role" mini form:
    User search input (Search icon #9A77CF)
    Role select (Employee/HR Manager/Admin)
    "Update Role" CTA gradient button
    Confirmation: inline expand after click

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: SYSTEM SETTINGS  (admin only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY SETTINGS card (edit mode same pattern as personal info):
  Company Name · Company Email · Company Phone
  Industry (select) · Company Size (select) · Founded Year
  Address (textarea full-width)
  Logo upload (same avatar upload pattern, rectangle crop preview)

PLATFORM SETTINGS card — toggle rows:
  Users → Allow employee self-registration
  Mail → Require email verification
  Lock → Force 2FA for all HR Managers
  Eye → Allow employees to view org chart
  Download → Allow payslip self-download
  Bell → Global notification master switch
  
  Session timeout select:
    "Auto logout after:" → 15 min / 30 min / 1 hour / 4 hours / Never

"Save Settings" CTA gradient → toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB: DANGER ZONE  (admin only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Card: bg-[#EC4176]/5 border border-[#EC4176]/20 rounded-2xl p-6
Header: "Danger Zone" text-[#EC4176] font-semibold + AlertTriangle icon

Action rows (border-b border-[#EC4176]/10 last:border-0, py-4):
  1. "Reset All Settings" 
     desc: "Restore all platform settings to factory defaults"
     button: border border-[#EC4176] text-[#EC4176] rounded-lg px-4 py-2 text-sm
  2. "Wipe All Employee Data"
     desc: "Permanently delete all employee records. Cannot be undone."
     same button style
  3. "Disable Platform"
     desc: "Put HR Space in maintenance mode for all users."
     same button style

Each action: clicking expands inline confirmation (motion height 0→auto, 0.2s):
  bg-[#EC4176]/5 rounded-xl p-4 mt-3:
    Warning text-sm · Input placeholder "Type CONFIRM to proceed"
    "Proceed" #EC4176 solid button + "Cancel" ghost link

=== QUICK ACTIONS WIDGET ===
Floating card bottom-right corner of RIGHT PANEL (not fixed, just at the top 
of the right column before the tab content, inside a card):
  Header: "Quick Actions" text-sm font-medium
  Role-based buttons (flex flex-wrap gap-2):
    employee/hr_manager:
      "Apply Leave" CTA gradient pill-button (small, CalendarPlus icon)
      "Download Payslip" ghost border pill (Download icon)
      "Update Documents" ghost border pill (Upload icon)
    admin:
      "Add Employee" CTA gradient pill-button (UserPlus icon)
      "Generate Report" ghost border pill (BarChart2 icon)
      "System Backup" ghost border pill (Database icon)

=== ROUTING & SIDEBAR INTEGRATION ===
Add to routes.tsx (inside ProtectedRoute + Layout):
  { path: 'profile', Component: Profile }

Add to Sidebar.tsx (above logout, with divider above):
  UserCircle icon + "My Profile" nav item → /profile
  Same styling as existing sidebar nav items

Add to Header.tsx user dropdown:
  "View Profile" option with User icon → navigate('/profile')
  Place above the existing Logout option, with divider between

=== TECHNICAL RULES ===
- File: src/app/pages/Profile.tsx
- Split each tab into a local const component (PersonalInfoTab, etc.)
- If file exceeds 600 lines, split into src/app/pages/profile/ subfolder:
    index.tsx (layout + sidebar + tab routing)
    tabs/PersonalInfo.tsx, tabs/WorkInfo.tsx ... etc.
- All forms: react-hook-form
- All animations: motion from "motion/react" — never framer-motion
- Mock all saves: setTimeout 800ms then success toast
- activeTab: useState persisted to sessionStorage
- Role gate: useAuth().user.role conditional rendering, never CSS
- Dark mode: all elements must use dark: variants
- Responsive: left sidebar → horizontal scroll tab strip on mobile (lg breakpoint)
- Icons: lucide-react only
- No real API calls, no external components beyond project's own UI
- Inputs must match existing Input.tsx style from the project
- Buttons must match existing Button.tsx primary variant