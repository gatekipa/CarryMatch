import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import { toast } from "sonner";

export default function VendorTrackingFeedback() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [response, setResponse] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
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
        .then(vendors => {
          if (vendors) {
            setVendor(vendors?.[0]);
          }
        });
    }
  }, [user]);

  const permissions = useVendorPermissions(vendorStaff);

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['vendor-tracking-feedback', vendor?.id, filterStatus],
    queryFn: async () => {
      if (!vendor) return [];
      let query = { vendor_id: vendor.id };
      if (filterStatus !== "all") query.status = filterStatus;
      return await base44.entities.TrackingFeedback.filter(query, "-created_date");
    },
    enabled: !!vendor
  });

  const respondMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TrackingFeedback.update(selectedFeedback.id, {
        status: "RESOLVED",
        admin_response: response,
        responded_by: vendorStaff.email,
        responded_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-tracking-feedback'] });
      setSelectedFeedback(null);
      setResponse("");
      toast.success("Response sent!");
    }
  });

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </Card>
      </div>
    );
  }

  const statusColors = {
    PENDING: "bg-yellow-500/20 text-yellow-300",
    REVIEWED: "bg-blue-500/20 text-blue-300",
    RESOLVED: "bg-green-500/20 text-green-300"
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Customer Feedback</h1>
              <p className="text-gray-400">Messages from tracking page</p>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading feedback...</p>
            </Card>
          ) : feedbacks.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No feedback yet</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white font-mono">{feedback.tracking_code}</h3>
                          <Badge className={statusColors[feedback.status]}>
                            {feedback.status}
                          </Badge>
                          <Badge className="bg-white/10 text-gray-300 text-xs">
                            {feedback.feedback_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {feedback.customer_name} • {feedback.customer_email}
                          {feedback.customer_phone && ` • ${feedback.customer_phone}`}
                        </p>
                        <p className="text-white mb-2">{feedback.message}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(feedback.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>

                    {feedback.admin_response ? (
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Response:</p>
                        <p className="text-white text-sm">{feedback.admin_response}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          By {feedback.responded_by} • {format(new Date(feedback.responded_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedFeedback(feedback)}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Respond
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Response Dialog */}
          {selectedFeedback && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="p-6 bg-[#1a1a2e] border-white/10 max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">Respond to Feedback</h3>
                <div className="p-4 bg-white/5 rounded-lg mb-4">
                  <p className="text-sm text-gray-400 mb-1">Customer Message:</p>
                  <p className="text-white">{selectedFeedback.message}</p>
                </div>
                <div className="mb-4">
                  <Label className="text-gray-300">Your Response *</Label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="bg-white/5 border-white/10 text-white"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFeedback(null);
                      setResponse("");
                    }}
                    className="flex-1 border-white/10 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => respondMutation.mutate()}
                    disabled={!response || respondMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
                  >
                    {respondMutation.isPending ? "Sending..." : "Send Response"}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}