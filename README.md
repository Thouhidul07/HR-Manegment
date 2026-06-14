# HRSpace

HRSpace is split into a React frontend and an Express/MySQL backend.

## Folders

- `frontend/` - React, React Router, Tailwind-style UI components, Recharts, Axios.
- `backend/` - Node.js, Express.js, MySQL via `mysql2`, JWT auth, bcryptjs, CORS, dotenv, express-validator, multer.
- `backend/src/main/` - shared features used by all roles, such as auth, employees, attendance, leave, payroll, training, expenses, tasks, and forums.
- `backend/src/roles/` - role-specific route modules. Each role has its own dashboard and attendance entry points.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Run backend with XAMPP MySQL

1. Start Apache/MySQL from XAMPP.
2. Import `backend/database/hrspace_xampp.sql` in phpMyAdmin.
   This script drops and recreates the `hrspace` database tables, then seeds demo users, roles, permissions, attendance, payroll, training, tasks, expenses, projects, forum data, and notifications.
3. Copy `backend/.env.example` to `backend/.env` and update the values.

```bash
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:5000`. The Vite frontend runs at `http://localhost:5173` and proxies API calls through `/api`.

## Backend Authorization Tests

Import `backend/database/hrspace_xampp.sql` first so the demo users exist, then run:

```bash
cd backend
npm test
```

These tests use Node's built-in test runner and verify that restricted APIs return `403` for the wrong role and `401` without a token.

## Login Credentials

Demo logins from `backend/database/hrspace_xampp.sql`:

- Admin / CEO
  Email: `admin@nexoratech.com`
  Password: `Admin@1234`

- HR Manager
  Email: `hr.manager01@nexoratech.com`
  Password: `Hr@1234`

- Employee
  Email: `employee01@nexoratech.com`
  Password: `Emp@1234`

- Project Manager
  Email: `pm01@nexoratech.com`
  Password: `ProjectMgr@123`

Demo company scope:

- Company: `NexoraTech Ltd`
- Domain: `nexoratech.com`
- Seeded users: 1 Admin / CEO, 2 HR Managers, 8 Employees.
- Admin user title: Chief Executive Officer.

## Role Access Model

The XAMPP database seed includes role-based access control tables:

- `roles` - Admin / CEO, HR Manager, Employee.
- `permissions` - Module actions such as `employees.view_all`, `leave.approve`, and `payroll.view_self`.
- `role_permissions` - Maps each role to allowed permissions.
- `access_requests` - Lets limited users request extra permissions for admin/HR review.

Default access:

- Admin / CEO has every permission across every module and is the company authority role.
- Admin / CEO approves or rejects public account registrations from `Account Approvals`.
- HR Manager can manage HR operations, employees, attendance, leave approvals, training, performance, expenses, forum moderation, and reports.
- Employee can only access self-service actions like own profile, own attendance, own leave requests, own payroll, own expenses, own training, own performance, and forum posting.

## Seeded Demo Coverage

`backend/database/hrspace_xampp.sql` includes sample data for:

- Current-month attendance records for employee calendars and attendance pages.
- Payroll records and employee payslips.
- Training sessions, enrollments, progress, certificates, course materials UI support.
- Leave requests, expenses, tasks, notifications, forum posts/replies/reactions, peer reviews, performance reviews, CV candidates, and project/task demo data.

After editing backend code or re-importing SQL, restart the backend server before checking the frontend.
