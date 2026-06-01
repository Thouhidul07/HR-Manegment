import { Calendar, Download, FileText, Wallet } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const payslips = [
  { month: "March 2026", payDate: "Apr 5, 2026", gross: 4200, deductions: 750, net: 3450, status: "Processed" },
  { month: "February 2026", payDate: "Mar 5, 2026", gross: 4200, deductions: 750, net: 3450, status: "Processed" },
  { month: "January 2026", payDate: "Feb 5, 2026", gross: 4120, deductions: 740, net: 3380, status: "Processed" },
  { month: "December 2025", payDate: "Jan 5, 2026", gross: 4120, deductions: 740, net: 3380, status: "Processed" },
];

function downloadPayslip(month: string, net: number) {
  const file = new Blob(
    [`HR Space Payslip\nMonth: ${month}\nNet Pay: $${net.toLocaleString()}\nStatus: Processed\n`],
    { type: "text/plain" }
  );
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${month.replace(/\s+/g, "-").toLowerCase()}-payslip.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function Payslips() {
  const latest = payslips[0];
  const yearToDate = payslips.reduce((sum, payslip) => sum + payslip.net, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground mb-2">My Payslips</h1>
          <p className="text-muted-foreground">View and download your processed salary slips.</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => downloadPayslip(latest.month, latest.net)}>
          <Download className="w-4 h-4" />
          Download Latest
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
          <p className="text-2xl text-foreground">${latest.net.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{latest.month}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <Calendar className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <p className="text-sm text-muted-foreground">Payment Date</p>
          </div>
          <p className="text-2xl text-foreground">{latest.payDate}</p>
          <p className="text-xs text-muted-foreground mt-1">Next processed salary</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--chart-3)]/20">
              <FileText className="w-5 h-5 text-[var(--chart-3)]" />
            </div>
            <p className="text-sm text-muted-foreground">Year-to-Date Net</p>
          </div>
          <p className="text-2xl text-foreground">${yearToDate.toLocaleString()}</p>
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
              <div key={payslip.month} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#543884]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#543884]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{payslip.month}</p>
                    <p className="text-xs text-muted-foreground">Paid on {payslip.payDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-foreground">${payslip.net.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Net pay</p>
                  </div>
                  <Badge variant="secondary">{payslip.status}</Badge>
                  <button
                    type="button"
                    aria-label={`Download ${payslip.month} payslip`}
                    onClick={() => downloadPayslip(payslip.month, payslip.net)}
                    className="text-[#9A77CF] hover:text-[#EC4176]"
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
