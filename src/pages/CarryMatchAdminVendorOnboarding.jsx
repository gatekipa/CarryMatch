import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Download, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CarryMatchAdminVendorOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user.role !== "admin") {
          navigate(createPageUrl("Home"));
        } else {
          setUser(user);
        }
      })
      .catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: applications = [] } = useQuery({
    queryKey: ['vendor-applications'],
    queryFn: () => base44.entities.VendorApplication.list("-created_date"),
    enabled: !!user
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ appId, updates }) => {
      return await base44.entities.VendorApplication.update(appId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-applications'] });
    }
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async ({ application }) => {
      try {
        const vendor = await base44.asServiceRole.entities.Vendor.create({
          legal_name: application.legal_name,
          display_name: application.display_name,
          vendor_type: application.vendor_type,
          description: application.description,
          primary_contact_name: application.contact_name,
          primary_contact_email: application.contact_email,
          primary_contact_phone: application.contact_phone,
          hq_country: application.hq_country,
          hq_city: application.hq_city,
          status: "ACTIVE",
          admin_user_email: application.contact_email
        });

        await base44.entities.VendorApplication.update(application.id, {
          status: "APPROVED",
          vendor_id: vendor.id,
          reviewed_by: user.email,
          reviewed_at: new Date().toISOString(),
          admin_notes: reviewNotes
        });

        await base44.integrations.Core.SendEmail({
          to: application.contact_email,
          subject: "Welcome to CarryMatch CML - Application Approved!",
          body: `
            <h2>Congratulations! Your application has been approved</h2>
            <p>Dear ${application.contact_name},</p>
            <p>We're excited to welcome <strong>${application.display_name}</strong> to the CarryMatch logistics partner network!</p>
            <p>Next steps:</p>
            <ul>
              <li>Log in to your partner portal at <a href="${window.location.origin}${createPageUrl('PartnerLogin')}">${window.location.origin}${createPageUrl('PartnerLogin')}</a></li>
              <li>Complete your vendor profile</li>
              <li>Add your branches and staff</li>
              <li>Start processing shipments</li>
            </ul>
            <p>Best regards,<br/>CarryMatch Team</p>
          `
        });

        return vendor;
      } catch (error) {
        console.error("Error creating vendor:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-applications'] });
      setReviewDialogOpen(false);
      toast.success("Application approved and vendor account created!");
    },
    onError: (error) => {
      console.error("Approval error:", error);
      toast.error("Error approving: " + error.message);
    }
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ application }) => {
      await base44.entities.VendorApplication.update(application.id, {
        status: "REJECTED",
        rejection_reason: reviewNotes,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString()
      });

      await base44.integrations.Core.SendEmail({
        to: application.contact_email,
        subject: "Update on Your CarryMatch Partner Application",
        body: `
          <h2>Application Update</h2>
          <p>Dear ${application.contact_name},</p>
          <p>Thank you for your interest in partnering with CarryMatch CML.</p>
          <p>After careful review, we're unable to approve your application at this time.</p>
          <p><strong>Reason:</strong> ${reviewNotes}</p>
          <p>You're welcome to reapply in the future. If you have questions, please contact our team.</p>
          <p>Best regards,<br/>CarryMatch Team</p>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-applications'] });
      setReviewDialogOpen(false);
      toast.success("Application rejected and notification sent.");
    }
  });

  const updateDocVerification = async (appId, docType, status) => {
    const app = applications.find(a => a.id === appId);
    const updated = {
      ...app.document_verification_status,
      [docType]: status
    };
    await updateApplicationMutation.mutateAsync({
      appId,
      updates: { document_verification_status: updated }
    });
  };

  const openReviewDialog = (application, action) => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = () => {
    if (reviewAction === "approve") {
      approveApplicationMutation.mutate({ application: selectedApplication });
    } else {
      rejectApplicationMutation.mutate({ application: selectedApplication });
    }
  };

  const statusColors = {
    PENDING: "bg-gray-500/20 text-gray-300",
    UNDER_REVIEW: "bg-blue-500/20 text-blue-300",
    DOCUMENTS_REQUESTED: "bg-yellow-500/20 text-yellow-300",
    APPROVED: "bg-green-500/20 text-green-300",
    REJECTED: "bg-red-500/20 text-red-300"
  };

  const pendingApps = applications.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW");
  const approvedApps = applications.filter(a => a.status === "APPROVED");
  const rejectedApps = applications.filter(a => a.status === "REJECTED");

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Vendor Onboarding</h1>
              <p className="text-gray-400">Review applications and verify documents</p>
            </div>
            <Button variant="outline" onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))} className="border-white/10 text-gray-300">
              Back
            </Button>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="bg-white/5">
              <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedApps.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedApps.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingApps.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No pending applications</p>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {pendingApps.map(app => (
                    <Card key={app.id} className="p-6 bg-white/5 border-white/10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{app.display_name}</h3>
                          <p className="text-sm text-gray-400">{app.legal_name}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={statusColors[app.status]}>{app.status.replace(/_/g, " ")}</Badge>
                            <Badge className="bg-blue-500/20 text-blue-300">{app.vendor_type.replace(/_/g, " ")}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{format(new Date(app.created_date), "MMM d, yyyy")}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-400">Contact: {app.contact_name}</p>
                          <p className="text-gray-400">Email: {app.contact_email}</p>
                          <p className="text-gray-400">Phone: {app.contact_phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Location: {app.hq_city}, {app.hq_country}</p>
                          <p className="text-gray-400">Address: {app.address || "N/A"}</p>
                        </div>
                      </div>

                      {app.description && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg">
                          <p className="text-sm text-gray-300">{app.description}</p>
                        </div>
                      )}

                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-white text-sm">Document Verification</h4>
                        {[
                          { key: "business_registration", label: "Business Registration", url: app.business_registration_doc },
                          { key: "licenses", label: "Licenses", url: app.license_docs?.[0] },
                          { key: "tax_id", label: "Tax ID", url: app.tax_id_doc },
                          { key: "insurance", label: "Insurance", url: app.insurance_doc }
                        ].map(doc => (
                          <div key={doc.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{doc.label}</span>
                              {doc.url && (
                                <Button size="sm" variant="ghost" onClick={() => window.open(doc.url, '_blank')} className="text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {app.document_verification_status?.[doc.key] === "VERIFIED" ? (
                                <Badge className="bg-green-500/20 text-green-300">Verified</Badge>
                              ) : app.document_verification_status?.[doc.key] === "REJECTED" ? (
                                <Badge className="bg-red-500/20 text-red-300">Rejected</Badge>
                              ) : (
                                <>
                                  <Button size="sm" onClick={() => updateDocVerification(app.id, doc.key, "VERIFIED")} className="bg-green-500/20 hover:bg-green-500/30 text-green-300">
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" onClick={() => updateDocVerification(app.id, doc.key, "REJECTED")} className="bg-red-500/20 hover:bg-red-500/30 text-red-300">
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button onClick={() => openReviewDialog(app, "reject")} variant="outline" className="border-red-500/30 text-red-400">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button onClick={() => openReviewDialog(app, "approve")} className="bg-green-500 hover:bg-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve & Create Vendor
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              <div className="grid gap-4">
                {approvedApps.map(app => (
                  <Card key={app.id} className="p-6 bg-white/5 border-white/10">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{app.display_name}</h3>
                        <p className="text-sm text-gray-400">{app.contact_email}</p>
                      </div>
                      <Badge className={statusColors.APPROVED}>Approved</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="grid gap-4">
                {rejectedApps.map(app => (
                  <Card key={app.id} className="p-6 bg-white/5 border-white/10">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white">{app.display_name}</h3>
                        <p className="text-sm text-gray-400">{app.contact_email}</p>
                      </div>
                      <Badge className={statusColors.REJECTED}>Rejected</Badge>
                    </div>
                    {app.rejection_reason && (
                      <p className="text-sm text-gray-400 mt-2">Reason: {app.rejection_reason}</p>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewAction === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">
                {reviewAction === "approve" ? "Approval Notes (optional)" : "Rejection Reason *"}
              </Label>
              <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder={reviewAction === "approve" ? "Add any notes..." : "Explain why this application is being rejected"} rows={4} className="bg-white/5 border-white/10 text-white mt-2" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="border-white/10">
                Cancel
              </Button>
              <Button onClick={handleReviewSubmit} disabled={reviewAction === "reject" && !reviewNotes} className={reviewAction === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}>
                Confirm {reviewAction === "approve" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}