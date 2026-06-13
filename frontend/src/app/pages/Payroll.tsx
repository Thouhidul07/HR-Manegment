import { useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, Download, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/api";
import { formatCurrencyBDT } from "../utils/formatters";

type PayrollRecord = {
  id: number;
  user_id: number;
  employee_name: string;
  department?: string;
  designation?: string;
  pay_period: string;
  basic_salary: string | number;
  allowances: string | number;
  deductions: string | number;
  net_pay: string | number;
  status: string;
};

function asNumber(value: string | number) {
  return Number(value || 0);
}

function monthLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fullDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function downloadBlob(data: Blob, fileName: string) {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

export function Payroll() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [processMonth, setProcessMonth] = useState(currentMonthValue());

  async function loadPayroll() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/payroll");
      setPayroll(response.data.payroll || []);
    } catch {
      setError("Unable to load payroll records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayroll();
  }, []);

  const totals = useMemo(() => {
    return payroll.reduce(
      (sum, record) => ({
        gross: sum.gross + asNumber(record.basic_salary) + asNumber(record.allowances),
        deductions: sum.deductions + asNumber(record.deductions),
        net: sum.net + asNumber(record.net_pay),
      }),
      { gross: 0, deductions: 0, net: 0 }
    );
  }, [payroll]);

  const monthlyPayroll = useMemo(() => {
    const totalsByMonth = new Map<string, number>();

    for (const record of payroll) {
      const label = monthLabel(record.pay_period);
      totalsByMonth.set(label, (totalsByMonth.get(label) || 0) + asNumber(record.net_pay));
    }

    return Array.from(totalsByMonth.entries())
      .reverse()
      .map(([month, amount]) => ({ month, amount }));
  }, [payroll]);

  const latest = payroll[0];

  async function handleDownloadPayslip(record: PayrollRecord) {
    setBusyAction(`payslip-${record.id}`);
    try {
      const response = await api.get(`/payroll/${record.id}/payslip`, { responseType: "blob" });
      downloadBlob(response.data, `${record.employee_name.replace(/\s+/g, "-").toLowerCase()}-${monthLabel(record.pay_period).replace(/\s+/g, "-").toLowerCase()}-payslip.txt`);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleExport() {
    setBusyAction("export");
    try {
      const response = await api.get("/payroll/export", { responseType: "blob" });
      downloadBlob(response.data, "payroll-export.csv");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleProcessPayroll() {
    setBusyAction("process");
    setMessage("");
    setError("");
    try {
      const response = await api.post("/payroll/process", { payPeriod: `${processMonth}-01` });
      setMessage(response.data.message || "Payroll processed.");
      await loadPayroll();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to process payroll.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Payroll Management</h1>
          <p className="text-muted-foreground">Process and manage employee payroll</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <input
            type="month"
            value={processMonth}
            onChange={(event) => setProcessMonth(event.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            aria-label="Payroll period"
          />
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={busyAction === "export" || !payroll.length}>
            <Download className="w-4 h-4" />
            {busyAction === "export" ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" onClick={handleProcessPayroll} disabled={busyAction === "process"}>
            {busyAction === "process" ? "Processing..." : "Process Selected Month"}
          </Button>
        </div>
      </div>

      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <DollarSign className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Payroll</p>
          </div>
          <p className="text-2xl text-foreground">{formatCurrencyBDT(totals.gross)}</p>
          <p className="text-xs text-muted-foreground mt-1">Visible records</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Net Payable</p>
          </div>
          <p className="text-2xl text-foreground">{formatCurrencyBDT(totals.net)}</p>
          <p className="text-xs text-muted-foreground mt-1">After deductions</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Deductions</p>
          <p className="text-2xl text-foreground mt-1">{formatCurrencyBDT(totals.deductions)}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Employees Paid</p>
          <p className="text-2xl text-foreground mt-1">{new Set(payroll.map((record) => record.user_id)).size}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  formatter={(value) => formatCurrencyBDT(Number(value))}
                />
                <Bar key="amount-bar" dataKey="amount" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Salary Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {latest ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-muted-foreground mb-3">Earnings</h4>
                  {[
                    { component: "Basic Salary", amount: asNumber(latest.basic_salary) },
                    { component: "Allowances", amount: asNumber(latest.allowances) },
                  ].map((item) => (
                    <div key={item.component} className="flex items-center justify-between text-sm mb-2">
                      <span className="text-foreground">{item.component}</span>
                      <span className="text-muted-foreground">{formatCurrencyBDT(item.amount)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm text-muted-foreground mb-3">Deductions</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Total Deductions</span>
                    <span className="text-muted-foreground">-{formatCurrencyBDT(latest.deductions)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Net Salary</span>
                    <span className="text-foreground text-lg">{formatCurrencyBDT(latest.net_pay)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payroll records available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Details</CardTitle>
            {latest && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Latest period: {fullDate(latest.pay_period)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-muted-foreground">Loading payroll...</div>
          ) : !payroll.length ? (
            <div className="p-6 text-muted-foreground">No payroll records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          {initials(record.employee_name)}
                        </div>
                        <div>
                          <span className="text-sm text-foreground">{record.employee_name}</span>
                          <p className="text-xs text-muted-foreground">{record.designation || "Employee"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.department || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{monthLabel(record.pay_period)}</TableCell>
                    <TableCell className="text-sm">{formatCurrencyBDT(asNumber(record.basic_salary) + asNumber(record.allowances))}</TableCell>
                    <TableCell className="text-sm text-destructive">-{formatCurrencyBDT(record.deductions)}</TableCell>
                    <TableCell className="text-sm">{formatCurrencyBDT(record.net_pay)}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === "processed" ? "default" : "secondary"}>
                        {statusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDownloadPayslip(record)}
                        disabled={busyAction === `payslip-${record.id}`}
                      >
                        <Download className="w-3 h-3" />
                        {busyAction === `payslip-${record.id}` ? "Downloading..." : "Payslip"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
