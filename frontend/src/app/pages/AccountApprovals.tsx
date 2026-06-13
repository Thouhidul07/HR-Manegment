import { useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, UserCheck, XCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import api from "../services/api";

type AccountRequest = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  status: "pending" | "rejected";
  registeredAt: string;
};

function formatDate(value: string) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function roleLabel(role: string) {
  return role === "hr_manager" ? "HR Manager" : role === "admin" ? "Admin" : "Employee";
}

export function AccountApprovals() {
  const [accounts, setAccounts] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectingAccount, setRejectingAccount] = useState<AccountRequest | null>(null);
  const [rejectError, setRejectError] = useState("");

  const pendingCount = useMemo(
    () => accounts.filter((account) => account.status === "pending").length,
    [accounts],
  );

  async function loadAccounts() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/account-approvals");
      setAccounts(response.data.accounts || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load account approvals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const showMessage = (nextMessage: string) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 3000);
  };

  const approveAccount = async (account: AccountRequest) => {
    setActionId(account.id);
    setError("");
    try {
      await api.patch(`/account-approvals/${account.id}/approve`);
      showMessage(`${account.name} was approved and can now sign in.`);
      await loadAccounts();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to approve this account.");
    } finally {
      setActionId(null);
    }
  };

  const rejectAccount = async () => {
    if (!rejectingAccount) return;

    setActionId(rejectingAccount.id);
    setRejectError("");
    try {
      await api.patch(`/account-approvals/${rejectingAccount.id}/reject`);
      showMessage(`${rejectingAccount.name} was rejected.`);
      setRejectingAccount(null);
      await loadAccounts();
    } catch (err: any) {
      setRejectError(err?.response?.data?.message || "Unable to reject this account.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground mb-2">Account Approvals</h1>
          <p className="text-muted-foreground">Review pending HRSpace account registrations</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={loadAccounts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
              <p className="text-2xl text-foreground">{pendingCount}</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[var(--primary)]" />
            </div>
          </div>
        </Card>
        <Card className="p-5 md:col-span-2">
          <p className="text-sm text-muted-foreground">
            Public registrations are created as pending employee accounts. Admin approval activates sign-in access.
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Requested Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading account requests...
                </TableCell>
              </TableRow>
            ) : accounts.length ? (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{account.department || "No department added"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{account.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel(account.role)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{account.phone || "Not added"}</TableCell>
                  <TableCell className="text-sm">{formatDate(account.registeredAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={account.status === "rejected" ? "destructive" : "secondary"}
                      className={account.status === "pending" ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" : ""}
                    >
                      {account.status === "pending" ? "Pending" : "Rejected"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {account.status === "pending" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[var(--success)] hover:bg-[var(--success)]/10"
                            onClick={() => approveAccount(account)}
                            disabled={actionId === account.id}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {actionId === account.id ? "Working..." : "Approve"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setRejectError("");
                              setRejectingAccount(account);
                            }}
                            disabled={actionId === account.id}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">No action available</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No pending account requests.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(rejectingAccount)}
        title="Reject Account"
        message={
          <>
            Reject <span className="text-foreground">{rejectingAccount?.name}</span>? This account will not be able to
            sign in.
          </>
        }
        confirmLabel="Reject Account"
        loading={Boolean(rejectingAccount && actionId === rejectingAccount.id)}
        error={rejectError}
        onClose={() => {
          if (actionId) return;
          setRejectingAccount(null);
          setRejectError("");
        }}
        onConfirm={rejectAccount}
      />
    </div>
  );
}
