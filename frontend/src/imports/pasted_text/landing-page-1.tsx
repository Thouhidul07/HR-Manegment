You are building three pages for HR Space, a React + TypeScript + Tailwind CSS v4 HRMS.
Stack: react-router v7, lucide-react@0.487.0, `motion` v12 (import from "motion/react").

=== EXACT COLOR PALETTE — all 6 must appear meaningfully ===

#262254  Midnight Blue   → page headings, footer bg, deepest text, darkest panel layer
#543884  Deep Purple     → left panel background, navbar base, primary solid buttons
#9A77CF  Medium Purple   → input focus rings, hyperlinks, icon tints, secondary accents
#A13670  Berry Rose      → gradient bridge between purple and pink, hover states, tags
#EC4176  Paradise Pink   → CTA buttons (gradient end), "HR" in logo, badges, highlights
#FFA45E  Sandy Orange    → star ratings, warm stat highlights, warning badges, sparkle dots

GRADIENT RECIPES (use these exactly):
  Left panel bg:      linear-gradient(145deg, #262254 0%, #543884 100%)
  CTA buttons:        linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)
  Headline text:      linear-gradient(90deg, #9A77CF, #EC4176)  [clip-text technique]
  Stats/dark band:    linear-gradient(135deg, #543884 0%, #9A77CF 100%)
  Hero glow blobs:    use #9A77CF/20, #EC4176/15, #FFA45E/10 for blurred bg shapes

=== FILE 1: src/app/pages/LandingPage.tsx ===

NAVBAR (sticky):
- Logo: "HR" in #EC4176 bold + "Space" in #262254 (light) / white (dark)
- Nav links (smooth scroll): Features · Modules · How It Works · Contact
- Right: theme toggle + "Sign In" ghost button (border #9A77CF, text #543884) 
  + "Get Started" button using the CTA gradient above, white text, rounded-xl
- On scroll: backdrop-blur-md, bg-white/80 (light) / bg-[#262254]/80 (dark), shadow-sm
- Mobile: hamburger → dropdown with same links
- motion: initial opacity:0 y:-20 → opacity:1 y:0, duration 0.4s

---

HERO SECTION (full viewport height):
Layout: 58% left text / 42% right graphic on desktop; stacked on mobile.

LEFT — stagger each child with motion (opacity 0→1, y 30→0, delay += 0.12s):
  a) Pill badge: gradient bg (#543884→#EC4176), white text, rounded-full, px-4 py-1.5
     Text: "✦ Trusted by 500+ Companies"
  b) H1 (text-5xl font-bold leading-tight, color #262254):
     "Streamline Your" (plain)
     "Workforce." (gradient clip-text #9A77CF→#EC4176)
     "Amplify Your Impact."
  c) Subtext (text-lg, color #7c6b9e): 80-char description of HRMS value prop
  d) Two buttons row:
     Primary: "Get Started Free" → CTA gradient, white, px-6 py-3 rounded-xl, shadow-lg
       hover: brightness-110, scale-[1.02], transition-all
     Secondary: "Watch Demo" → border-2 border-[#543884], text-[#543884], 
       same size, hover:bg-[#543884]/5
  e) Trust row: 
     4 avatar circles (initials, bg cycling: #9A77CF, #EC4176, #543884, #A13670, white text)
     + "500+ teams trust HR Space" in muted text
     + ★★★★★ in #FFA45E + "4.9/5" text

RIGHT — floating dashboard card mockup (motion: opacity 0→1, x 50→0, delay 0.35s):
  Outer card: bg-white, rounded-2xl, shadow-2xl, border border-[#543884]/10, p-5, w-[320px]
  Header row: purple dot (#9A77CF) + "Workforce Overview" bold + Live badge 
    (bg #EC4176/10, text #EC4176, text-xs rounded-full px-2)

  3 stat rows (each: icon in tinted circle + label + value + mini progress bar):
    Row 1 — Users icon, circle bg #543884/10 icon #543884
            "Present Today"  →  "1,156 / 1,234"
            Progress bar: filled #543884, track #543884/15, 93% width
    Row 2 — Calendar icon, circle bg #EC4176/10, icon #EC4176
            "On Leave"  →  "48 employees"
            Progress bar: filled #EC4176, 4% width
    Row 3 — TrendingUp icon, circle bg #9A77CF/10, icon #9A77CF
            "In Training"  →  "87 enrolled"
            Progress bar: filled #9A77CF, 7% width

  Mini bar chart below (5 bars, pure divs, flex items-end gap-1, h-12 total):
    Heights: 40%, 65%, 50%, 80%, 60%
    Colors cycling: #543884, #9A77CF, #A13670, #EC4176, #9A77CF
    Label row: Mon Tue Wed Thu Fri in 9px muted text

  TWO floating satellite cards (motion: infinite y float [0,-10,0] 3s ease):
    Card A (top-right offset, translate x+24 y-16):
      bg white, shadow-xl, rounded-xl, p-3, border border-[#EC4176]/10
      ✓ circle (bg #EC4176, white checkmark) + "Payroll Processed" bold
      "$94,210" in #262254 + small #FFA45E dot "This month"
      Stagger: delay 0s

    Card B (bottom-left offset, translate x-20 y+20):
      bg white, shadow-xl, rounded-xl, p-3, border border-[#9A77CF]/10
      Bell icon (color #9A77CF) + "3 Leave Requests"
      "Pending approval" in muted text + #FFA45E pulsing dot
      Stagger: delay 1.5s

  Decorative blobs (absolute, pointer-events-none, z-behind card):
    Blob 1: w-48 h-48, bg #543884/20, rounded-full, blur-3xl, top-0 right-4
    Blob 2: w-32 h-32, bg #EC4176/15, rounded-full, blur-2xl, bottom-4 right-20
    Blob 3: w-20 h-20, bg #FFA45E/10, rounded-full, blur-xl, top-16 right-0

---

STATS BAND:
bg: linear-gradient(135deg, #543884, #9A77CF), py-14, text white
4 stats in grid (1 col mobile → 4 col desktop), dividers between cols:
  500+      Companies        → number color #FFA45E
  50,000+   Employees        → number color white
  99.9%     Uptime SLA       → number color #FFA45E  
  4.9★      User Rating      → ★ in #FFA45E, number white
Each: large bold number (text-4xl), label below (text-sm white/70)
Animate: count-up from 0 when entering viewport (whileInView, once:true)
Thin separator lines between columns: rgba(255,255,255,0.15)

---

FEATURES SECTION (id="features"):
bg-[#F4F0FA] (light) / bg-[#1a0f2e] (dark)
Section header (centered):
  Eyebrow: "CAPABILITIES" uppercase tracking-[0.15em] text-[#9A77CF] text-xs
  H2: "Everything your HR team needs" — color #262254 / white in dark
  Subtext muted, max-w-lg centered

6 feature cards (3-col grid, gap-6):
Use lucide-react icons. Each card: bg-white/card, border, rounded-2xl, p-6, 
hover:shadow-md hover:-translate-y-0.5 transition-all

  1. Users       → "Employee Management"   → icon bg #543884/10, icon #543884
  2. Clock       → "Attendance Tracking"   → icon bg #9A77CF/10, icon #9A77CF
  3. DollarSign  → "Payroll Processing"    → icon bg #EC4176/10, icon #EC4176
  4. Target      → "Performance Reviews"   → icon bg #A13670/10, icon #A13670
  5. GraduationCap → "Training & Dev"      → icon bg #FFA45E/10, icon #FFA45E
  6. Shield      → "Roles & Permissions"   → icon bg #262254/10, icon #262254

Each card bottom: small "Learn more →" link in #9A77CF
whileInView: opacity 0→1, y 20→0, stagger index × 0.08s

---

HOW IT WORKS (id="how-it-works"):
bg white (light) / bg-[#251942] (dark), py-24
Header: same eyebrow+H2 pattern, "Three steps to go live"

Steps row (desktop: horizontal with connecting dashed line; mobile: vertical):
  Step 1 — number circle bg #543884, white "01" bold
    Icon: Building2 (bg #543884/10, icon #543884)
    Title: "Set Up Your Organization" bold #262254
    Desc: muted, 2 lines max

  Step 2 — number circle bg gradient(#A13670, #EC4176), white "02"
    Icon: UserPlus (bg #EC4176/10, icon #EC4176)
    Title: "Onboard Your Team"
    Desc: muted

  Step 3 — number circle bg #EC4176, white "03"
    Icon: Zap (bg #FFA45E/10, icon #FFA45E)
    Title: "Go Live Instantly"
    Desc: muted

Dashed connector (desktop only): border-t-2 border-dashed border-[#9A77CF]/30
between step circles, z-0 (steps z-10)
whileInView stagger left to right

---

CTA BANNER (id="contact"):
Full width, py-24
bg: linear-gradient(135deg, #262254 0%, #543884 40%, #A13670 70%, #EC4176 100%)
Centered white text:
  H2 text-4xl bold: "Ready to transform your HR?"
  Sub: "Join forward-thinking teams already on HR Space."
  Buttons row:
    "Start Free Trial" → bg white, text #543884, px-6 py-3, rounded-xl, 
      hover:scale-105, shadow-md
    "Schedule a Demo" → bg white/15, border border-white/30, text white, same size,
      hover:bg-white/25
Decorative circles:
  Top-left: w-64 h-64, bg white/5, rounded-full, -translate-x-1/2 -translate-y-1/2
  Bottom-right: w-96 h-96, bg white/5, rounded-full, translate-x-1/3 translate-y-1/3
  A few tiny dots (#FFA45E/40, #9A77CF/40) scattered abs for sparkle
whileInView: scale 0.96→1, opacity 0→1, duration 0.5s

---

FOOTER:
bg #262254, text white, py-16
4-col grid (1 mobile):
  Col 1: Logo + "Streamlining HR for modern teams." muted white/60
    + 3 social icon buttons (Github, Twitter, Linkedin) — 
      rounded-full border border-white/15, p-2, hover:border-[#9A77CF]
  Col 2–3: Product + Company nav links (white/70, hover:text-[#9A77CF])
  Col 4: Subscribe email input row (input bg white/10, placeholder white/40,
    button bg gradient CTA)
Bottom: border-t border-white/10, "© 2026 HR Space" + "Built for modern HR teams"
+ a small row of colored dots (1 each in all 6 palette colors, w-2 h-2 rounded-full)
  as a subtle brand signature

---

=== FILE 2: src/app/pages/Login.tsx ===

Full-page, outside Layout shell.
TWO-PANEL: flex row desktop, single col mobile.

LEFT PANEL (40% desktop, hidden mobile):
bg: linear-gradient(145deg, #262254 0%, #543884 100%)
Content (centered, max-w-xs, px-10):
  Logo: "HR" bold text-3xl color #EC4176 + "Space" text-3xl color white
  Tagline: "Streamline your workforce. Amplify your impact." white/80 mt-4
  Decorative feature pills below tagline (3 items, mt-8, flex-col gap-3):
    Each pill: bg white/10, rounded-full, px-4 py-2, text-sm white/90
    + leading icon (color #9A77CF or #FFA45E or #EC4176)
    Items: "✦ Workforce Management"  /  "✦ Smart Analytics"  /  "✦ Secure & Compliant"
  Decorative blob: w-48 h-48, bg #9A77CF/20, rounded-full, blur-3xl, 
    absolute bottom-16 left-0
  Blob 2: w-24 h-24, bg #EC4176/15, rounded-full, blur-2xl, absolute top-24 right-0
  Small dots scattered (3-4 circles, w-1.5 h-1.5, colors #FFA45E, #9A77CF, #EC4176, 
    opacity-40) — purely decorative sparkle

RIGHT PANEL (60% desktop, full mobile):
bg-white (light) / bg-[#1a0f2e] (dark)
Centered form (max-w-sm w-full, mx-auto, py-16 px-8):
  Top-right corner: theme toggle button (Moon/Sun icon, hover:bg-[#9A77CF]/10)
  
  Small logo for mobile only (show on small screens): 
    "HR" #EC4176 + "Space" #262254
  
  Heading: "Welcome back" — font-bold text-2xl color #262254 / white dark
  Subheading: "Sign in to HR Space" — text-sm color #7c6b9e mt-1 mb-8

  Email field:
    Label: "Email address" text-sm font-medium color #262254 / white dark
    Input: relative div, Mail icon (left, color #9A77CF), 
      pl-10 pr-4 py-3 rounded-xl border border-[#543884]/20
      focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent
      bg-white (light) / bg-[#251942] (dark)
  
  Password field (mt-4):
    Label: "Password"
    Input: Lock icon left (#9A77CF) + Eye/EyeOff toggle right (#9A77CF/60)
    Same styling as email
  
  Row (mt-3, flex justify-between):
    Checkbox: "Remember me" — accent-[#543884]
    Link: "Forgot password?" — text-[#9A77CF] text-sm hover:text-[#EC4176]
  
  Sign In button (mt-6, w-full):
    bg: linear-gradient(135deg, #543884, #A13670, #EC4176)
    text-white, py-3, rounded-xl, font-semibold
    hover: brightness-110, shadow-lg shadow-[#EC4176]/20
    Loading state: spinner (white, animate-spin) + "Signing in..."
  
  Error alert (shown on failure, mt-4):
    bg #EC4176/10, border border-[#EC4176]/30, rounded-xl, p-4
    AlertCircle icon #EC4176 + error message text-[#A13670]
  
  Divider (mt-6): thin line with "or" centered, border-[#543884]/15
  
  Google-style SSO button (mt-4, w-full):
    bg white (light) / bg-[#251942] (dark), border border-[#543884]/20
    rounded-xl, py-3, text-sm text-[#262254]/dark:text-white
    Globe icon (#9A77CF) left + "Continue with SSO"
  
  Bottom text (mt-8, text-center, text-sm):
    "New to HR Space?" color muted + 
    " Contact your administrator" link #9A77CF hover:#EC4176

Motion: right panel form children stagger (opacity 0→1, y 15→0, each 0.1s delay)
Left panel: opacity 0→1, x -30→0, duration 0.6s

---

=== FILE 3: src/app/pages/Register.tsx ===

Same two-panel layout as Login.

LEFT PANEL: identical gradient bg and logo.
Tagline: "Join your team on HR Space."
Feature pills:
  "✦ Instant Access"  /  "✦ Role-Based Permissions"  /  "✦ Secure by Default"

RIGHT PANEL form (max-w-sm):
  Heading: "Create your account"
  Subheading: "Set up your HR Space profile" muted

  STEP INDICATOR (top of form):
    2 connected dots: Step 1 "Details" → Step 2 "Role"
    Active step: bg gradient CTA; inactive: bg #543884/20
    Connector line: bg-[#543884]/15
    (Show step 1 or 2 fields based on currentStep state)

  STEP 1 fields:
    Full Name (User icon, #9A77CF)
    Work Email (Mail icon, #9A77CF)
    Password (Lock icon + show/hide) — show strength meter below:
      4 segments, colors: #EC4176 (weak) / #FFA45E (fair) / #9A77CF (good) / #543884 (strong)
      Label text changes with strength
    Confirm Password (Lock icon + show/hide)
    "Next →" button: CTA gradient, full width
  
  STEP 2 fields:
    Department (Select dropdown, styled with border-[#543884]/20, focus ring #9A77CF):
      Options: Engineering / HR / Finance / Marketing / Sales / Operations
    Role (segmented control, 2 options):
      "Employee" | "HR Manager"
      Selected: bg gradient CTA + white text
      Unselected: bg [#543884]/5 + text [#543884]
    Terms checkbox:
      "I agree to the Terms of Service and Privacy Policy"
      Policy link: text-[#9A77CF] hover:text-[#EC4176]
      accent-[#543884]
    "Create Account" button: CTA gradient, full width, loading state (spinner)
    "← Back" ghost link above the button
  
  SUCCESS STATE (replaces form after submit):
    Animated checkmark circle: bg gradient(#9A77CF,#EC4176), white check icon
    (motion: scale 0→1, spring)
    "Account Created!" heading color #262254 / white
    "Awaiting admin approval. You'll receive an email shortly." muted
    "← Back to Sign In" link → /login, color #9A77CF

  Bottom: "Already have an account?" + "Sign in" link → /login, #9A77CF

---

=== SHARED RULES ===

Typography:
  All headings: color #262254 (light) / white (dark)
  Body/labels: color #262254 / white dark
  Muted text: #7c6b9e (light) / #b5a3d1 (dark)
  Links: #9A77CF default → #EC4176 hover, transition-colors

Inputs (all three pages):
  border: 1px solid rgba(84,56,132,0.2)
  focus: ring-2 ring-[#9A77CF] border-transparent
  bg: white (light) / #251942 (dark)
  border-radius: rounded-xl (0.75rem)
  icon color: #9A77CF

Buttons:
  Primary CTA: gradient(135deg, #543884, #A13670, #EC4176), white text, rounded-xl
  Secondary/outline: border-[#543884], text-[#543884], hover:bg-[#543884]/5
  Ghost link: text-[#9A77CF], hover:text-[#EC4176], no border

Badges/pills:
  Default: bg-[#543884]/10, text-[#543884]
  Active/highlight: bg-[#EC4176]/10, text-[#EC4176]
  Warning: bg-[#FFA45E]/15, text-[#A13670]

Dark mode: all pages must respond to the existing .dark class on <html>
  driven by ThemeContext. Replace hardcoded bg/text with dark: variants.

Motion rules:
  Library: `motion` from "motion/react" — do NOT use framer-motion
  Entrance: opacity + y (never x on mobile, causes scroll jank)
  Float loops: y only, ease "easeInOut", repeat Infinity, repeatType "mirror"
  whileInView: once:true, viewport margin "-80px"
  No animations on inputs/form controls (distracting during fill)

Routing:
  Login/Register: outside <Layout>, no sidebar/header
  Add to routes.tsx: path:"login", path:"register" as siblings to "/"
  <Link to="/login"> and <Link to="/register"> for all navigation

Code structure:
  Each page: single .tsx file, extract logical sections as local const arrow functions
  (HeroSection, FeaturesSection, etc.) — keep each file under 500 lines
  No inline style tags for things achievable with Tailwind
  Use Tailwind for layout/spacing, inline style ONLY for gradient backgrounds
  and complex color values that Tailwind v4 can't express with the custom palette