import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Globe, FileText, Mail, Phone, MapPin, Edit, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function VendorDetailsDialog({ vendor, onClose }) {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(vendor.current_plan || "");

  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      const startDate = new Date();
      const expiresDate = new Date();
      expiresDate.setMonth(expiresDate.getMonth() + 1);

      await base44.entities.Vendor.update(vendor.id, {
        current_plan: selectedPlan,
        plan_started_at: startDate.toISOString(),
        plan_expires_at: expiresDate.toISOString(),
        shipments_this_period: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success("Plan updated successfully!");
      setEditingPlan(false);
      onClose();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.Vendor.update(vendor.id, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success("Status updated!");
      onClose();
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Vendor Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Actions */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                {vendor.logo_url ? (
                  <img src={vendor.logo_url} alt={vendor.display_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{vendor.display_name}</h2>
                <p className="text-gray-400 mb-3">{vendor.legal_name}</p>
                <div className="flex gap-2">
                  <Badge className={
                    vendor.status === "ACTIVE" ? "bg-green-500/20 text-green-300" :
                    vendor.status === "PENDING_REVIEW" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-red-500/20 text-red-300"
                  }>
                    {vendor.status.replace(/_/g, " ")}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300">
                    {vendor.vendor_type?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-4 border-t border-white/10">
              {vendor.status === "PENDING_REVIEW" && (
                <>
                  <Button
                    onClick={() => updateStatusMutation.mutate("ACTIVE")}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate("INACTIVE")}
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              {vendor.status === "ACTIVE" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("SUSPENDED")}
                  size="sm"
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400"
                >
                  Suspend
                </Button>
              )}
              {vendor.status === "SUSPENDED" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("ACTIVE")}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Reactivate
                </Button>
              )}
            </div>
          </Card>

          {/* Subscription Plan Management */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Subscription Plan</h3>
              {!editingPlan && (
                <Button
                  onClick={() => setEditingPlan(true)}
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-gray-300"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Plan
                </Button>
              )}
            </div>

            {editingPlan ? (
              <div className="space-y-4">
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="GROWTH">Growth</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updatePlanMutation.mutate()}
                    className="bg-[#9EFF00] text-[#1A1A1A]"
                    disabled={updatePlanMutation.isPending}
                  >
                    {updatePlanMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingPlan(false);
                      setSelectedPlan(vendor.current_plan || "");
                    }}
                    variant="outline"
                    className="border-white/10 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                  <p className="text-white font-bold">{vendor.current_plan || "None"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Billing Period</p>
                  <p className="text-white">{vendor.billing_period || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Shipments This Period</p>
                  <p className="text-white">{vendor.shipments_this_period || 0}</p>
                </div>
                {vendor.plan_expires_at && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Expires</p>
                    <p className="text-white">{format(new Date(vendor.plan_expires_at), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Business Information */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold text-white mb-4">Business Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Registration Number</p>
                <p className="text-white">{vendor.registration_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Tax ID</p>
                <p className="text-white">{vendor.tax_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Headquarters</p>
                <p className="text-white flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {vendor.hq_city}, {vendor.hq_country}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Website</p>
                <p className="text-white flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {vendor.website_url || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold text-white mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Primary Contact</p>
                <p className="text-white">{vendor.primary_contact_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="text-white flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {vendor.primary_contact_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Phone</p>
                <p className="text-white flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {vendor.primary_contact_phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Admin Email</p>
                <p className="text-white">{vendor.admin_user_email || "N/A"}</p>
              </div>
            </div>
          </Card>

          {/* Operations */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold text-white mb-4">Operations</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-2">Operating Countries</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.operating_countries?.map(country => (
                    <Badge key={country} className="bg-white/10 text-gray-300">
                      {country}
                    </Badge>
                  )) || <span className="text-gray-500">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Primary Transport Modes</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.primary_modes?.map(mode => (
                    <Badge key={mode} className="bg-blue-500/20 text-blue-300">
                      {mode}
                    </Badge>
                  )) || <span className="text-gray-500">None specified</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Main Routes</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.main_routes?.map(route => (
                    <Badge key={route} className="bg-purple-500/20 text-purple-300">
                      {route}
                    </Badge>
                  )) || <span className="text-gray-500">None specified</span>}
                </div>
              </div>
            </div>
          </Card>

          {/* Financial Settings */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold text-white mb-4">Financial Settings</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Base Currency</p>
                <p className="text-white">{vendor.base_currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Insurance Rate</p>
                <p className="text-white">{vendor.insurance_default_rate_pct}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Min Insurance Premium</p>
                <p className="text-white">{vendor.base_currency} {vendor.insurance_min_premium}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Max Insured Value</p>
                <p className="text-white">{vendor.base_currency} {vendor.max_insured_value?.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Documents */}
          {vendor.license_documents && vendor.license_documents.length > 0 && (
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="font-bold text-white mb-4">License Documents</h3>
              <div className="space-y-2">
                {vendor.license_documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">Document {idx + 1}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Additional Info */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold text-white mb-4">Additional Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-white">{vendor.description || "No description provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Created Date</p>
                <p className="text-white">{format(new Date(vendor.created_date), "MMMM d, yyyy 'at' h:mm a")}</p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}