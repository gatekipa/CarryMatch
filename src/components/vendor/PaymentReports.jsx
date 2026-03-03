import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function PaymentReports({ vendor, vendorStaff }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");

  const { data: branches = [] } = useQuery({
    queryKey: ['vendor-branches', vendor.id],
    queryFn: async () => {
      return await base44.entities.Branch.filter({ vendor_id: vendor.id });
    }
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment-reports', vendor.id, dateFrom, dateTo, filterMethod, filterBranch],
    queryFn: async () => {
      let query = {
        vendor_id: vendor.id,
        payment_status: { $in: ["PAID", "PARTIAL"] }
      };

      if (dateFrom) {
        query.payment_recorded_at = { $gte: new Date(dateFrom).toISOString() };
      }
      if (dateTo) {
        if (query.payment_recorded_at) {
          query.payment_recorded_at.$lte = new Date(dateTo).toISOString();
        } else {
          query.payment_recorded_at = { $lte: new Date(dateTo).toISOString() };
        }
      }
      if (filterMethod !== "all") {
        query.payment_method = filterMethod;
      }
      if (filterBranch !== "all") {
        query.branch_id = filterBranch;
      }

      return await base44.entities.Shipment.filter(query, "-payment_recorded_at");
    }
  });

  const summary = {
    total: payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0),
    count: payments.length,
    byMethod: payments.reduce((acc, p) => {
      const method = p.payment_method || "UNKNOWN";
      acc[method] = (acc[method] || 0) + (p.amount_paid || 0);
      return acc;
    }, {})
  };

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Tracking Code",
      "Sender",
      "Recipient",
      "Amount",
      "Payment Method",
      "Reference",
      "Recorded By",
      "Branch"
    ];

    const rows = payments.map(p => [
      p.payment_recorded_at ? format(new Date(p.payment_recorded_at), "yyyy-MM-dd HH:mm") : "",
      p.tracking_code,
      p.sender_name,
      p.recipient_name,
      p.amount_paid || 0,
      p.payment_method || "",
      p.payment_reference || "",
      p.payment_recorded_by || "",
      p.branch_id || ""
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="font-bold text-white mb-4">Filter Payments</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-gray-300">From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Payment Method</Label>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="ZELLE">Zelle</SelectItem>
                <SelectItem value="MOMO">Mobile Money</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300">Branch</Label>
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Total Collected</p>
              <p className="text-2xl font-bold text-white">
                {vendor.base_currency} {summary.total.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Transactions</p>
              <p className="text-2xl font-bold text-white">{summary.count}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <p className="text-sm text-gray-400 mb-3">By Method</p>
          <div className="space-y-1">
            {Object.entries(summary.byMethod).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{method}</span>
                <span className="text-white font-mono">{vendor.base_currency} {amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportCSV}
          disabled={payments.length === 0}
          className="bg-green-500 hover:bg-green-600"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <p className="text-gray-400">Loading payments...</p>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <p className="text-gray-400">No payments found for the selected filters</p>
        </Card>
      ) : (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Tracking</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Customer</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Method</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-400">Amount</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-4 text-sm text-gray-300">
                      {payment.payment_recorded_at ? 
                        format(new Date(payment.payment_recorded_at), "MMM d, h:mm a") : 
                        "-"
                      }
                    </td>
                    <td className="p-4 text-sm text-white font-mono">{payment.tracking_code}</td>
                    <td className="p-4 text-sm text-gray-300">{payment.sender_name}</td>
                    <td className="p-4">
                      <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                        {payment.payment_method}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-right text-white font-bold">
                      {payment.currency} {payment.amount_paid?.toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {payment.payment_reference || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}