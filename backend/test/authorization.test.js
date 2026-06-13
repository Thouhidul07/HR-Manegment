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

  await login("admin", "admin@hrms.com", "Admin@1234");
  await login("hrManager", "hr@hrms.com", "Hr@1234");
  await login("employee", "employee@hrms.com", "Emp@1234");
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
