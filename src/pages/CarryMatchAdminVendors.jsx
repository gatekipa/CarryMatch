import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import VendorDetailsDialog from "@/components/admin/VendorDetailsDialog";
import { toast } from "sonner";

export default function CarryMatchAdminVendors() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== "admin") navigate(createPageUrl("Home"));
      setUser(user);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['admin-vendors', filterStatus, filterType],
    queryFn: async () => {
      let query = {};
      if (filterStatus !== "all") query.status = filterStatus;
      if (filterType !== "all") query.vendor_type = filterType;
      return await base44.entities.Vendor.filter(query, "-created_date");
    },
    enabled: !!user
  });

  const updateVendorMutation = useMutation({
    mutationFn: async ({ vendorId, updates }) => {
      return await base44.entities.Vendor.update(vendorId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success("Vendor updated!");
    }
  });

  const filteredVendors = vendors.filter(v =>
    !searchQuery ||
    v.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    PENDING_REVIEW: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    ACTIVE: "bg-green-500/20 text-green-300 border-green-500/30",
    SUSPENDED: "bg-red-500/20 text-red-300 border-red-500/30",
    INACTIVE: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Vendor Management</h1>
              <p className="text-gray-400">Review and manage vendor applications</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))}
              className="border-white/10 text-gray-300"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white/5 border-white/10 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="BUS_AGENCY">Bus Agency</SelectItem>
                  <SelectItem value="PARCEL_FORWARDER">Parcel Forwarder</SelectItem>
                  <SelectItem value="CONTAINER_SHIPPER">Container Shipper</SelectItem>
                  <SelectItem value="COURIER_COMPANY">Courier Company</SelectItem>
                  <SelectItem value="FREIGHT_FORWARDER">Freight Forwarder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Vendors List */}
          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading vendors...</p>
            </Card>
          ) : filteredVendors.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No vendors found</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          {vendor.logo_url ? (
                            <img src={vendor.logo_url} alt={vendor.display_name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Building2 className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{vendor.display_name}</h3>
                            <Badge className={statusColors[vendor.status]}>
                              {vendor.status.replace(/_/g, " ")}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                              {vendor.vendor_type?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{vendor.legal_name}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {vendor.primary_contact_email}
                            </span>
                            {vendor.primary_contact_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {vendor.primary_contact_phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {vendor.hq_city}, {vendor.hq_country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(vendor.created_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedVendor(vendor)}
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-gray-300"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {vendor.status === "PENDING_REVIEW" && (
                          <>
                            <Button
                              onClick={() => updateVendorMutation.mutate({
                                vendorId: vendor.id,
                                updates: { status: "ACTIVE" }
                              })}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => updateVendorMutation.mutate({
                                vendorId: vendor.id,
                                updates: { status: "INACTIVE" }
                              })}
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
                            onClick={() => updateVendorMutation.mutate({
                              vendorId: vendor.id,
                              updates: { status: "SUSPENDED" }
                            })}
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/30 text-yellow-400"
                          >
                            Suspend
                          </Button>
                        )}
                        {vendor.status === "SUSPENDED" && (
                          <Button
                            onClick={() => updateVendorMutation.mutate({
                              vendorId: vendor.id,
                              updates: { status: "ACTIVE" }
                            })}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {selectedVendor && (
        <VendorDetailsDialog
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  );
}