You are working on HR Space, a React + TypeScript + Tailwind CSS v4 HRMS application 
using React Router v7, Vite, and a custom shadcn-style component library.

=== DESIGN TOKENS (from theme.css) ===
Primary (sidebar/nav):     #543884
Secondary/accent purple:   #9A77CF
Action/CTA (pink):         #EC4176
Warning/pending:           #FFA45E
Heading/typography:        #262254
Light background:          #F9FAFB
Dark mode bg:              #1a0f2e
Dark mode card:            #251942

CSS variables already defined: --primary, --action, --action-foreground, 
--background, --foreground, --card, --border, --muted, --muted-foreground, 
--sidebar, --sidebar-foreground, --sidebar-primary

=== TASK ===
Create a complete, production-quality authentication system with these files:

--- 1. src/app/contexts/AuthContext.tsx ---
- AuthContextType: { user, login, logout, isAuthenticated, isLoading }
- User type: { id, name, email, role: 'admin' | 'hr_manager' | 'employee', avatar? }
- login(email, password): Promise<void> — mock with setTimeout(800ms), 
  accept any @hrms.com email with password 'password123', 
  or hardcode: admin@hrms.com / Admin@1234, hr@hrms.com / Hr@1234, 
  employee@hrms.com / Emp@1234 (each gets corresponding role)
- Persist auth state to localStorage key 'hrms-auth'
- Expose AuthProvider and useAuth hook

--- 2. src/app/pages/Login.tsx ---
Full-page login screen (no sidebar/header — outside the Layout shell).
LEFT PANEL (60% width, desktop):
  - Decorative panel with the deep purple sidebar color (#543884 / var(--sidebar))
  - Large HRMS logo/wordmark (HR in --action pink, MS in white)  
  - Tagline: "Streamline your workforce, amplify your impact"
  - 3 feature highlights with icons: Workforce Management, Smart Analytics, Secure & Compliant
  - Subtle geometric pattern or gradient overlay for visual depth
RIGHT PANEL (40% width, desktop; full width mobile):
  - White/card background
  - Centered form (max-w-sm, vertically centered)
  - "Welcome back" heading in --foreground (#262254)
  - Subheading: "Sign in to HR Space"
  - Email input with Mail icon
  - Password input with Lock icon + toggle show/hide (Eye/EyeOff)
  - "Remember me" checkbox + "Forgot password?" link (right-aligned)
  - Primary sign-in button (full width, --action pink #EC4176)
    with loading spinner while authenticating
  - Error alert box (red, with AlertCircle icon) shown on failed login
  - Bottom: "New to HR Space? Contact your administrator"
  - Theme toggle button (top-right corner of right panel)
Layout: flex row on desktop, single column on mobile (left panel hidden on mobile).
Use only existing CSS variables, no hardcoded colors except where vars don't exist.

--- 3. src/app/pages/Register.tsx ---
Same left panel layout as Login.
RIGHT PANEL form fields:
  - Full Name (User icon)
  - Work Email (Mail icon) 
  - Password (Lock icon + show/hide)
  - Confirm Password (Lock icon + show/hide)
  - Role selector: Employee / HR Manager (dropdown/segmented control)
  - Department (Select dropdown): Engineering, HR, Finance, Marketing, Sales, Operations
  - "I agree to the Terms of Service and Privacy Policy" checkbox
  - Register button (--action pink, full width, loading state)
  - Error handling: show inline field errors (required, email format, password match, min 8 chars)
  - On success: show a success state ("Account created! Awaiting admin approval.") 
    with a checkmark and link back to login
  - Bottom link: "Already have an account? Sign in"
Use react-hook-form for validation. No backend call needed — mock a 1.2s delay then success.

--- 4. src/app/components/auth/ProtectedRoute.tsx ---
- Wraps any route; checks useAuth().isAuthenticated
- If loading: show full-page spinner (--primary purple spinner, centered)
- If not authenticated: <Navigate to="/login" replace />
- If authenticated: <Outlet />

--- 5. Update src/app/routes.tsx ---
- Add route: { path: "login", Component: Login } (outside Layout, no auth required)
- Add route: { path: "register", Component: Register } (outside Layout, no auth required)  
- Wrap the existing Layout route with ProtectedRoute as the parent component
- Add a catch-all: { path: "*", element: <Navigate to="/" replace /> }

--- 6. Update src/app/App.tsx ---
- Wrap RouterProvider with <AuthProvider> from AuthContext

--- 7. Update src/app/components/layout/Header.tsx ---
- Import and use useAuth()
- Show real user.name and user.email in the user menu (instead of hardcoded "Super Admin")
- Wire up the Logout button: call logout() then navigate('/login')
- Show user initials (first letters of name) in the avatar circle

=== STYLE REQUIREMENTS ===
- Match the existing app's visual language exactly (rounded-lg/xl cards, border-border, 
  shadow-sm, transition-all, hover:opacity-90 patterns)
- Use only Tailwind utility classes and existing CSS variables
- The login/register pages must look polished and on-brand — not generic
- Inputs should match the existing Input.tsx component style 
  (border border-border bg-background focus:ring-2 focus:ring-primary rounded-lg)
- Buttons should match Button.tsx primary variant style
- Support both light and dark mode using existing .dark class variables
- Fully responsive: works on mobile (stacked), tablet, and desktop (split panel)

=== COMPONENT IMPORTS ===
Use components from src/app/components/ui/ (uppercase versions):
  Button from './components/ui/Button'
  Input from './components/ui/Input'
  Badge from './components/ui/Badge'
Do NOT import from lowercase shadcn files for these pages.
Icons from lucide-react.

=== DO NOT CHANGE ===
- theme.css, tailwind.css, index.css
- Any existing page components
- The sidebar/header layout for authenticated pages