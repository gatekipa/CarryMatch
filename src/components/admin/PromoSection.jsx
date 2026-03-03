import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Tag, Plus, Trash2, CheckCircle, XCircle, Loader2, Search,
  Percent, DollarSign, TrendingUp, BarChart3, Package, Bus, Truck, Globe
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const SCOPE_OPTIONS = [
  { value: "PLATFORM", label: "All Platform", icon: Globe, color: "bg-purple-500" },
  { value: "BUS",      label: "Bus Tickets", icon: Bus,    color: "bg-green-500" },
  { value: "P2P",      label: "P2P Delivery", icon: Package, color: "bg-blue-500" },
  { value: "CML",      label: "CML Logistics", icon: Truck, color: "bg-cyan-500" },
];

export default function PromoSection({ promoCodes }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScope, setFilterScope] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: 10,
    max_uses: 100, usage_limit_per_user: 1, valid_from: "", valid_until: "",
    operator_id: "PLATFORM"
  });

  // Mutations
  const createPromo = useMutation({
    mutationFn: async () => {
      if (!form.code.trim()) throw new Error("Code is required");
      await base44.entities.PromoCode.create({
        ...form,
        code: form.code.toUpperCase().trim(),
        is_active: true,
        current_uses: 0,
        discount_value: Number(form.discount_value) || 0,
        max_uses: Number(form.max_uses) || 100,
        usage_limit_per_user: Number(form.usage_limit_per_user) || 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sa-promos"]);
      toast.success("Promo code created");
      setShowDialog(false);
      setForm({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 100, usage_limit_per_user: 1, valid_from: "", valid_until: "", operator_id: "PLATFORM" });
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const togglePromo = useMutation({
    mutationFn: async ({ promoId, active }) => {
      await base44.entities.PromoCode.update(promoId, { is_active: active });
    },
    onSuccess: () => { queryClient.invalidateQueries(["sa-promos"]); toast.success("Promo updated"); }
  });

  const deletePromo = useMutation({
    mutationFn: async (promoId) => { await base44.entities.PromoCode.delete(promoId); },
    onSuccess: () => { queryClient.invalidateQueries(["sa-promos"]); toast.success("Promo deleted"); }
  });

  // Scope detection for existing promos
  const getScope = (p) => {
    if (!p.operator_id || p.operator_id === "PLATFORM") return "PLATFORM";
    if (p.operator_id === "P2P") return "P2P";
    if (p.operator_id === "CML") return "CML";
    return "BUS"; // operator-specific = bus
  };

  // Filtered promos
  const filtered = promoCodes.filter(p => {
    if (searchTerm && !p.code?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterScope !== "all" && getScope(p) !== filterScope) return false;
    if (filterStatus === "active" && !p.is_active) return false;
    if (filterStatus === "disabled" && p.is_active) return false;
    if (filterStatus === "expired" && (!p.valid_until || new Date(p.valid_until) >= new Date())) return false;
    return true;
  });

  // Stats
  const activeCount = promoCodes.filter(p => p.is_active).length;
  const totalRedemptions = promoCodes.reduce((s, p) => s + (p.current_uses || 0), 0);
  const totalDiscount = promoCodes.reduce((s, p) => s + ((p.current_uses || 0) * (p.discount_value || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Promo Codes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage discounts across all platform verticals</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] text-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Promo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Codes", value: promoCodes.length, icon: Tag },
          { label: "Active", value: activeCount, icon: CheckCircle },
          { label: "Redemptions", value: totalRedemptions, icon: TrendingUp },
          { label: "Discount Given", value: `${totalDiscount.toLocaleString()}`, icon: DollarSign },
        ].map((s, i) => (
          <Card key={s.label} className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search codes..."
            className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
        </div>
        <Select value={filterScope} onValueChange={setFilterScope}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
            <SelectItem value="all">All Scopes</SelectItem>
            {SCOPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Promo Table */}
      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Scope</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Discount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:table-cell">Usage</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden md:table-cell">Expires</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const scope = getScope(p);
                const scopeInfo = SCOPE_OPTIONS.find(s => s.value === scope) || SCOPE_OPTIONS[0];
                const ScopeIcon = scopeInfo.icon;
                const isExpired = p.valid_until && new Date(p.valid_until) < new Date();

                return (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[#9EFF00] text-sm font-bold">{p.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${scopeInfo.color} text-white text-[10px]`}>
                        <ScopeIcon className="w-3 h-3 mr-1" />{scopeInfo.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">
                      {p.discount_type === "percentage" ? `${p.discount_value}%` : `${p.discount_value} XAF`}
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
                      {p.current_uses || 0} / {p.max_uses || "∞"}
                    </td>
                    <td className="py-3 px-4 text-xs hidden md:table-cell">
                      {p.valid_until ? (
                        <span className={isExpired ? "text-red-500" : "text-gray-500 dark:text-gray-400"}>{p.valid_until}</span>
                      ) : <span className="text-gray-400">No expiry</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`text-xs ${p.is_active && !isExpired ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>
                        {isExpired ? "Expired" : p.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => togglePromo.mutate({ promoId: p.id, active: !p.is_active })}
                          className="h-7 px-2 text-xs text-gray-500 dark:text-gray-300">
                          {p.is_active ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                          {p.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          if (window.confirm(`Delete promo "${p.code}"?`)) deletePromo.mutate(p.id);
                        }} className="h-7 px-2 text-red-400 text-xs">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">No promo codes found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#9EFF00]" /> Create Promo Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Code *</label>
              <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. LAUNCH25"
                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Scope</label>
              <Select value={form.operator_id} onValueChange={(v) => setForm(p => ({ ...p, operator_id: v }))}>
                <SelectTrigger className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
                  {SCOPE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Type</label>
                <Select value={form.discount_type} onValueChange={(v) => setForm(p => ({ ...p, discount_type: v }))}>
                  <SelectTrigger className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (XAF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Value</label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm(p => ({ ...p, discount_value: e.target.value }))}
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Max Uses</label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm(p => ({ ...p, max_uses: e.target.value }))}
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Per-User Limit</label>
                <Input type="number" value={form.usage_limit_per_user} onChange={(e) => setForm(p => ({ ...p, usage_limit_per_user: e.target.value }))}
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Valid From</label>
                <Input type="date" value={form.valid_from} onChange={(e) => setForm(p => ({ ...p, valid_from: e.target.value }))}
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Expires</label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm(p => ({ ...p, valid_until: e.target.value }))}
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              </div>
            </div>

            <Button onClick={() => createPromo.mutate()} disabled={createPromo.isPending || !form.code.trim()}
              className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
              {createPromo.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Promo Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
