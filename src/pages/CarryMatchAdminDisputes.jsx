import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, Search, CheckCircle, Clock, MessageSquare,
  ArrowLeft, User, Package, XCircle, Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS = {
  OPEN: "bg-red-500/20 text-red-300 border-red-500/30",
  IN_REVIEW: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  RESOLVED: "bg-green-500/20 text-green-300 border-green-500/30",
  CLOSED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  ESCALATED: "bg-purple-500/20 text-purple-300 border-purple-500/30"
};

export default function CarryMatchAdminDisputes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [responseText, setResponseText] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== "admin") navigate(createPageUrl("Home"));
      setUser(u);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['admin-disputes', filterStatus],
    queryFn: async () => {
      const query = {};
      if (filterStatus !== "all") query.status = filterStatus;
      return await base44.entities.Dispute.filter(query, "-created_date", 100);
    },
    enabled: !!user
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: async () => await base44.entities.TrackingFeedback.filter({}, "-created_date", 50),
    enabled: !!user
  });

  const updateDisputeMutation = useMutation({
    mutationFn: async () => {
      const updates = {};
      if (newStatus) updates.status = newStatus;
      if (responseText) updates.admin_response = responseText;
      updates.reviewed_by = user.email;
      updates.reviewed_at = new Date().toISOString();
      await base44.entities.Dispute.update(selectedDispute.id, updates);
    },
    onSuccess: () => {
      toast.success("Dispute updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setSelectedDispute(null);
      setResponseText("");
      setNewStatus("");
    },
    onError: () => toast.error("Failed to update dispute")
  });

  const filteredDisputes = disputes.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (d.tracking_code || "").toLowerCase().includes(q) ||
      (d.vendor_name || "").toLowerCase().includes(q) ||
      (d.subject || "").toLowerCase().includes(q) ||
      (d.submitted_by || "").toLowerCase().includes(q);
  });

  const stats = {
    open: disputes.filter(d => d.status === "OPEN").length,
    inReview: disputes.filter(d => d.status === "IN_REVIEW").length,
    resolved: disputes.filter(d => d.status === "RESOLVED").length,
    total: disputes.length
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))} className="text-gray-300 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Admin Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              Dispute Center
            </h1>
            <p className="text-gray-400 mt-1">Handle complaints, feedback, and transaction disputes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Open", value: stats.open, color: "text-red-400", bg: "bg-red-500/10" },
            { label: "In Review", value: stats.inReview, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Resolved", value: stats.resolved, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Total", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10" }
          ].map((s, i) => (
            <Card key={i} className={`p-4 ${s.bg} border-white/10`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <Input placeholder="Search by tracking code, vendor, subject..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="ESCALATED">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Disputes List */}
        <Tabs defaultValue="disputes" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="disputes">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Disputes ({filteredDisputes.length})
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="w-4 h-4 mr-2" />
              Tracking Feedback ({feedbacks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disputes">
            {filteredDisputes.length === 0 ? (
              <Card className="p-8 bg-white/5 border-white/10 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="text-gray-400">No disputes found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDisputes.map(dispute => (
                  <motion.div key={dispute.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="p-5 bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                      onClick={() => setSelectedDispute(dispute)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={STATUS_COLORS[dispute.status] || STATUS_COLORS.OPEN}>
                              {dispute.status}
                            </Badge>
                            <span className="text-white font-medium">{dispute.subject || "Dispute"}</span>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            {dispute.tracking_code && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{dispute.tracking_code}</span>}
                            {dispute.vendor_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{dispute.vendor_name}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(dispute.created_date), "MMM d, yyyy")}</span>
                          </div>
                          {dispute.description && (
                            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{dispute.description}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback">
            {feedbacks.length === 0 ? (
              <Card className="p-8 bg-white/5 border-white/10 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No feedback received yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {feedbacks.map(fb => (
                  <Card key={fb.id} className="p-5 bg-white/5 border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{fb.tracking_code || fb.shipment_id}</p>
                        <p className="text-sm text-gray-400 mt-1">{fb.message || fb.feedback_text}</p>
                        {fb.rating && (
                          <div className="flex gap-1 mt-2">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className={s <= fb.rating ? "text-yellow-400" : "text-gray-600"}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{format(new Date(fb.created_date), "MMM d")}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dispute Detail Dialog */}
        {selectedDispute && (
          <Dialog open={true} onOpenChange={() => setSelectedDispute(null)}>
            <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl" aria-describedby="dispute-detail-desc">
              <DialogHeader>
                <DialogTitle className="text-white">Dispute Details</DialogTitle>
                <p id="dispute-detail-desc" className="text-gray-400 text-sm">Review and respond to this dispute</p>
              </DialogHeader>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Status</p>
                    <Badge className={STATUS_COLORS[selectedDispute.status]}>{selectedDispute.status}</Badge>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Tracking Code</p>
                    <p className="text-white font-mono">{selectedDispute.tracking_code || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Vendor</p>
                    <p className="text-white">{selectedDispute.vendor_name || selectedDispute.vendor_id || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Submitted By</p>
                    <p className="text-white">{selectedDispute.submitted_by || selectedDispute.user_email || "N/A"}</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Subject</p>
                  <p className="text-white font-medium">{selectedDispute.subject || "No subject"}</p>
                  <p className="text-xs text-gray-400 mt-3 mb-1">Description</p>
                  <p className="text-sm text-gray-300">{selectedDispute.description || "No description provided"}</p>
                </div>

                {selectedDispute.admin_response && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-400 mb-1">Previous Admin Response</p>
                    <p className="text-sm text-blue-300">{selectedDispute.admin_response}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-300 text-sm mb-2">Update Status</p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Change status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="ESCALATED">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-gray-300 text-sm mb-2">Admin Response</p>
                  <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to this dispute..."
                    className="bg-white/5 border-white/10 text-white" rows={4} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedDispute(null)} className="border-white/10 text-gray-300">Cancel</Button>
                <Button onClick={() => updateDisputeMutation.mutate()}
                  disabled={(!newStatus && !responseText) || updateDisputeMutation.isPending}
                  className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold">
                  {updateDisputeMutation.isPending ? "Saving..." : "Update Dispute"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
