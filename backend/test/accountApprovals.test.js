const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");
const { pool, query } = require("../src/config/database");

let server;
let baseUrl;
let adminToken;

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

async function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

async function registerAccount(email) {
  return request("/api/auth/register", {
    method: "POST",
    body: {
      name: "QA Pending User",
      email,
      password: "Pending@1234",
      department: "Information Technology",
    },
  });
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  const adminLogin = await login("admin@nexoratech.com", "Admin@1234");
  assert.equal(adminLogin.status, 200);
  adminToken = adminLogin.data.token;
});

test.after(async () => {
  await query("DELETE FROM users WHERE email LIKE 'qa-approval-%@nexoratech.com'");
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test("registered accounts require admin approval before login", async () => {
  const email = `qa-approval-approve-${Date.now()}@nexoratech.com`;

  const registerResponse = await registerAccount(email);
  assert.equal(registerResponse.status, 201);
  assert.equal(registerResponse.data.user.role, "employee");
  assert.equal(registerResponse.data.user.status, "pending");

  const pendingLogin = await login(email, "Pending@1234");
  assert.equal(pendingLogin.status, 403);

  const [pendingRows] = await query("SELECT id, status, role FROM users WHERE email = ?", [email]);
  assert.equal(pendingRows[0].status, "pending");
  assert.equal(pendingRows[0].role, "employee");

  const listResponse = await request("/api/account-approvals", { token: adminToken });
  assert.equal(listResponse.status, 200);
  assert.ok(listResponse.data.accounts.some((account) => account.email === email));

  const approveResponse = await request(`/api/account-approvals/${pendingRows[0].id}/approve`, {
    method: "PATCH",
    token: adminToken,
  });
  assert.equal(approveResponse.status, 200);

  const approvedLogin = await login(email, "Pending@1234");
  assert.equal(approvedLogin.status, 200);
});

test("rejected registrations cannot log in", async () => {
  const email = `qa-approval-reject-${Date.now()}@nexoratech.com`;

  const registerResponse = await registerAccount(email);
  assert.equal(registerResponse.status, 201);

  const [pendingRows] = await query("SELECT id FROM users WHERE email = ?", [email]);
  const rejectResponse = await request(`/api/account-approvals/${pendingRows[0].id}/reject`, {
    method: "PATCH",
    token: adminToken,
  });
  assert.equal(rejectResponse.status, 200);

  const [rejectedRows] = await query("SELECT status FROM users WHERE email = ?", [email]);
  assert.equal(rejectedRows[0].status, "rejected");

  const rejectedLogin = await login(email, "Pending@1234");
  assert.equal(rejectedLogin.status, 403);
});
