import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Plane,
  Package,
  Eye,
  AlertCircle,
  Loader2,
  Star,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePermissions } from "@/components/permissions/usePermissions";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminVerifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");

  const permissions = usePermissions(user);

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      if (!userData || (userData.role !== 'admin' && !permissions.hasPermission('can_verify_users'))) {
        navigate(createPageUrl("Home"));
      }
    }).catch(() => {
      navigate(createPageUrl("Home"));
    });
  }, [navigate, permissions]);

  // Fetch identity verifications
   const { data: identityVerifications = [], isLoading: identityLoading } = useQuery({
     queryKey: ['identity-verifications'],
     queryFn: async () => {
       const users = await base44.entities.User.filter({
         verification_status: "pending"
       }, "-verification_submitted_date");
       return users;
     },
     enabled: !!user && permissions.hasPermission('can_verify_users'),
     staleTime: 5000,
     retry: 2
   });

  // Fetch role verification requests
   const { data: roleRequests = [], isLoading: rolesLoading } = useQuery({
     queryKey: ['role-verification-requests'],
     queryFn: () => base44.entities.RoleVerificationRequest.list("-created_date"),
     enabled: !!user && permissions.hasPermission('can_verify_users'),
     staleTime: 5000,
     retry: 2
   });

  const approveIdentityMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, {
        is_verified: true,
        verification_status: "approved",
        verification_approved_date: new Date().toISOString()
      });
    },
    onSuccess: async (_, userId) => {
      const verifiedUser = identityVerifications.find(u => u.id === userId);

      queryClient.invalidateQueries({ queryKey: ['identity-verifications'] });

      if (verifiedUser) {
        await base44.entities.Notification.create({
          user_email: verifiedUser.email,
          type: "system",
          title: "✅ Identity Verified!",
          message: "Your identity has been verified. You now have enhanced trust and can access more features.",
          priority: "high"
        }).catch(err => console.error('Failed to create notification:', err));
      }
      toast.success("Identity approved successfully!");
    },
    onError: () => toast.error("Failed to approve identity")
  });

  const rejectIdentityMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      await base44.entities.User.update(userId, {
        verification_status: "rejected",
        verification_rejection_reason: reason
      });
    },
    onSuccess: async (_, variables) => {
      const rejectedUser = identityVerifications.find(u => u.id === variables.userId);

      queryClient.invalidateQueries({ queryKey: ['identity-verifications'] });

      if (rejectedUser) {
        await base44.entities.Notification.create({
          user_email: rejectedUser.email,
          type: "system",
          title: "❌ Verification Rejected",
          message: `Your identity verification was rejected. Reason: ${variables.reason}. You can resubmit with better documents.`,
          priority: "high"
        }).catch(err => console.error('Failed to create notification:', err));
      }
      toast.success("Identity rejected with feedback sent");
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: () => toast.error("Failed to reject identity")
  });

  const approveRoleMutation = useMutation({
    mutationFn: async (requestId) => {
      const request = roleRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Update request status
      await base44.entities.RoleVerificationRequest.update(requestId, {
        status: "approved",
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
        admin_notes: adminNotes
      });

      // Update user with new role
      const users = await base44.entities.User.filter({ email: request.user_email });
      if (users[0]) {
        const currentRoles = users[0].additional_roles || [];
        if (!currentRoles.includes(request.requested_role)) {
          await base44.entities.User.update(users[0].id, {
            additional_roles: [...currentRoles, request.requested_role]
          });
        }
      }
    },
    onSuccess: async (_, requestId) => {
      const request = roleRequests.find(r => r.id === requestId);

      queryClient.invalidateQueries({ queryKey: ['role-verification-requests'] });

      if (request) {
        await base44.entities.Notification.create({
          user_email: request.user_email,
          type: "system",
          title: "🎉 Role Verification Approved!",
          message: `Congratulations! You're now a ${request.requested_role.replace('_', ' ')}. Enjoy your premium benefits!`,
          priority: "high",
          link_url: createPageUrl("UserProfile", `email=${request.user_email}`)
        }).catch(err => console.error('Failed to create notification:', err));
      }
      toast.success("Role verification approved!");
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: () => toast.error("Failed to approve role verification")
  });

  const rejectRoleMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      await base44.entities.RoleVerificationRequest.update(requestId, {
        status: "rejected",
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
        rejection_reason: reason,
        admin_notes: adminNotes
      });
    },
    onSuccess: async (_, variables) => {
      const request = roleRequests.find(r => r.id === variables.requestId);

      queryClient.invalidateQueries({ queryKey: ['role-verification-requests'] });

      if (request) {
        await base44.entities.Notification.create({
          user_email: request.user_email,
          type: "system",
          title: "Application Not Approved",
          message: `Your application for ${request.requested_role.replace('_', ' ')} was not approved. Reason: ${variables.reason}`,
          priority: "normal"
        }).catch(err => console.error('Failed to create notification:', err));
      }
      toast.success("Application rejected with feedback");
      setSelectedRequest(null);
      setRejectionReason("");
      setAdminNotes("");
    },
    onError: () => toast.error("Failed to reject role verification")
  });

  const filteredRoleRequests = roleRequests.filter(r => 
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  if (!user || !permissions.hasPermission('can_verify_users')) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Verification Center</h1>
              <p className="text-gray-400">Review and approve verification requests</p>
            </div>
          </div>

          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="bg-white/5 border-white/10 mb-6">
              <TabsTrigger value="identity">
                <Shield className="w-4 h-4 mr-2" />
                Identity Verifications ({identityVerifications.length})
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Star className="w-4 h-4 mr-2" />
                Role Verifications ({roleRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity">
              {identityLoading ? (
                <Card className="p-12 bg-white/5 border-white/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#9EFF00] animate-spin mr-3" />
                  <p className="text-gray-400">Loading verifications...</p>
                </Card>
              ) : identityVerifications.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">All Caught Up!</h3>
                  <p className="text-gray-400">No pending identity verifications</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {identityVerifications.map(userToVerify => (
                    <Card key={userToVerify.id} className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{userToVerify.full_name || "Unnamed"}</h3>
                            <p className="text-sm text-gray-400">{userToVerify.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-400 text-xs mb-1">Document Type</Label>
                          <p className="text-white">{userToVerify.verification_document_type || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs mb-1">Submitted</Label>
                          <p className="text-white">
                            {userToVerify.verification_submitted_date 
                              ? format(new Date(userToVerify.verification_submitted_date), "MMM d, yyyy")
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {userToVerify.verification_document_uri && (
                        <div className="mb-4">
                          <a
                            href={userToVerify.verification_document_uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-blue-300"
                          >
                            <FileText className="w-5 h-5" />
                            <span className="flex-1">View Verification Document</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={() => approveIdentityMutation.mutate(userToVerify.id)}
                          disabled={approveIdentityMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                           onClick={() => {
                             setSelectedRequest(userToVerify);
                             setRejectionReason("");
                           }}
                           disabled={rejectIdentityMutation.isPending}
                           className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                         >
                           <XCircle className="w-4 h-4 mr-2" />
                           Reject
                         </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roles">
              {rolesLoading && roleRequests.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#9EFF00] animate-spin mr-3" />
                  <p className="text-gray-400">Loading verifications...</p>
                </Card>
              ) : (
                <>
              <div className="mb-4">
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList className="bg-white/5 border-white/10">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {filteredRoleRequests.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {filterStatus === 'pending' ? 'All Caught Up!' : 'No Requests Found'}
                  </h3>
                  <p className="text-gray-400">
                    {filterStatus === 'pending' 
                      ? 'No pending role verification requests' 
                      : `No ${filterStatus} requests`}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredRoleRequests.map(request => (
                    <Card key={request.id} className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            request.requested_role === 'verified_traveler'
                              ? 'bg-blue-500/20'
                              : 'bg-purple-500/20'
                          }`}>
                            {request.requested_role === 'verified_traveler' ? (
                              <Plane className="w-6 h-6 text-blue-400" />
                            ) : (
                              <Package className="w-6 h-6 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {request.user_name}
                            </h3>
                            <p className="text-sm text-gray-400">{request.user_email}</p>
                          </div>
                        </div>
                        <Badge className={
                          request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>
                          {request.status === 'approved' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                          ) : request.status === 'rejected' ? (
                            <><XCircle className="w-3 h-3 mr-1" /> Rejected</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <Badge className={
                          request.requested_role === 'verified_traveler'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }>
                          {request.requested_role.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        {request.application_details?.experience_years > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-gray-300">
                              {request.application_details.experience_years} years of experience
                            </span>
                          </div>
                        )}
                        
                        {request.application_details?.description && (
                          <div className="p-3 rounded-lg bg-white/5">
                            <Label className="text-gray-400 text-xs mb-2 block">Application Statement</Label>
                            <p className="text-gray-300 text-sm">{request.application_details.description}</p>
                          </div>
                        )}

                        {request.supporting_documents?.length > 0 && (
                          <div>
                            <Label className="text-gray-400 text-xs mb-2 block">Supporting Documents</Label>
                            <div className="space-y-2">
                              {request.supporting_documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                                >
                                  <FileText className="w-4 h-4 text-blue-400" />
                                  <span className="flex-1 text-sm text-gray-300">{doc.type}</span>
                                  <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.application_details?.references?.length > 0 && (
                          <div className="p-3 rounded-lg bg-white/5">
                            <Label className="text-gray-400 text-xs mb-2 block">References</Label>
                            <div className="space-y-1">
                              {request.application_details.references.map((ref, idx) => (
                                <div key={idx} className="text-sm text-gray-300">• {ref}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        Applied: {format(new Date(request.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </div>

                      {request.status === 'pending' && (
                        <>
                          <div className="mb-4">
                            <Label className="text-gray-300 mb-2 block">Admin Notes (Internal)</Label>
                            <Textarea
                              value={selectedRequest?.id === request.id ? adminNotes : ""}
                              onChange={(e) => {
                                setSelectedRequest(request);
                                setAdminNotes(e.target.value);
                              }}
                              placeholder="Add notes about this review..."
                              rows={2}
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                approveRoleMutation.mutate(request.id);
                              }}
                              disabled={approveRoleMutation.isPending}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {approveRoleMutation.isPending ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => setSelectedRequest(request)}
                              disabled={rejectRoleMutation.isPending}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </>
                      )}

                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <Label className="text-red-400 text-xs mb-1 block">Rejection Reason</Label>
                          <p className="text-gray-300 text-sm">{request.rejection_reason}</p>
                        </div>
                      )}

                      {request.admin_notes && (
                        <div className="p-3 rounded-lg bg-white/5 mt-3">
                          <Label className="text-gray-400 text-xs mb-1 block">Admin Notes</Label>
                          <p className="text-gray-300 text-sm">{request.admin_notes}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
                )}
                </>
                )}
                </TabsContent>
                </Tabs>
                </motion.div>
                </div>

      {/* Rejection Dialog */}
       <Dialog 
         open={!!selectedRequest && (selectedRequest.status === 'pending' || !selectedRequest.status)} 
         onOpenChange={() => {
           setSelectedRequest(null);
           setRejectionReason("");
           setAdminNotes("");
         }}
       >
        <DialogContent className="max-w-md bg-[#0F1D35] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Reject Verification</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Rejecting: {selectedRequest.user_name || selectedRequest.full_name}
                </Label>
                <Badge className="bg-gray-500/20 text-gray-300">
                  {selectedRequest.requested_role?.replace('_', ' ') || 'Identity Verification'}
                </Badge>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">
                  Reason for Rejection *
                </Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application is being rejected..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 border-white/10 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (rejectionReason.trim()) {
                      if (selectedRequest.requested_role) {
                        rejectRoleMutation.mutate({
                          requestId: selectedRequest.id,
                          reason: rejectionReason
                        });
                      } else {
                        rejectIdentityMutation.mutate({
                          userId: selectedRequest.id,
                          reason: rejectionReason
                        });
                      }
                    } else {
                      toast.error("Please provide a reason");
                    }
                  }}
                  disabled={!rejectionReason.trim() || rejectRoleMutation.isPending || rejectIdentityMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {rejectRoleMutation.isPending || rejectIdentityMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}