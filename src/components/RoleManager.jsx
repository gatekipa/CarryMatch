import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Users, Headphones, Plane, Package, AlertTriangle } from "lucide-react";
import { getRoleBadgeColor, getRoleLabel } from "./permissions/usePermissions";
import { toast } from "sonner";

const AVAILABLE_ROLES = [
  {
    value: "moderator",
    label: "Moderator",
    icon: Shield,
    description: "Can moderate content, hide reviews, flag users",
    permissions: ["can_moderate_content", "can_send_admin_messages"]
  },
  {
    value: "support_agent",
    label: "Support Agent",
    icon: Headphones,
    description: "Handle disputes, verify users, view analytics",
    permissions: ["can_handle_disputes", "can_verify_users", "can_view_analytics", "can_send_admin_messages"]
  },
  {
    value: "verified_traveler",
    label: "Verified Traveler",
    icon: Plane,
    description: "Priority listing for trips, enhanced trust score",
    permissions: ["priority_listing"]
  },
  {
    value: "verified_shipper",
    label: "Verified Shipper",
    icon: Package,
    description: "Priority listing for shipment requests, enhanced trust score",
    permissions: ["priority_listing"]
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

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Assign Roles
        </h3>
        <div className="space-y-3">
          {AVAILABLE_ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRoles.includes(role.value);
            
            return (
              <div
                key={role.value}
                onClick={() => handleRoleToggle(role.value)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
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
                      <Icon className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white">{role.label}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{role.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map(perm => (
                        <Badge key={perm} className="bg-blue-500/20 text-blue-300 text-xs">
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

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Custom Permissions
        </h3>
        <div className="space-y-3">
          {[
            { key: 'can_moderate_content', label: 'Moderate Content' },
            { key: 'can_handle_disputes', label: 'Handle Disputes' },
            { key: 'can_verify_users', label: 'Verify Users' },
            { key: 'can_manage_users', label: 'Manage Users' },
            { key: 'can_view_analytics', label: 'View Analytics' },
            { key: 'can_send_admin_messages', label: 'Send Admin Messages' }
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
            >
              <Checkbox
                checked={customPermissions[key] || false}
                onCheckedChange={() => handlePermissionToggle(key)}
                className="border-white/20"
              />
              <span className="text-sm text-gray-300">{label}</span>
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