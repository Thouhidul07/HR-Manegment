You are adding a Profile & Settings page to HR Space, a React + TypeScript + 
Tailwind CSS v4 HRMS. The page lives inside the existing authenticated Layout 
shell (with sidebar + header). It is ONE adaptive page that renders different 
sections and permissions based on the current user's role from useAuth().

Roles: 'admin' | 'hr_manager' | 'employee'
Colors (use these exactly, inline style for gradients only):
  #262254  Midnight Blue   → headings, darkest text
  #543884  Deep Purple     → sidebar, primary buttons, active states  
  #9A77CF  Medium Purple   → focus rings, links, icons, secondary accents
  #A13670  Berry Rose      → gradient midpoint, hover states
  #EC4176  Paradise Pink   → CTA buttons, badges, highlights
  #FFA45E  Sandy Orange    → warnings, status dots, warm accents

Stack: lucide-react icons, `motion` from "motion/react", 
react-hook-form for all forms, no external UI libraries beyond what exists.

===================================================================
FILE: src/app/pages/Profile.tsx
===================================================================

--- PAGE LAYOUT ---
Full page inside Layout shell. Two-column layout on desktop (lg+):
  LEFT COLUMN  — w-72 fixed sidebar card (sticky top-24)
  RIGHT COLUMN — flex-1, scrollable tab content

Mobile: left column collapses to a horizontal scrollable tab strip at top,
right column is full width below.

-------------------------------------------------------------------
LEFT SIDEBAR CARD
-------------------------------------------------------------------
bg-white (light) / bg-[#251942] (dark)
border border-[#543884]/10, rounded-2xl, p-6

TOP SECTION — Avatar + identity:
  Avatar circle (w-20 h-20, rounded-full, mx-auto):
    If user has avatar URL: show image with object-cover
    If no avatar: initials circle, bg gradient(135deg, #543884, #EC4176), 
      white text, text-2xl font-bold
    Hover overlay: dark/40 backdrop + Camera icon (#EC4176, w-5 h-5) centered
      with cursor-pointer — clicking triggers hidden <input type="file" accept="image/*">
    Processing state: show animate-spin Loader2 icon over avatar

  Below avatar:
    User's full name — font-semibold text-lg color #262254 / white dark, text-center
    Role badge (text-center, mt-1):
      admin      → bg #543884/10 text #543884  "Administrator"
      hr_manager → bg #9A77CF/10 text #9A77CF  "HR Manager"
      employee   → bg #EC4176/10 text #EC4176  "Employee"
      pill shape, rounded-full, px-3 py-0.5, text-xs font-medium
    Department (if available from user object) — text-xs text-[#9A77CF] text-center mt-1
    "Member since [join date]" — text-xs muted text-center mt-1

  Thin divider: border-t border-[#543884]/10, my-5

NAVIGATION TABS (vertical list, flex-col gap-1):
  Each tab: flex items-center gap-3, px-4 py-2.5, rounded-xl, 
    text-sm font-medium, cursor-pointer, transition-all duration-150
  
  Active state:  bg gradient(135deg, #543884, #A13670, #EC4176), text-white,
    shadow-md shadow-[#EC4176]/20
  Inactive:      text-[#262254]/70 (light) / white/60 (dark), 
    hover:bg-[#543884]/8 hover:text-[#543884]

  TABS — shown to ALL roles:
    [User icon]          "Personal Info"
    [Lock icon]          "Password & Security"
    [Bell icon]          "Notifications"
    [Moon icon]          "Appearance"
    [Shield icon]        "Privacy"

  TABS — shown only to admin:
    [Activity icon]      "Activity Log"
    [Settings icon]      "System Settings"    ← admin only

  TABS — shown to admin + hr_manager:
    [Briefcase icon]     "Employment Details"

  TABS — shown only to employee:
    [Briefcase icon]     "My Employment"
    [Activity icon]      "My Activity"

  Thin divider before role-specific tabs.

BOTTOM of sidebar:
  "Last login: [date+time]" — text-xs muted
  Small colored status dot (w-2 h-2 rounded-full bg-green-400 animate-pulse) 
    + "Active session" text-xs muted

-------------------------------------------------------------------
RIGHT CONTENT AREA
-------------------------------------------------------------------
Each tab panel: motion.div with opacity 0→1, y 12→0, duration 0.25s, key=activeTab
Card wrapper per section: bg-white/card, rounded-2xl, border border-[#543884]/10,
  p-6 md:p-8, mb-6, shadow-sm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 1 — PERSONAL INFO  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section header pattern (use on every tab):
  H2 "Personal Information" — font-semibold text-xl color #262254 / white dark
  Subtext — text-sm text-[#9A77CF]
  "Edit" button top-right: ghost, User icon, text-[#9A77CF] hover:text-[#EC4176]

Two states: VIEW mode (read-only display) / EDIT mode (form inputs).
Toggle via local isEditing boolean state. "Edit" button → isEditing=true.

VIEW mode — info grid (2 cols on md+, 1 col mobile):
  Each field:
    Label: text-xs uppercase tracking-wider text-[#9A77CF] font-medium
    Value: text-sm font-medium color #262254 / white dark, mt-0.5
  Fields:
    Full Name | Display Name
    Email Address | Phone Number
    Date of Birth | Gender (shown as badge)
    City | Country
    Bio (full width, text-sm muted, italic if empty "No bio added yet")

EDIT mode — react-hook-form:
  Same fields as inputs. Input style:
    border border-[#543884]/20, rounded-xl, px-4 py-2.5, text-sm
    focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent
    bg-white (light) / bg-[#1a0f2e] (dark)
    w-full
  Bio: textarea, rows=3, same styling, resize-none
  Gender: segmented control (Male / Female / Prefer not to say)
    Selected: bg gradient CTA + white; unselected: bg-[#543884]/5 text-[#543884]
  
  Bottom action row (flex justify-end gap-3, mt-6):
    "Cancel" ghost button → isEditing=false, reset form
    "Save Changes" CTA gradient button, loading state with spinner
    On success: show inline toast — 
      fixed bottom-6 right-6, bg-white, border-l-4 border-[#543884],
      shadow-xl, rounded-xl, px-5 py-3, flex items-center gap-3
      CheckCircle icon #543884 + "Profile updated successfully"
      Auto-dismiss after 3s (setTimeout)

AVATAR UPLOAD CARD (separate card below personal info):
  Header: "Profile Picture"
  Left: current avatar (w-16 h-16) + name + role badge
  Right: two buttons:
    "Upload Photo" → CTA gradient, triggers file input
      Accepted: image/jpeg, image/png, image/webp, max 5MB
      On select: show filename + file size below button
      Show preview thumbnail (URL.createObjectURL) replacing avatar
    "Remove Photo" → ghost, text-[#EC4176], only visible if avatar exists
  Below buttons: text-xs muted 
    "Accepted formats: JPG, PNG, WEBP · Max size: 5MB"
  Note: actual upload is mocked (no real API) — just update local state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 2 — PASSWORD & SECURITY  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE PASSWORD CARD:
  react-hook-form, 3 fields (all with Lock icon left, Eye/EyeOff toggle right):
    Current Password
    New Password
    Confirm New Password

  Password strength meter (below New Password field):
    4 segment bar. Filled count based on rules met:
      1 seg #EC4176 "Weak" / 2 segs #FFA45E "Fair" / 
      3 segs #9A77CF "Good" / 4 segs #543884 "Strong"
    Rules checklist below meter (text-xs, each with Check/X icon):
      ✓ At least 8 characters
      ✓ One uppercase letter  
      ✓ One number
      ✓ One special character
      Check icon: #543884 if met; X icon: #EC4176/50 if not

  Validation: newPassword === confirmPassword, currentPassword required
  "Update Password" button: CTA gradient, full width, loading + success toast

ACTIVE SESSIONS CARD (below password card):
  Header: "Active Sessions" + small badge with session count
  List of 2-3 mock sessions (flex rows):
    Left: device icon (Monitor / Smartphone from lucide) color #9A77CF
    Middle: 
      "Chrome on Windows" / "Safari on iPhone" etc — font-medium text-sm
      "Dhaka, Bangladesh · 2 hours ago" — text-xs muted
    Right: 
      Current session → green dot + "This device" badge 
        bg-green-50 text-green-700 text-xs rounded-full px-2
      Other sessions → "Revoke" ghost button text-[#EC4176] text-xs
  Footer: "Sign out all other sessions" link text-[#EC4176] text-sm

TWO-FACTOR AUTHENTICATION CARD:
  Toggle row: Shield icon (#543884) + "Two-Factor Authentication" label
    + description text muted + toggle switch on right
  Toggle: checked=bg-[#543884], unchecked=bg-gray-200
  When enabled: show green badge "Enabled" + 
    "Authenticator app connected" text + "Manage" link #9A77CF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 3 — NOTIFICATIONS  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Single card. Toggle rows grouped by category.

Toggle row component (reusable local):
  flex justify-between items-center, py-3.5, border-b border-[#543884]/8 (last:border-0)
  Left: icon (color #9A77CF, w-4 h-4) + flex-col:
    Label: text-sm font-medium color #262254 / white dark
    Description: text-xs text-[#9A77CF]/70
  Right: toggle switch — checked bg #543884, transition-colors

GROUPS:

"HR Updates" (shown to all):
  [Bell]       Leave request status updates
  [Calendar]   Shift schedule changes
  [FileText]   Payslip available
  [Award]      Performance review reminders

"Team Activity" (hr_manager + admin only):
  [Users]      New employee onboarding alerts
  [UserMinus]  Resignation/offboarding notifications
  [AlertCircle] Policy violation flags

"System" (admin only):
  [Server]     System health alerts
  [Shield]     Security breach notifications
  [Database]   Backup completion reports

"Delivery Channels" section (all roles, separate card):
  Header: "How to receive notifications"
  Three channel toggles with icon:
    [Mail]     Email notifications
    [Smartphone] Push notifications  
    [MessageSquare] In-app notifications
  Each has same toggle row pattern.

"Save Preferences" CTA gradient button, bottom right, with success toast.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 4 — APPEARANCE  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THEME CARD:
  Header: "Theme Preference"
  3 selectable cards in a row (1fr grid, gap-4):
    Each: rounded-xl border-2, p-4, cursor-pointer, transition-all
    Selected: border-[#543884] shadow-md shadow-[#543884]/15
    Unselected: border-[#543884]/15 hover:border-[#9A77CF]

    "Light" card:
      Mini preview div: bg-white border, inner sidebar #543884/10, 
        inner content rows as thin bg-gray-100 lines
      Label: "Light" centered, text-sm font-medium mt-3
      Selected indicator: checkmark circle bg #543884 white check, top-right corner

    "Dark" card:
      Mini preview div: bg-[#1a0f2e], inner sidebar #543884/60,
        inner content rows as thin bg-white/10 lines
      Label: "Dark"

    "System" card:
      Mini preview div: half white + half dark split diagonally
      Label: "System default"

  On select: call existing ThemeContext setTheme() function.
  Selecting Dark/Light/System should actually apply the theme via ThemeContext.

LANGUAGE & REGION CARD:
  Two select dropdowns (same input styling):
    Language: English (US) selected, options: English UK, Bengali, French, Spanish
    Timezone: Asia/Dhaka selected, options: major world timezones
  "Save" button CTA gradient

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 5 — PRIVACY  (all roles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISIBILITY SETTINGS CARD:
  Header: "Profile Visibility"
  Subtext: "Control what others can see about you"

  Toggle rows (same pattern as notifications):
    [Eye]         Show my profile to all employees
    [Phone]       Show phone number to team members
    [Mail]        Show email address in directory
    [MapPin]      Show location/timezone

ANONYMOUS MODE CARD (separate card):
  Header: "Anonymous Mode"
  Description row: 
    Left: UserX icon (#A13670) + column:
      "Anonymous Mode" font-medium
      "Your name appears as 'HR Space User' in non-critical systems" text-xs muted
    Right: toggle (checked bg: gradient #A13670→#EC4176)
  
  Warning box (shown when anonymous mode ON, motion animate height):
    bg #FFA45E/10, border border-[#FFA45E]/30, rounded-xl, p-4
    AlertTriangle icon #FFA45E + text-sm:
    "Anonymous mode is active. Your identity is hidden in peer reviews 
     and open feedback forms. Admin and HR can still see your identity."

DATA & PRIVACY CARD:
  Three action rows (flex justify-between, py-3, border-b last:border-0):
    "Download My Data"      → ghost button "Request Export" #9A77CF
    "Delete My Account"     → ghost button "Delete Account" #EC4176
    "Privacy Policy"        → link with ExternalLink icon #9A77CF

  Delete Account: clicking shows inline confirmation (no modal — 
    expand a confirmation section below the row with animation):
    Red warning text + input "Type DELETE to confirm" + 
    "Permanently Delete" red button + "Cancel" link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 6 — EMPLOYMENT DETAILS  (admin + hr_manager)
TAB 6 — MY EMPLOYMENT  (employee)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAME LAYOUT — but admin/hr_manager can edit fields; employee sees read-only.

Info grid (2 col on md+):
  Employee ID        | Job Title
  Department         | Reporting Manager
  Employment Type    | Work Location
  Join Date          | Contract End Date (if applicable)
  Salary Band        | (admin/hr_manager only — hidden from employee)
  Notice Period      | Probation End Date

Employee: all fields read-only (VIEW mode only, no Edit button)
Admin/HR Manager: Edit button → same form pattern as Personal Info tab

EMPLOYMENT TIMELINE CARD (below info grid):
  Header: "Employment History" + small badge with entry count
  Vertical timeline (relative, left border-l-2 border-[#543884]/20):
    Each entry (pl-6, pb-6, relative):
      Left dot: absolute -left-[5px], w-2.5 h-2.5 rounded-full bg-[#543884]
      Date range: text-xs text-[#9A77CF] font-medium
      Role + Department: text-sm font-semibold color #262254 / white dark
      Description: text-xs muted
    Show 3 mock history entries. Last entry dot: bg-[#EC4176] (current role)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 7 — ACTIVITY LOG  (admin)
TAB 7 — MY ACTIVITY  (employee — limited view)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header row: "Activity Log" + 
  Filter row (flex gap-2 flex-wrap, mt-4):
    Filter buttons (pill toggles, same segmented style):
      "All" | "Login" | "Profile" | "Settings" | "Security"
    Date range input (type="date" from/to, same input styling)
    "Export Log" ghost button with Download icon #9A77CF (admin only)

Activity list (flex-col gap-0, divided):
  Each row (flex items-start gap-4, py-4, border-b border-[#543884]/8):
    Left: icon circle (w-9 h-9, rounded-full):
      Login event     → LogIn icon, bg #543884/10, icon #543884
      Profile update  → Edit icon, bg #9A77CF/10, icon #9A77CF
      Password change → Lock icon, bg #A13670/10, icon #A13670
      Settings change → Settings icon, bg #FFA45E/10, icon #FFA45E
      Security event  → Shield icon, bg #EC4176/10, icon #EC4176
    Middle:
      Event title: text-sm font-medium color #262254 / white dark
      Detail: text-xs muted (e.g. "Changed password" / "Updated phone number")
      IP + Location: text-xs text-[#9A77CF] (admin sees IP; employee does not)
    Right: 
      Timestamp: text-xs muted text-right
      "2h ago" relative + "May 24, 2026 14:32" on hover (title attribute)

  Show 10 mock entries covering a realistic mix of event types.
  "Load more" ghost button centered at bottom.

Employee sees same layout but:
  No IP addresses
  No Export button  
  Only their own events (no impersonation or system-level events)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAB 8 — SYSTEM SETTINGS  (admin only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY SETTINGS CARD:
  Edit mode same as personal info pattern.
  Fields: Company Name | Company Email | Company Phone
          Industry | Company Size | Founded Year
          Company Address (full width textarea)
  Logo upload (same pattern as avatar upload card)

PLATFORM SETTINGS CARD:
  Toggle rows:
    [Users]      Allow employee self-registration
    [Mail]       Require email verification
    [Lock]       Force 2FA for all HR Managers
    [Eye]        Allow employees to view org chart
    [Download]   Allow employees to download payslips
    [Bell]       Global notification master switch

  Session timeout select:
    "Auto logout after:" → select (15 min / 30 min / 1 hour / 4 hours / Never)
    Same input styling

DANGER ZONE CARD:
  bg-[#EC4176]/5, border border-[#EC4176]/20, rounded-2xl, p-6
  Header: "Danger Zone" color #EC4176, font-semibold
  Two action rows:
    "Reset All Settings to Default" → outline button border-[#EC4176] text-[#EC4176]
    "Wipe All Employee Data"        → same style, with confirmation expand pattern

===================================================================
ROUTING & INTEGRATION
===================================================================
Add to src/app/routes.tsx inside the existing Layout/ProtectedRoute:
  { path: 'profile', Component: Profile }

Add to src/app/components/layout/Sidebar.tsx:
  A "Profile" nav item at the bottom of the nav list (above logout),
  linking to /profile.
  Icon: UserCircle, same styling as other sidebar nav items.

In src/app/components/layout/Header.tsx:
  The existing user avatar/name in the top-right dropdown —
  add a "View Profile" option that navigates to /profile.
  Use useNavigate() from react-router.

===================================================================
TECHNICAL RULES
===================================================================
- Single file: src/app/pages/Profile.tsx
- Extract each tab panel as a local const component inside the file
  (PersonalInfoTab, SecurityTab, NotificationsTab, etc.)
- All form state: react-hook-form (already in project)
- All animations: motion from "motion/react"
- No real API calls — all saves are mock (setTimeout 800ms then success)
- Toast: local state, fixed position, auto-dismiss 3s, z-50
- Active tab: useState<string>('personal'), persisted to 
  sessionStorage so refreshing keeps you on the same tab
- Role gating: const { user } = useAuth(); then conditional rendering
  Never hide with CSS — use ternary/&& so hidden tabs don't mount
- Dark mode: all bg/text must respond to .dark class via dark: variants
- Responsive: left sidebar → top tab strip below lg breakpoint
- Icons: lucide-react only, w-4 h-4 default, w-5 h-5 for section headers
- Input styling must match existing Input.tsx component in the project
- Button styling must match existing Button.tsx primary variant
- Keep file under 700 lines — if longer, split tab panels into
  src/app/pages/profile/ subfolder with index.tsx + one file per tab