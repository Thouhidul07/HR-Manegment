You are building a public-facing Landing Page for HR Space, a modern HR Management 
System. This page lives OUTSIDE the authenticated Layout shell — it's the first 
thing visitors see before logging in.

The project uses: React + TypeScript, Tailwind CSS v4, lucide-react@0.487.0, 
and the `motion` library (v12, already installed — import from "motion/react").

=== BRAND COLORS (use CSS variables where possible) ===
--primary:          #543884   (Deep Purple — sidebar, headings, primary UI)
--sidebar-primary:  #9A77CF   (Medium Purple — accents, hover, glows)
--action:           #EC4176   (Paradise Pink — CTAs, highlights, badges)
--warning:          #FFA45E   (Sandy Orange — secondary accent, warm highlights)
--foreground:       #262254   (Midnight Blue — body text, headings)
--background:       #F9FAFB   (Light gray — page background)
--card:             #ffffff
--border:           rgba(84,56,132,0.12)
Dark mode: --background #1a0f2e, --card #251942, --foreground #ffffff

=== FILE TO CREATE ===
src/app/pages/LandingPage.tsx
(Also add route: { path: "landing", Component: LandingPage } in routes.tsx,
and make "/" redirect to "/landing" for unauthenticated users if AuthContext exists,
otherwise just add the route.)

=== PAGE STRUCTURE ===
Build a single-page layout with these sections in order:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — NAVBAR (sticky, top)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Logo left: "HR" in #EC4176 + "Space" in --foreground, bold, text-xl
- Nav links center (desktop): Features, How It Works, Modules, Contact
  (smooth scroll anchors to sections below)
- Right: Theme toggle icon button + "Sign In" ghost button + "Get Started" 
  filled button in #EC4176 with white text
- On scroll > 60px: add backdrop-blur-md + bg-card/80 + shadow-sm transition
- Mobile: hamburger menu (☰) that toggles a dropdown nav
- Animate: fade-in + slide-down on mount (motion, duration 0.4s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — HERO (id="hero")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full-viewport height section. Split layout: 55% text left, 45% graphic right.

LEFT SIDE — Text content:
- Small pill badge at top: 
  gradient background (from #543884 to #EC4176), white text,
  text: "✦ Next-Gen HR Platform"
- H1 headline (text-5xl, font-bold, leading-tight):
  "Streamline Your  
   Workforce. Amplify  
   Your Impact."
  "Workforce" should be gradient text: from #9A77CF to #EC4176
- Subheading (text-lg, muted): 
  "HR Space centralizes employee management, payroll, attendance, 
   performance, and more — in one beautifully simple platform."
- Two CTA buttons side by side:
  Primary: "Get Started Free" — bg #EC4176, white, px-6 py-3 rounded-xl, shadow-md
  Secondary: "Watch Demo" — border border-[#543884] text-[#543884], same size
  Primary button: subtle pulse/glow animation on hover using box-shadow
- Trust row below CTAs: 
  "Trusted by 500+ companies" + 4 small placeholder avatar circles 
  (initials: SA, JD, MK, RL, colors cycling through brand palette) 
  + star rating "4.9 / 5.0"

RIGHT SIDE — Animated graphic (pure CSS/SVG + motion, no images):
- Floating dashboard card mockup built from divs:
  - Outer card: bg-card, rounded-2xl, border, shadow-xl, p-5, w-[340px]
  - Mini header row: colored dot + "Employee Overview" text + small badge "Live"
  - 3 mini stat rows (icon + label + value + small bar):
    Present Today: 1,156 / 1,234 — bar fill #543884
    On Leave: 48 — bar fill #EC4176  
    Training: 87 — bar fill #9A77CF
  - A small sparkline-style bar chart (5 bars, pure divs, varied heights, 
    gradient from #9A77CF to #543884)
- Floating smaller cards orbiting/near the main card (motion animate):
  Card A (top-right, offset): bg white, shadow, rounded-xl, p-3
    Shows: ✓ "Payroll Processed" + "BDT 94,210" + green dot
  Card B (bottom-left, offset): bg white, shadow, rounded-xl, p-3
    Shows: Bell icon + "3 Leave Requests" + #FFA45E dot
- All floating cards: motion animate y with infinite gentle float 
  (y: [0, -12, 0], duration 3s, ease "easeInOut", repeat Infinity)
  Stagger Card A and B by 1s offset each
- Decorative blurred blobs behind the card:
  Blob 1: absolute, w-48 h-48, bg #543884/20, rounded-full, blur-3xl, top-0 right-0
  Blob 2: absolute, w-32 h-32, bg #EC4176/15, rounded-full, blur-2xl, bottom-8 right-16

HERO ANIMATION:
- Left text: stagger children with motion (each child: opacity 0→1, y 30→0, 
  delay incrementing by 0.15s each)
- Right graphic: opacity 0→1, x 40→0, delay 0.3s, duration 0.7s
- Background: very subtle diagonal gradient overlay: 
  from transparent to rgba(84,56,132,0.04)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — STATS BAR (id="stats")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full-width band, bg-[#543884], white text, py-12.
4 stats centered in a grid (2 cols mobile, 4 cols desktop):
  - 500+  Companies
  - 50,000+  Employees Managed
  - 99.9%  Uptime
  - 4.9★  User Rating
Each stat: large bold number in #EC4176 or white, label below in white/70.
Animate: when section enters viewport (use IntersectionObserver or 
motion whileInView), numbers count up from 0 to their value over 1.5s.
Add a thin top/bottom border: rgba(255,255,255,0.1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — FEATURES (id="features")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section heading (centered):
  Eyebrow: "FEATURES" small caps, #9A77CF, letter-spacing wide
  H2: "Everything HR needs in one place"
  Subtext: muted, max-w-xl centered

6 feature cards in a 3-col grid (1 col mobile, 2 tablet, 3 desktop):
Each card: bg-card, border, rounded-2xl, p-6, hover:shadow-md transition

  1. 👥 Employee Management
     Icon bg: #543884/10, icon color: #543884
     "Centralize employee records, org charts, and documents effortlessly."

  2. ⏱ Attendance Tracking
     Icon bg: #9A77CF/10, icon color: #9A77CF
     "Real-time clock-in/out, shift management, and absence monitoring."

  3. 💰 Payroll Processing
     Icon bg: #EC4176/10, icon color: #EC4176
     "Automated payroll runs, tax compliance, and instant payslips."

  4. 📈 Performance Reviews
     Icon bg: #FFA45E/10, icon color: #FFA45E
     "360° feedback, goal tracking, and appraisal workflows."

  5. 🎓 Training & Development
     Icon bg: #543884/10, icon color: #543884
     "Course enrollment, progress tracking, and certification management."

  6. 🔐 Roles & Permissions
     Icon bg: #9A77CF/10, icon color: #9A77CF
     "Granular access control with audit logs and approval flows."

Use lucide-react icons: Users, Clock, DollarSign, Target, GraduationCap, Shield
Card animation: motion whileInView, opacity 0→1, y 20→0, stagger by index*0.1s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — HOW IT WORKS (id="how-it-works")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Alternate bg: bg-[#F4F0FA] (light) / bg-[#251942] (dark)
Section heading (centered): "Up and running in 3 steps"

3 steps in a horizontal timeline (vertical on mobile):
  Step 1 — "Set Up Your Organization"
    Number circle: bg #543884, white "01", connected to step 2 by dashed line
    Icon: Building2, desc: "Add your company details, departments, and org structure."
  Step 2 — "Onboard Your Team"
    Number circle: bg #EC4176, white "02"
    Icon: UserPlus, desc: "Import employees or invite them via email with role assignments."
  Step 3 — "Go Live"
    Number circle: bg #9A77CF, white "03"
    Icon: Zap, desc: "Everything syncs instantly. Payroll, attendance, and analytics — live."

Connector line between steps: dashed border-t-2 border-[#543884]/30 (hidden on mobile)
Step animation: whileInView, stagger left-to-right

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — CTA BANNER (id="contact")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full-width section with bold gradient background:
  background: linear-gradient(135deg, #543884 0%, #EC4176 100%)
White text throughout. Centered content:
  H2: "Ready to transform your HR operations?"
  Subtext: "Join hundreds of companies already using HR Space."
  Two buttons:
    "Start Free Trial" — white bg, #543884 text, hover:scale-105
    "Schedule a Demo" — white/20 bg, white border, white text
Decorative: two large blurred circles (white/5) at top-left and bottom-right corners
Motion: section fades in + scales slightly (scale 0.97→1) on scroll into view

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — FOOTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
bg-[#262254], white text, py-12
4-col grid (1 col mobile):
  Col 1 — Brand: Logo + tagline + social icon placeholders (Github, Twitter, LinkedIn)
  Col 2 — Product: Features, Pricing, Changelog, Roadmap
  Col 3 — Company: About, Blog, Careers, Press
  Col 4 — Legal: Privacy Policy, Terms of Service, Cookie Policy
Bottom bar: border-t border-white/10, "© 2026 HR Space. All rights reserved." 
+ "Made with ♥ for modern HR teams"

=== ANIMATION SUMMARY ===
Use `motion` from "motion/react" (NOT framer-motion).
- Navbar: initial opacity/y mount animation
- Hero text: staggered children (0.15s each)
- Hero graphic: translate-x entrance
- Floating cards: infinite y float loop
- Stats: count-up on viewport enter (use whileInView + custom counter hook)
- Feature cards: staggered whileInView fade+rise
- Steps: staggered whileInView left-to-right
- CTA banner: whileInView scale+fade
- All hover interactions: transition-all duration-200 (Tailwind), 
  no heavy spring animations on hover

=== TECHNICAL RULES ===
- Single file: src/app/pages/LandingPage.tsx
- Use only CSS variables from theme.css + Tailwind utilities
- Hardcode colors ONLY for gradients and decorative blobs where CSS vars 
  don't translate (e.g. linear-gradient needs hex)
- Dark mode: uses .dark class on <html> (already handled by ThemeContext)
  All bg/text colors must respond to dark mode via CSS variables
- Icons: lucide-react only
- No external image URLs — all visuals are pure divs/SVG/CSS
- The page must be fully responsive (mobile-first)
- All buttons that say "Sign In" or "Get Started" should use 
  react-router's <Link to="/login"> 
- Keep the file under 600 lines — extract sub-components 
  (HeroSection, FeaturesSection, etc.) as local functions within the file
