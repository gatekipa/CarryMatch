import { useMemo } from 'react';

// Permission definitions for each role
const ROLE_PERMISSIONS = {
  admin: {
    can_moderate_content: true,
    can_handle_disputes: true,
    can_verify_users: true,
    can_manage_users: true,
    can_view_analytics: true,
    can_send_admin_messages: true,
    can_delete_users: true,
    can_edit_any_content: true,
    can_access_admin_dashboard: true,
    can_manage_roles: true
  },
  moderator: {
    can_moderate_content: true,
    can_handle_disputes: false,
    can_verify_users: false,
    can_manage_users: false,
    can_view_analytics: false,
    can_send_admin_messages: true,
    can_delete_users: false,
    can_edit_any_content: false,
    can_access_admin_dashboard: true,
    can_manage_roles: false
  },
  support_agent: {
    can_moderate_content: false,
    can_handle_disputes: true,
    can_verify_users: true,
    can_manage_users: false,
    can_view_analytics: true,
    can_send_admin_messages: true,
    can_delete_users: false,
    can_edit_any_content: false,
    can_access_admin_dashboard: true,
    can_manage_roles: false
  },
  verified_traveler: {
    can_moderate_content: false,
    can_handle_disputes: false,
    can_verify_users: false,
    can_manage_users: false,
    can_view_analytics: false,
    can_send_admin_messages: false,
    can_delete_users: false,
    can_edit_any_content: false,
    can_access_admin_dashboard: false,
    can_manage_roles: false,
    priority_listing: true,
    higher_trust_score_multiplier: 1.2
  },
  verified_shipper: {
    can_moderate_content: false,
    can_handle_disputes: false,
    can_verify_users: false,
    can_manage_users: false,
    can_view_analytics: false,
    can_send_admin_messages: false,
    can_delete_users: false,
    can_edit_any_content: false,
    can_access_admin_dashboard: false,
    can_manage_roles: false,
    priority_listing: true,
    higher_trust_score_multiplier: 1.2
  }
};

export function usePermissions(user) {
  return useMemo(() => {
    if (!user) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasRole: () => false,
        isAdmin: false,
        isModerator: false,
        isSupportAgent: false,
        isStaff: false
      };
    }

    // Get all roles (primary role + additional roles)
    const allRoles = [
      user.role,
      ...(user.additional_roles || [])
    ].filter(Boolean);

    // Merge permissions from all roles
    const mergedPermissions = allRoles.reduce((acc, role) => {
      const rolePerms = ROLE_PERMISSIONS[role] || {};
      Object.keys(rolePerms).forEach(perm => {
        // If any role grants permission, user has it
        if (rolePerms[perm]) {
          acc[perm] = true;
        }
      });
      return acc;
    }, {});

    // Also merge custom permissions from user.role_permissions
    if (user.role_permissions) {
      Object.assign(mergedPermissions, user.role_permissions);
    }

    const hasPermission = (permission) => {
      return !!mergedPermissions[permission];
    };

    const hasAnyPermission = (...permissions) => {
      return permissions.some(perm => hasPermission(perm));
    };

    const hasRole = (role) => {
      return allRoles.includes(role);
    };

    return {
      hasPermission,
      hasAnyPermission,
      hasRole,
      allRoles,
      isAdmin: hasRole('admin'),
      isModerator: hasRole('moderator'),
      isSupportAgent: hasRole('support_agent'),
      isStaff: hasAnyPermission('can_access_admin_dashboard'),
      permissions: mergedPermissions
    };
  }, [user]);
}

export function getRoleBadgeColor(role) {
  const colors = {
    admin: "bg-gradient-to-r from-purple-400 to-pink-500",
    moderator: "bg-gradient-to-r from-blue-400 to-cyan-500",
    support_agent: "bg-gradient-to-r from-green-400 to-emerald-500",
    verified_traveler: "bg-gradient-to-r from-indigo-400 to-purple-400",
    verified_shipper: "bg-gradient-to-r from-orange-400 to-amber-500"
  };
  return colors[role] || "bg-gray-500";
}

export function getRoleLabel(role) {
  const labels = {
    admin: "Admin",
    moderator: "Moderator",
    support_agent: "Support Agent",
    verified_traveler: "Verified Traveler",
    verified_shipper: "Verified Shipper",
    user: "User"
  };
  return labels[role] || role;
}