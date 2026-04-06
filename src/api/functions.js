import { base44 } from "./base44Client";

const invokeLegacyFunction = (functionName, payload) => {
  // Legacy Base44 function compatibility: keep routing server-style
  // operations through the existing SDK invoke path for now.
  return base44.functions.invoke(functionName, payload);
};

const createFunctionsBoundary = () => ({
  // Future migration seam: move these calls to app-owned server/API
  // services without forcing callers to change shape first.
  invoke: (functionName, payload) => invokeLegacyFunction(functionName, payload),
  checkSeatAllocation: (payload) => invokeLegacyFunction("checkSeatAllocation", payload),
  updateBusLocation: (payload) => invokeLegacyFunction("updateBusLocation", payload),
  sendTripNotification: (payload) => invokeLegacyFunction("sendTripNotification", payload),
  sendCancelNotice: (payload) => invokeLegacyFunction("sendCancelNotice", payload),
  cloneTrip: (payload) => invokeLegacyFunction("cloneTrip", payload),
  bulkCreateTrips: (payload) => invokeLegacyFunction("bulkCreateTrips", payload),
  rebalanceSeats: (payload) => invokeLegacyFunction("rebalanceSeats", payload),
  toggleEmergencyMode: (payload) => invokeLegacyFunction("toggleEmergencyMode", payload),
  generateRecurringTrips: (payload) => invokeLegacyFunction("generateRecurringTrips", payload),
  intelligentMatcher: (payload) => invokeLegacyFunction("intelligentMatcher", payload),
  sendTemplateMessage: (payload) => invokeLegacyFunction("sendTemplateMessage", payload),
  sendDelayNotice: (payload) => invokeLegacyFunction("sendDelayNotice", payload),
  suggestOptimalRoute: (payload) => invokeLegacyFunction("suggestOptimalRoute", payload),
  sendShipmentNotification: (payload) => invokeLegacyFunction("sendShipmentNotification", payload),
});

const functionsBoundary = createFunctionsBoundary();

export const Functions = functionsBoundary;

export const invoke = functionsBoundary.invoke;
export const checkSeatAllocation = functionsBoundary.checkSeatAllocation;
export const updateBusLocation = functionsBoundary.updateBusLocation;
export const sendTripNotification = functionsBoundary.sendTripNotification;
export const sendCancelNotice = functionsBoundary.sendCancelNotice;
export const cloneTrip = functionsBoundary.cloneTrip;
export const bulkCreateTrips = functionsBoundary.bulkCreateTrips;
export const rebalanceSeats = functionsBoundary.rebalanceSeats;
export const toggleEmergencyMode = functionsBoundary.toggleEmergencyMode;
export const generateRecurringTrips = functionsBoundary.generateRecurringTrips;
export const intelligentMatcher = functionsBoundary.intelligentMatcher;
export const sendTemplateMessage = functionsBoundary.sendTemplateMessage;
export const sendDelayNotice = functionsBoundary.sendDelayNotice;
export const suggestOptimalRoute = functionsBoundary.suggestOptimalRoute;
export const sendShipmentNotification = functionsBoundary.sendShipmentNotification;
