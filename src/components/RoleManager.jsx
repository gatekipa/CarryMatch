import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Users, Headphones, Plane, Package, Crown, TrendingUp, Megaphone, CreditCard, Settings2 } from "lucide-react";
import { getRoleBadgeColor, getRoleLabel } from "./permissions/usePermissions";
import { toast } from "sonner";

const AVAILABLE_ROLES = [
  {
    value: "super_admin",
    label: "Super Admin",
    icon: Crown,
    description: "Full platform control — all permissions including team, billing, system config, audit",
    permissions: ["can_manage_team", "can_manage_system_config", "can_view_audit_log", "can_manage_roles", "can_moderate_content", "can_handle_disputes", "can_verify_users", "can_manage_users", "can_view_analytics", "can_send_admin_messages", "can_delete_users", "can_edit_any_content", "can_manage_promos", "can_manage_billing"],
    category: "admin"
  },
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    description: "Full admin access — same as Super Admin, for legacy role compatibility",
    permissions: ["can_manage_team", "can_manage_system_config", "can_view_audit_log", "can_manage_roles", "can_moderate_content", "can_handle_disputes", "can_verify_users", "can_manage_users", "can_view_analytics", "can_send_admin_messages", "can_delete_users", "can_edit_any_content", "can_manage_promos", "can_manage_billing"],
    category: "admin"
  },
  {
    value: "moderator",
    label: "Moderator",
    icon: Shield,
    description: "Can moderate content, hide reviews, flag users",
    permissions: ["can_moderate_content", "can_send_admin_messages"],
    category: "admin"
  },
  {
    value: "support_agent",
    label: "Support Agent",
    icon: Headphones,
    description: "Handle disputes, verify users, view analytics",
    permissions: ["can_handle_disputes", "can_verify_users", "can_view_analytics", "can_send_admin_messages"],
    category: "admin"
  },
  {
    value: "sales_manager",
    label: "Sales Manager",
    icon: TrendingUp,
    description: "Manage promo codes, view revenue analytics, track conversions",
    permissions: ["can_view_analytics", "can_manage_promos", "can_send_admin_messages"],
    category: "admin"
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: Megaphone,
    description: "Campaign management, promo codes, user acquisition analytics",
    permissions: ["can_view_analytics", "can_manage_promos", "can_send_admin_messages"],
    category: "admin"
  },
  {
    value: "billing_admin",
    label: "Billing Admin",
    icon: CreditCard,
    description: "Revenue tracking, payment management, refunds, subscriptions",
    permissions: ["can_view_analytics", "can_handle_disputes", "can_manage_billing"],
    category: "admin"
  },
  {
    value: "operations_manager",
    label: "Operations Manager",
    icon: Settings2,
    description: "Trip/shipment monitoring, vendor management, user verification",
    permissions: ["can_view_analytics", "can_manage_users", "can_verify_users", "can_moderate_content"],
    category: "admin"
  },
  {
    value: "verified_traveler",
    label: "Verified Traveler",
    icon: Plane,
    description: "Priority listing for trips, enhanced trust score",
    permissions: ["priority_listing"],
    category: "user"
  },
  {
    value: "verified_shipper",
    label: "Verified Shipper",
    icon: Package,
    description: "Priority listing for shipment requests, enhanced trust score",
    permissions: ["priority_listing"],
    category: "user"
  }
];

export default function RoleManager({ user, onUpdate }) {
  const [selectedRoles, setSelectedRoles] = useState(user?.additional_roles || []);
  const [customPermissions, setCustomPermissions] = useState(user?.role_permissions || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleRoleToggle = (roleValue) => {
    setSelectedRoles(prev =>
      prev.includes(roleValue)
        ? prev.filter(r => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  const handlePermissionToggle = (permission) => {
    setCustomPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        additional_roles: selectedRoles,
        role_permissions: customPermissions
      });
      toast.success("Roles and permissions updated successfully");
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Failed to update roles: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const adminRoles = AVAILABLE_ROLES.filter(r => r.category === "admin");
  const userRoles = AVAILABLE_ROLES.filter(r => r.category === "user");

  return (
    <div className="space-y-6">
      {/* Staff / Admin Roles */}
      <Card className="p-6 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          Staff Roles
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Assign admin dashboard access and capabilities</p>
        <div className="space-y-3">
          {adminRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRoles.includes(role.value);

            return (
              <div
                key={role.value}
                onClick={() => handleRoleToggle(role.value)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{role.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(perm => (
                        <Badge key={perm} className="bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs">
                          {perm.replace(/can_|_/g, (m) => m === 'can_' ? '' : ' ').trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* User Verification Roles */}
      <Card className="p-6 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          User Roles
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Verification badges and user-level perks</p>
        <div className="space-y-3">
          {userRoles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRoles.includes(role.value);

            return (
              <div
                key={role.value}
                onClick={() => handleRoleToggle(role.value)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{role.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(perm => (
                        <Badge key={perm} className="bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs">
                          {perm.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Custom Permissions */}
      <Card className="p-6 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          Custom Permissions
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Override individual permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { key: 'can_moderate_content', label: 'Moderate Content' },
            { key: 'can_handle_disputes', label: 'Handle Disputes' },
            { key: 'can_verify_users', label: 'Verify Users' },
            { key: 'can_manage_users', label: 'Manage Users' },
            { key: 'can_view_analytics', label: 'View Analytics' },
            { key: 'can_send_admin_messages', label: 'Send Admin Messages' },
            { key: 'can_manage_promos', label: 'Manage Promo Codes' },
            { key: 'can_manage_billing', label: 'Manage Billing' },
            { key: 'can_manage_team', label: 'Manage Team' },
            { key: 'can_manage_system_config', label: 'Manage System Config' },
            { key: 'can_view_audit_log', label: 'View Audit Log' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-all"
            >
              <Checkbox
                checked={customPermissions[key] || false}
                onCheckedChange={() => handlePermissionToggle(key)}
                className="border-gray-300 dark:border-white/20"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold"
      >
        {isSaving ? "Saving..." : "Save Roles & Permissions"}
      </Button>
    </div>
  );
}
