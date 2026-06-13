import { Plus, Receipt, Wallet, TrendingUp, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { formatCurrencyBDT } from "../utils/formatters";

type ExpenseClaim = {
  id: number;
  employee: string;
  avatar: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  description: string;
  receiptUrl?: string | null;
};

type ExpenseActivity = {
  id: number;
  action: string;
  employee: string;
  amount: number;
  time: string;
};

type ExpenseFormState = {
  category: string;
  amount: string;
  expenseDate: string;
  description: string;
  receipt: File | null;
};

const emptyExpenseForm = (): ExpenseFormState => ({
  category: "Travel",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  description: "",
  receipt: null,
});

const fallbackExpenseClaims = [
  {
    id: 1,
    employee: "Tanvir Hasan",
    avatar: "TH",
    type: "Travel",
    amount: 4500,
    date: "Apr 2, 2026",
    status: "Pending",
    description: "Client meeting in Gulshan, Dhaka",
  },
  {
    id: 2,
    employee: "Nusrat Jahan",
    avatar: "NJ",
    type: "Meals",
    amount: 850,
    date: "Apr 1, 2026",
    status: "Approved",
    description: "Team lunch",
  },
  {
    id: 3,
    employee: "Rakibul Islam",
    avatar: "RI",
    type: "Accommodation",
    amount: 3200,
    date: "Mar 30, 2026",
    status: "Pending",
    description: "Hotel stay - Chattogram visit",
  },
  {
    id: 4,
    employee: "Farhana Akter",
    avatar: "FA",
    type: "Office Supplies",
    amount: 1250,
    date: "Mar 29, 2026",
    status: "Approved",
    description: "Office equipment",
  },
  {
    id: 5,
    employee: "Mehedi Hasan",
    avatar: "MH",
    type: "Travel",
    amount: 6800,
    date: "Mar 28, 2026",
    status: "Rejected",
    description: "Training visit to Sylhet",
  },
  {
    id: 6,
    employee: "Sadia Rahman",
    avatar: "SR",
    type: "Training",
    amount: 12000,
    date: "Mar 27, 2026",
    status: "Approved",
    description: "Professional certification",
  },
];

const expenseByCategory = [
  { name: "Travel", value: 24500, color: "var(--chart-1)" },
  { name: "Meals", value: 8500, color: "var(--chart-2)" },
  { name: "Accommodation", value: 12000, color: "var(--chart-3)" },
  { name: "Training", value: 32000, color: "var(--chart-4)" },
  { name: "Office Supplies", value: 6800, color: "var(--chart-5)" },
];

const recentActivity = [
  {
    id: 1,
    action: "Expense approved",
    employee: "Nusrat Jahan",
    amount: 850,
    time: "2 hours ago",
  },
  {
    id: 2,
    action: "New expense submitted",
    employee: "Tanvir Hasan",
    amount: 4500,
    time: "4 hours ago",
  },
  {
    id: 3,
    action: "Expense rejected",
    employee: "Mehedi Hasan",
    amount: 6800,
    time: "1 day ago",
  },
];

export function Expense() {
  const { user } = useAuth();
  const [expenseClaims, setExpenseClaims] =
    useState<ExpenseClaim[]>(fallbackExpenseClaims);
  const [activityList, setActivityList] =
    useState<ExpenseActivity[]>(recentActivity);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] =
    useState<ExpenseFormState>(emptyExpenseForm());
  const [savingExpense, setSavingExpense] = useState(false);
  const [reviewingExpenseId, setReviewingExpenseId] = useState<number | null>(
    null,
  );
  const [expenseMessage, setExpenseMessage] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isHRManager = user?.role === "hr_manager";
  const canReviewExpenses = isAdmin || isHRManager;
  const canSubmitExpense = isEmployee && !isAdmin;

  const loadExpenses = useCallback(async () => {
    const response = await api.get("/expenses");

    if (response.data.expenses?.length) {
      setExpenseClaims(response.data.expenses);
    } else {
      setExpenseClaims([]);
    }
  }, []);

  useEffect(() => {
    loadExpenses().catch(() => {});
  }, [loadExpenses]);

  const pageTitle =
    isEmployee && !isAdmin ? "My Expenses" : "Expense Management";
  const pageSubtitle =
    isEmployee && !isAdmin
      ? "Submit and track your expense claims"
      : "Review and manage employee expense claims";
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EU";
  const visibleClaims = isEmployee
    ? expenseClaims.map((claim) => ({
        ...claim,
        employee: user?.name || "Employee User",
        avatar: initials,
      }))
    : expenseClaims;
  const filteredClaims =
    activeFilter === "All"
      ? visibleClaims
      : visibleClaims.filter((claim) => claim.status === activeFilter);
  const visibleActivity = isEmployee
    ? activityList.map((activity) => ({
        ...activity,
        employee: user?.name || "Employee User",
      }))
    : activityList;
  const displayExpenseByCategory = isEmployee
    ? visibleClaims.reduce(
        (categories, claim, index) => {
          const existing = categories.find(
            (category) => category.name === claim.type,
          );
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
        },
        [] as typeof expenseByCategory,
      )
    : expenseByCategory;
  const totalClaims = visibleClaims.reduce(
    (sum, claim) => sum + claim.amount,
    0,
  );
  const approvedClaims = visibleClaims
    .filter((c) => c.status === "Approved")
    .reduce((sum, claim) => sum + claim.amount, 0);
  const pendingClaims = visibleClaims
    .filter((c) => c.status === "Pending")
    .reduce((sum, claim) => sum + claim.amount, 0);

  const showExpenseFeedback = (message: string, isError = false) => {
    if (isError) {
      setExpenseError(message);
      setExpenseMessage("");
    } else {
      setExpenseMessage(message);
      setExpenseError("");
    }

    window.setTimeout(() => {
      setExpenseMessage("");
      setExpenseError("");
    }, 3000);
  };

  const getApiErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;

  const openSubmitExpenseModal = () => {
    setExpenseForm(emptyExpenseForm());
    setExpenseError("");
    setIsSubmitModalOpen(true);
  };

  const closeSubmitExpenseModal = () => {
    if (savingExpense) return;
    setIsSubmitModalOpen(false);
  };

  const updateExpenseForm = (
    field: keyof ExpenseFormState,
    value: string | File | null,
  ) => {
    setExpenseForm((form) => ({ ...form, [field]: value }));
  };

  const handleExportExpenses = () => {
    const header = "Employee,Type,Description,Amount,Date,Status";
    const rows = visibleClaims.map((claim) =>
      [
        claim.employee,
        claim.type,
        claim.description,
        formatCurrencyBDT(claim.amount),
        claim.date,
        claim.status,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
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
    if (!canSubmitExpense) return;

    if (!expenseForm.category.trim()) {
      setExpenseError("Expense category is required.");
      return;
    }

    if (!expenseForm.amount || Number(expenseForm.amount) < 1) {
      setExpenseError("Enter a valid amount in BDT.");
      return;
    }

    if (!expenseForm.expenseDate) {
      setExpenseError("Expense date is required.");
      return;
    }

    const formData = new FormData();
    formData.append("category", expenseForm.category.trim());
    formData.append("amount", String(Number(expenseForm.amount)));
    formData.append("expenseDate", expenseForm.expenseDate);
    formData.append("description", expenseForm.description.trim());

    if (expenseForm.receipt) {
      formData.append("receipt", expenseForm.receipt);
    }

    setSavingExpense(true);
    setExpenseError("");

    try {
      const response = await api.post("/expenses", formData);
      const savedClaim = response.data.expense;

      await loadExpenses();
      setActivityList((currentActivities) => [
        {
          id: Date.now(),
          action: "New expense submitted",
          employee: savedClaim.employee || user?.name || "Employee User",
          amount: savedClaim.amount,
          time: "Just now",
        },
        ...currentActivities,
      ]);
      setExpenseForm(emptyExpenseForm());
      setIsSubmitModalOpen(false);
      showExpenseFeedback("Expense submitted successfully.");
    } catch (error) {
      setExpenseError(
        getApiErrorMessage(error, "Unable to submit expense right now."),
      );
    } finally {
      setSavingExpense(false);
    }
  };

  const handleStatusChange = async (
    claimId: number,
    status: "Approved" | "Rejected",
  ) => {
    if (!canReviewExpenses) return;

    setReviewingExpenseId(claimId);
    setExpenseError("");

    try {
      const response = await api.patch(`/expenses/${claimId}/status`, {
        status: status.toLowerCase(),
      });
      const updatedClaim = response.data.expense;

      await loadExpenses();
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
      showExpenseFeedback(`Expense ${status.toLowerCase()} successfully.`);
    } catch (error) {
      showExpenseFeedback(
        getApiErrorMessage(error, "Unable to update expense status."),
        true,
      );
    } finally {
      setReviewingExpenseId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExpenses}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          {canSubmitExpense && (
            <Button
              variant="primary"
              className="gap-2"
              onClick={openSubmitExpenseModal}
            >
              <Plus className="w-4 h-4" />
              Submit Expense
            </Button>
          )}
        </div>
      </div>

      {expenseMessage && (
        <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          {expenseMessage}
        </div>
      )}

      {expenseError && !isSubmitModalOpen && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {expenseError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <Receipt className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Total Claims</p>
          </div>
          <p className="text-2xl text-foreground">
            {formatCurrencyBDT(totalClaims)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Wallet className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>
          <p className="text-2xl text-foreground">
            {formatCurrencyBDT(approvedClaims)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ready for payment
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <TrendingUp className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl text-foreground">
            {formatCurrencyBDT(pendingClaims)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting approval
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg. Claim Amount</p>
          <p className="text-2xl text-foreground mt-1">
            {formatCurrencyBDT(
              Math.round(totalClaims / visibleClaims.length || 0),
            )}
          </p>
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
                  formatter={(value) => formatCurrencyBDT(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {displayExpenseByCategory.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-foreground">{category.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrencyBDT(category.value)}
                  </span>
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
                      <p className="text-sm text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.employee} •{" "}
                        {formatCurrencyBDT(activity.amount)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
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
              <Button
                variant={activeFilter === "All" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("All")}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "Pending" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("Pending")}
              >
                Pending
              </Button>
              <Button
                variant={activeFilter === "Approved" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("Approved")}
              >
                Approved
              </Button>
              <Button
                variant={activeFilter === "Rejected" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("Rejected")}
              >
                Rejected
              </Button>
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
                      <span className="text-sm text-foreground">
                        {claim.employee}
                      </span>
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
                  <TableCell className="text-sm">
                    {formatCurrencyBDT(claim.amount)}
                  </TableCell>
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
                    {canReviewExpenses && claim.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--success)]"
                          disabled={reviewingExpenseId === claim.id}
                          onClick={() =>
                            handleStatusChange(claim.id, "Approved")
                          }
                        >
                          {reviewingExpenseId === claim.id
                            ? "Saving..."
                            : "Approve"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={reviewingExpenseId === claim.id}
                          onClick={() =>
                            handleStatusChange(claim.id, "Rejected")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {(!canReviewExpenses || claim.status !== "Pending") && (
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

      <Modal
        isOpen={canSubmitExpense && isSubmitModalOpen}
        onClose={closeSubmitExpenseModal}
        title="Submit Expense"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeSubmitExpenseModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitExpense}
              disabled={savingExpense}
            >
              {savingExpense ? "Submitting..." : "Submit Expense"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {expenseError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {expenseError}
            </div>
          )}

          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Expense Category
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={expenseForm.category}
              onChange={(event) =>
                updateExpenseForm("category", event.target.value)
              }
            >
              <option>Travel</option>
              <option>Meals</option>
              <option>Accommodation</option>
              <option>Office Supplies</option>
              <option>Training</option>
              <option>Internet & Mobile</option>
              <option>Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Amount (BDT)"
              type="number"
              min="1"
              step="1"
              value={expenseForm.amount}
              onChange={(event) =>
                updateExpenseForm("amount", event.target.value)
              }
              placeholder="1200"
            />
            <Input
              label="Expense Date"
              type="date"
              value={expenseForm.expenseDate}
              onChange={(event) =>
                updateExpenseForm("expenseDate", event.target.value)
              }
            />
          </div>

          {Number(expenseForm.amount) > 0 && (
            <p className="text-sm text-muted-foreground">
              Amount preview: {formatCurrencyBDT(Number(expenseForm.amount))}
            </p>
          )}

          <div>
            <label className="block text-sm mb-1.5 text-foreground">
              Description / Reason
            </label>
            <textarea
              className="w-full min-h-24 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={expenseForm.description}
              onChange={(event) =>
                updateExpenseForm("description", event.target.value)
              }
              placeholder="Add the business reason for this claim."
            />
          </div>

          <Input
            label="Receipt"
            type="file"
            onChange={(event) =>
              updateExpenseForm("receipt", event.target.files?.[0] || null)
            }
          />
          <p className="text-xs text-muted-foreground">
            Upload a receipt image or PDF if available.
          </p>
        </div>
      </Modal>
    </div>
  );
}
