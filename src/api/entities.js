import { base44 } from './base44Client';

const legacyEntityCollectionNames = [
  'Message',
  'Conversation',
  'User',
  'Notification',
  'GroupMessage',
  'GroupConversation',
  'Vendor',
  'VendorStaff',
  'BusOperator',
  'OperatorStaff',
  'Trip',
  'TripStatusUpdate',
];

const getLegacyEntityAccess = () => {
  // Legacy Base44 entity compatibility: keep using the SDK-backed
  // entity surface until CRUD moves to app-owned repositories/services.
  return base44.entities;
};

const getLegacyEntityCollection = (collectionName) => {
  const entities = getLegacyEntityAccess();
  return entities[collectionName];
};

const getLegacyAuthAccess = () => {
  return base44.auth;
};

const createNamedEntityBoundary = () => {
  const collections = {};

  for (const collectionName of legacyEntityCollectionNames) {
    collections[collectionName] = getLegacyEntityCollection(collectionName);
  }

  return collections;
};

const createEntityAccessBoundary = () => {
  const entities = getLegacyEntityAccess();
  const auth = getLegacyAuthAccess();
  const namedEntities = createNamedEntityBoundary();

  return {
    // Future migration seam: replace these passthroughs with app-owned
    // repository/entity services without changing current importers first.
    Query: entities.Query,
    User: auth,
    Entities: namedEntities,
    Message: namedEntities.Message,
    Conversation: namedEntities.Conversation,
    Notification: namedEntities.Notification,
    GroupMessage: namedEntities.GroupMessage,
    GroupConversation: namedEntities.GroupConversation,
    Vendor: namedEntities.Vendor,
    VendorStaff: namedEntities.VendorStaff,
    BusOperator: namedEntities.BusOperator,
    OperatorStaff: namedEntities.OperatorStaff,
    Trip: namedEntities.Trip,
    TripStatusUpdate: namedEntities.TripStatusUpdate,
  };
};

const entityAccess = createEntityAccessBoundary();

// Entity access entrypoint
export const Query = entityAccess.Query;

// Auth passthrough retained for current callers.
export const User = entityAccess.User;

// Stable named entity boundary for routed callers.
// Note: Entities.User is the user entity collection; the top-level User
// export above remains the legacy auth passthrough for compatibility.
export const Entities = entityAccess.Entities;

export const Message = entityAccess.Message;
export const Conversation = entityAccess.Conversation;
export const Notification = entityAccess.Notification;
export const GroupMessage = entityAccess.GroupMessage;
export const GroupConversation = entityAccess.GroupConversation;
export const Vendor = entityAccess.Vendor;
export const VendorStaff = entityAccess.VendorStaff;
export const BusOperator = entityAccess.BusOperator;
export const OperatorStaff = entityAccess.OperatorStaff;
export const Trip = entityAccess.Trip;
export const TripStatusUpdate = entityAccess.TripStatusUpdate;
