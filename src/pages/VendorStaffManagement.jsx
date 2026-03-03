import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Edit,
  Trash2,
  Building
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getRoleLabel, getRoleDescription, getRoleBadgeColor } from "@/components/vendor/useVendorPermissions";
import { toast } from "sonner";

export default function VendorStaffManagement() {
  const [user, setUser] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [inviteForm, setInviteForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "VIEWER",
    branch_id: ""
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Filter to only vendors this user is staff of
      const allStaff = await base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" });
      const vendorIds = [...new Set(allStaff.map(s => s.vendor_id))];
      const vendorPromises = vendorIds.map(vid => base44.entities.Vendor.filter({ id: vid }));
      const vendorResults = await Promise.all(vendorPromises);
      return vendorResults.flat();
    },
    enabled: !!user
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', selectedVendor?.id],
    queryFn: async () => {
      if (!selectedVendor) return [];
      return await base44.entities.Branch.filter({
        vendor_id: selectedVendor.id
      });
    },
    enabled: !!selectedVendor
  });

  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ['vendor-staff', selectedVendor?.id],
    queryFn: async () => {
      if (!selectedVendor) return [];
      return await base44.entities.VendorStaff.filter({
        vendor_id: selectedVendor.id
      }, "-created_date");
    },
    enabled: !!selectedVendor
  });

  const inviteStaffMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.VendorStaff.create({
        vendor_id: selectedVendor.id,
        ...data,
        status: "INVITED",
        invitation_sent_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-staff'] });
      setShowInviteDialog(false);
      setInviteForm({
        full_name: "",
        email: "",
        phone: "",
        role: "VIEWER",
        branch_id: ""
      });
      toast.success("Staff invitation sent!");
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.VendorStaff.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-staff'] });
      setShowEditDialog(false);
      setSelectedStaff(null);
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.VendorStaff.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-staff'] });
    }
  });

  const handleInvite = async () => {
    if (!inviteForm.full_name || !inviteForm.email || !inviteForm.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Plan limit check — staff seats
    if (selectedVendor) {
      try {
        const planName = selectedVendor.current_plan || "STARTER";
        const plans = await base44.entities.SubscriptionPlan.filter({ name: planName });
        const plan = plans[0] || { STARTER: { included_staff_seats: 2 }, GROWTH: { included_staff_seats: 5 }, PRO: { included_staff_seats: 15 }, ENTERPRISE: { included_staff_seats: 999 } }[planName];
        if (plan) {
          const activeStaff = staff.filter(s => s.status === "ACTIVE").length;
          if (activeStaff >= (plan.included_staff_seats || 2)) {
            toast.error(`Staff seat limit reached (${plan.included_staff_seats} on ${planName} plan). Upgrade your plan to add more staff.`);
            return;
          }
        }
      } catch {}
    }

    // Check for duplicate email in this vendor
    try {
      const existing = await base44.entities.VendorStaff.filter({
        email: inviteForm.email,
        vendor_id: selectedVendor.id
      });
      if (existing.length > 0) {
        const status = existing[0].status;
        if (status === "ACTIVE") {
          toast.error(`${inviteForm.email} is already an active staff member.`);
        } else {
          toast.error(`${inviteForm.email} already has a ${status.toLowerCase()} invitation.`);
        }
        return;
      }
    } catch (e) {
      console.warn("Duplicate check failed, proceeding:", e);
    }

    inviteStaffMutation.mutate(inviteForm);
  };

  const handleUpdateStaff = () => {
    if (!selectedStaff) return;
    updateStaffMutation.mutate({
      id: selectedStaff.id,
      data: {
        role: selectedStaff.role,
        status: selectedStaff.status,
        branch_id: selectedStaff.branch_id
      }
    });
  };

  const handleDeleteStaff = (staff) => {
    if (confirm(`Are you sure you want to remove ${staff.full_name} from your team?`)) {
      deleteStaffMutation.mutate(staff.id);
    }
  };

  useEffect(() => {
    if (vendors.length > 0 && !selectedVendor) {
      setSelectedVendor(vendors[0]);
    }
  }, [vendors, selectedVendor]);

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || staff.role === filterRole;
    const matchesStatus = filterStatus === "all" || staff.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">You need to be signed in to manage staff</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Team & Permissions</h1>
              <p className="text-gray-400">Manage your vendor staff and their access levels</p>
            </div>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Staff
            </Button>
          </div>

          {vendors.length > 1 && (
            <Card className="p-4 bg-white/5 border-white/10 mb-6">
              <Label className="text-gray-300 mb-2">Select Vendor</Label>
              <Select value={selectedVendor?.id} onValueChange={(id) => setSelectedVendor(vendors.find(v => v.id === id))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          )}

          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="OPS_ORIGIN">Origin Ops</SelectItem>
                  <SelectItem value="OPS_DEST">Destination Ops</SelectItem>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="INVITED">Invited</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading staff members...</p>
            </Card>
          ) : filteredStaff.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-bold text-white mb-2">No staff members yet</h3>
              <p className="text-gray-400 mb-6">Invite your first team member to get started</p>
              <Button
                onClick={() => setShowInviteDialog(true)}
                className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Staff
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStaff.map((staff, index) => {
                const branch = branches.find(b => b.id === staff.branch_id);
                return (
                  <motion.div
                    key={staff.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white">{staff.full_name}</h3>
                              <Badge className={`${getRoleBadgeColor(staff.role)} text-white border-0`}>
                                {getRoleLabel(staff.role)}
                              </Badge>
                              {staff.status === "INVITED" && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Invited
                                </Badge>
                              )}
                              {staff.status === "ACTIVE" && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                              {staff.status === "DISABLED" && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-2">{getRoleDescription(staff.role)}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {staff.email}
                              </div>
                              {branch && (
                                <div className="flex items-center gap-1">
                                  <Building className="w-4 h-4" />
                                  {branch.name}
                                </div>
                              )}
                              {staff.last_login_at && (
                                <span>Last login: {format(new Date(staff.last_login_at), "MMM d, yyyy")}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setShowEditDialog(true);
                            }}
                            className="border-white/10 text-gray-300 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteStaff(staff)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Staff Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send an invitation to a new team member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Full Name *</Label>
              <Input
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label className="text-gray-300">Email *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="john@company.com"
              />
            </div>

            <div>
              <Label className="text-gray-300">Phone</Label>
              <Input
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <Label className="text-gray-300">Role *</Label>
              <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="OPS_ORIGIN">Origin Operations</SelectItem>
                  <SelectItem value="OPS_DEST">Destination Operations</SelectItem>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">{getRoleDescription(inviteForm.role)}</p>
            </div>

            {branches.length > 0 && (
              <div>
                <Label className="text-gray-300">Assign to Branch (Optional)</Label>
                <Select value={inviteForm.branch_id} onValueChange={(value) => setInviteForm({...inviteForm, branch_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="No specific branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No specific branch</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              className="border-white/10 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteStaffMutation.isPending}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
            >
              {inviteStaffMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#1a1a2e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Staff Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update role, status, or branch assignment
            </DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Role</Label>
                <Select 
                  value={selectedStaff.role} 
                  onValueChange={(value) => setSelectedStaff({...selectedStaff, role: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="OPS_ORIGIN">Origin Operations</SelectItem>
                    <SelectItem value="OPS_DEST">Destination Operations</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Status</Label>
                <Select 
                  value={selectedStaff.status} 
                  onValueChange={(value) => setSelectedStaff({...selectedStaff, status: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {branches.length > 0 && (
                <div>
                  <Label className="text-gray-300">Branch Assignment</Label>
                  <Select 
                    value={selectedStaff.branch_id || ""} 
                    onValueChange={(value) => setSelectedStaff({...selectedStaff, branch_id: value})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="No specific branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No specific branch</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-white/10 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStaff}
              disabled={updateStaffMutation.isPending}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
            >
              {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}