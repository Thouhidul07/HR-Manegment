const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const { pool } = require("../src/config/database");

let server;
let baseUrl;
const tokens = {};

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { status: response.status, data };
}

async function login(role, email, password) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  assert.equal(response.status, 200, `${role} login should succeed`);
  assert.ok(response.data.token, `${role} login should return a token`);
  tokens[role] = response.data.token;
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  await login("admin", "admin@nexoratech.com", "Admin@1234");
  await login("hrManager", "hr.manager01@nexoratech.com", "Hr@1234");
  await login("projectManager", "pm01@nexoratech.com", "ProjectMgr@123");
  await login("employee", "employee01@nexoratech.com", "Emp@1234");
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test("employee cannot approve leave", async () => {
  const response = await request("/api/leave/1/status", {
    method: "PATCH",
    token: tokens.employee,
    body: { status: "approved" },
  });

  assert.equal(response.status, 403);
});

test("employee cannot approve expense", async () => {
  const response = await request("/api/expenses/1/status", {
    method: "PATCH",
    token: tokens.employee,
    body: { status: "approved" },
  });

  assert.equal(response.status, 403);
});

test("employee cannot create training", async () => {
  const response = await request("/api/training", {
    method: "POST",
    token: tokens.employee,
    body: {
      title: "Authorization QA Training",
      startsAt: "2026-06-10T10:00",
      endsAt: "2026-06-10T12:00",
    },
  });

  assert.equal(response.status, 403);
});

test("employee cannot access forum moderation", async () => {
  const response = await request("/api/forum/reports", {
    token: tokens.employee,
  });

  assert.equal(response.status, 403);
});

test("employee cannot access account approvals", async () => {
  const response = await request("/api/account-approvals", {
    token: tokens.employee,
  });

  assert.equal(response.status, 403);
});

test("employee cannot access admin-only role authority APIs", async () => {
  const response = await request("/api/admin/dashboard", {
    token: tokens.employee,
  });

  assert.equal(response.status, 403);
});

test("hr manager cannot access admin-only role authority APIs", async () => {
  const response = await request("/api/admin/dashboard", {
    token: tokens.hrManager,
  });

  assert.equal(response.status, 403);
});

test("hr manager cannot access account approvals", async () => {
  const response = await request("/api/account-approvals", {
    token: tokens.hrManager,
  });

  assert.equal(response.status, 403);
});

test("admin cannot create normal forum posts or comments", async () => {
  const postResponse = await request("/api/forum/posts", {
    method: "POST",
    token: tokens.admin,
    body: {
      title: "Admin should not post here",
      content: "Admin is expected to use moderation, not normal posting.",
      category: "General",
    },
  });
  const commentResponse = await request("/api/forum/posts/1/replies", {
    method: "POST",
    token: tokens.admin,
    body: { content: "Admin should not comment here." },
  });

  assert.equal(postResponse.status, 403);
  assert.equal(commentResponse.status, 403);
});

test("employee cannot access payroll management APIs", async () => {
  const processResponse = await request("/api/payroll/process", {
    method: "POST",
    token: tokens.employee,
    body: { payPeriod: "2026-06-30" },
  });
  const exportResponse = await request("/api/payroll/export", {
    token: tokens.employee,
  });

  assert.equal(processResponse.status, 403);
  assert.equal(exportResponse.status, 403);
});

test("employee cannot access employee management APIs", async () => {
  const response = await request("/api/employees", {
    token: tokens.employee,
  });

  assert.equal(response.status, 403);
});

test("requests without a token are rejected", async () => {
  const response = await request("/api/employees");

  assert.equal(response.status, 401);
});

test("admin sees project overview but cannot access detailed project management", async () => {
  const overviewResponse = await request("/api/projects/overview", {
    token: tokens.admin,
  });
  const projectsResponse = await request("/api/projects", {
    token: tokens.admin,
  });
  const wbsResponse = await request("/api/projects/wbs", {
    token: tokens.admin,
  });
  const historyResponse = await request("/api/projects/history", {
    token: tokens.admin,
  });

  assert.equal(overviewResponse.status, 200);
  assert.equal(typeof overviewResponse.data.totalProjects, "number");
  assert.equal(typeof overviewResponse.data.activeWbsItems, "number");
  assert.equal(typeof overviewResponse.data.overdueWbsItems, "number");
  assert.equal(typeof overviewResponse.data.completedWbsItems, "number");
  assert.equal(projectsResponse.status, 403);
  assert.equal(wbsResponse.status, 403);
  assert.equal(historyResponse.status, 403);
});

test("project manager can access detailed project management and assign tasks", async () => {
  const projectsResponse = await request("/api/projects", {
    token: tokens.projectManager,
  });
  const historyResponse = await request("/api/projects/history", {
    token: tokens.projectManager,
  });
  const reportsResponse = await request("/api/projects/stats", {
    token: tokens.projectManager,
  });
  const tasksResponse = await request("/api/tasks", {
    token: tokens.projectManager,
  });

  assert.equal(projectsResponse.status, 200);
  assert.equal(historyResponse.status, 200);
  assert.equal(reportsResponse.status, 200);
  assert.equal(tasksResponse.status, 200);
});

test("project manager can create persistent WBS items and admin cannot mutate them", async () => {
  const projectsResponse = await request("/api/projects", {
    token: tokens.projectManager,
  });
  assert.equal(projectsResponse.status, 200);

  const projectId = projectsResponse.data.projects[0].id;
  const title = "Authorization WBS " + Date.now();
  const createResponse = await request(`/api/projects/${projectId}/wbs`, {
    method: "POST",
    token: tokens.projectManager,
    body: {
      title,
      description: "Created by authorization test",
      status: "todo",
      priority: "medium",
      progress: 5,
    },
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.data.wbsItem.title, title);

  const reloadResponse = await request(`/api/projects/${projectId}/wbs`, {
    token: tokens.projectManager,
  });
  assert.equal(reloadResponse.status, 200);
  assert.ok(reloadResponse.data.wbsItems.some((item) => item.id === createResponse.data.wbsItem.id));

  const adminCreateResponse = await request(`/api/projects/${projectId}/wbs`, {
    method: "POST",
    token: tokens.admin,
    body: { title: "Admin should not create WBS" },
  });
  assert.equal(adminCreateResponse.status, 403);

  const updateResponse = await request(`/api/projects/wbs/${createResponse.data.wbsItem.id}`, {
    method: "PUT",
    token: tokens.projectManager,
    body: { status: "completed", progress: 100 },
  });
  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.data.wbsItem.status, "completed");

  const auditResponse = await request("/api/audit-logs?module=Project%20Management&limit=25", {
    token: tokens.admin,
  });
  assert.equal(auditResponse.status, 200);
  assert.ok(auditResponse.data.logs.some((log) => log.action === "wbs_created" && log.description.includes(title)));
  assert.ok(auditResponse.data.logs.some((log) => log.action === "wbs_status_changed" && Number(log.entity_id) === Number(createResponse.data.wbsItem.id)));

  const deleteResponse = await request(`/api/projects/wbs/${createResponse.data.wbsItem.id}`, {
    method: "DELETE",
    token: tokens.projectManager,
  });
  assert.equal(deleteResponse.status, 200);
});

test("project manager completion appears in project history and audit logs", async () => {
  const createResponse = await request("/api/projects/tasks", {
    method: "POST",
    token: tokens.projectManager,
    body: {
      title: "History completion " + Date.now(),
      description: "Task created to verify project history persistence",
      status: "todo",
      priority: "high",
      assignee: "Project Manager 01",
      deadline: "2026-12-31",
      project: "Website Redesign",
      tags: ["history"],
    },
  });
  assert.equal(createResponse.status, 201);

  const updateResponse = await request(`/api/projects/tasks/${createResponse.data.task.id}`, {
    method: "PATCH",
    token: tokens.projectManager,
    body: { status: "completed" },
  });
  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.data.task.status, "completed");

  const historyResponse = await request("/api/projects/history?status=completed&assignee=Project%20Manager%2001", {
    token: tokens.projectManager,
  });
  assert.equal(historyResponse.status, 200);
  assert.ok(historyResponse.data.completedTasks.some((task) => Number(task.id) === Number(createResponse.data.task.id)));

  const projectHistoryResponse = await request(`/api/projects/1/history?status=completed&assignee=Project%20Manager%2001`, {
    token: tokens.projectManager,
  });
  assert.equal(projectHistoryResponse.status, 200);
  assert.ok(projectHistoryResponse.data.projects.some((project) => project.completedTasksList.some((task) => Number(task.id) === Number(createResponse.data.task.id))));

  const auditResponse = await request("/api/audit-logs?module=Project%20Management&action=project_task_status_changed&limit=25", {
    token: tokens.admin,
  });
  assert.equal(auditResponse.status, 200);
  assert.ok(auditResponse.data.logs.some((log) => Number(log.entity_id) === Number(createResponse.data.task.id)));

  const deleteResponse = await request(`/api/projects/tasks/${createResponse.data.task.id}`, {
    method: "DELETE",
    token: tokens.projectManager,
  });
  assert.equal(deleteResponse.status, 200);
});

test("project manager cannot access admin or HR-only controls", async () => {
  const adminResponse = await request("/api/admin/dashboard", {
    token: tokens.projectManager,
  });
  const rolesResponse = await request("/api/roles-permissions/summary", {
    token: tokens.projectManager,
  });
  const auditResponse = await request("/api/audit-logs", {
    token: tokens.projectManager,
  });
  const recruitmentResponse = await request("/api/cv-filter/candidates", {
    token: tokens.projectManager,
  });

  assert.equal(adminResponse.status, 403);
  assert.equal(rolesResponse.status, 403);
  assert.equal(auditResponse.status, 403);
  assert.equal(recruitmentResponse.status, 403);
});

test("employee can access own tasks but not project management", async () => {
  const tasksResponse = await request("/api/tasks", {
    token: tokens.employee,
  });
  const projectsResponse = await request("/api/projects", {
    token: tokens.employee,
  });

  assert.equal(tasksResponse.status, 200);
  assert.equal(projectsResponse.status, 403);
});

test("HR manager keeps HR access but cannot access detailed projects", async () => {
  const employeesResponse = await request("/api/employees", {
    token: tokens.hrManager,
  });
  const projectsResponse = await request("/api/projects", {
    token: tokens.hrManager,
  });

  assert.equal(employeesResponse.status, 200);
  assert.equal(projectsResponse.status, 403);
});
