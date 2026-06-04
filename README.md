# HRSpace

HRSpace is split into a React frontend and an Express/MySQL backend.

## Folders

- `frontend/` - React.js, React Router DOM, Bootstrap, React Icons, Recharts, Axios.
- `backend/` - Node.js, Express.js, MySQL via `mysql2`, JWT auth, bcryptjs, CORS, dotenv, express-validator, multer.
- `backend/src/main/` - shared features used by all roles, such as auth, employees, attendance, leave, and payroll.
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
3. Copy `backend/.env.example` to `backend/.env` and update the values.

```bash
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:5000` and the frontend expects API calls at `http://localhost:5173/api`.

## Login Credentials

Demo logins from `backend/database/hrspace_xampp.sql`:

- Admin
  Email: `admin@hrms.com`
  Password: `Admin@1234`

- HR Manager
  Email: `hr@hrms.com`
  Password: `Hr@1234`

- Employee
  Email: `employee@hrms.com`
  Password: `Emp@1234`

## Role Access Model

The XAMPP database seed includes role-based access control tables:

- `roles` - Admin, HR Manager, Employee.
- `permissions` - Module actions such as `employees.view_all`, `leave.approve`, and `payroll.view_self`.
- `role_permissions` - Maps each role to allowed permissions.
- `access_requests` - Lets limited users request extra permissions for admin/HR review.

Default access:

- Admin has every permission.
- HR Manager can manage HR operations, employees, attendance, leave approvals, training, performance, expenses, forum moderation, and reports.
- Employee can only access self-service actions like own profile, own attendance, own leave requests, own payroll, own expenses, own training, own performance, and forum posting.
