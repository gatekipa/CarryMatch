import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, XCircle, Eye, FileText, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CarryMatchAdminApplications() {
  const [user, setUser] = React.useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['vendor-applications', filterStatus],
    queryFn: async () => {
      if (filterStatus === "ALL") {
        return await base44.entities.VendorApplication.list('-created_date');
      }
      return await base44.entities.VendorApplication.filter({ status: filterStatus }, '-created_date');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ appId, notes }) => {
      const app = applications.find(a => a.id === appId);
      
      // Create vendor using service role
      const vendor = await base44.entities.Vendor.create({
        legal_name: app.legal_name,
        display_name: app.display_name,
        vendor_type: app.vendor_type,
        description: app.description,
        primary_contact_name: app.contact_name,
        primary_contact_email: app.contact_email,
        primary_contact_phone: app.contact_phone,
        hq_country: app.hq_country,
        hq_city: app.hq_city,
        registration_number: app.business_registration_doc,
        license_documents: app.license_docs || [],
        status: "ACTIVE",
        admin_user_email: app.contact_email
      });

      // Create vendor staff record for the admin user
      await base44.entities.VendorStaff.create({
        vendor_id: vendor.id,
        full_name: app.contact_name,
        email: app.contact_email,
        phone: app.contact_phone,
        role: "OWNER",
        status: "ACTIVE"
      });

      // Update application
      await base44.entities.VendorApplication.update(appId, {
        status: "APPROVED",
        admin_notes: notes,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        vendor_id: vendor.id
      });

      return vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-applications'] });
      setSelectedApp(null);
      setActionType(null);
      setAdminNotes("");
      setError("");
    },
    onError: (err) => {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve application. Please try again.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ appId, reason, notes }) => {
      await base44.entities.VendorApplication.update(appId, {
        status: "REJECTED",
        rejection_reason: reason,
        admin_notes: notes,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-applications'] });
      setSelectedApp(null);
      setActionType(null);
      setRejectionReason("");
      setAdminNotes("");
      setError("");
    },
    onError: (err) => {
      console.error("Rejection error:", err);
      setError(err.message || "Failed to reject application. Please try again.");
    }
  });

  const handleAction = () => {
    setError("");
    if (actionType === "approve") {
      approveMutation.mutate({ appId: selectedApp.id, notes: adminNotes });
    } else if (actionType === "reject") {
      rejectMutation.mutate({ appId: selectedApp.id, reason: rejectionReason, notes: adminNotes });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 bg-white/5 border-red-500/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
          <p className="text-gray-400 mb-6">You must be an administrator to access this page.</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const statusColors = {
    PENDING: "bg-yellow-500/10 text-yellow-500",
    UNDER_REVIEW: "bg-blue-500/10 text-blue-500",
    DOCUMENTS_REQUESTED: "bg-orange-500/10 text-orange-500",
    APPROVED: "bg-green-500/10 text-green-500",
    REJECTED: "bg-red-500/10 text-red-500"
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("CarryMatchAdminDashboard")}>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Vendor Applications</h1>
              <p className="text-gray-400 mt-1">Review and manage partner applications</p>
            </div>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Applications</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="DOCUMENTS_REQUESTED">Docs Requested</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-400">Loading applications...</p>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">No applications found</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{app.display_name}</h3>
                        <Badge className={statusColors[app.status]}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{app.legal_name}</p>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>{" "}
                          <span className="text-gray-300">{app.vendor_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Contact:</span>{" "}
                          <span className="text-gray-300">{app.contact_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>{" "}
                          <span className="text-gray-300">{app.hq_city}, {app.hq_country}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setActionType("view");
                        }}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {app.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setActionType("approve");
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApp(app);
                              setActionType("reject");
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {app.description && (
                    <p className="text-gray-400 text-sm mt-4 pt-4 border-t border-white/10">
                      {app.description}
                    </p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => {
        setActionType(null);
        setSelectedApp(null);
        setRejectionReason("");
        setAdminNotes("");
        setError("");
      }}>
        <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === "approve" && "Approve Application"}
              {actionType === "reject" && "Reject Application"}
              {actionType === "view" && "Application Details"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === "approve" && "Review and approve this vendor application to create an active vendor account."}
              {actionType === "reject" && "Provide a reason for rejecting this vendor application."}
              {actionType === "view" && "View complete details of this vendor application."}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2">{selectedApp.display_name}</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-400">Legal Name</Label>
                    <p className="text-white">{selectedApp.legal_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Type</Label>
                    <p className="text-white">{selectedApp.vendor_type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Contact</Label>
                    <p className="text-white">{selectedApp.contact_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Email</Label>
                    <p className="text-white">{selectedApp.contact_email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Phone</Label>
                    <p className="text-white">{selectedApp.contact_phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Location</Label>
                    <p className="text-white">{selectedApp.hq_city}, {selectedApp.hq_country}</p>
                  </div>
                </div>
              </div>

              {selectedApp.description && (
                <div>
                  <Label className="text-gray-400">Description</Label>
                  <p className="text-white text-sm mt-1">{selectedApp.description}</p>
                </div>
              )}

              {selectedApp.address && (
                <div>
                  <Label className="text-gray-400">Address</Label>
                  <p className="text-white text-sm mt-1">{selectedApp.address}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-400 mb-2 block">Documents</Label>
                <div className="space-y-2">
                  {selectedApp.business_registration_doc && (
                    <a
                      href={selectedApp.business_registration_doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9EFF00] hover:text-[#7ACC00]"
                    >
                      <FileText className="w-4 h-4" />
                      Business Registration
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedApp.license_docs?.length > 0 && selectedApp.license_docs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9EFF00] hover:text-[#7ACC00]"
                    >
                      <FileText className="w-4 h-4" />
                      License Document {idx + 1}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                  {selectedApp.tax_id_doc && (
                    <a
                      href={selectedApp.tax_id_doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9EFF00] hover:text-[#7ACC00]"
                    >
                      <FileText className="w-4 h-4" />
                      Tax ID Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedApp.insurance_doc && (
                    <a
                      href={selectedApp.insurance_doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9EFF00] hover:text-[#7ACC00]"
                    >
                      <FileText className="w-4 h-4" />
                      Insurance Certificate
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {actionType === "reject" && (
                <div>
                  <Label className="text-gray-400 mb-2">Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this application is being rejected..."
                    className="bg-white/5 border-white/10 text-white"
                    rows={3}
                  />
                </div>
              )}

              {(actionType === "approve" || actionType === "reject") && (
                <div>
                  <Label className="text-gray-400 mb-2">Admin Notes (Optional)</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes..."
                    className="bg-white/5 border-white/10 text-white"
                    rows={2}
                  />
                </div>
              )}

              {(actionType === "approve" || actionType === "reject") && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAction}
                    disabled={
                      (actionType === "reject" && !rejectionReason) ||
                      approveMutation.isPending ||
                      rejectMutation.isPending
                    }
                    className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    {approveMutation.isPending || rejectMutation.isPending
                      ? "Processing..."
                      : actionType === "approve"
                      ? "Approve & Create Vendor"
                      : "Reject Application"
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionType(null);
                      setSelectedApp(null);
                      setRejectionReason("");
                      setAdminNotes("");
                      setError("");
                    }}
                    className="border-white/20 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}