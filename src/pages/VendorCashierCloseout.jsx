import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, DollarSign, Download, CheckCircle, Clock, CreditCard, Banknote, Smartphone
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { key: "CASH", label: "Cash", icon: Banknote, color: "text-green-400" },
  { key: "ZELLE", label: "Zelle", icon: CreditCard, color: "text-blue-400" },
  { key: "MOMO", label: "Mobile Money", icon: Smartphone, color: "text-yellow-400" },
  { key: "BANK_TRANSFER", label: "Bank Transfer", icon: CreditCard, color: "text-purple-400" },
  { key: "OTHER", label: "Other", icon: DollarSign, color: "text-gray-400" }
];

export default function VendorCashierCloseout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("PartnerLogin")));
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return base44.entities.Vendor.filter({ id: staff[0].vendor_id });
          }
        })
        .then(vendors => { if (vendors?.[0]) setVendor(vendors[0]); });
    }
  }, [user]);

  // Fetch shipments for the selected date that have payments
  const { data: dayShipments = [], isLoading } = useQuery({
    queryKey: ['cashier-closeout', vendor?.id, selectedDate],
    queryFn: async () => {
      if (!vendor) return [];
      const startOfDay = new Date(selectedDate + "T00:00:00");
      const endOfDay = new Date(selectedDate + "T23:59:59");
      const allShipments = await base44.entities.Shipment.filter({
        vendor_id: vendor.id,
        payment_status: { $in: ["PAID", "PARTIAL"] }
      }, "-created_date", 500);
      // Filter client-side by date
      return allShipments.filter(s => {
        const created = new Date(s.payment_recorded_at || s.created_date);
        return created >= startOfDay && created <= endOfDay;
      });
    },
    enabled: !!vendor
  });

  // Calculate totals by method
  const methodTotals = PAYMENT_METHODS.map(m => {
    const shipments = dayShipments.filter(s => s.payment_method === m.key);
    const total = shipments.reduce((sum, s) => sum + (s.amount_paid || s.total_amount || 0), 0);
    return { ...m, count: shipments.length, total };
  }).filter(m => m.count > 0);

  const grandTotal = methodTotals.reduce((sum, m) => sum + m.total, 0);
  const totalShipments = dayShipments.length;
  const insuredCount = dayShipments.filter(s => s.insurance_enabled).length;
  const insurancePremiums = dayShipments.filter(s => s.insurance_enabled).reduce((sum, s) => sum + (s.insurance_premium || 0), 0);

  const exportCSV = () => {
    const headers = ["Tracking Code", "Sender", "Recipient", "Amount", "Method", "Currency", "Insurance", "Time"];
    const rows = dayShipments.map(s => [
      s.tracking_code, s.sender_name, s.recipient_name,
      s.amount_paid || s.total_amount, s.payment_method, s.currency,
      s.insurance_enabled ? s.insurance_premium : 0,
      s.payment_recorded_at || s.created_date
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `closeout-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const currency = vendor?.base_currency || "USD";

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("VendorDashboard"))} className="text-gray-300 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-[#9EFF00]" />
              Cashier Closeout
            </h1>
            <p className="text-gray-400 mt-1">End-of-day payment reconciliation</p>
          </div>
          <Input type="date" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44 bg-white/5 border-white/10 text-white" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/20">
              <p className="text-3xl font-bold text-green-400">{currency} {grandTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Total Collected</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-3xl font-bold text-white">{totalShipments}</p>
              <p className="text-sm text-gray-400">Paid Shipments</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-3xl font-bold text-blue-400">{insuredCount}</p>
              <p className="text-sm text-gray-400">Insured Parcels</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-4 bg-white/5 border-white/10">
              <p className="text-3xl font-bold text-purple-400">{currency} {insurancePremiums.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Insurance Premiums</p>
            </Card>
          </motion.div>
        </div>

        {/* Payment Method Breakdown */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Payments by Method</h2>
          {methodTotals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payments recorded for {selectedDate}</p>
          ) : (
            <div className="space-y-3">
              {methodTotals.map(m => (
                <div key={m.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                    <div>
                      <p className="text-white font-medium">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.count} transaction{m.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <p className="text-white font-bold text-lg">{currency} {m.total.toFixed(2)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-[#9EFF00]/10 border border-[#9EFF00]/30 rounded-lg mt-2">
                <p className="text-[#9EFF00] font-bold">GRAND TOTAL</p>
                <p className="text-[#9EFF00] font-bold text-xl">{currency} {grandTotal.toFixed(2)}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Individual Transactions */}
        {dayShipments.length > 0 && (
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Transactions ({dayShipments.length})</h2>
              <Button onClick={exportCSV} variant="outline" size="sm" className="border-white/10 text-gray-300">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {dayShipments.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
                  <div>
                    <p className="text-white font-mono">{s.tracking_code}</p>
                    <p className="text-xs text-gray-500">{s.sender_name} → {s.recipient_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{s.currency} {(s.amount_paid || s.total_amount || 0).toFixed(2)}</p>
                    <Badge className="bg-white/10 text-xs text-gray-400">{s.payment_method}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Staff Info */}
        <div className="text-center text-xs text-gray-600 mt-8">
          <p>Closeout by: {vendorStaff?.full_name || user?.email} · {vendor?.display_name} · {selectedDate}</p>
        </div>
      </div>
    </div>
  );
}
