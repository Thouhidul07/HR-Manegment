import { Plus, Receipt, DollarSign, TrendingUp, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const fallbackExpenseClaims = [
  { id: 1, employee: "John Doe", avatar: "JD", type: "Travel", amount: 450, date: "Apr 2, 2026", status: "Pending", description: "Client meeting in NYC" },
  { id: 2, employee: "Sarah Smith", avatar: "SS", type: "Meals", amount: 85, date: "Apr 1, 2026", status: "Approved", description: "Team lunch" },
  { id: 3, employee: "Mike Johnson", avatar: "MJ", type: "Accommodation", amount: 320, date: "Mar 30, 2026", status: "Pending", description: "Hotel stay - business trip" },
  { id: 4, employee: "Emily Brown", avatar: "EB", type: "Office Supplies", amount: 125, date: "Mar 29, 2026", status: "Approved", description: "Office equipment" },
  { id: 5, employee: "David Wilson", avatar: "DW", type: "Travel", amount: 680, date: "Mar 28, 2026", status: "Rejected", description: "Conference attendance" },
  { id: 6, employee: "Lisa Anderson", avatar: "LA", type: "Training", amount: 1200, date: "Mar 27, 2026", status: "Approved", description: "Professional certification" },
];

const expenseByCategory = [
  { name: "Travel", value: 2450, color: "var(--chart-1)" },
  { name: "Meals", value: 850, color: "var(--chart-2)" },
  { name: "Accommodation", value: 1200, color: "var(--chart-3)" },
  { name: "Training", value: 3200, color: "var(--chart-4)" },
  { name: "Office Supplies", value: 680, color: "var(--chart-5)" },
];

const recentActivity = [
  { id: 1, action: "Expense approved", employee: "Sarah Smith", amount: 85, time: "2 hours ago" },
  { id: 2, action: "New expense submitted", employee: "John Doe", amount: 450, time: "4 hours ago" },
  { id: 3, action: "Expense rejected", employee: "David Wilson", amount: 680, time: "1 day ago" },
];

export function Expense() {
  const { user } = useAuth();
  const [expenseClaims, setExpenseClaims] = useState(fallbackExpenseClaims);
  const [activityList, setActivityList] = useState(recentActivity);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    let isMounted = true;

    api.get("/expenses")
      .then((response) => {
        if (isMounted && response.data.expenses?.length) {
          setExpenseClaims(response.data.expenses);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const isEmployee = user?.role === "employee";
  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EU";
  const visibleClaims = isEmployee
    ? expenseClaims.map((claim) => ({ ...claim, employee: user?.name || "Employee User", avatar: initials }))
    : expenseClaims;
  const filteredClaims = activeFilter === "All"
    ? visibleClaims
    : visibleClaims.filter((claim) => claim.status === activeFilter);
  const visibleActivity = isEmployee
    ? activityList.map((activity) => ({ ...activity, employee: user?.name || "Employee User" }))
    : activityList;
  const displayExpenseByCategory = isEmployee
    ? visibleClaims.reduce((categories, claim, index) => {
        const existing = categories.find((category) => category.name === claim.type);
        if (existing) {
          existing.value += claim.amount;
          return categories;
        }

        categories.push({
          name: claim.type,
          value: claim.amount,
          color: `var(--chart-${(index % 5) + 1})`,
        });
        return categories;
      }, [] as typeof expenseByCategory)
    : expenseByCategory;
  const totalClaims = visibleClaims.reduce((sum, claim) => sum + claim.amount, 0);
  const approvedClaims = visibleClaims.filter(c => c.status === "Approved").reduce((sum, claim) => sum + claim.amount, 0);
  const pendingClaims = visibleClaims.filter(c => c.status === "Pending").reduce((sum, claim) => sum + claim.amount, 0);

  const handleExportExpenses = () => {
    const header = "Employee,Type,Description,Amount,Date,Status";
    const rows = visibleClaims.map((claim) =>
      [
        claim.employee,
        claim.type,
        claim.description,
        `$${claim.amount}`,
        claim.date,
        claim.status,
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    );
    const file = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitExpense = async () => {
    const type = window.prompt("Expense type", "Travel");
    const amount = window.prompt("Amount", "0");
    const description = window.prompt("Description", "");
    if (!type || !amount) return;

    const today = new Date().toISOString().slice(0, 10);
    const response = await api.post("/expenses", {
      category: type,
      amount: Number(amount),
      expenseDate: today,
      description: description || type,
    });
    const savedClaim = response.data.expense;

    setExpenseClaims((currentClaims) => [savedClaim, ...currentClaims]);
    setActivityList((currentActivities) => [
      {
        id: Date.now(),
        action: "New expense submitted",
        employee: savedClaim.employee || user?.name || "Employee User",
        amount: Number(amount),
        time: "Just now",
      },
      ...currentActivities,
    ]);
  };

  const handleStatusChange = async (claimId: number, status: "Approved" | "Rejected") => {
    const response = await api.patch(`/expenses/${claimId}/status`, { status });
    const updatedClaim = response.data.expense;

    setExpenseClaims((currentClaims) =>
      currentClaims.map((claim) => (claim.id === claimId ? updatedClaim : claim))
    );
    setActivityList((currentActivities) => [
      {
        id: Date.now(),
        action: `Expense ${status.toLowerCase()}`,
        employee: updatedClaim.employee || user?.name || "Employee User",
        amount: updatedClaim.amount,
        time: "Just now",
      },
      ...currentActivities,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Expense Management</h1>
          <p className="text-muted-foreground">Submit and manage expense claims</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportExpenses}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="primary" className="gap-2" onClick={handleSubmitExpense}>
            <Plus className="w-4 h-4" />
            Submit Expense
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <Receipt className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Claims</p>
          </div>
          <p className="text-2xl text-foreground">${totalClaims.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <DollarSign className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>
          <p className="text-2xl text-foreground">${approvedClaims.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Ready for payment</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl text-foreground">${pendingClaims.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg. Claim Amount</p>
          <p className="text-2xl text-foreground mt-1">${Math.round(totalClaims / visibleClaims.length || 0)}</p>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  key="expense-category-pie"
                  data={displayExpenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {displayExpenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {displayExpenseByCategory.map((category) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="text-foreground">{category.name}</span>
                  </div>
                  <span className="text-muted-foreground">${category.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visibleActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.employee} • ${activity.amount}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Claims Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Claims</CardTitle>
            <div className="flex gap-2">
              <Button variant={activeFilter === "All" ? "outline" : "ghost"} size="sm" onClick={() => setActiveFilter("All")}>All</Button>
              <Button variant={activeFilter === "Pending" ? "outline" : "ghost"} size="sm" onClick={() => setActiveFilter("Pending")}>Pending</Button>
              <Button variant={activeFilter === "Approved" ? "outline" : "ghost"} size="sm" onClick={() => setActiveFilter("Approved")}>Approved</Button>
              <Button variant={activeFilter === "Rejected" ? "outline" : "ghost"} size="sm" onClick={() => setActiveFilter("Rejected")}>Rejected</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        {claim.avatar}
                      </div>
                      <span className="text-sm text-foreground">{claim.employee}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">
                      {claim.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {claim.description}
                  </TableCell>
                  <TableCell className="text-sm">${claim.amount}</TableCell>
                  <TableCell className="text-sm">{claim.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        claim.status === "Approved"
                          ? "success"
                          : claim.status === "Pending"
                          ? "warning"
                          : "error"
                      }
                    >
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {claim.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-[var(--success)]" onClick={() => handleStatusChange(claim.id, "Approved")}>
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleStatusChange(claim.id, "Rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {claim.status !== "Pending" && (
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    )}
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
