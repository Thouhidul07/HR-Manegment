import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Download, Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatCurrencyBDT } from "../utils/formatters";

type EmployeeStatus = "active" | "inactive";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  hire_date?: string | null;
  salary?: number | string;
  status: EmployeeStatus;
  avatar?: string;
};

type EmployeeFormState = {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  hireDate: string;
  salary: string;
  status: EmployeeStatus;
};

const fallbackEmployees: Employee[] = [
  { id: 1, name: "System Admin", email: "admin@nexoratech.com", phone: "+8801712345601", department: "System Administration", designation: "Administrator", status: "active", avatar: "SA", salary: 120000, hire_date: "2024-01-01" },
  { id: 2, name: "HR Manager 01", email: "hr.manager01@nexoratech.com", phone: "+8801712345602", department: "Human Resources", designation: "Lead HR Manager", status: "active", avatar: "HM", salary: 96000, hire_date: "2024-02-01" },
  { id: 3, name: "Employee 01", email: "employee01@nexoratech.com", phone: "+8801712345603", department: "Information Technology", designation: "Software Engineer", status: "active", avatar: "E0", salary: 75000, hire_date: "2024-03-01" },
  { id: 4, name: "Employee 02", email: "employee02@nexoratech.com", phone: "+8801712345604", department: "Finance", designation: "Accounts Officer", status: "active", avatar: "E0", salary: 68000, hire_date: "2024-04-15" },
  { id: 5, name: "Employee 03", email: "employee03@nexoratech.com", phone: "+8801712345605", department: "Marketing", designation: "Marketing Executive", status: "active", avatar: "E0", salary: 62000, hire_date: "2024-05-10" },
  { id: 6, name: "HR Manager 02", email: "hr.manager02@nexoratech.com", phone: "+8801712345606", department: "Human Resources", designation: "HR Manager", status: "active", avatar: "HM", salary: 92000, hire_date: "2024-02-02" },
  { id: 7, name: "Employee 04", email: "employee04@nexoratech.com", phone: "+8801812345004", department: "Sales", designation: "Sales Executive", status: "active", avatar: "E0", salary: 53000, hire_date: "2024-04-04" },
  { id: 8, name: "Employee 05", email: "employee05@nexoratech.com", phone: "+8801812345005", department: "Operations", designation: "Operations Executive", status: "active", avatar: "E0", salary: 53750, hire_date: "2024-05-05" },
  { id: 9, name: "Employee 06", email: "employee06@nexoratech.com", phone: "+8801812345006", department: "Customer Support", designation: "Customer Support Executive", status: "active", avatar: "E0", salary: 54500, hire_date: "2024-06-06" },
  { id: 10, name: "Employee 07", email: "employee07@nexoratech.com", phone: "+8801812345007", department: "Training & Development", designation: "Training & Development Executive", status: "active", avatar: "E0", salary: 55250, hire_date: "2024-07-07" },
  { id: 11, name: "Employee 08", email: "employee08@nexoratech.com", phone: "+8801812345008", department: "Administration", designation: "Administration Executive", status: "active", avatar: "E0", salary: 56000, hire_date: "2024-08-08" },
];

const departments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Administration",
  "Customer Support",
];

const designations = [
  "HR Manager",
  "Software Engineer",
  "Junior Software Engineer",
  "Accounts Officer",
  "Marketing Executive",
  "Operations Executive",
  "Admin Officer",
  "Support Executive",
  "Sales Executive",
];

const emptyForm: EmployeeFormState = {
  name: "",
  email: "",
  phone: "",
  department: "Information Technology",
  designation: "Software Engineer",
  hireDate: new Date().toISOString().slice(0, 10),
  salary: "75000",
  status: "active",
};

function employeeInitials(name: string, fallback?: string) {
  return fallback || name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function normalizeEmployee(employee: any): Employee {
  return {
    id: Number(employee.id),
    name: employee.name,
    email: employee.email,
    phone: employee.phone || "",
    department: employee.department || "",
    designation: employee.designation || employee.role || "",
    hire_date: employee.hire_date,
    salary: employee.salary || 0,
    status: employee.status || "active",
    avatar: employee.avatar || employeeInitials(employee.name || "Employee"),
  };
}

function formFromEmployee(employee: Employee): EmployeeFormState {
  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone || "",
    department: employee.department || "Information Technology",
    designation: employee.designation || "Software Engineer",
    hireDate: employee.hire_date ? String(employee.hire_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    salary: String(employee.salary || 0),
    status: employee.status || "active",
  };
}

function statusLabel(status: EmployeeStatus) {
  return status === "active" ? "Active" : "Inactive";
}

export function EmployeeManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>(fallbackEmployees);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState<EmployeeFormState>(emptyForm);

  const canManageEmployees = user?.role === "admin" || user?.role === "hr_manager";
  const canDeleteEmployees = user?.role === "admin";

  async function loadEmployees() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/employees");
      setEmployees((response.data.employees || []).map(normalizeEmployee));
    } catch {
      setError("Unable to load employee records. Showing demo data.");
      setEmployees(fallbackEmployees);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const stats = useMemo(() => {
    const active = employees.filter((employee) => employee.status === "active").length;
    const inactive = employees.filter((employee) => employee.status === "inactive").length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const newThisMonth = employees.filter((employee) => String(employee.hire_date || "").slice(0, 7) === thisMonth).length;
    return { total: employees.length, active, inactive, newThisMonth };
  }, [employees]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm(formFromEmployee(employee));
    setMessage("");
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const handleFormChange = (field: keyof EmployeeFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveEmployee = async () => {
    if (!canManageEmployees) return;

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department,
        designation: form.designation,
        hireDate: form.hireDate,
        salary: Number(form.salary || 0),
        status: form.status,
      };

      if (editingEmployee) {
        await api.patch(`/employees/${editingEmployee.id}`, payload);
        setMessage("Employee updated successfully.");
      } else {
        const response = await api.post("/employees", payload);
        setMessage(response.data.message || "Employee created successfully.");
      }

      await loadEmployees();
      setIsModalOpen(false);
    } catch (err: any) {
      const validationMessage = err?.response?.data?.errors?.[0]?.msg;
      setError(err?.response?.data?.message || validationMessage || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteEmployeeDialog = (employee: Employee) => {
    if (!canDeleteEmployees) return;
    setEmployeeToDelete(employee);
    setDeleteError("");
    setError("");
    setMessage("");
  };

  const closeDeleteEmployeeDialog = () => {
    if (deletingEmployee) return;
    setEmployeeToDelete(null);
    setDeleteError("");
  };

  const handleDeleteEmployee = async () => {
    if (!canDeleteEmployees || !employeeToDelete) return;

    setDeletingEmployee(true);
    setError("");
    setMessage("");
    setDeleteError("");
    try {
      await api.delete(`/employees/${employeeToDelete.id}`);
      setMessage("Employee deactivated successfully.");
      await loadEmployees();
      setEmployeeToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Unable to deactivate employee.");
    } finally {
      setDeletingEmployee(false);
    }
  };

  const handleExportEmployees = () => {
    const header = "Name,Email,Phone,Department,Designation,Joining Date,Salary,Status";
    const rows = filteredEmployees.map((employee) =>
      [
        employee.name,
        employee.email,
        employee.phone,
        employee.department,
        employee.designation,
        employee.hire_date ? String(employee.hire_date).slice(0, 10) : "",
        formatCurrencyBDT(employee.salary || 0),
        statusLabel(employee.status),
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    );
    const file = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Employee Management</h1>
          <p className="text-muted-foreground">Manage your organization's employees</p>
        </div>
        {canManageEmployees && (
          <Button variant="primary" className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        )}
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl text-foreground mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl text-foreground mt-1">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl text-foreground mt-1">{stats.inactive}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">New This Month</p>
          <p className="text-2xl text-foreground mt-1">{stats.newThisMonth}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportEmployees}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading employees...</TableCell>
              </TableRow>
            ) : filteredEmployees.length ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="cursor-pointer" onClick={() => navigate(`/dashboard/employees/${employee.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {employeeInitials(employee.name, employee.avatar)}
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {employee.phone || "Not added"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{employee.department || "Unassigned"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{employee.designation || "Employee"}</TableCell>
                  <TableCell className="text-sm">{formatCurrencyBDT(employee.salary || 0)}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "active" ? "success" : "warning"}>
                      {statusLabel(employee.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/dashboard/employees/${employee.id}`);
                      }}>
                        View
                      </Button>
                      {canManageEmployees && (
                        <Button variant="ghost" size="sm" className="gap-1" onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(employee);
                        }}>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      )}
                      {canDeleteEmployees && employee.status !== "inactive" && (
                        <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={(event) => {
                          event.stopPropagation();
                          openDeleteEmployeeDialog(employee);
                        }}>
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No employees found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground">{filteredEmployees.length}</span> of <span className="text-foreground">{employees.length}</span> employees
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="primary" size="sm">1</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEmployee ? "Edit Employee" : "Add Employee"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSaveEmployee}
              disabled={saving || !form.name.trim() || !form.email.trim()}
            >
              {saving ? "Saving..." : editingEmployee ? "Save Changes" : "Create Employee"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={(event) => handleFormChange("name", event.target.value)} placeholder="Tanvir Hasan" />
          <Input label="Email" type="email" value={form.email} onChange={(event) => handleFormChange("email", event.target.value)} placeholder="tanvir.hasan@nexoratech.com" />
          <Input label="Phone" value={form.phone} onChange={(event) => handleFormChange("phone", event.target.value)} placeholder="+8801712345678" />
          <div>
            <label className="block text-sm mb-1.5 text-foreground">Department</label>
            <select
              value={form.department}
              onChange={(event) => handleFormChange("department", event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {departments.map((department) => (
                <option key={department}>{department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1.5 text-foreground">Designation</label>
            <select
              value={form.designation}
              onChange={(event) => handleFormChange("designation", event.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {designations.map((designation) => (
                <option key={designation}>{designation}</option>
              ))}
            </select>
          </div>
          <Input label="Joining Date" type="date" value={form.hireDate} onChange={(event) => handleFormChange("hireDate", event.target.value)} />
          <Input label="Salary" type="number" min="0" value={form.salary} onChange={(event) => handleFormChange("salary", event.target.value)} />
          <div>
            <label className="block text-sm mb-1.5 text-foreground">Status</label>
            <select
              value={form.status}
              onChange={(event) => handleFormChange("status", event.target.value as EmployeeStatus)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {!editingEmployee && (
            <div className="md:col-span-2 rounded-lg border border-[#543884]/10 bg-[#543884]/5 px-4 py-3 text-sm text-muted-foreground">
              New employee login password will be set to <span className="text-foreground font-medium">Emp@1234</span>.
            </div>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={Boolean(employeeToDelete)}
        title="Deactivate Employee"
        message={
          <>
            Deactivate <span className="text-foreground">{employeeToDelete?.name}</span>? They will remain in records
            but will no longer be active.
          </>
        }
        confirmLabel="Deactivate"
        loading={deletingEmployee}
        error={deleteError}
        onClose={closeDeleteEmployeeDialog}
        onConfirm={handleDeleteEmployee}
      />
    </div>
  );
}
