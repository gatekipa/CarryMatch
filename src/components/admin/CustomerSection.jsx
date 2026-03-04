import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, User, Package, Bus, Truck, AlertTriangle, Star,
  ShieldCheck, Ban, RotateCcw, Bell, Flag, Loader2, X,
  ArrowRight, CheckCircle, XCircle, Clock, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CustomerSection({ users, allData }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [notifMessage, setNotifMessage] = useState("");
  const [showNotifDialog, setShowNotifDialog] = useState(false);
  const [trustAdjust, setTrustAdjust] = useState({ value: 0, reason: "" });
  const [showTrustDialog, setShowTrustDialog] = useState(false);

  const { trips, requests, matches, orders, disputes, reviews } = allData;

  // Search users
  const filteredUsers = users.filter(u => {
    if (!searchTerm || searchTerm.length < 2) return false;
    const term = searchTerm.toLowerCase();
    return (u.full_name || "").toLowerCase().includes(term) ||
           (u.email || u.created_by || "").toLowerCase().includes(term) ||
           (u.phone_number || "").includes(term);
  });

  // Get customer data when selected
  const customerEmail = selectedUser?.email || selectedUser?.created_by || "";
  const customerTrips = trips.filter(t => t.created_by === customerEmail);
  const customerRequests = requests.filter(r => r.created_by === customerEmail);
  const customerMatches = matches.filter(m => m.traveler_email === customerEmail || m.requester_email === customerEmail);
  const customerOrders = orders.filter(o => o.created_by === customerEmail || o.user_email === customerEmail);
  const customerDisputes = disputes.filter(d => d.complainant_email === customerEmail || d.respondent_email === customerEmail);
  const customerReviews = reviews.filter(r => r.reviewer_email === customerEmail || r.reviewee_email === customerEmail);

  // Mutations
  const restrictMutation = useMutation({
    mutationFn: async ({ userId, restrict, reason }) => {
      await base44.entities.User.update(userId, {
        is_restricted: restrict,
        restriction_reason: restrict ? reason : "",
        admin_flags: restrict ? ["admin-restricted"] : []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-users"] });
      toast.success("User updated");
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const sendNotifMutation = useMutation({
    mutationFn: async ({ userEmail, message }) => {
      await base44.entities.Notification.create({
        user_email: userEmail,
        type: "admin_message",
        title: "Message from Admin",
        message: message,
        is_read: false
      });
    },
    onSuccess: () => {
      toast.success("Notification sent");
      setShowNotifDialog(false);
      setNotifMessage("");
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const updateTrustMutation = useMutation({
    mutationFn: async ({ userId, newScore }) => {
      await base44.entities.User.update(userId, { trust_score: newScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sa-users"] });
      toast.success("Trust score updated");
      setShowTrustDialog(false);
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const trustScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Support</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Search and troubleshoot customer accounts</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-base"
          autoFocus />
      </div>

      {/* Search Results */}
      {searchTerm.length >= 2 && !selectedUser && (
        <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5">
          {filteredUsers.slice(0, 20).map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
              {u.profile_picture_url ? (
                <img src={u.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.full_name || "Unnamed"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email || u.created_by}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${trustScoreColor(u.trust_score || 0)}`}>{u.trust_score || 0}</span>
                {u.is_restricted && <Badge className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs">Restricted</Badge>}
                {u.is_verified && <Badge className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs">Verified</Badge>}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No users found matching "{searchTerm}"</div>
          )}
          {filteredUsers.length > 20 && (
            <div className="p-3 text-center text-xs text-gray-400">Showing first 20 of {filteredUsers.length} results</div>
          )}
        </Card>
      )}

      {/* Customer 360° View */}
      {selectedUser && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Header */}
          <Card className="p-6 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {selectedUser.profile_picture_url ? (
                  <img src={selectedUser.profile_picture_url} alt="" className="w-16 h-16 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.full_name || "Unnamed User"}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{customerEmail}</p>
                  {selectedUser.phone_number && <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.phone_number}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.is_verified && <Badge className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>}
                    {selectedUser.is_restricted && <Badge className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs"><Ban className="w-3 h-3 mr-1" /> Restricted</Badge>}
                    {(selectedUser.additional_roles || []).map(r => (
                      <Badge key={r} className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Trust Score + Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <p className={`text-2xl font-bold ${trustScoreColor(selectedUser.trust_score || 0)}`}>{selectedUser.trust_score || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Trust Score</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerTrips.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Trips</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerRequests.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Requests</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerOrders.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customerDisputes.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Disputes</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              {selectedUser.is_restricted ? (
                <Button size="sm" variant="outline" onClick={() => restrictMutation.mutate({ userId: selectedUser.id, restrict: false })}
                  className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30 text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" /> Unblock
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => {
                  const reason = window.prompt("Restriction reason:");
                  if (reason) restrictMutation.mutate({ userId: selectedUser.id, restrict: true, reason });
                }} className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 text-xs">
                  <Ban className="w-3 h-3 mr-1" /> Restrict
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowNotifDialog(true)}
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 text-xs">
                <Bell className="w-3 h-3 mr-1" /> Send Notification
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setTrustAdjust({ value: selectedUser.trust_score || 0, reason: "" });
                setShowTrustDialog(true);
              }} className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 text-xs">
                <ShieldCheck className="w-3 h-3 mr-1" /> Adjust Trust
              </Button>
            </div>
          </Card>

          {/* Activity Tabs */}
          <Tabs defaultValue="p2p" className="w-full">
            <TabsList className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 h-auto flex-wrap gap-1 p-1">
              <TabsTrigger value="p2p" className="text-xs"><Package className="w-3.5 h-3.5 mr-1" /> P2P ({customerTrips.length + customerRequests.length})</TabsTrigger>
              <TabsTrigger value="bus" className="text-xs"><Bus className="w-3.5 h-3.5 mr-1" /> Bus ({customerOrders.length})</TabsTrigger>
              <TabsTrigger value="disputes" className="text-xs"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Disputes ({customerDisputes.length})</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs"><Star className="w-3.5 h-3.5 mr-1" /> Reviews ({customerReviews.length})</TabsTrigger>
            </TabsList>

            {/* P2P Tab */}
            <TabsContent value="p2p">
              <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Trips Posted ({customerTrips.length})</h4>
                {customerTrips.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    {customerTrips.slice(0, 10).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{t.departure_city} → {t.arrival_city}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.departure_date}</p>
                        </div>
                        <Badge className={`text-xs ${t.status === 'active' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 mb-6">No trips posted</p>}

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Requests ({customerRequests.length})</h4>
                {customerRequests.length > 0 ? (
                  <div className="space-y-2">
                    {customerRequests.slice(0, 10).map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{r.origin_city} → {r.destination_city}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.item_description?.slice(0, 60)}</p>
                        </div>
                        <Badge className="text-xs bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400">{r.status || "open"}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No requests</p>}
              </Card>
            </TabsContent>

            {/* Bus Tab */}
            <TabsContent value="bus">
              <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Bus Orders ({customerOrders.length})</h4>
                {customerOrders.length > 0 ? (
                  <div className="space-y-2">
                    {customerOrders.slice(0, 10).map(o => (
                      <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{o.passenger_name || "—"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{(o.amount_xaf || 0).toLocaleString()} XAF · {o.channel || "online"}</p>
                        </div>
                        <Badge className={`text-xs ${o.order_status === 'confirmed' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>{o.order_status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No bus orders</p>}
              </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes">
              <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                {customerDisputes.length > 0 ? (
                  <div className="space-y-3">
                    {customerDisputes.map(d => (
                      <div key={d.id} className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${d.status === 'open' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : d.status === 'resolved' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'}`}>{d.status}</Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{d.dispute_type || "General"}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{d.complainant_email === customerEmail ? "(Filed by customer)" : "(Filed against customer)"}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{d.description?.slice(0, 200)}</p>
                        {d.resolution_notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Resolution: {d.resolution_notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No disputes</p>}
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                {customerReviews.length > 0 ? (
                  <div className="space-y-3">
                    {customerReviews.slice(0, 10).map(r => (
                      <div key={r.id} className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= (r.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}</div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {r.reviewer_email === customerEmail ? "Given" : "Received"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{r.comment?.slice(0, 150) || "No comment"}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No reviews</p>}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Send Notification Dialog */}
      <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
        <DialogContent className="bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">To: {selectedUser?.full_name || customerEmail}</p>
            <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Enter your message..."
              className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white min-h-[100px]" />
            <Button onClick={() => {
                if (!selectedUser) return;
                sendNotifMutation.mutate({ userEmail: selectedUser.email || selectedUser.created_by || "", message: notifMessage });
              }}
              disabled={sendNotifMutation.isPending || !notifMessage.trim() || !selectedUser}
              className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
              {sendNotifMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trust Score Dialog */}
      <Dialog open={showTrustDialog} onOpenChange={setShowTrustDialog}>
        <DialogContent className="bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Adjust Trust Score</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">New Score (0–100)</label>
              <Input type="number" min={0} max={100} value={trustAdjust.value}
                onChange={(e) => setTrustAdjust(p => ({ ...p, value: parseInt(e.target.value) || 0 }))}
                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
            </div>
            <Button onClick={() => {
                if (!selectedUser) return;
                updateTrustMutation.mutate({ userId: selectedUser.id, newScore: trustAdjust.value });
              }}
              disabled={updateTrustMutation.isPending || !selectedUser}
              className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
              Update Trust Score
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
