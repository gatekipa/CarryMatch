import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download, Printer, AlertTriangle, CheckCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function DailyCloseout() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedBranch, setSelectedBranch] = useState("");
  const [countedAmounts, setCountedAmounts] = useState({
    cash: "",
    momo: "",
    orange: "",
    other: ""
  });
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['closeout-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['closeout-branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: offlineSales = [] } = useQuery({
    queryKey: ['closeout-sales', operator?.id, selectedDate, selectedBranch],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filter = {
        operator_id: operator.id,
        created_date: {
          $gte: startOfDay.toISOString(),
          $lte: endOfDay.toISOString()
        }
      };

      // If branch selected, filter by trips from that branch
      if (selectedBranch) {
        const trips = await base44.entities.Trip.filter({ 
          operator_id: operator.id,
          departure_branch_id: selectedBranch
        });
        const tripIds = trips.map(t => t.id);
        if (tripIds.length === 0) return [];
        filter.trip_id = { $in: tripIds };
      }

      return await base44.entities.OfflineSale.filter(filter);
    },
    enabled: !!operator && !!selectedDate
  });

  const { data: existingCloseout } = useQuery({
    queryKey: ['existing-closeout', operator?.id, selectedDate, selectedBranch],
    queryFn: async () => {
      const closeouts = await base44.entities.DailyCloseout.filter({
        operator_id: operator.id,
        business_date: selectedDate,
        branch_id: selectedBranch || null
      });
      return closeouts[0];
    },
    enabled: !!operator && !!selectedDate
  });

  const createCloseoutMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.DailyCloseout.create({
        operator_id: operator.id,
        business_date: selectedDate,
        branch_id: selectedBranch || null,
        expected_totals_json: expectedTotals,
        counted_totals_json: countedAmounts,
        variance_json: variance,
        total_sales: offlineSales.length,
        closeout_status: "completed",
        closed_by_user_id: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-closeout'] });
      toast.success("Closeout completed!");
      setCountedAmounts({ cash: "", momo: "", orange: "", other: "" });
    }
  });

  const addAdjustmentMutation = useMutation({
    mutationFn: async () => {
      if (!existingCloseout) return;

      const updatedAdjustments = [
        ...(existingCloseout.adjustments_json || []),
        {
          amount: parseFloat(adjustmentAmount),
          type: adjustmentType,
          reason: adjustmentReason,
          adjusted_by: user.email,
          adjusted_at: new Date().toISOString()
        }
      ];

      await base44.entities.DailyCloseout.update(existingCloseout.id, {
        adjustments_json: updatedAdjustments
      });

      // Audit log
      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: operator.id,
        action_type: "closeout_adjusted",
        entity_type: "DailyCloseout",
        entity_id: existingCloseout.id,
        payload_json: {
          business_date: selectedDate,
          branch_id: selectedBranch,
          adjustment_amount: parseFloat(adjustmentAmount),
          adjustment_type: adjustmentType,
          reason: adjustmentReason
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-closeout'] });
      toast.success("Adjustment recorded!");
      setShowAdjustmentDialog(false);
      setAdjustmentAmount("");
      setAdjustmentReason("");
      setAdjustmentType("");
    }
  });

  // Calculate expected totals by payment method
  const expectedTotals = {
    cash: offlineSales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.sale_price_xaf, 0),
    momo: offlineSales.filter(s => s.payment_method === 'momo').reduce((sum, s) => sum + s.sale_price_xaf, 0),
    orange: offlineSales.filter(s => s.payment_method === 'orange').reduce((sum, s) => sum + s.sale_price_xaf, 0),
    other: offlineSales.filter(s => s.payment_method === 'other').reduce((sum, s) => sum + s.sale_price_xaf, 0)
  };

  const totalExpected = Object.values(expectedTotals).reduce((sum, val) => sum + val, 0);

  // Calculate variance
  const variance = {
    cash: (parseFloat(countedAmounts.cash) || 0) - expectedTotals.cash,
    momo: (parseFloat(countedAmounts.momo) || 0) - expectedTotals.momo,
    orange: (parseFloat(countedAmounts.orange) || 0) - expectedTotals.orange,
    other: (parseFloat(countedAmounts.other) || 0) - expectedTotals.other
  };

  const totalCounted = Object.values(countedAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalVariance = totalCounted - totalExpected;

  const exportCSV = () => {
    const rows = [
      ['Daily Closeout Report'],
      ['Business Date', selectedDate],
      ['Branch', selectedBranch ? branches.find(b => b.id === selectedBranch)?.branch_name : 'All Branches'],
      ['Closed By', user.email],
      [''],
      ['Payment Method', 'Expected (XAF)', 'Counted (XAF)', 'Variance (XAF)'],
      ['Cash', expectedTotals.cash, countedAmounts.cash || 0, variance.cash],
      ['MTN Mobile Money', expectedTotals.momo, countedAmounts.momo || 0, variance.momo],
      ['Orange Money', expectedTotals.orange, countedAmounts.orange || 0, variance.orange],
      ['Other', expectedTotals.other, countedAmounts.other || 0, variance.other],
      [''],
      ['TOTAL', totalExpected, totalCounted, totalVariance],
      [''],
      ['Total Sales Count', offlineSales.length]
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `closeout-${selectedDate}-${selectedBranch || 'all'}.csv`;
    a.click();
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const branchName = selectedBranch ? branches.find(b => b.id === selectedBranch)?.branch_name : 'All Branches';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Closeout - ${selectedDate}</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .info { text-align: center; margin-bottom: 30px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total-row { font-weight: bold; border-top: 2px solid #333; }
          .variance-positive { color: green; }
          .variance-negative { color: red; }
          .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${operator.name}</h1>
        <div class="info">
          <p><strong>Daily Closeout Report</strong></p>
          <p>Business Date: ${selectedDate} | Branch: ${branchName}</p>
          <p>Closed By: ${user.email}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Expected (XAF)</th>
              <th>Counted (XAF)</th>
              <th>Variance (XAF)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cash</td>
              <td>${expectedTotals.cash.toLocaleString()}</td>
              <td>${(parseFloat(countedAmounts.cash) || 0).toLocaleString()}</td>
              <td class="${variance.cash >= 0 ? 'variance-positive' : 'variance-negative'}">${variance.cash.toLocaleString()}</td>
            </tr>
            <tr>
              <td>MTN Mobile Money</td>
              <td>${expectedTotals.momo.toLocaleString()}</td>
              <td>${(parseFloat(countedAmounts.momo) || 0).toLocaleString()}</td>
              <td class="${variance.momo >= 0 ? 'variance-positive' : 'variance-negative'}">${variance.momo.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Orange Money</td>
              <td>${expectedTotals.orange.toLocaleString()}</td>
              <td>${(parseFloat(countedAmounts.orange) || 0).toLocaleString()}</td>
              <td class="${variance.orange >= 0 ? 'variance-positive' : 'variance-negative'}">${variance.orange.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Other</td>
              <td>${expectedTotals.other.toLocaleString()}</td>
              <td>${(parseFloat(countedAmounts.other) || 0).toLocaleString()}</td>
              <td class="${variance.other >= 0 ? 'variance-positive' : 'variance-negative'}">${variance.other.toLocaleString()}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL</td>
              <td>${totalExpected.toLocaleString()}</td>
              <td>${totalCounted.toLocaleString()}</td>
              <td class="${totalVariance >= 0 ? 'variance-positive' : 'variance-negative'}">${totalVariance.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        <p><strong>Total Sales Count:</strong> ${offlineSales.length}</p>
        
        <div class="footer">
          <p>Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isCompleted = !!existingCloseout;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Daily Closeout</h1>
          <p className="text-gray-400">End-of-day reconciliation for offline sales</p>
        </div>

        {/* Date & Branch Selection */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Business Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-300">Branch (Optional)</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Branches</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.branch_name}, {b.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Sales</span>
            </div>
            <div className="text-3xl font-bold text-white">{offlineSales.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Expected Total</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalExpected.toLocaleString()} XAF</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <span className="text-gray-400">Status</span>
            </div>
            <Badge className={isCompleted ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
              {isCompleted ? "Completed" : "Pending"}
            </Badge>
          </Card>
        </div>

        {/* Reconciliation Table */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <h3 className="text-xl font-bold text-white mb-6">Reconciliation by Payment Method</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 text-gray-300">Payment Method</th>
                  <th className="text-right py-3 text-gray-300">Expected (XAF)</th>
                  <th className="text-right py-3 text-gray-300">Counted (XAF)</th>
                  <th className="text-right py-3 text-gray-300">Variance (XAF)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'cash', label: 'Cash' },
                  { key: 'momo', label: 'MTN Mobile Money' },
                  { key: 'orange', label: 'Orange Money' },
                  { key: 'other', label: 'Other' }
                ].map(({ key, label }) => (
                  <tr key={key} className="border-b border-white/10">
                    <td className="py-4 text-white font-medium">{label}</td>
                    <td className="py-4 text-right text-gray-300">{expectedTotals[key].toLocaleString()}</td>
                    <td className="py-4 text-right">
                      {isCompleted ? (
                        <span className="text-gray-300">{(existingCloseout.counted_totals_json[key] || 0).toLocaleString()}</span>
                      ) : (
                        <Input
                          type="number"
                          value={countedAmounts[key]}
                          onChange={(e) => setCountedAmounts({...countedAmounts, [key]: e.target.value})}
                          placeholder="0"
                          className="bg-white/5 border-white/10 text-white text-right max-w-[150px] ml-auto"
                        />
                      )}
                    </td>
                    <td className={`py-4 text-right font-bold ${
                      variance[key] > 0 ? 'text-green-400' : variance[key] < 0 ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {isCompleted ? (
                        existingCloseout.variance_json[key]?.toLocaleString()
                      ) : (
                        variance[key].toLocaleString()
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-white/20 font-bold">
                  <td className="py-4 text-white text-lg">TOTAL</td>
                  <td className="py-4 text-right text-white text-lg">{totalExpected.toLocaleString()}</td>
                  <td className="py-4 text-right text-white text-lg">
                    {isCompleted 
                      ? Object.values(existingCloseout.counted_totals_json).reduce((sum, val) => sum + val, 0).toLocaleString()
                      : totalCounted.toLocaleString()
                    }
                  </td>
                  <td className={`py-4 text-right text-lg ${
                    totalVariance > 0 ? 'text-green-400' : totalVariance < 0 ? 'text-red-400' : 'text-white'
                  }`}>
                    {isCompleted
                      ? (Object.values(existingCloseout.counted_totals_json).reduce((sum, val) => sum + val, 0) - totalExpected).toLocaleString()
                      : totalVariance.toLocaleString()
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {totalVariance !== 0 && !isCompleted && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mt-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold">Variance Detected</p>
                  <p className="text-yellow-400 text-sm">
                    {totalVariance > 0 ? 'Overage' : 'Shortage'} of {Math.abs(totalVariance).toLocaleString()} XAF
                  </p>
                </div>
              </div>
            </Card>
          )}
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {!isCompleted ? (
            <Button
              onClick={() => createCloseoutMutation.mutate()}
              disabled={totalCounted === 0 || createCloseoutMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {createCloseoutMutation.isPending ? "Processing..." : "Complete Closeout"}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setShowAdjustmentDialog(true)}
                variant="outline"
                className="border-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Add Adjustment
              </Button>
              <Button onClick={printReport} variant="outline" className="border-white/10">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={exportCSV} variant="outline" className="border-white/10">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </>
          )}
        </div>

        {/* Adjustments */}
        {isCompleted && existingCloseout.adjustments_json?.length > 0 && (
          <Card className="p-6 bg-white/5 border-white/10 mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Adjustments</h3>
            <div className="space-y-3">
              {existingCloseout.adjustments_json.map((adj, idx) => (
                <Card key={idx} className="p-4 bg-white/5 border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-semibold mb-1">
                        {adj.type === 'add' ? '+' : '-'} {adj.amount.toLocaleString()} XAF
                      </div>
                      <div className="text-sm text-gray-400 mb-2">{adj.reason}</div>
                      <div className="text-xs text-gray-500">
                        By {adj.adjusted_by} • {format(new Date(adj.adjusted_at), "MMM d, h:mm a")}
                      </div>
                    </div>
                    <Badge className={adj.type === 'add' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {adj.type === 'add' ? 'Addition' : 'Deduction'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Adjustment Dialog */}
        <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Add Manual Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Addition (+)</SelectItem>
                    <SelectItem value="deduct">Deduction (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Amount (XAF)</Label>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300">Reason *</Label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explain the reason for this adjustment..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <Card className="p-3 bg-yellow-500/10 border-yellow-500/30">
                <p className="text-yellow-300 text-sm">
                  This adjustment will be logged in the audit trail and cannot be deleted.
                </p>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAdjustmentDialog(false);
                    setAdjustmentAmount("");
                    setAdjustmentReason("");
                    setAdjustmentType("");
                  }}
                  className="flex-1 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => addAdjustmentMutation.mutate()}
                  disabled={!adjustmentAmount || !adjustmentReason || !adjustmentType || addAdjustmentMutation.isPending}
                  className="flex-1 bg-blue-500"
                >
                  {addAdjustmentMutation.isPending ? "Recording..." : "Record Adjustment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}