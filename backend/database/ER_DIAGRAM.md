# HRSpace ER Diagram

```mermaid
erDiagram
  USERS {
    int id PK
    varchar name
    varchar email UK
    varchar password
    enum role
    varchar phone
    varchar department
    varchar designation
    date hire_date
    decimal salary
    varchar avatar
    enum status
    timestamp created_at
    timestamp updated_at
  }

  ROLES {
    int id PK
    varchar code UK
    varchar name
    varchar description
    boolean is_system
    timestamp created_at
  }

  PERMISSIONS {
    int id PK
    varchar code UK
    varchar module
    varchar action
    varchar description
    timestamp created_at
  }

  ROLE_PERMISSIONS {
    int role_id PK,FK
    int permission_id PK,FK
    timestamp created_at
  }

  ACCESS_REQUESTS {
    int id PK
    int user_id FK
    int permission_id FK
    text reason
    enum status
    int reviewed_by FK
    datetime reviewed_at
    timestamp created_at
    timestamp updated_at
  }

  ATTENDANCE {
    int id PK
    int user_id FK
    date work_date
    datetime clock_in
    datetime clock_out
    enum status
    varchar notes
    timestamp created_at
  }

  LEAVE_REQUESTS {
    int id PK
    int user_id FK
    varchar leave_type
    date start_date
    date end_date
    text reason
    enum status
    int reviewed_by FK
    datetime reviewed_at
    timestamp created_at
    timestamp updated_at
  }

  PAYROLL {
    int id PK
    int user_id FK
    date pay_period
    decimal basic_salary
    decimal allowances
    decimal deductions
    decimal net_pay
    enum status
    timestamp created_at
  }

  TRAINING_SESSIONS {
    int id PK
    varchar title
    text description
    varchar trainer
    datetime starts_at
    datetime ends_at
    timestamp created_at
  }

  TRAINING_ENROLLMENTS {
    int id PK
    int training_id FK
    int user_id FK
    enum status
    tinyint progress
    timestamp created_at
  }

  PERFORMANCE_REVIEWS {
    int id PK
    int user_id FK
    int reviewer_id FK
    varchar review_period
    decimal score
    text goals
    text feedback
    enum status
    timestamp created_at
    timestamp updated_at
  }

  EXPENSES {
    int id PK
    int user_id FK
    varchar category
    decimal amount
    date expense_date
    text description
    varchar receipt_path
    enum status
    int reviewed_by FK
    timestamp created_at
    timestamp updated_at
  }

  FORUM_POSTS {
    int id PK
    int user_id FK
    varchar title
    text body
    varchar category
    boolean is_anonymous
    enum status
    timestamp created_at
    timestamp updated_at
  }

  FORUM_REPLIES {
    int id PK
    int post_id FK
    int user_id FK
    text body
    boolean is_anonymous
    timestamp created_at
  }

  ROLES ||--o{ ROLE_PERMISSIONS : grants
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : assigned_to
  USERS ||--o{ ACCESS_REQUESTS : requests
  USERS ||--o{ ACCESS_REQUESTS : reviews
  PERMISSIONS ||--o{ ACCESS_REQUESTS : requested_permission

  USERS ||--o{ ATTENDANCE : has
  USERS ||--o{ LEAVE_REQUESTS : submits
  USERS ||--o{ LEAVE_REQUESTS : reviews
  USERS ||--o{ PAYROLL : receives
  USERS ||--o{ TRAINING_ENROLLMENTS : enrolls
  TRAINING_SESSIONS ||--o{ TRAINING_ENROLLMENTS : contains
  USERS ||--o{ PERFORMANCE_REVIEWS : reviewed_employee
  USERS ||--o{ PERFORMANCE_REVIEWS : reviewer
  USERS ||--o{ EXPENSES : submits
  USERS ||--o{ EXPENSES : reviews
  USERS ||--o{ FORUM_POSTS : creates
  FORUM_POSTS ||--o{ FORUM_REPLIES : has
  USERS ||--o{ FORUM_REPLIES : writes
```

Note: `users.role` stores the role code (`admin`, `hr_manager`, `employee`) and matches `roles.code`. The `user_permissions` view joins users to roles and permissions for easier authorization checks.
