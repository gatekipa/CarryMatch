
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

// Helper functions to create notifications
export const createNotification = async (data) => {
  try {
    await base44.entities.Notification.create(data);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const notifyNewMessage = async (receiverEmail, senderName, conversationId) => {
  await createNotification({
    user_email: receiverEmail,
    type: "message",
    title: "New message",
    message: `${senderName} sent you a message`,
    link_url: createPageUrl("Messages"),
    priority: "normal",
    related_id: conversationId,
    related_entity_type: "conversation"
  });
};

export const notifyDispute = async (respondentEmail, complainantName, disputeId) => {
  await createNotification({
    user_email: respondentEmail,
    type: "dispute",
    title: "New dispute filed",
    message: `${complainantName} has filed a dispute against you. Please review.`,
    link_url: createPageUrl("MyDisputes"),
    priority: "high",
    related_id: disputeId,
    related_entity_type: "dispute"
  });
};

export const notifyDisputeUpdate = async (userEmail, status, disputeId) => {
  await createNotification({
    user_email: userEmail,
    type: "dispute_update",
    title: "Dispute status updated",
    message: `Your dispute status has been updated to: ${status}`,
    link_url: createPageUrl("MyDisputes"),
    priority: "normal",
    related_id: disputeId,
    related_entity_type: "dispute"
  });
};

export const notifyNewReview = async (revieweeEmail, reviewerName, rating, reviewId) => {
  await createNotification({
    user_email: revieweeEmail,
    type: "review",
    title: "New review received",
    message: `${reviewerName} left you a ${rating}-star review`,
    link_url: createPageUrl("UserProfile", `email=${revieweeEmail}`),
    priority: "normal",
    related_id: reviewId,
    related_entity_type: "review"
  });
};

export const notifyMatchFound = async (userEmail, matchType, matchScore, itemId) => {
  const detailsPage = matchType === "trip" ? "TripDetails" : "RequestDetails";
  
  await createNotification({
    user_email: userEmail,
    type: "match_found",
    title: "🎯 Smart match found!",
    message: `Our AI found a ${matchScore}% match for your ${matchType}. Check it out!`,
    link_url: createPageUrl(detailsPage, `id=${itemId}`),
    priority: "normal",
    related_id: itemId,
    related_entity_type: matchType
  });
};

export const notifySavedItemUpdate = async (userEmail, itemType, itemTitle, changeType, itemId) => {
  const detailsPage = itemType === "trip" ? "TripDetails" : "RequestDetails";
  
  await createNotification({
    user_email: userEmail,
    type: "system",
    title: `Saved ${itemType} updated`,
    message: `${itemTitle} - ${changeType} changed. Check it out!`,
    link_url: createPageUrl(detailsPage, `id=${itemId}`),
    priority: "normal",
    related_id: itemId,
    related_entity_type: itemType
  });
};

export default {
  createNotification,
  notifyNewMessage,
  notifyDispute,
  notifyDisputeUpdate,
  notifyNewReview,
  notifyMatchFound,
  notifySavedItemUpdate
};
