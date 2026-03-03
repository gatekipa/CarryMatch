import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertTriangle, Search, CheckCircle, Clock, Eye, MessageSquare,
  Loader2, ArrowRight, XCircle, User
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function DisputeSection({ disputes, users }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState("");

  // Mutations
  const updateDispute = useMutation({
    mutationFn: async ({ disputeId, updates }) => {
      await base44.entities.Dispute.update(disputeId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sa-disputes"]);
      toast.success("Dispute updated");
      setSelectedDispute(null);
      setResolution("");
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  // Stats
  const openCount = disputes.filter(d => d.status === "open").length;
  const reviewCount = disputes.filter(d => d.status === "in_review").length;
  const resolvedCount = disputes.filter(d => d.status === "resolved").length;

  // Filtered
  const filtered = disputes.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (d.complainant_email || "").toLowerCase().includes(term) ||
             (d.respondent_email || "").toLowerCase().includes(term) ||
             (d.description || "").toLowerCase().includes(term);
    }
    return true;
  });

  const statusColor = (status) => {
    switch (status) {
      case "open": return "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400";
      case "in_review": return "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400";
      case "resolved": return "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400";
      case "closed": return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
      default: return "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dispute Center</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage disputes across all platform verticals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", value: openCount, icon: AlertTriangle, color: "text-red-500" },
          { label: "In Review", value: reviewCount, icon: Eye, color: "text-orange-500" },
          { label: "Resolved", value: resolvedCount, icon: CheckCircle, color: "text-green-500" },
          { label: "Total", value: disputes.length, icon: MessageSquare, color: "text-gray-500 dark:text-gray-400" },
        ].map(s => (
          <Card key={s.label} className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
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
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by email or description..."
            className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
            <SelectItem value="all">All ({disputes.length})</SelectItem>
            <SelectItem value="open">Open ({openCount})</SelectItem>
            <SelectItem value="in_review">In Review ({reviewCount})</SelectItem>
            <SelectItem value="resolved">Resolved ({resolvedCount})</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dispute List */}
      <div className="space-y-3">
        {filtered.slice(0, 50).map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
            <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${statusColor(d.status)}`}>{d.status}</Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{d.dispute_type || "General"}</span>
                    {d.created_date && <span className="text-xs text-gray-400">{new Date(d.created_date).toLocaleDateString()}</span>}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{d.description?.slice(0, 200) || "No description"}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {d.complainant_email}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{d.respondent_email}</span>
                  </div>
                  {d.resolution_notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic border-l-2 border-green-400 pl-2">
                      Resolution: {d.resolution_notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {d.status === "open" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                      onClick={() => updateDispute.mutate({ disputeId: d.id, updates: { status: "in_review" } })}>
                      <Eye className="w-3 h-3 mr-1" /> Review
                    </Button>
                  )}
                  {(d.status === "open" || d.status === "in_review") && (
                    <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30"
                      onClick={() => { setSelectedDispute(d); setResolution(""); }}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">No disputes found</div>
        )}
        {filtered.length > 50 && (
          <p className="text-center text-xs text-gray-400">Showing first 50 of {filtered.length}</p>
        )}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => { if (!open) setSelectedDispute(null); }}>
        <DialogContent className="bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Resolve Dispute</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300">
                {selectedDispute.description?.slice(0, 300)}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Resolution Notes *</label>
                <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe the resolution..."
                  className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white min-h-[100px]" />
              </div>
              <Button onClick={() => updateDispute.mutate({
                disputeId: selectedDispute.id,
                updates: { status: "resolved", resolution_notes: resolution, resolved_at: new Date().toISOString() }
              })} disabled={updateDispute.isPending || !resolution.trim()}
                className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
                {updateDispute.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Resolve Dispute
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
