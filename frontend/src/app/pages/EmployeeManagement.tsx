import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Download, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Card } from "../components/ui/Card";

const employees = [
  { id: 1, name: "Tanvir Hasan", email: "tanvir.hasan@hrspace.local", phone: "+8801712345678", department: "Information Technology", role: "Senior Software Engineer", status: "Active", avatar: "TH" },
  { id: 2, name: "Nusrat Jahan", email: "nusrat.jahan@hrspace.local", phone: "+8801812345678", department: "Marketing", role: "Marketing Manager", status: "Active", avatar: "NJ" },
  { id: 3, name: "Rakibul Islam", email: "rakibul.islam@hrspace.local", phone: "+8801912345678", department: "Sales", role: "Sales Executive", status: "Active", avatar: "RI" },
  { id: 4, name: "Farhana Akter", email: "farhana.akter@hrspace.local", phone: "+8801612345678", department: "Human Resources", role: "HR Specialist", status: "Active", avatar: "FA" },
  { id: 5, name: "Mehedi Hasan", email: "mehedi.hasan@hrspace.local", phone: "+8801512345678", department: "Finance", role: "Accounts Officer", status: "On Leave", avatar: "MH" },
  { id: 6, name: "Sadia Rahman", email: "sadia.rahman@hrspace.local", phone: "+8801312345678", department: "Information Technology", role: "UX Designer", status: "Active", avatar: "SR" },
  { id: 7, name: "Arif Hossain", email: "arif.hossain@hrspace.local", phone: "+8801412345678", department: "Sales", role: "Sales Manager", status: "Active", avatar: "AH" },
  { id: 8, name: "Sharmin Sultana", email: "sharmin.sultana@hrspace.local", phone: "+8801811112222", department: "Marketing", role: "Content Writer", status: "Active", avatar: "SS" },
];

export function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const navigate = useNavigate();

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Employee Management</h1>
          <p className="text-muted-foreground">Manage your organization's employees</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl text-foreground mt-1">1,234</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl text-foreground mt-1">1,186</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">On Leave</p>
          <p className="text-2xl text-foreground mt-1">48</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">New This Month</p>
          <p className="text-2xl text-foreground mt-1">23</p>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
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
              <option value="Information Technology">Information Technology</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
            </select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} className="cursor-pointer" onClick={() => navigate(`/employees/${employee.id}`)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      {employee.avatar}
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
                      {employee.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{employee.department}</Badge>
                </TableCell>
                <TableCell className="text-sm">{employee.role}</TableCell>
                <TableCell>
                  <Badge variant={employee.status === "Active" ? "success" : "warning"}>
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="text-foreground">1-8</span> of <span className="text-foreground">1,234</span> employees
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">1</Button>
          <Button variant="primary" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}
