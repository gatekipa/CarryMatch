import { useMemo } from 'react';

// ── All platform permission keys ──────────────────────────────────────
export const ALL_PERMISSIONS = [
  'can_moderate_content',
  'can_handle_disputes',
  'can_verify_users',
  'can_manage_users',
  'can_view_analytics',
  'can_send_admin_messages',
  'can_delete_users',
  'can_edit_any_content',
  'can_access_admin_dashboard',
  'can_manage_roles',
  'can_manage_team',
  'can_manage_promos',
  'can_manage_billing',
  'can_manage_system_config',
  'can_view_audit_log',
];

// ── Permission definitions for each role ──────────────────────────────
const ROLE_PERMISSIONS = {
  super_admin: {
    can_moderate_content: true,
    can_handle_disputes: true,
    can_verify_users: true,
    can_manage_users: true,
    can_view_analytics: true,
    can_send_admin_messages: true,
    can_delete_users: true,
    can_edit_any_content: true,
    can_access_admin_dashboard: true,
    can_manage_roles: true,
    can_manage_team: true,
    can_manage_promos: true,
    can_manage_billing: true,
    can_manage_system_config: true,
    can_view_audit_log: true,
  },
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
    can_manage_roles: true,
    can_manage_team: true,
    can_manage_promos: true,
    can_manage_billing: true,
    can_manage_system_config: true,
    can_view_audit_log: true,
  },
  moderator: {
    can_moderate_content: true,
    can_send_admin_messages: true,
    can_access_admin_dashboard: true,
  },
  support_agent: {
    can_handle_disputes: true,
    can_verify_users: true,
    can_view_analytics: true,
    can_send_admin_messages: true,
    can_access_admin_dashboard: true,
  },
  sales_manager: {
    can_view_analytics: true,
    can_manage_promos: true,
    can_send_admin_messages: true,
    can_access_admin_dashboard: true,
  },
  marketing: {
    can_view_analytics: true,
    can_manage_promos: true,
    can_send_admin_messages: true,
    can_access_admin_dashboard: true,
  },
  billing_admin: {
    can_view_analytics: true,
    can_handle_disputes: true,
    can_manage_billing: true,
    can_send_admin_messages: true,
    can_access_admin_dashboard: true,
  },
  operations_manager: {
    can_view_analytics: true,
    can_manage_users: true,
    can_verify_users: true,
    can_moderate_content: true,
    can_send_admin_messages: true,
    can_access_admin_dashboard: true,
  },
  verified_traveler: {
    priority_listing: true,
    higher_trust_score_multiplier: 1.2
  },
  verified_shipper: {
    priority_listing: true,
    higher_trust_score_multiplier: 1.2
  }
};

// ── Roles that grant admin dashboard access ───────────────────────────
export const STAFF_ROLES = [
  'super_admin', 'admin', 'moderator', 'support_agent',
  'sales_manager', 'marketing', 'billing_admin', 'operations_manager'
];

export function usePermissions(user) {
  return useMemo(() => {
    if (!user) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasRole: () => false,
        isAdmin: false,
        isSuperAdmin: false,
        isModerator: false,
        isSupportAgent: false,
        isStaff: false,
        allRoles: [],
        permissions: {}
      };
    }

    // Get all roles (primary role + additional roles)
    const allRoles = [
      user.role,
      ...(user.additional_roles || [])
    ].filter(Boolean);

    // Merge permissions from all roles (preserve numeric values like multipliers)
    const mergedPermissions = allRoles.reduce((acc, role) => {
      const rolePerms = ROLE_PERMISSIONS[role] || {};
      Object.keys(rolePerms).forEach(perm => {
        const val = rolePerms[perm];
        if (val) {
          acc[perm] = typeof val === 'number' ? val : true;
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
      isAdmin: hasRole('admin') || hasRole('super_admin'),
      isSuperAdmin: hasRole('super_admin'),
      isModerator: hasRole('moderator'),
      isSupportAgent: hasRole('support_agent'),
      isSalesManager: hasRole('sales_manager'),
      isMarketing: hasRole('marketing'),
      isBillingAdmin: hasRole('billing_admin'),
      isOperationsManager: hasRole('operations_manager'),
      isStaff: hasAnyPermission('can_access_admin_dashboard'),
      permissions: mergedPermissions
    };
  }, [user]);
}

export function getRoleBadgeColor(role) {
  const colors = {
    super_admin: "bg-gradient-to-r from-yellow-400 to-orange-500",
    admin: "bg-gradient-to-r from-purple-400 to-pink-500",
    moderator: "bg-gradient-to-r from-blue-400 to-cyan-500",
    support_agent: "bg-gradient-to-r from-green-400 to-emerald-500",
    sales_manager: "bg-gradient-to-r from-rose-400 to-red-500",
    marketing: "bg-gradient-to-r from-fuchsia-400 to-pink-500",
    billing_admin: "bg-gradient-to-r from-teal-400 to-cyan-500",
    operations_manager: "bg-gradient-to-r from-amber-400 to-yellow-500",
    verified_traveler: "bg-gradient-to-r from-indigo-400 to-purple-400",
    verified_shipper: "bg-gradient-to-r from-orange-400 to-amber-500"
  };
  return colors[role] || "bg-gray-500";
}

export function getRoleLabel(role) {
  const labels = {
    super_admin: "Super Admin",
    admin: "Admin",
    moderator: "Moderator",
    support_agent: "Support Agent",
    sales_manager: "Sales Manager",
    marketing: "Marketing",
    billing_admin: "Billing Admin",
    operations_manager: "Operations Manager",
    verified_traveler: "Verified Traveler",
    verified_shipper: "Verified Shipper",
    user: "User"
  };
  return labels[role] || role;
}
