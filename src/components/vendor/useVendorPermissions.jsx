import { useMemo } from 'react';

// Permission definitions for each vendor staff role
const ROLE_PERMISSIONS = {
  OWNER: {
    can_create_shipment: true,
    can_edit_shipment: true,
    can_add_batch: true,
    can_lock_batch: true,
    can_update_status: true,
    can_view_amounts: true,
    can_record_payment: true,
    can_setup_insurance: true,
    can_bulk_notify: true,
    can_export_manifest: true,
    can_view_audit: true,
    can_manage_staff: true,
    can_manage_branches: true,
    can_view_reports: true
  },
  MANAGER: {
    can_create_shipment: true,
    can_edit_shipment: true,
    can_add_batch: true,
    can_lock_batch: true,
    can_update_status: true,
    can_view_amounts: true,
    can_record_payment: true,
    can_setup_insurance: true,
    can_bulk_notify: true,
    can_export_manifest: true,
    can_view_audit: true,
    can_manage_staff: true,
    can_manage_branches: false,
    can_view_reports: true
  },
  OPS_ORIGIN: {
    can_create_shipment: true,
    can_edit_shipment: true,
    can_add_batch: true,
    can_lock_batch: true,
    can_update_status: true,
    can_view_amounts: false,
    can_record_payment: false,
    can_setup_insurance: false,
    can_bulk_notify: true,
    can_export_manifest: true,
    can_view_audit: true,
    can_manage_staff: false,
    can_manage_branches: false,
    can_view_reports: false
  },
  OPS_DEST: {
    can_create_shipment: false,
    can_edit_shipment: false,
    can_add_batch: false,
    can_lock_batch: false,
    can_update_status: true,
    can_view_amounts: false,
    can_record_payment: false,
    can_setup_insurance: false,
    can_bulk_notify: true,
    can_export_manifest: true,
    can_view_audit: true,
    can_manage_staff: false,
    can_manage_branches: false,
    can_view_reports: false
  },
  CASHIER: {
    can_create_shipment: false,
    can_edit_shipment: false,
    can_add_batch: false,
    can_lock_batch: false,
    can_update_status: false,
    can_view_amounts: true,
    can_record_payment: true,
    can_setup_insurance: true,
    can_bulk_notify: false,
    can_export_manifest: false,
    can_view_audit: true,
    can_manage_staff: false,
    can_manage_branches: false,
    can_view_reports: false
  },
  VIEWER: {
    can_create_shipment: false,
    can_edit_shipment: false,
    can_add_batch: false,
    can_lock_batch: false,
    can_update_status: false,
    can_view_amounts: false,
    can_record_payment: false,
    can_setup_insurance: false,
    can_bulk_notify: false,
    can_export_manifest: false,
    can_view_audit: false,
    can_manage_staff: false,
    can_manage_branches: false,
    can_view_reports: false
  }
};

export function useVendorPermissions(vendorStaff) {
  return useMemo(() => {
    if (!vendorStaff) {
      return {
        hasPermission: () => false,
        hasAnyPermission: () => false,
        isOwner: false,
        isManager: false,
        canViewMoney: false,
        canEditShipments: false,
        role: null
      };
    }

    const rolePermissions = ROLE_PERMISSIONS[vendorStaff.role] || ROLE_PERMISSIONS.VIEWER;
    
    // Merge with custom permissions override if exists
    const mergedPermissions = {
      ...rolePermissions,
      ...(vendorStaff.permissions_override || {})
    };

    const hasPermission = (permission) => {
      return !!mergedPermissions[permission];
    };

    const hasAnyPermission = (...permissions) => {
      return permissions.some(perm => hasPermission(perm));
    };

    return {
      hasPermission,
      hasAnyPermission,
      isOwner: vendorStaff.role === 'OWNER',
      isManager: vendorStaff.role === 'MANAGER',
      canViewMoney: hasPermission('can_view_amounts'),
      canEditShipments: hasPermission('can_edit_shipment'),
      role: vendorStaff.role,
      permissions: mergedPermissions
    };
  }, [vendorStaff]);
}

export function getRoleLabel(role) {
  const labels = {
    OWNER: "Owner",
    MANAGER: "Manager",
    OPS_ORIGIN: "Origin Operations",
    OPS_DEST: "Destination Operations",
    CASHIER: "Cashier",
    VIEWER: "Viewer"
  };
  return labels[role] || role;
}

export function getRoleDescription(role) {
  const descriptions = {
    OWNER: "Full access to all features and settings",
    MANAGER: "Can manage shipments, batches, and team members",
    OPS_ORIGIN: "Can create shipments and manage batches at origin",
    OPS_DEST: "Can update shipment status at destination",
    CASHIER: "Can record payments and view financial data",
    VIEWER: "Read-only access to shipment information"
  };
  return descriptions[role] || "";
}

export function getRoleBadgeColor(role) {
  const colors = {
    OWNER: "bg-gradient-to-r from-purple-500 to-pink-500",
    MANAGER: "bg-gradient-to-r from-blue-500 to-cyan-500",
    OPS_ORIGIN: "bg-gradient-to-r from-green-500 to-emerald-500",
    OPS_DEST: "bg-gradient-to-r from-orange-500 to-amber-500",
    CASHIER: "bg-gradient-to-r from-yellow-500 to-orange-500",
    VIEWER: "bg-gray-500"
  };
  return colors[role] || "bg-gray-500";
}