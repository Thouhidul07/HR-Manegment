import { useEffect, useState } from "react";
import { Calendar, Download, FileText, Wallet } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import api from "../services/api";
import { formatCurrencyBDT } from "../utils/formatters";

type PayrollRecord = {
  id: number;
  pay_period: string;
  basic_salary: string | number;
  allowances: string | number;
  deductions: string | number;
  net_pay: string | number;
  status: string;
};

function monthLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function payDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

export function Payslips() {
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    api.get("/payroll")
      .then((response) => {
        if (isMounted) setPayslips(response.data.payroll || []);
      })
      .catch(() => {
        if (isMounted) setError("Unable to load payslips.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const latest = payslips[0];
  const yearToDate = payslips.reduce((sum, payslip) => sum + Number(payslip.net_pay || 0), 0);

  async function downloadPayslip(payslip: PayrollRecord) {
    setDownloadingId(payslip.id);
    try {
      const response = await api.get(`/payroll/${payslip.id}/payslip`, { responseType: "blob" });
      downloadBlob(response.data, `${monthLabel(payslip.pay_period).replace(/\s+/g, "-").toLowerCase()}-payslip.txt`);
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading payslips...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  if (!latest) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl text-foreground">My Payslips</h1>
        <Card className="p-6 text-muted-foreground">No processed payroll records are available yet.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">My Payslips</h1>
          <p className="text-muted-foreground">View and download your processed salary slips.</p>
        </div>
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => downloadPayslip(latest)}
          disabled={downloadingId === latest.id}
        >
          <Download className="w-4 h-4" />
          {downloadingId === latest.id ? "Downloading..." : "Download Latest"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-1)]/20">
              <Wallet className="w-5 h-5 text-[var(--chart-1)]" />
            </div>
            <p className="text-sm text-muted-foreground">Latest Net Pay</p>
          </div>
          <p className="text-2xl text-foreground">{formatCurrencyBDT(latest.net_pay)}</p>
          <p className="text-xs text-muted-foreground mt-1">{monthLabel(latest.pay_period)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Calendar className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Payment Date</p>
          </div>
          <p className="text-2xl text-foreground">{payDateLabel(latest.pay_period)}</p>
          <p className="text-xs text-muted-foreground mt-1">Most recent payroll period</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <FileText className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Year-to-Date Net</p>
          </div>
          <p className="text-2xl text-foreground">{formatCurrencyBDT(yearToDate)}</p>
          <p className="text-xs text-muted-foreground mt-1">Visible payslips</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payslips.map((payslip) => (
              <div key={payslip.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#543884]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#543884]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{monthLabel(payslip.pay_period)}</p>
                    <p className="text-xs text-muted-foreground">Period starts {payDateLabel(payslip.pay_period)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-foreground">{formatCurrencyBDT(payslip.net_pay)}</p>
                    <p className="text-xs text-muted-foreground">Net pay</p>
                  </div>
                  <Badge variant="secondary">{statusLabel(payslip.status)}</Badge>
                  <button
                    type="button"
                    aria-label={`Download ${monthLabel(payslip.pay_period)} payslip`}
                    onClick={() => downloadPayslip(payslip)}
                    disabled={downloadingId === payslip.id}
                    className="text-[#9A77CF] hover:text-[#EC4176] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
