import { CheckCircle2, Plus, Receipt, DollarSign, TrendingUp, Download, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Textarea } from "../components/ui/textarea";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const expenseClaims = [
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

type ExpenseFilter = "All" | "Pending" | "Approved" | "Rejected" | "Paid";
const expenseFilters: ExpenseFilter[] = ["All", "Pending", "Approved", "Rejected", "Paid"];

export function Expense() {
  const { user } = useAuth();
  const [claims, setClaims] = useState(expenseClaims);
  const [activities, setActivities] = useState(recentActivity);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);
  const [activeExpenseFilter, setActiveExpenseFilter] = useState<ExpenseFilter>("All");
  const [slideDirection, setSlideDirection] = useState(1);
  const [selectedClaim, setSelectedClaim] = useState<(typeof expenseClaims)[number] | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    type: "Travel",
    amount: "",
    date: "",
    description: "",
  });

  useEffect(() => {
    let isMounted = true;

    api.get("/expenses")
      .then((response) => {
        if (isMounted && response.data.expenses?.length) {
          setClaims(response.data.expenses);
        }
      })
      .catch(() => {
        // Keep demo claims visible if the backend is unavailable.
      });

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
    ? claims.map((claim) => ({ ...claim, employee: user?.name || "Employee User", avatar: initials }))
    : claims;
  const visibleActivity = isEmployee
    ? activities.map((activity) => ({ ...activity, employee: user?.name || "Employee User" }))
    : activities;
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
  const averageClaim = visibleClaims.length ? Math.round(totalClaims / visibleClaims.length) : 0;
  const filteredClaims = activeExpenseFilter === "All"
    ? visibleClaims
    : visibleClaims.filter((claim) => claim.status === activeExpenseFilter);

  const formatDisplayDate = (dateValue: string) =>
    new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const resetExpenseForm = () => {
    setExpenseForm({ type: "Travel", amount: "", date: "", description: "" });
  };

  const handleExpenseFilterChange = (filter: ExpenseFilter) => {
    const currentIndex = expenseFilters.indexOf(activeExpenseFilter);
    const nextIndex = expenseFilters.indexOf(filter);
    setSlideDirection(nextIndex >= currentIndex ? 1 : -1);
    setActiveExpenseFilter(filter);
  };

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
    link.download = "my-expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(expenseForm.amount);
    const response = await api.post("/expenses", {
      category: expenseForm.type,
      amount,
      expenseDate: expenseForm.date,
      description: expenseForm.description,
    });
    const newClaim = response.data.expense;

    setClaims((currentClaims) => [newClaim, ...currentClaims]);
    setActivities((currentActivities) => [
      {
        id: Date.now(),
        action: "New expense submitted",
        employee: user?.name || "Employee User",
        amount,
        time: "Just now",
      },
      ...currentActivities,
    ]);
    resetExpenseForm();
    setIsSubmitModalOpen(false);
    setShowSubmittedMessage(true);
    window.setTimeout(() => setShowSubmittedMessage(false), 2200);
  };

  const handleExpenseStatus = async (claimId: number, status: "approved" | "rejected" | "paid") => {
    const response = await api.patch(`/expenses/${claimId}/status`, { status });
    const updatedClaim = response.data.expense;
    setClaims((currentClaims) =>
      currentClaims.map((claim) => (claim.id === claimId ? updatedClaim : claim))
    );
    setActivities((currentActivities) => [
      {
        id: Date.now(),
        action: `Expense ${status}`,
        employee: updatedClaim.employee,
        amount: updatedClaim.amount,
        time: "Just now",
      },
      ...currentActivities,
    ]);
  };

  const handleDeleteExpense = async (claimId: number) => {
    await api.delete(`/expenses/${claimId}`);
    setClaims((currentClaims) => currentClaims.filter((claim) => claim.id !== claimId));
    setSelectedClaim((claim) => (claim?.id === claimId ? null : claim));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{isEmployee ? "My Expenses" : "Expense Management"}</h1>
          <p className="text-muted-foreground">{isEmployee ? "Submit and track your own expense claims" : "Submit and manage expense claims"}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportExpenses}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => setIsSubmitModalOpen(true)}>
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
          <p className="text-2xl text-foreground mt-1">${averageClaim}</p>
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
            <CardTitle>{isEmployee ? "My Expense Claims" : "Expense Claims"}</CardTitle>
            <div className="flex gap-2">
              {expenseFilters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeExpenseFilter === filter ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => handleExpenseFilterChange(filter)}
                  className={activeExpenseFilter === filter ? "border-[#9A77CF] text-foreground" : ""}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={activeExpenseFilter}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection * 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection * -48 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
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
                              : claim.status === "Paid"
                              ? "info"
                              : "error"
                          }
                        >
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {claim.status === "Pending" && !isEmployee && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[var(--success)]"
                                onClick={() => handleExpenseStatus(claim.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleExpenseStatus(claim.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {claim.status === "Approved" && !isEmployee && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--info)]"
                              onClick={() => handleExpenseStatus(claim.id, "paid")}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setSelectedClaim(claim)}>
                            View
                          </Button>
                          {(claim.status === "Pending" || !isEmployee) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteExpense(claim.id)}
                              aria-label="Delete expense"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredClaims.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No {activeExpenseFilter.toLowerCase()} expense claims found.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {showSubmittedMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="relative overflow-hidden rounded-2xl bg-card border border-[#543884]/20 px-8 py-6 shadow-2xl text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#543884] via-[#EC4176] to-[#FFA45E]" />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-foreground">Expense submitted</p>
            <p className="mt-1 text-sm text-muted-foreground">Your expense claim is now pending approval.</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Expense"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="submit-expense-form" variant="primary">
              Submit Claim
            </Button>
          </>
        }
      >
        <form id="submit-expense-form" onSubmit={handleSubmitExpense} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 text-foreground">Expense Type</label>
            <select
              value={expenseForm.type}
              onChange={(event) => setExpenseForm((form) => ({ ...form, type: event.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Travel</option>
              <option>Meals</option>
              <option>Accommodation</option>
              <option>Training</option>
              <option>Office Supplies</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              min="1"
              required
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm((form) => ({ ...form, amount: event.target.value }))}
              placeholder="450"
            />
            <Input
              label="Expense Date"
              type="date"
              required
              value={expenseForm.date}
              onChange={(event) => setExpenseForm((form) => ({ ...form, date: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-foreground">Description</label>
            <Textarea
              required
              value={expenseForm.description}
              onChange={(event) => setExpenseForm((form) => ({ ...form, description: event.target.value }))}
              placeholder="Add a short description for this expense"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedClaim)}
        onClose={() => setSelectedClaim(null)}
        title="Expense Details"
        footer={
          <Button variant="primary" onClick={() => setSelectedClaim(null)}>
            Close
          </Button>
        }
      >
        {selectedClaim && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {selectedClaim.avatar}
              </div>
              <div>
                <p className="text-base font-medium text-foreground">{selectedClaim.employee}</p>
                <p className="text-sm text-muted-foreground">Submitted on {selectedClaim.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="text-sm text-foreground">{selectedClaim.type}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="text-sm text-foreground">${selectedClaim.amount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={
                    selectedClaim.status === "Approved"
                      ? "success"
                      : selectedClaim.status === "Pending"
                      ? "warning"
                      : selectedClaim.status === "Paid"
                      ? "info"
                      : "error"
                  }
                >
                  {selectedClaim.status}
                </Badge>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Claim ID</p>
                <p className="text-sm text-foreground">EXP-{selectedClaim.id}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2">Description</p>
              <p className="text-sm text-foreground">{selectedClaim.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
