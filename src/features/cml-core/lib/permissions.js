/**
 * Permissions Matrix per PRD 7.6.12
 *
 * Three roles: owner, admin, staff
 * 16 actions with strict role-based access.
 */

const ACTIONS = {
  CREATE_SHIPMENT: "create_shipment",
  VIEW_SHIPMENT: "view_shipment",
  EDIT_SHIPMENT: "edit_shipment",
  VIEW_FINANCIALS: "view_financials",
  RECORD_PAYMENT: "record_payment",
  VIEW_REPORTS: "view_reports",
  MANAGE_BATCHES: "manage_batches",
  MANAGE_STAFF: "manage_staff",
  EDIT_SETTINGS: "edit_settings",
  MANAGE_BRANCHES: "manage_branches",
  EDIT_NOTIFICATION_SETTINGS: "edit_notification_settings",
  VIEW_CUSTOMERS: "view_customers",
  EDIT_CUSTOMERS: "edit_customers",
  DELETE_CUSTOMERS: "delete_customers",
  EXPORT_DATA: "export_data",
  MANAGE_SUBSCRIPTION: "manage_subscription",
};

/**
 * Maps each role to the set of actions they are allowed to perform.
 * staff  = operational only (intake, view, batches)
 * admin  = operational + financials + settings
 * owner  = everything
 */
const PERMISSIONS_MATRIX = {
  owner: new Set(Object.values(ACTIONS)),
  admin: new Set([
    ACTIONS.CREATE_SHIPMENT,
    ACTIONS.VIEW_SHIPMENT,
    ACTIONS.EDIT_SHIPMENT,
    ACTIONS.VIEW_FINANCIALS,
    ACTIONS.RECORD_PAYMENT,
    ACTIONS.VIEW_REPORTS,
    ACTIONS.MANAGE_BATCHES,
    ACTIONS.EDIT_SETTINGS,
    ACTIONS.MANAGE_BRANCHES,
    ACTIONS.EDIT_NOTIFICATION_SETTINGS,
    ACTIONS.VIEW_CUSTOMERS,
    ACTIONS.EDIT_CUSTOMERS,
    ACTIONS.EXPORT_DATA,
  ]),
  staff: new Set([
    ACTIONS.CREATE_SHIPMENT,
    ACTIONS.VIEW_SHIPMENT,
    ACTIONS.EDIT_SHIPMENT,
    ACTIONS.MANAGE_BATCHES,
    ACTIONS.VIEW_CUSTOMERS,
  ]),
};

export function hasPermission(role, action) {
  const allowed = PERMISSIONS_MATRIX[role];
  return allowed ? allowed.has(action) : false;
}

export function canViewFinancials(role) {
  return hasPermission(role, ACTIONS.VIEW_FINANCIALS);
}

export function canRecordPayment(role) {
  return hasPermission(role, ACTIONS.RECORD_PAYMENT);
}

export function canManageStaff(role) {
  return hasPermission(role, ACTIONS.MANAGE_STAFF);
}

export function canEditSettings(role) {
  return hasPermission(role, ACTIONS.EDIT_SETTINGS);
}

export function canManageBranches(role) {
  return hasPermission(role, ACTIONS.MANAGE_BRANCHES);
}

export function canViewReports(role) {
  return hasPermission(role, ACTIONS.VIEW_REPORTS);
}

export function canEditNotificationSettings(role) {
  return hasPermission(role, ACTIONS.EDIT_NOTIFICATION_SETTINGS);
}

export function canManageSubscription(role) {
  return hasPermission(role, ACTIONS.MANAGE_SUBSCRIPTION);
}

export function canExportData(role) {
  return hasPermission(role, ACTIONS.EXPORT_DATA);
}

export function canDeleteCustomers(role) {
  return hasPermission(role, ACTIONS.DELETE_CUSTOMERS);
}

export function canEditCustomers(role) {
  return hasPermission(role, ACTIONS.EDIT_CUSTOMERS);
}

export { ACTIONS, PERMISSIONS_MATRIX };
