export const ACCESS_STATES = {
  PUBLIC: "public",
  NO_VENDOR_RECORD: "no_vendor_record",
  APPLICATION_PENDING: "application_pending",
  APPLICATION_REJECTED: "application_rejected",
  SETUP_REQUIRED: "setup_required",
  ACTIVE_VENDOR: "active_vendor",
  SUSPENDED_VENDOR: "suspended_vendor",
};

const ACCESS_STATE_SET = new Set(Object.values(ACCESS_STATES));

const normalizeString = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : null;

const normalizeAccessState = (value) => {
  const normalized = normalizeString(value);
  return normalized && ACCESS_STATE_SET.has(normalized) ? normalized : null;
};

const normalizeApplicationStatus = (value) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (["pending", "under_review", "under-review", "review"].includes(normalized)) {
    return "pending";
  }

  if (normalized === "info_requested") {
    return "info_requested";
  }

  if (["rejected", "declined"].includes(normalized)) {
    return "rejected";
  }

  if (["approved", "active"].includes(normalized)) {
    return "approved";
  }

  return normalized;
};

const normalizeVendorStatus = (value) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (["suspended", "inactive", "blocked"].includes(normalized)) {
    return "suspended";
  }

  if (["active", "approved"].includes(normalized)) {
    return "active";
  }

  return normalized;
};

const resolveBoolean = (...values) => {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "yes", "1", "complete", "completed"].includes(normalized)) {
        return true;
      }

      if (["false", "no", "0", "incomplete", "pending"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

export const resolveCmlAccessStateFromRecords = ({ sessionUser, application, vendor }) => {
  if (!sessionUser) {
    return ACCESS_STATES.PUBLIC;
  }

  const vendorStatus = normalizeVendorStatus(vendor?.status);

  if (vendorStatus === "suspended") {
    return ACCESS_STATES.SUSPENDED_VENDOR;
  }

  if (vendorStatus === "active") {
    return ACCESS_STATES.ACTIVE_VENDOR;
  }

  if (vendorStatus === "setup_required") {
    return ACCESS_STATES.SETUP_REQUIRED;
  }

  const applicationStatus = normalizeApplicationStatus(application?.status);

  if (applicationStatus === "pending" || applicationStatus === "info_requested") {
    return ACCESS_STATES.APPLICATION_PENDING;
  }

  if (applicationStatus === "rejected") {
    return ACCESS_STATES.APPLICATION_REJECTED;
  }

  if (applicationStatus === "approved") {
    return ACCESS_STATES.SETUP_REQUIRED;
  }

  return null;
};

export const resolveCmlAccessState = ({ sessionUser, profile, application, vendor }) => {
  if (!sessionUser) {
    return ACCESS_STATES.PUBLIC;
  }

  const recordsState = resolveCmlAccessStateFromRecords({ sessionUser, application, vendor });

  if (recordsState) {
    return recordsState;
  }

  const userMeta = sessionUser.user_metadata ?? {};
  const profilePayload = profile?.raw_legacy_payload ?? {};

  const explicitAccessState = firstDefined(
    normalizeAccessState(userMeta.cml_access_state),
    normalizeAccessState(profilePayload.cml_access_state),
    normalizeAccessState(profilePayload.access_state),
  );

  if (explicitAccessState) {
    return explicitAccessState;
  }

  const vendorStatus = normalizeVendorStatus(
    firstDefined(
      userMeta.cml_vendor_status,
      profilePayload.cml_vendor_status,
      profilePayload.vendor_status,
      profile?.is_restricted ? "suspended" : null,
    ),
  );

  if (vendorStatus === "suspended") {
    return ACCESS_STATES.SUSPENDED_VENDOR;
  }

  const applicationStatus = normalizeApplicationStatus(
    firstDefined(
      userMeta.cml_application_status,
      profilePayload.cml_application_status,
      profilePayload.application_status,
      profilePayload.partner_application_status,
    ),
  );

  if (applicationStatus === "pending") {
    return ACCESS_STATES.APPLICATION_PENDING;
  }

  if (applicationStatus === "rejected") {
    return ACCESS_STATES.APPLICATION_REJECTED;
  }

  const hasVendorRecord = Boolean(
    firstDefined(
      userMeta.cml_vendor_id,
      profilePayload.cml_vendor_id,
      profilePayload.vendor_id,
      profile?.vendor_legacy_base44_id,
    ),
  );

  const setupComplete = resolveBoolean(
    userMeta.cml_setup_complete,
    userMeta.cml_onboarding_complete,
    profilePayload.cml_setup_complete,
    profilePayload.cml_onboarding_complete,
    profilePayload.setup_complete,
  );

  if (applicationStatus === "approved" && setupComplete !== true) {
    return ACCESS_STATES.SETUP_REQUIRED;
  }

  if (hasVendorRecord && setupComplete !== true) {
    return ACCESS_STATES.SETUP_REQUIRED;
  }

  if (hasVendorRecord) {
    return ACCESS_STATES.ACTIVE_VENDOR;
  }

  return ACCESS_STATES.NO_VENDOR_RECORD;
};

export const getDefaultRouteForAccessState = (accessState) => {
  switch (accessState) {
    case ACCESS_STATES.NO_VENDOR_RECORD:
      return "/partners/apply";
    case ACCESS_STATES.APPLICATION_PENDING:
    case ACCESS_STATES.APPLICATION_REJECTED:
    case ACCESS_STATES.SUSPENDED_VENDOR:
      return "/application-status";
    case ACCESS_STATES.SETUP_REQUIRED:
      return "/setup";
    case ACCESS_STATES.ACTIVE_VENDOR:
      return "/dashboard";
    case ACCESS_STATES.PUBLIC:
    default:
      return "/";
  }
};
