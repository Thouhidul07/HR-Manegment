import { DollarSign, TrendingUp, Download, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const payrollData = [
  { id: 1, employee: "John Doe", avatar: "JD", empId: "EMP-001", department: "Engineering", gross: 8500, deductions: 1200, net: 7300, status: "Processed" },
  { id: 2, employee: "Sarah Smith", avatar: "SS", empId: "EMP-002", department: "Marketing", gross: 7200, deductions: 980, net: 6220, status: "Processed" },
  { id: 3, employee: "Mike Johnson", avatar: "MJ", empId: "EMP-003", department: "Sales", gross: 6800, deductions: 890, net: 5910, status: "Pending" },
  { id: 4, employee: "Emily Brown", avatar: "EB", empId: "EMP-004", department: "HR", gross: 6500, deductions: 850, net: 5650, status: "Processed" },
  { id: 5, employee: "David Wilson", avatar: "DW", empId: "EMP-005", department: "Finance", gross: 7800, deductions: 1050, net: 6750, status: "Processed" },
];

const monthlyPayroll = [
  { month: "Oct", amount: 1250000 },
  { month: "Nov", amount: 1280000 },
  { month: "Dec", amount: 1320000 },
  { month: "Jan", amount: 1290000 },
  { month: "Feb", amount: 1310000 },
  { month: "Mar", amount: 1345000 },
];

const salaryBreakdown = [
  { component: "Basic Salary", amount: 5000, percentage: 59 },
  { component: "HRA", amount: 1500, percentage: 18 },
  { component: "Transport Allowance", amount: 800, percentage: 9 },
  { component: "Special Allowance", amount: 1200, percentage: 14 },
];

const deductions = [
  { component: "Provident Fund", amount: 600 },
  { component: "Income Tax", amount: 450 },
  { component: "Professional Tax", amount: 150 },
];

export function Payroll() {
  const totalGross = payrollData.reduce((sum, item) => sum + item.gross, 0);
  const totalDeductions = payrollData.reduce((sum, item) => sum + item.deductions, 0);
  const totalNet = payrollData.reduce((sum, item) => sum + item.net, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Payroll Management</h1>
          <p className="text-muted-foreground">Process and manage employee payroll</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="primary">Process Payroll</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <DollarSign className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Payroll</p>
          </div>
          <p className="text-2xl text-foreground">${totalGross.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">This period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Net Payable</p>
          </div>
          <p className="text-2xl text-foreground">${totalNet.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">After deductions</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Deductions</p>
          <p className="text-2xl text-foreground mt-1">${totalDeductions.toLocaleString()}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Employees Paid</p>
          <p className="text-2xl text-foreground mt-1">1,234</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payroll Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPayroll}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="amount" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Salary Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-muted-foreground mb-3">Earnings</h4>
                {salaryBreakdown.map((item) => (
                  <div key={item.component} className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground">{item.component}</span>
                      <span className="text-muted-foreground">${item.amount}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--chart-2)]"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm text-muted-foreground mb-3">Deductions</h4>
                {deductions.map((item) => (
                  <div
                    key={item.component}
                    className="flex items-center justify-between text-sm mb-2"
                  >
                    <span className="text-foreground">{item.component}</span>
                    <span className="text-muted-foreground">-${item.amount}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Net Salary</span>
                  <span className="text-foreground text-lg">${(8500 - 1200).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Details - March 2026</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Payment Date: Apr 5, 2026
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Emp ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {record.avatar}
                      </div>
                      <span className="text-sm text-foreground">{record.employee}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{record.empId}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">
                      {record.department}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">${record.gross.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-destructive">
                    -${record.deductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">${record.net.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === "Processed" ? "success" : "warning"}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Download className="w-3 h-3" />
                      Payslip
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
