import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Upload, DollarSign, Calendar, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PlanGate } from "@/components/vendor/PlanLimitEnforcer";

export default function VendorInsuranceClaims() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    shipment_id: "",
    claim_type: "damaged",
    claim_amount: "",
    incident_date: "",
    description: "",
    supporting_documents: []
  });

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: vendorStaff } = useQuery({
    queryKey: ['vendor-staff-me', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const staff = await base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" });
      return staff[0] || null;
    },
    enabled: !!user
  });

  const { data: vendor } = useQuery({
    queryKey: ['vendor', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return null;
      const vendors = await base44.entities.Vendor.filter({ id: vendorStaff.vendor_id });
      return vendors[0] || null;
    },
    enabled: !!vendorStaff
  });

  const { data: claims = [] } = useQuery({
    queryKey: ['insurance-claims', vendor?.id],
    queryFn: () => base44.entities.InsuranceClaim.filter({ vendor_id: vendor.id }, "-created_date"),
    enabled: !!vendor
  });

  const { data: insuredShipments = [] } = useQuery({
    queryKey: ['insured-shipments', vendor?.id],
    queryFn: async () => {
      const shipments = await base44.entities.Shipment.filter({ 
        vendor_id: vendor.id,
        insurance_enabled: true
      });
      return shipments;
    },
    enabled: !!vendor
  });

  const fileClaimMutation = useMutation({
    mutationFn: async (data) => {
      const shipment = insuredShipments.find(s => s.id === data.shipment_id);
      return await base44.entities.InsuranceClaim.create({
        ...data,
        vendor_id: vendor.id,
        insured_value: shipment?.insurance_value || 0,
        filed_by: user.email,
        status: "submitted"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      toast.success("Insurance claim filed successfully!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to file claim: " + error.message);
    }
  });

  const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_MB = 10;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate all files before uploading
    for (const file of files) {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not allowed. Only PDF, JPEG, PNG, or WebP files are accepted.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = "";
        return;
      }
    }

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setFormData(prev => ({
        ...prev,
        supporting_documents: [...(prev.supporting_documents || []), ...uploadedUrls]
      }));
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDocument = (index) => {
    setFormData({
      ...formData,
      supporting_documents: formData.supporting_documents.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setFormData({
      shipment_id: "",
      claim_type: "damaged",
      claim_amount: "",
      incident_date: "",
      description: "",
      supporting_documents: []
    });
    setShowDialog(false);
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  const statusColors = {
    submitted: "bg-blue-500/20 text-blue-400",
    under_review: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
    paid: "bg-emerald-500/20 text-emerald-400"
  };

  const statusIcons = {
    submitted: Clock,
    under_review: AlertCircle,
    approved: CheckCircle,
    rejected: X,
    paid: CheckCircle
  };

  return (
    <PlanGate vendor={vendor} feature="insurance" featureLabel="Insurance Claims">
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Insurance Claims</h1>
            <p className="text-gray-400">Manage claims for damaged or lost shipments</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            File New Claim
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white/5 border-white/10">
            <p className="text-sm text-gray-400 mb-1">Total Claims</p>
            <p className="text-2xl font-bold text-white">{claims.length}</p>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <p className="text-sm text-gray-400 mb-1">Under Review</p>
            <p className="text-2xl font-bold text-yellow-400">
              {claims.filter(c => c.status === 'under_review').length}
            </p>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <p className="text-sm text-gray-400 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-400">
              {claims.filter(c => c.status === 'approved' || c.status === 'paid').length}
            </p>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <p className="text-sm text-gray-400 mb-1">Total Claimed</p>
            <p className="text-2xl font-bold text-white">
              ${claims.reduce((sum, c) => sum + (c.claim_amount || 0), 0).toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Claims List */}
        {claims.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Claims Filed</h3>
            <p className="text-gray-400">File your first insurance claim to get started</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map(claim => {
              const StatusIcon = statusIcons[claim.status];
              const shipment = insuredShipments.find(s => s.id === claim.shipment_id);
              
              return (
                <Card key={claim.id} className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">
                          {shipment?.tracking_code || 'Unknown Shipment'}
                        </h3>
                        <Badge className={statusColors[claim.status]}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {claim.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400 capitalize">
                          {claim.claim_type}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-400">Claim Amount</p>
                          <p className="text-white font-semibold">${claim.claim_amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Insured Value</p>
                          <p className="text-white font-semibold">${claim.insured_value}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Incident Date</p>
                          <p className="text-white font-semibold">
                            {format(new Date(claim.incident_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-300 mb-3">{claim.description}</p>

                      {claim.supporting_documents.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {claim.supporting_documents.map((doc, idx) => (
                            <a
                              key={idx}
                              href={doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                            >
                              Document {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      {claim.status === 'approved' && claim.approved_amount && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-sm text-green-300">
                            Approved Amount: <span className="font-bold">${claim.approved_amount}</span>
                          </p>
                          {claim.review_notes && (
                            <p className="text-xs text-gray-400 mt-1">{claim.review_notes}</p>
                          )}
                        </div>
                      )}

                      {claim.status === 'rejected' && claim.review_notes && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-300">{claim.review_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* File Claim Dialog */}
        <Dialog open={showDialog} onOpenChange={resetForm}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">File Insurance Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-gray-300">Shipment *</Label>
                <Select value={formData.shipment_id} onValueChange={(value) => setFormData({...formData, shipment_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue placeholder="Select insured shipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuredShipments.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.tracking_code} - ${s.insurance_value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Claim Type *</Label>
                  <Select value={formData.claim_type} onValueChange={(value) => setFormData({...formData, claim_type: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Claim Amount (USD) *</Label>
                  <Input
                    type="number"
                    value={formData.claim_amount}
                    onChange={(e) => setFormData({...formData, claim_amount: e.target.value})}
                    placeholder="0.00"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Incident Date *</Label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the incident in detail..."
                  className="bg-white/5 border-white/10 text-white mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Supporting Documents</Label>
                <label className="cursor-pointer">
                  <Button variant="outline" className="border-white/10" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Files"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                {formData.supporting_documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.supporting_documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <p className="text-sm text-gray-300 truncate">Document {idx + 1}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(idx)}
                          className="text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={() => fileClaimMutation.mutate(formData)}
                disabled={!formData.shipment_id || !formData.claim_amount || !formData.incident_date || !formData.description || fileClaimMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {fileClaimMutation.isPending ? "Filing Claim..." : "File Claim"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </PlanGate>
  );
}