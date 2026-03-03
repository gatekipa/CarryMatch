import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getRoleBadgeColor, getRoleLabel, STAFF_ROLES } from "@/components/permissions/usePermissions";
import {
  Search, Plus, UserPlus, Shield, Trash2, Pencil, Loader2,
  Crown, Headphones, TrendingUp, Megaphone, CreditCard, Settings2, Users
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ROLE_ICONS = {
  super_admin: Crown, admin: Shield, moderator: Shield,
  support_agent: Headphones, sales_manager: TrendingUp,
  marketing: Megaphone, billing_admin: CreditCard, operations_manager: Settings2
};

export default function TeamSection({ users, currentUser }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoles, setInviteRoles] = useState([]);

  // Filter to staff members only
  const staffMembers = users.filter(u => {
    const allRoles = [u.role, ...(u.additional_roles || [])].filter(Boolean);
    return allRoles.some(r => STAFF_ROLES.includes(r));
  });

  const filteredStaff = staffMembers.filter(u => {
    if (!searchTerm) return true;
    return (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
           (u.email || u.created_by || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Assign roles to an existing user
  const assignRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }) => {
      await base44.entities.User.update(userId, { additional_roles: roles });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sa-users"]);
      toast.success("Team member roles updated");
      setShowInviteDialog(false);
      setEditingMember(null);
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  // Invite — search for user by email, then assign roles
  const handleInvite = async () => {
    if (!inviteEmail.trim() || inviteRoles.length === 0) {
      toast.error("Please enter an email and select at least one role");
      return;
    }
    try {
      const found = await base44.entities.User.filter({ email: inviteEmail.trim() });
      if (!found || found.length === 0) {
        // Try by created_by field
        const allUsers = users;
        const match = allUsers.find(u => (u.email || u.created_by || "").toLowerCase() === inviteEmail.trim().toLowerCase());
        if (!match) {
          toast.error("No user found with that email. They must create an account first.");
          return;
        }
        const existingRoles = match.additional_roles || [];
        const newRoles = [...new Set([...existingRoles, ...inviteRoles])];
        assignRolesMutation.mutate({ userId: match.id, roles: newRoles });
      } else {
        const user = found[0];
        const existingRoles = user.additional_roles || [];
        const newRoles = [...new Set([...existingRoles, ...inviteRoles])];
        assignRolesMutation.mutate({ userId: user.id, roles: newRoles });
      }
    } catch (e) {
      toast.error("Error searching for user: " + e.message);
    }
  };

  const handleRemoveRole = (userId, roleToRemove, currentRoles) => {
    const newRoles = (currentRoles || []).filter(r => r !== roleToRemove);
    assignRolesMutation.mutate({ userId, roles: newRoles });
  };

  const handleRemoveAllAccess = (userId) => {
    if (!window.confirm("Remove all admin access for this user?")) return;
    assignRolesMutation.mutate({ userId, roles: [] });
  };

  // Role stats
  const roleCounts = {};
  STAFF_ROLES.forEach(r => { roleCounts[r] = 0; });
  staffMembers.forEach(u => {
    const allRoles = [u.role, ...(u.additional_roles || [])].filter(Boolean);
    allRoles.forEach(r => { if (roleCounts[r] !== undefined) roleCounts[r]++; });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{staffMembers.length} staff members across {Object.values(roleCounts).filter(v => v > 0).length} roles</p>
        </div>
        <Button onClick={() => { setShowInviteDialog(true); setInviteEmail(""); setInviteRoles([]); }} className="bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] text-sm">
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAFF_ROLES.filter(r => roleCounts[r] > 0 || ['super_admin', 'admin', 'support_agent', 'sales_manager'].includes(r)).map(role => {
          const Icon = ROLE_ICONS[role] || Shield;
          return (
            <Card key={role} className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{getRoleLabel(role)}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{roleCounts[role]}</p>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search staff by name or email..."
          className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
        />
      </div>

      {/* Staff Table */}
      <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Member</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Roles</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden md:table-cell">Added</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member, i) => {
                const allRoles = [member.role, ...(member.additional_roles || [])].filter(Boolean);
                const staffRolesForMember = allRoles.filter(r => STAFF_ROLES.includes(r));
                const isCurrentUser = (member.email || member.created_by) === (currentUser?.email || currentUser?.created_by);

                return (
                  <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {member.profile_picture_url ? (
                          <img src={member.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{member.full_name || "—"}{isCurrentUser && <span className="text-xs text-gray-400 ml-1">(you)</span>}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email || member.created_by}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {staffRolesForMember.map(r => (
                          <Badge key={r} className={`${getRoleBadgeColor(r)} text-white text-[10px] px-1.5`}>
                            {getRoleLabel(r)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {member.created_date ? new Date(member.created_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                          onClick={() => {
                            setEditingMember(member);
                            setInviteRoles(member.additional_roles || []);
                          }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {!isCurrentUser && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-600"
                            onClick={() => handleRemoveAllAccess(member.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredStaff.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400">No staff members found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#9EFF00]" /> Add Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">User Email</label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="search@email.com"
                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
              <p className="text-xs text-gray-400 mt-1">User must have an existing CarryMatch account</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Assign Roles</label>
              <div className="space-y-2">
                {STAFF_ROLES.filter(r => r !== 'admin').map(role => {
                  const Icon = ROLE_ICONS[role] || Shield;
                  const isSelected = inviteRoles.includes(role);
                  return (
                    <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'border-[#9EFF00] bg-[#9EFF00]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'
                    }`}>
                      <Checkbox checked={isSelected} onCheckedChange={() => {
                        setInviteRoles(prev => isSelected ? prev.filter(r => r !== role) : [...prev, role]);
                      }} />
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{getRoleLabel(role)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <Button onClick={handleInvite} disabled={assignRolesMutation.isPending || !inviteEmail.trim() || inviteRoles.length === 0}
              className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
              {assignRolesMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : "Add to Team"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => { if (!open) setEditingMember(null); }}>
        <DialogContent className="bg-white dark:bg-[#0F1D35] border-gray-200 dark:border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#9EFF00]" /> Edit Roles
            </DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{editingMember.full_name || "—"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{editingMember.email || editingMember.created_by}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Roles</label>
                <div className="space-y-2">
                  {STAFF_ROLES.filter(r => r !== 'admin').map(role => {
                    const Icon = ROLE_ICONS[role] || Shield;
                    const isSelected = inviteRoles.includes(role);
                    return (
                      <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected ? 'border-[#9EFF00] bg-[#9EFF00]/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5'
                      }`}>
                        <Checkbox checked={isSelected} onCheckedChange={() => {
                          setInviteRoles(prev => isSelected ? prev.filter(r => r !== role) : [...prev, role]);
                        }} />
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{getRoleLabel(role)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <Button onClick={() => assignRolesMutation.mutate({ userId: editingMember.id, roles: inviteRoles })}
                disabled={assignRolesMutation.isPending}
                className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
                {assignRolesMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
