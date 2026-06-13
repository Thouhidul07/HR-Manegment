# HRMS Design System Documentation

## Overview
A comprehensive HR Management System built with React, TypeScript, and Tailwind CSS v4, featuring a complete light/dark mode design system.

## Design Principles

### Light Mode
- Clean white/light gray backgrounds (#ffffff, #f8f9fa)
- Soft shadows for elevation and depth
- Dark text for maximum readability
- Professional and minimal color usage
- Border opacity: rgba(0, 0, 0, 0.08)

### Dark Mode
- Deep gray backgrounds (#0a0a0a, #141414) - not pure black for reduced eye strain
- Subtle borders instead of heavy shadows
- Muted text colors (#ededed, #a1a1aa) for comfort
- Maintains accessibility standards (WCAG AA)
- Border opacity: rgba(255, 255, 255, 0.1)

## Color System

### Brand Colors
- **Primary**: #5B5FC7 (light) / #7c7ff5 (dark)
- Used for: CTAs, active states, brand elements

### Semantic Colors
- **Success**: #16a34a (light) / #22c55e (dark) - Positive actions, approvals
- **Warning**: #ea580c (light) / #f97316 (dark) - Cautions, pending states
- **Destructive**: #d4183d (light) / #ef4444 (dark) - Errors, deletions
- **Info**: #0284c7 (light) / #06b6d4 (dark) - Information, neutral actions

### Surface Colors
- **Background**: Main page background
- **Card**: Elevated content containers
- **Surface**: Secondary background areas
- **Muted**: Disabled states, subtle backgrounds

## Typography
- **Font**: System font stack (inherits from body)
- **H1**: 2xl, Medium (500) - Main page titles
- **H2**: xl, Medium - Section titles
- **H3**: lg, Medium - Card/component titles
- **H4**: base, Medium - Sub-headings
- **Body**: base, Normal (400) - Regular content
- **Small**: sm, Normal - Secondary information

## Spacing System
- Based on 8px grid system
- Gaps: 8px, 16px, 24px, 32px, 48px
- Padding: 16px (cards), 24px (pages), 8px (compact)
- Margins: Consistent with spacing scale

## Components

### Buttons
**Variants**: primary, secondary, outline, ghost, destructive
**Sizes**: sm, md, lg
**States**: default, hover, active, disabled

### Badges
**Variants**: default, success, warning, error, info, secondary
**Sizes**: sm, md
Used for: Status indicators, categories, counts

### Cards
- Rounded corners: 12px (--radius-xl)
- Border: 1px solid var(--border)
- Light mode: subtle shadow
- Dark mode: emphasis on borders

### Tables
- Sticky headers
- Hover states on rows
- Zebra striping (optional)
- Sortable columns
- Pagination support

### Forms
- Labels: Medium weight, muted color
- Inputs: Border, focus ring (2px primary)
- Error states: Red border + message
- Success states: Green border

## Modules

1. **Dashboard**: KPIs, charts, activity feed
2. **Employee Management**: CRUD operations, filtering, search
3. **Onboarding**: Step-based workflow, task tracking
4. **Attendance**: Time tracking, daily/weekly/monthly views
5. **Leave Management**: Request/approval system, balance tracking
6. **Training**: Course catalog, progress tracking
7. **Payroll**: Salary processing, breakdown visualization
8. **Expense**: Claims management, category tracking
9. **Performance**: Reviews, goals, skills assessment
10. **Roles & Permissions**: Access control matrix

## Theme Switching
- Toggle button in header (Sun/Moon icons)
- Instant theme switching with no flash
- Persists to localStorage
- All components automatically adapt

## Best Practices

### Accessibility
- WCAG AA compliant color contrast
- Keyboard navigation support
- Focus indicators on all interactive elements
- Semantic HTML structure
- ARIA labels where needed

### Performance
- Lazy loading for routes
- Optimized re-renders with React.memo
- CSS variables for theme (no JS overhead)
- Efficient chart rendering with Recharts

### Consistency
- Reusable component library
- Design tokens for all styling
- 8px grid system throughout
- Consistent icon usage (Lucide)

## Tech Stack
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router 7** - Navigation
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Radix UI** - Accessible primitives

## File Structure
```
src/
├── app/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Select.tsx
│   │       ├── StatsCard.tsx
│   │       └── Table.tsx
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── EmployeeManagement.tsx
│   │   ├── Attendance.tsx
│   │   └── ... (all modules)
│   ├── routes.tsx
│   └── App.tsx
└── styles/
    └── theme.css (Design tokens)
```

## Usage Examples

### Using Theme
```tsx
import { useTheme } from './contexts/ThemeContext';

function Component() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}
```

### Creating a Stats Card
```tsx
<StatsCard
  title="Total Employees"
  value="1,234"
  subtitle="Active users"
  icon={Users}
  iconColor="text-[var(--chart-1)]"
  trend={{ value: "+12%", isPositive: true }}
/>
```

### Using Badges
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Rejected</Badge>
```

## Future Enhancements
- Real-time data integration
- Advanced filtering and search
- Export to PDF/Excel
- Email notifications
- Mobile responsive views
- Advanced analytics dashboard
- Multi-language support
- Role-based feature flags

---

Built with attention to detail, accessibility, and enterprise-grade UX patterns.
