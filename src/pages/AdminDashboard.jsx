import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  Plane,
  Package,
  MessageSquare,
  Ban,
  CheckCircle,
  Download,
  RefreshCw,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Filter,
  Calendar,
  DollarSign,
  Star,
  FileText,
  UserCog
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifyDisputeUpdate } from "../components/NotificationCreator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { usePermissions } from "@/components/permissions/usePermissions";
import RoleManager from "@/components/RoleManager";
import TransactionOverview from "@/components/admin/TransactionOverview";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [resolution, setResolution] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [newFlag, setNewFlag] = useState("");
  const [restrictingUser, setRestrictingUser] = useState(null);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [isTemporary, setIsTemporary] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState("no_fault");
  const [refundAmount, setRefundAmount] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [penaltyAppliedTo, setPenaltyAppliedTo] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [userToDelete, setUserToDelete] = useState(null);
  const [managingRolesFor, setManagingRolesFor] = useState(null);

  const permissions = usePermissions(user);

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
    }).catch(() => {
      navigate(createPageUrl("Home"));
    });
  }, [navigate]);

  useEffect(() => {
    // This effect runs after `user` state has been updated, and `permissions` (derived from `user`) has also updated.
    // Ensure `user` is not null (meaning a fetch attempt completed) and then check permissions.
    if (user !== null) {
      if (!permissions.isStaff) {
        navigate(createPageUrl("Home"));
      }
    }
  }, [user, permissions, navigate]);

  const { data: allUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: () => base44.entities.Trip.list(),
    enabled: !!user
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => base44.entities.ShipmentRequest.list(),
    enabled: !!user
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => base44.entities.Match.list(),
    enabled: !!user
  });

  const { data: allDisputes = [], isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => base44.entities.Dispute.list(),
    enabled: !!user
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 100),
    enabled: !!user
  });

  const { data: userProfile } = useQuery({
    queryKey: ['admin-user-profile', viewingUserProfile],
    queryFn: async () => {
      if (!viewingUserProfile) return null;
      const users = await base44.entities.User.filter({ email: viewingUserProfile });
      return users[0];
    },
    enabled: !!viewingUserProfile
  });

  const { data: userDisputes = [] } = useQuery({
    queryKey: ['admin-user-disputes', viewingUserProfile],
    queryFn: async () => {
      if (!viewingUserProfile) return [];
      const asComplainant = await base44.entities.Dispute.filter({
        complainant_email: viewingUserProfile
      }, "-created_date");
      const asRespondent = await base44.entities.Dispute.filter({
        respondent_email: viewingUserProfile
      }, "-created_date");
      const combinedDisputes = [...asComplainant, ...asRespondent];
      const uniqueDisputes = Array.from(new Map(combinedDisputes.map(item => [item.id, item])).values());
      return uniqueDisputes;
    },
    enabled: !!viewingUserProfile
  });

  const { data: userReviews = [] } = useQuery({
    queryKey: ['admin-user-reviews', viewingUserProfile],
    queryFn: async () => {
      if (!viewingUserProfile) return [];
      return await base44.entities.Review.filter({
        reviewee_email: viewingUserProfile
      }, "-created_date", 100);
    },
    enabled: !!viewingUserProfile
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const userToDelete = allUsers.find(u => u.id === userId);
      if (!userToDelete) throw new Error("User not found");

      const userEmail = userToDelete.email;

      const userTrips = await base44.entities.Trip.filter({ created_by: userEmail });
      await Promise.all(userTrips.map(trip => base44.entities.Trip.delete(trip.id)));

      const userRequests = await base44.entities.ShipmentRequest.filter({ created_by: userEmail });
      await Promise.all(userRequests.map(req => base44.entities.ShipmentRequest.delete(req.id)));

      const matchesAsTraveler = await base44.entities.Match.filter({ traveler_email: userEmail });
      const matchesAsRequester = await base44.entities.Match.filter({ requester_email: userEmail });
      await Promise.all([...matchesAsTraveler, ...matchesAsRequester].map(m => base44.entities.Match.delete(m.id)));

      const sentMessages = await base44.entities.Message.filter({ sender_email: userEmail });
      const receivedMessages = await base44.entities.Message.filter({ receiver_email: userEmail });
      await Promise.all([...sentMessages, ...receivedMessages].map(msg => base44.entities.Message.delete(msg.id)));

      const conv1 = await base44.entities.Conversation.filter({ participant_1_email: userEmail });
      const conv2 = await base44.entities.Conversation.filter({ participant_2_email: userEmail });
      await Promise.all([...conv1, ...conv2].map(conv => base44.entities.Conversation.delete(conv.id)));

      const reviewsWritten = await base44.entities.Review.filter({ reviewer_email: userEmail });
      const reviewsReceived = await base44.entities.Review.filter({ reviewee_email: userEmail });
      await Promise.all([...reviewsWritten, ...reviewsReceived].map(rev => base44.entities.Review.delete(rev.id)));

      const disputesAsComplainant = await base44.entities.Dispute.filter({ complainant_email: userEmail });
      const disputesAsRespondent = await base44.entities.Dispute.filter({ respondent_email: userEmail });
      await Promise.all([...disputesAsComplainant, ...disputesAsRespondent].map(disp => base44.entities.Dispute.delete(disp.id)));

      const notifications = await base44.entities.Notification.filter({ user_email: userEmail });
      await Promise.all(notifications.map(notif => base44.entities.Notification.delete(notif.id)));

      const savedItems = await base44.entities.SavedItem.filter({ user_email: userEmail });
      await Promise.all(savedItems.map(item => base44.entities.SavedItem.delete(item.id)));

      const savedSearches = await base44.entities.SavedSearch.filter({ user_email: userEmail });
      await Promise.all(savedSearches.map(search => base44.entities.SavedSearch.delete(search.id)));

      const referralsAsReferrer = await base44.entities.Referral.filter({ referrer_email: userEmail });
      const referralsAsReferee = await base44.entities.Referral.filter({ referee_email: userEmail });
      await Promise.all([...referralsAsReferrer, ...referralsAsReferee].map(ref => base44.entities.Referral.delete(ref.id)));

      await base44.entities.User.delete(userId);

      return { email: userEmail, deletedItems: {
        trips: userTrips.length,
        requests: userRequests.length,
        matches: matchesAsTraveler.length + matchesAsRequester.length,
        messages: sentMessages.length + receivedMessages.length,
        conversations: conv1.length + conv2.length,
        reviews: reviewsWritten.length + reviewsReceived.length,
        disputes: disputesAsComplainant.length + disputesAsRespondent.length,
        notifications: notifications.length,
        savedItems: savedItems.length,
        savedSearches: savedSearches.length,
        referrals: referralsAsReferrer.length + referralsAsReferee.length
      }};
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-trips']);
      queryClient.invalidateQueries(['admin-requests']);
      queryClient.invalidateQueries(['admin-matches']);
      queryClient.invalidateQueries(['admin-disputes']);
      queryClient.invalidateQueries(['admin-reviews']);
      setUserToDelete(null);
      setViewingUserProfile(null);
      
      const total = Object.values(result.deletedItems).reduce((sum, count) => sum + count, 0);
      toast.success(`User deleted successfully. Removed ${total} related records.`);
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user: " + error.message);
      setUserToDelete(null);
    }
  });

  const updateDisputeMutation = useMutation({
    mutationFn: ({ disputeId, updates }) =>
      base44.entities.Dispute.update(disputeId, updates),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(['admin-disputes']);
      const dispute = allDisputes.find(d => d.id === variables.disputeId);
      if (dispute && variables.updates.status) {
        await notifyDisputeUpdate(dispute.complainant_email, variables.updates.status, dispute.id);
        await notifyDisputeUpdate(dispute.respondent_email, variables.updates.status, dispute.id);
      }
    }
  });

  const resolveDisputeWithOutcomeMutation = useMutation({
    mutationFn: async ({ disputeId, resolution, outcome, refundAmount, penaltyAmount, penaltyAppliedTo }) => {
      return await base44.entities.Dispute.update(disputeId, {
        status: "resolved",
        resolution,
        resolution_outcome: outcome,
        refund_amount: refundAmount || 0,
        penalty_amount: penaltyAmount || 0,
        penalty_applied_to: penaltyAppliedTo,
        resolved_date: new Date().toISOString(),
        resolved_by: user.email,
        admin_notes: adminNotes
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(['admin-disputes']);

      const dispute = allDisputes.find(d => d.id === variables.disputeId);
      if (!dispute) return;

      const complainantUsers = await base44.entities.User.filter({ email: dispute.complainant_email });
      const respondentUsers = await base44.entities.User.filter({ email: dispute.respondent_email });

      if (complainantUsers.length > 0 && respondentUsers.length > 0) {
        const complainant = complainantUsers[0];
        const respondent = respondentUsers[0];

        let complainantScoreChange = 0;
        let respondentScoreChange = 0;
        let complainantWon = complainant.disputes_won || 0;
        let complainantLost = complainant.disputes_lost || 0;
        let respondentWon = respondent.disputes_won || 0;
        let respondentLost = respondent.disputes_lost || 0;

        switch (variables.outcome) {
          case "favor_complainant":
            complainantScoreChange = 5;
            respondentScoreChange = -10;
            complainantWon += 1;
            respondentLost += 1;
            break;
          case "favor_respondent":
            complainantScoreChange = -10;
            respondentScoreChange = 5;
            complainantLost += 1;
            respondentWon += 1;
            break;
          case "split_decision":
            complainantScoreChange = -2;
            respondentScoreChange = -2;
            break;
          case "no_fault":
            // No score change for no-fault resolutions
            break;
        }

        await base44.entities.User.update(complainant.id, {
          trust_score: Math.max(0, Math.min(100, (complainant.trust_score || 50) + complainantScoreChange)),
          unresolved_dispute_count: Math.max(0, (complainant.unresolved_dispute_count || 0) - 1),
          disputes_won: complainantWon,
          disputes_lost: complainantLost
        });

        await base44.entities.User.update(respondent.id, {
          trust_score: Math.max(0, Math.min(100, (respondent.trust_score || 50) + respondentScoreChange)),
          unresolved_dispute_count: Math.max(0, (respondent.unresolved_dispute_count || 0) - 1),
          disputes_won: respondentWon,
          disputes_lost: respondentLost
        });
      }

      await notifyDisputeUpdate(dispute.complainant_email, "resolved", dispute.id);
      await notifyDisputeUpdate(dispute.respondent_email, "resolved", dispute.id);

      setSelectedDispute(null);
      setResolution("");
      setAdminNotes("");
      setResolveOutcome("no_fault");
      setRefundAmount(0);
      setPenaltyAmount(0);
      setPenaltyAppliedTo("");
      toast.success("Dispute resolved and trust scores updated!");
    },
    onError: (error) => {
      console.error("Error resolving dispute:", error);
      toast.error("Failed to resolve dispute: " + error.message);
    }
  });

  const restrictUserMutation = useMutation({
    mutationFn: async ({ email, reason, temporary }) => {
      const users = await base44.entities.User.filter({ email });
      if (users.length === 0) throw new Error("User not found");

      const user = users[0];
      return await base44.entities.User.update(user.id, {
        is_restricted: true,
        restriction_reason: reason,
        admin_flags: [...(user.admin_flags || []), temporary ? "temporary-restriction" : "permanent-restriction"]
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(['admin-user-profile', viewingUserProfile]);
      queryClient.invalidateQueries(['admin-users']);
      await base44.entities.Notification.create({
        user_email: variables.email,
        type: "system",
        title: "⚠️ Account Restriction Notice",
        message: `Your account has been ${variables.temporary ? 'temporarily' : 'permanently'} restricted. Reason: ${variables.reason}`,
        priority: "high",
        related_entity_type: "user"
      });
      setRestrictingUser(null);
      setRestrictionReason("");
      setIsTemporary(false);
      toast.success("User restricted successfully");
    }
  });

  const unrestrictUserMutation = useMutation({
    mutationFn: async (email) => {
      const users = await base44.entities.User.filter({ email });
      if (users.length === 0) throw new Error("User not found");

      const user = users[0];
      const updatedFlags = (user.admin_flags || []).filter(f =>
        !f.includes("restriction")
      );

      return await base44.entities.User.update(user.id, {
        is_restricted: false,
        restriction_reason: null,
        admin_flags: updatedFlags
      });
    },
    onSuccess: async (_, email) => {
      queryClient.invalidateQueries(['admin-user-profile', viewingUserProfile]);
      queryClient.invalidateQueries(['admin-users']);
      await base44.entities.Notification.create({
        user_email: email,
        type: "system",
        title: "✅ Account Restriction Lifted",
        message: "Your account restriction has been removed. You can now use the platform normally.",
        priority: "normal",
        related_entity_type: "user"
      });
      toast.success("User restriction removed successfully");
    }
  });

  const updateDisputeStatusMutation = useMutation({
    mutationFn: async ({ disputeId, newStatus, notes }) => {
      return await base44.entities.Dispute.update(disputeId, {
        status: newStatus,
        admin_notes: notes
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(['admin-disputes']);

      const dispute = allDisputes.find(d => d.id === variables.disputeId);
      if (dispute) {
        await notifyDisputeUpdate(dispute.complainant_email, variables.newStatus, dispute.id);
        await notifyDisputeUpdate(dispute.respondent_email, variables.newStatus, dispute.id);
      }
    }
  });

  const addUserFlagMutation = useMutation({
    mutationFn: async ({ userId, currentFlags, newFlag }) => {
      const updatedFlags = [...(currentFlags || []), newFlag];
      return base44.entities.User.update(userId, {
        admin_flags: updatedFlags
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-user-profile', viewingUserProfile]);
      queryClient.invalidateQueries(['admin-users']);
      setNewFlag("");
      toast.success("Flag added successfully");
    },
    onError: (error) => {
      console.error("Error adding user flag:", error);
      toast.error("Failed to add flag. Check console for details. (Ensure `base44.entities.User.update` is supported)");
    }
  });

  const toggleReviewVisibilityMutation = useMutation({
    mutationFn: async ({ reviewId, isHidden, reason }) => {
      return await base44.entities.Review.update(reviewId, {
        is_hidden: isHidden,
        admin_notes: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success("Review visibility updated");
    },
    onError: (error) => {
      console.error("Error toggling review visibility:", error);
      toast.error("Failed to update review visibility: " + error.message);
    }
  });

  const flagReviewMutation = useMutation({
    mutationFn: async ({ reviewId, flagReason }) => {
      return await base44.entities.Review.update(reviewId, {
        is_flagged: true,
        flag_reason: flagReason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success("Review flagged for moderation");
    },
    onError: (error) => {
      console.error("Error flagging review:", error);
      toast.error("Failed to flag review: " + error.message);
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, userIds }) => {
      const promises = userIds.map(async userId => {
        const userToUpdate = allUsers.find(u => u.id === userId);
        if (!userToUpdate) return;

        switch (action) {
          case 'restrict':
            await base44.entities.User.update(userId, {
              is_restricted: true,
              restriction_reason: "Bulk restricted by admin"
            });
            break;
          case 'unrestrict':
            await base44.entities.User.update(userId, {
              is_restricted: false,
              restriction_reason: ""
            });
            break;
          case 'verify':
            await base44.entities.User.update(userId, {
              is_verified: true,
              verification_status: "approved",
              verification_approved_date: new Date().toISOString()
            });
            break;
          case 'flag':
            await base44.entities.User.update(userId, {
              admin_flags: [...(userToUpdate.admin_flags || []), "Bulk flagged"]
            });
            break;
        }
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers([]);
      toast.success("Bulk action completed successfully");
    },
    onError: (error) => {
      console.error("Bulk action failed:", error);
      toast.error("Bulk action failed: " + error.message);
    }
  });

  const sendAdminMessage = async () => {
    if (!messageRecipient || !messageText.trim()) return;

    try {
      await base44.entities.Notification.create({
        user_email: messageRecipient,
        type: "system",
        title: "Message from CarryMatch Admin",
        message: messageText,
        priority: "high",
        related_id: selectedDispute?.id,
        related_entity_type: "dispute"
      });

      setMessageText("");
      setMessageRecipient(null);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const resolveDispute = async () => {
    if (!selectedDispute || !resolution.trim()) {
      toast.error("Please provide resolution details.");
      return;
    }

    if (penaltyAmount > 0 && !penaltyAppliedTo) {
      toast.error("Please specify who the penalty is applied to.");
      return;
    }

    await resolveDisputeWithOutcomeMutation.mutateAsync({
      disputeId: selectedDispute.id,
      resolution,
      outcome: resolveOutcome,
      refundAmount,
      penaltyAmount,
      penaltyAppliedTo
    });
  };

  const viewUserProfile = (email) => {
    setViewingUserProfile(email);
  };

  const handleRoleUpdate = async (userToUpdate, updates) => {
    try {
      await base44.entities.User.update(userToUpdate.id, updates);
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-profile', userToUpdate.email]); // Invalidate specific user profile
      setManagingRolesFor(null);
      toast.success(`Roles for ${userToUpdate.full_name || userToUpdate.email} updated successfully!`);
    } catch (error) {
      toast.error("Failed to update user roles: " + error.message);
      console.error("Error updating user roles:", error);
    }
  };

  const filteredDisputes = allDisputes
    .filter(dispute => {
      const statusMatch = filterStatus === "all" || dispute.status === filterStatus;
      const typeMatch = filterType === "all" || dispute.dispute_type === filterType;
      const priorityMatch = filterPriority === "all" || dispute.priority === filterPriority;
      const searchMatch = !searchQuery ||
        dispute.complainant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.respondent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.complainant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.respondent_email?.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && typeMatch && priorityMatch && searchMatch;
    })
    .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());


  const stats = {
    total: allDisputes.length,
    open: allDisputes.filter(d => d.status === "open").length,
    underReview: allDisputes.filter(d => d.status === "under_review").length,
    resolved: allDisputes.filter(d => d.status === "resolved").length,
    highPriority: allDisputes.filter(d => d.priority === "high").length
  };

  const statusColors = {
    open: "bg-red-500/20 text-red-400 border-red-500/30",
    under_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    resolved: "bg-green-500/20 text-green-400 border-green-500/30",
    closed: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };

  const disputeTypeLabels = {
    item_damaged: "Item Damaged",
    no_show: "No Show",
    wrong_item: "Wrong Item",
    late_delivery: "Late Delivery",
    payment_issue: "Payment Issue",
    other: "Other"
  };

  const analytics = {
    totalUsers: allUsers.length,
    verifiedUsers: allUsers.filter(u => u.is_verified).length,
    restrictedUsers: allUsers.filter(u => u.is_restricted).length,
    flaggedUsers: allUsers.filter(u => u.admin_flags && u.admin_flags.length > 0).length,
    activeTrips: allTrips.filter(t => t.status === 'active').length,
    activeRequests: allRequests.filter(r => r.status === 'active').length,
    completedMatches: allMatches.filter(m => m.status === 'delivered').length,
    openDisputes: allDisputes.filter(d => d.status === 'open').length,
    totalRevenue: allMatches.filter(m => m.match_fee_paid).length * 5,
    avgRating: allUsers.length > 0 ? (allUsers.reduce((sum, u) => sum + (u.average_rating || 0), 0) / allUsers.length) : 0
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !searchQuery ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    switch (userFilter) {
      case 'verified':
        matchesFilter = u.is_verified;
        break;
      case 'unverified':
        matchesFilter = !u.is_verified;
        break;
      case 'restricted':
        matchesFilter = u.is_restricted;
        break;
      case 'flagged':
        matchesFilter = u.admin_flags && u.admin_flags.length > 0;
        break;
      case 'staff':
        matchesFilter = u.role === 'admin' || (u.additional_roles && (u.additional_roles.includes('moderator') || u.additional_roles.includes('support')));
        break;
    }

    return matchesSearch && matchesFilter;
  });

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const exportData = (type) => {
    let data = [];
    let filename = "";

    switch (type) {
      case 'users':
        data = allUsers.map(u => ({
          Email: u.email,
          Name: u.full_name || "N/A",
          Verified: u.is_verified ? "Yes" : "No",
          Rating: u.average_rating || 0,
          "Trust Score": u.trust_score || 50,
          Trips: u.total_trips || 0,
          Shipments: u.total_shipments || 0,
          "Created Date": format(new Date(u.created_date), "yyyy-MM-dd"),
          Status: u.is_restricted ? "Restricted" : "Active"
        }));
        filename = "users_export.csv";
        break;
      case 'trips':
        data = allTrips.map(t => ({
          ID: t.id,
          From: `${t.from_city}, ${t.from_country}`,
          To: `${t.to_city}, ${t.to_country}`,
          "Departure Date": format(new Date(t.departure_date), "yyyy-MM-dd"),
          Weight: `${t.available_weight_kg} kg`,
          "Price/kg": `$${t.price_per_kg}`,
          Status: t.status,
          Traveler: t.created_by
        }));
        filename = "trips_export.csv";
        break;
      case 'disputes':
        data = allDisputes.map(d => ({
          ID: d.id,
          Type: d.dispute_type,
          Complainant: d.complainant_email,
          Respondent: d.respondent_email,
          Status: d.status,
          Priority: d.priority,
          Created: format(new Date(d.created_date), "yyyy-MM-dd")
        }));
        filename = "disputes_export.csv";
        break;
      default:
        toast.error("Unknown export type.");
        return;
    }

    if (data.length === 0) {
        toast.info(`No data to export for ${type}.`);
        return;
    }

    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.map(header => `"${header}"`).join(","),
      ...data.map(row => headers.map(h => {
        const value = row[h];
        return `"${(value === null || value === undefined ? "" : String(value)).replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} records`);
  };


  if (!user || (!permissions.isAdmin && !permissions.isStaff)) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {permissions.isAdmin ? 'Admin' : permissions.isModerator ? 'Moderator' : 'Support'} Dashboard
              </h1>
              <p className="text-gray-400">Manage users, transactions, and platform operations</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  refetchUsers();
                  queryClient.invalidateQueries(['admin-disputes']);
                  queryClient.invalidateQueries(['admin-reviews']);
                  queryClient.invalidateQueries(['admin-trips']);
                  queryClient.invalidateQueries(['admin-requests']);
                  queryClient.invalidateQueries(['admin-matches']);
                  toast.success("Dashboard refreshed");
                }}
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {permissions.hasPermission('can_view_analytics') && (
                <Link to={createPageUrl("AdminAnalytics")}>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
                <Badge className="bg-blue-500/20 text-blue-400">Users</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{analytics.totalUsers}</div>
              <div className="text-sm text-gray-400">{analytics.verifiedUsers} verified</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Plane className="w-8 h-8 text-purple-400" />
                <Badge className="bg-purple-500/20 text-purple-400">Trips</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{analytics.activeTrips}</div>
              <div className="text-sm text-gray-400">active now</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-green-400" />
                <Badge className="bg-green-500/20 text-green-400">Requests</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{analytics.activeRequests}</div>
              <div className="text-sm text-gray-400">active now</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
                <Badge className="bg-yellow-500/20 text-yellow-400">Disputes</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{analytics.openDisputes}</div>
              <div className="text-sm text-gray-400">need attention</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-[#9EFF00]" />
                <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">Revenue</Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${analytics.totalRevenue}</div>
              <div className="text-sm text-gray-400">{allMatches.filter(m => m.match_fee_paid).length} paid matches</div>
            </Card>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="bg-white/5 border-white/10 mb-6">
              {permissions.hasPermission('can_manage_users') && (
                <TabsTrigger value="users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
              )}
              {permissions.hasPermission('can_view_analytics') && (
                <TabsTrigger value="transactions">
                  <Activity className="w-4 h-4 mr-2" />
                  Transactions
                </TabsTrigger>
              )}
              {permissions.hasPermission('can_handle_disputes') && (
                <TabsTrigger value="disputes">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Disputes ({allDisputes.length})
                </TabsTrigger>
              )}
              {permissions.hasPermission('can_moderate_content') && (
                <TabsTrigger value="reviews">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Reviews ({allReviews.filter(r => r.is_flagged || !r.is_hidden).length})
                </TabsTrigger>
              )}
            </TabsList>

            {permissions.hasPermission('can_manage_users') && (
              <TabsContent value="users">
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <div className="grid sm:grid-cols-4 gap-4 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Filter Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="verified">Verified Only</SelectItem>
                        <SelectItem value="unverified">Unverified Only</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                        <SelectItem value="staff">Staff Members</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => exportData('users')}
                      variant="outline"
                      className="border-white/10 text-gray-300 hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {selectedUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">
                          {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => bulkActionMutation.mutate({ action: 'verify', userIds: selectedUsers })}
                            disabled={bulkActionMutation.isPending}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => bulkActionMutation.mutate({ action: 'restrict', userIds: selectedUsers })}
                            disabled={bulkActionMutation.isPending}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Restrict
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => bulkActionMutation.mutate({ action: 'unrestrict', userIds: selectedUsers })}
                            disabled={bulkActionMutation.isPending}
                            className="bg-yellow-500 hover:bg-yellow-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Unrestrict
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUsers([])}
                            className="border-white/10"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>

                <Card className="p-6 bg-white/5 border-white/10 overflow-x-auto">
                  {allUsers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No users found.</p>
                  ) : (
                    <table className="w-full text-left table-auto">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-3 px-2">
                            <Checkbox
                              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                              onCheckedChange={toggleAllUsers}
                              className="border-white/20"
                            />
                          </th>
                          <th className="py-3 px-4 text-gray-400 font-semibold">User</th>
                          <th className="py-3 px-4 text-gray-400 font-semibold">Roles</th>
                          <th className="py-3 px-4 text-gray-400 font-semibold">Stats</th>
                          <th className="py-3 px-4 text-gray-400 font-semibold">Trust</th>
                          <th className="py-3 px-4 text-gray-400 font-semibold">Joined</th>
                          <th className="py-3 px-4 text-gray-400 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-4 px-2">
                              <Checkbox
                                checked={selectedUsers.includes(u.id)}
                                onCheckedChange={() => toggleUserSelection(u.id)}
                                className="border-white/20"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-semibold text-white">{u.full_name || "Unnamed"}</div>
                                <div className="text-sm text-gray-400">{u.email}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1">
                                {u.role === 'admin' && (
                                  <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white w-fit">
                                    Admin
                                  </Badge>
                                )}
                                {(u.additional_roles || []).map(role => (
                                  <Badge key={role} className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white w-fit text-xs">
                                    {role.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                                {u.is_verified && (
                                  <Badge className="bg-green-500/20 text-green-400 w-fit text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {u.is_restricted && (
                                  <Badge className="bg-red-500/20 text-red-400 w-fit text-xs">
                                    <Ban className="w-3 h-3 mr-1" />
                                    Restricted
                                  </Badge>
                                )}
                                {u.admin_flags && u.admin_flags.length > 0 && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 w-fit text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Flagged
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-300">
                                <div>{u.total_trips || 0} trips</div>
                                <div>{u.total_shipments || 0} shipments</div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {u.average_rating?.toFixed(1) || 0} ({u.total_reviews || 0})
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-white/10 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      u.trust_score >= 75 ? 'bg-green-500' :
                                      u.trust_score >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${u.trust_score || 50}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-400">{u.trust_score || 50}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">
                              {u.created_date ? format(new Date(u.created_date), "MMM d, yyyy") : "N/A"}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0F1D35] border-white/10">
                                  <DropdownMenuItem onClick={() => viewUserProfile(u.email)} className="cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Profile
                                  </DropdownMenuItem>
                                  {permissions.hasPermission('can_manage_roles') && (
                                    <DropdownMenuItem onClick={() => setManagingRolesFor(u)} className="cursor-pointer">
                                      <UserCog className="w-4 h-4 mr-2" />
                                      Manage Roles
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      if (u.is_restricted) {
                                        unrestrictUserMutation.mutate(u.email);
                                      } else {
                                        const reason = prompt("Reason for restricting this user:");
                                        if (reason) {
                                            restrictUserMutation.mutate({ email: u.email, reason, temporary: false });
                                        } else if (reason !== null) {
                                            toast.info("Restriction cancelled.");
                                        }
                                      }
                                    }}
                                    className={`cursor-pointer ${u.is_restricted ? "text-green-400" : "text-red-400"}`}
                                  >
                                    {u.is_restricted ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Unrestrict
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Restrict
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {permissions.hasPermission('can_moderate_content') && (
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            const currentFlags = u.admin_flags || [];
                                            if (currentFlags.some(flag => flag.toLowerCase().includes('flag'))) {
                                                const updatedFlags = currentFlags.filter(flag => !flag.toLowerCase().includes('flag'));
                                                await base44.entities.User.update(u.id, { admin_flags: updatedFlags });
                                                queryClient.invalidateQueries(['admin-users']);
                                                toast.success("User unflagged successfully.");
                                            } else {
                                                const reason = prompt("Reason for flagging this user:");
                                                if (reason) {
                                                    addUserFlagMutation.mutate({ userId: u.id, currentFlags: currentFlags, newFlag: reason });
                                                } else if (reason !== null) {
                                                    toast.info("Flagging cancelled.");
                                                }
                                            }
                                        }}
                                        className={`cursor-pointer ${u.admin_flags && u.admin_flags.length > 0 ? "text-yellow-400" : ""}`}
                                    >
                                        {u.admin_flags && u.admin_flags.length > 0 ? (
                                            <>
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Unflag User
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Flag User
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                  )}
                                  {permissions.hasPermission('can_delete_users') && (
                                    <DropdownMenuItem
                                      onClick={() => setUserToDelete(u)}
                                      className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Card>
              </TabsContent>
            )}

            {permissions.hasPermission('can_view_analytics') && (
              <TabsContent value="transactions">
                <TransactionOverview matches={allMatches} users={allUsers} />
              </TabsContent>
            )}

            {permissions.hasPermission('can_handle_disputes') && (
              <TabsContent value="disputes">
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search disputes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(disputeTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => exportData('disputes')}
                    variant="outline"
                    className="mt-4 border-white/10 text-gray-300 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Disputes
                  </Button>
                </Card>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                        <div className="h-6 bg-white/10 rounded mb-3" />
                        <div className="h-4 bg-white/10 rounded" />
                      </Card>
                    ))}
                  </div>
                ) : filteredDisputes.length === 0 ? (
                  <Card className="p-12 bg-white/5 border-white/10 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No disputes found</h3>
                    <p className="text-gray-400">Adjust your filters or check back later</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredDisputes.map((dispute, index) => (
                        <motion.div
                          key={dispute.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.03 }}
                          layout
                        >
                          <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                                  <AlertTriangle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white mb-1">
                                    {disputeTypeLabels[dispute.dispute_type]}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <button
                                      onClick={() => viewUserProfile(dispute.complainant_email)}
                                      className="hover:text-blue-400 underline"
                                    >
                                      {dispute.complainant_name}
                                    </button>
                                    <span>vs</span>
                                    <button
                                      onClick={() => viewUserProfile(dispute.respondent_email)}
                                      className="hover:text-blue-400 underline"
                                    >
                                      {dispute.respondent_name}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={statusColors[dispute.status]}>
                                  {dispute.status.replace('_', ' ')}
                                </Badge>
                                {dispute.priority === 'high' && (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                    High Priority
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <p className="text-gray-300 mb-4 line-clamp-2">{dispute.description}</p>

                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {dispute.created_date ? format(new Date(dispute.created_date), "MMM d, yyyy") : "N/A"}
                                </div>
                                {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                                  <Badge variant="outline" className="border-white/10 text-gray-400">
                                    {dispute.evidence_urls.length} evidence file(s)
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {dispute.status === 'open' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateDisputeStatusMutation.mutate({
                                      disputeId: dispute.id,
                                      newStatus: "under_review",
                                      notes: adminNotes || dispute.admin_notes || ""
                                    })}
                                    disabled={updateDisputeStatusMutation.isPending}
                                    className="bg-yellow-500 hover:bg-yellow-600"
                                  >
                                    Start Review
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDispute(dispute);
                                    setAdminNotes(dispute.admin_notes || "");
                                  }}
                                  className="border-white/10 text-gray-300 hover:text-white"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            )}

            {permissions.hasPermission('can_moderate_content') && (
              <TabsContent value="reviews">
                <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4">Review Moderation</h3>

                  {allReviews.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {allReviews.map((review) => (
                        <Card
                          key={review.id}
                          className={`p-4 ${
                            review.is_flagged
                              ? 'bg-red-500/10 border-red-500/30'
                              : review.is_hidden
                                ? 'bg-gray-500/10 border-gray-500/30 opacity-60'
                                : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-white">
                                  {review.reviewer_name}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-white">{review.reviewee_name}</span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">{review.review_text}</p>
                              {review.photo_urls && review.photo_urls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {review.photo_urls.map((url, i) => (
                                    <img
                                      key={i}
                                      src={url}
                                      alt={`Review photo ${i + 1}`}
                                      className="w-16 h-16 rounded object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                               <span>{review.created_date ? format(new Date(review.created_date), "MMM d, yyyy") : "N/A"}</span>
                                {review.is_verified && (
                                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                                    Verified
                                  </Badge>
                                )}
                                {review.is_flagged && (
                                  <Badge className="bg-red-500/20 text-red-400 text-xs">
                                    Flagged: {review.flag_reason || "No reason provided"}
                                  </Badge>
                                )}
                                {review.is_hidden && (
                                  <Badge className="bg-gray-500/20 text-gray-400 text-xs">
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#0F1D35] border-white/10">
                                <DropdownMenuItem
                                  onClick={() => {
                                    let reason = "";
                                    if (!review.is_hidden) {
                                      reason = prompt("Reason for hiding this review (optional):");
                                      if (reason === null) return;
                                    }
                                    toggleReviewVisibilityMutation.mutate({
                                      reviewId: review.id,
                                      isHidden: !review.is_hidden,
                                      reason
                                    });
                                  }}
                                  className="cursor-pointer"
                                >
                                  {review.is_hidden ? "Unhide Review" : "Hide Review"}
                                </DropdownMenuItem>
                                {!review.is_flagged && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const reason = prompt("Reason for flagging (required):");
                                      if (reason) {
                                        flagReviewMutation.mutate({
                                          reviewId: review.id,
                                          flagReason: reason
                                        });
                                      } else if (reason !== null) {
                                        toast.info("Flagging cancelled.");
                                      }
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Flag Review
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => viewUserProfile(review.reviewer_email)}
                                  className="cursor-pointer"
                                >
                                  View Reviewer Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => viewUserProfile(review.reviewee_email)}
                                  className="cursor-pointer"
                                >
                                  View Reviewee Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {review.admin_notes && (
                            <div className="mt-3 p-2 rounded bg-white/5">
                              <p className="text-xs text-gray-400">
                                <strong>Admin Notes:</strong> {review.admin_notes}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>

      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0F1D35] border-white/10">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  {disputeTypeLabels[selectedDispute.dispute_type]}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="p-4 bg-red-500/10 border-red-500/30">
                    <div className="text-sm text-gray-400 mb-1">Complainant</div>
                    <div className="font-semibold text-white">{selectedDispute.complainant_name}</div>
                    <div className="text-sm text-gray-400 mb-2">{selectedDispute.complainant_email}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewUserProfile(selectedDispute.complainant_email)}
                        className="border-white/10 text-gray-300 hover:text-white text-xs"
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMessageRecipient(selectedDispute.complainant_email)}
                        className="border-white/10 text-gray-300 hover:text-white text-xs"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </Card>
                  <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                    <div className="text-sm text-gray-400 mb-1">Respondent</div>
                    <div className="font-semibold text-white">{selectedDispute.respondent_name}</div>
                    <div className="text-sm text-gray-400 mb-2">{selectedDispute.respondent_email}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewUserProfile(selectedDispute.respondent_email)}
                        className="border-white/10 text-gray-300 hover:text-white text-xs"
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMessageRecipient(selectedDispute.respondent_email)}
                        className="border-white/10 text-gray-300 hover:text-white text-xs"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </Card>
                </div>

                {messageRecipient && (
                  <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                    <Label className="text-gray-300 mb-2 block">
                      Send message to: {messageRecipient}
                    </Label>
                    <Textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={sendAdminMessage}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Send Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMessageRecipient(null);
                          setMessageText("");
                        }}
                        className="border-white/10 text-gray-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                )}

                <div>
                  <Label className="text-gray-300 mb-2 block">Description</Label>
                  <Card className="p-4 bg-white/5 border-white/10">
                    <p className="text-gray-300 leading-relaxed">{selectedDispute.description}</p>
                  </Card>
                </div>

                {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                  <div>
                    <Label className="text-gray-300 mb-2 block">Evidence Files</Label>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {selectedDispute.evidence_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm text-blue-400"
                        >
                          <FileText className="w-4 h-4" />
                          Evidence File {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-300 mb-2 block">Internal Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes (not visible to users)..."
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                  {selectedDispute.admin_notes && selectedDispute.admin_notes !== adminNotes && (
                    <Card className="mt-2 p-3 bg-white/5 border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Previous notes:</div>
                      <p className="text-sm text-gray-300">{selectedDispute.admin_notes}</p>
                    </Card>
                  )}
                </div>

                {selectedDispute.status !== 'resolved' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Resolution Outcome *</Label>
                      <Select value={resolveOutcome} onValueChange={setResolveOutcome}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="favor_complainant">In Favor of Complainant</SelectItem>
                          <SelectItem value="favor_respondent">In Favor of Respondent</SelectItem>
                          <SelectItem value="split_decision">Split Decision (Both at Fault)</SelectItem>
                          <SelectItem value="no_fault">No Fault (Misunderstanding)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Refund Amount ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-2 block">Penalty Amount ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={penaltyAmount}
                          onChange={(e) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    {penaltyAmount > 0 && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Apply Penalty To</Label>
                        <Select value={penaltyAppliedTo} onValueChange={setPenaltyAppliedTo}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={selectedDispute.complainant_email}>
                              {selectedDispute.complainant_name} (Complainant)
                            </SelectItem>
                            <SelectItem value={selectedDispute.respondent_email}>
                              {selectedDispute.respondent_name} (Respondent)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label className="text-gray-300 mb-2 block">Resolution Details *</Label>
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Explain the resolution, including refunds, penalties, and reasoning..."
                        rows={4}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                      <p className="text-sm text-gray-300">
                        <Shield className="w-4 h-4 inline mr-2 text-blue-400" />
                        Trust scores will be automatically updated based on the outcome you select.
                      </p>
                    </Card>
                  </div>
                )}

                {selectedDispute.resolution && (
                  <Card className="p-4 bg-green-500/10 border-green-500/30">
                    <div className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Resolution
                    </div>
                    <p className="text-gray-300">{selectedDispute.resolution}</p>
                  </Card>
                )}

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDispute(null);
                      setResolveOutcome("no_fault");
                      setRefundAmount(0);
                      setPenaltyAmount(0);
                      setPenaltyAppliedTo("");
                    }}
                    className="flex-1 border-white/10 text-gray-300 hover:text-white"
                  >
                    Close
                  </Button>
                  {selectedDispute.status !== 'resolved' && (
                    <Button
                      onClick={resolveDispute}
                      disabled={!resolution.trim() || resolveDisputeWithOutcomeMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {resolveDisputeWithOutcomeMutation.isPending ? "Resolving..." : "Resolve Dispute"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingUserProfile} onOpenChange={() => setViewingUserProfile(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0F1D35] border-white/10">
          {userProfile && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-400" />
                  User Profile: {userProfile.full_name || userProfile.email}
                  {userProfile.is_restricted && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2">
                      <Ban className="w-3 h-3 mr-1" />
                      Restricted
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="bg-white/5 border-white/10">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="disputes">Disputes ({userDisputes.length})</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({userReviews.length})</TabsTrigger>
                  {permissions.hasPermission('can_manage_roles') && (
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                  )}
                  <TabsTrigger value="flags">Admin Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 pt-4">
                  <Card className="p-4 bg-white/5 border-white/10">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Email</div>
                        <div className="text-white font-medium">{userProfile.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Rating</div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-white font-medium">
                            {userProfile.average_rating ? userProfile.average_rating.toFixed(1) : "N/A"} ({userProfile.total_reviews || 0})
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Trips</div>
                        <div className="text-white font-medium">{userProfile.total_trips || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Total Shipments</div>
                        <div className="text-white font-medium">{userProfile.total_shipments || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">PIN Violations</div>
                        <div className={`font-medium ${userProfile.pin_violations > 0 ? 'text-red-400' : 'text-white'}`}>
                          {userProfile.pin_violations || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Disputes</div>
                        <div className={`font-medium ${userProfile.unresolved_dispute_count > 0 ? 'text-yellow-400' : 'text-white'}`}>
                          {userProfile.dispute_count || 0} total, {userProfile.unresolved_dispute_count || 0} unresolved
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Verified</div>
                        <div className="text-white font-medium">
                          {userProfile.is_verified ? "Yes" : "No"}
                        </div>
                      </div>
                      <div>
                       <div className="text-sm text-gray-400">Member Since</div>
                       <div className="text-white font-medium">
                         {userProfile.created_date ? format(new Date(userProfile.created_date), "MMM d, yyyy") : "N/A"}
                       </div>
                      </div>
                    </div>
                  </Card>

                  {userProfile.bio && (
                    <Card className="p-4 bg-white/5 border-white/10">
                      <div className="text-sm text-gray-400 mb-2">Bio</div>
                      <p className="text-gray-300">{userProfile.bio}</p>
                    </Card>
                  )}

                  {userProfile.is_restricted && userProfile.restriction_reason && (
                    <Card className="p-4 bg-red-500/10 border-red-500/30">
                      <div className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Current Restriction
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{userProfile.restriction_reason}</p>
                      <Button
                        size="sm"
                        onClick={() => unrestrictUserMutation.mutate(userProfile.email)}
                        disabled={unrestrictUserMutation.isPending}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        {unrestrictUserMutation.isPending ? "Removing..." : "Remove Restriction"}
                      </Button>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="disputes" className="pt-4">
                  <div className="space-y-3">
                    {userDisputes.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No disputes on record for this user.</p>
                    ) : (
                      userDisputes.map((dispute) => (
                        <Card key={dispute.id} className="p-4 bg-white/5 border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-white">
                                {disputeTypeLabels[dispute.dispute_type]}
                              </div>
                              <div className="text-sm text-gray-400">
                                Role: {dispute.complainant_email === viewingUserProfile ? "Complainant" : "Respondent"}
                              </div>
                            </div>
                            <Badge className={statusColors[dispute.status]}>
                              {dispute.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {dispute.created_date ? format(new Date(dispute.created_date), "MMM d, yyyy") : "N/A"}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setAdminNotes(dispute.admin_notes || "");
                              setViewingUserProfile(null);
                            }}
                            className="mt-3 border-white/10 text-gray-300 hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Dispute
                          </Button>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="pt-4">
                  <div className="space-y-3">
                    {userReviews.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No reviews yet for this user.</p>
                    ) : (
                      userReviews.map((review) => (
                        <Card key={review.id} className="p-4 bg-white/5 border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">
                              by {review.reviewer_name || review.reviewer_email}
                            </span>
                          </div>
                          {review.review_text && (
                            <p className="text-gray-300 text-sm">{review.review_text}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Created: {review.created_date ? format(new Date(review.created_date), "MMM d, yyyy") : "N/A"}
                          </p>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {permissions.hasPermission('can_manage_roles') && (
                  <TabsContent value="roles" className="pt-4">
                    <RoleManager
                      user={userProfile}
                      onUpdate={(updates) => handleRoleUpdate(userProfile, updates)}
                    />
                  </TabsContent>
                )}

                <TabsContent value="flags" className="pt-4">
                  <div className="space-y-4">
                    {!userProfile.is_restricted && (
                      <Card className="p-4 bg-red-500/10 border-red-500/30">
                        <Label className="text-gray-300 mb-3 block font-semibold">Restrict User Account</Label>
                        <Textarea
                          value={restrictionReason}
                          onChange={(e) => setRestrictionReason(e.target.value)}
                          placeholder="Enter reason for restriction..."
                          rows={3}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mb-3"
                        />
                        <div className="flex items-center gap-4 mb-3">
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isTemporary}
                              onChange={(e) => setIsTemporary(e.target.checked)}
                              className="rounded bg-white/10 text-red-500 border-red-500 focus:ring-red-500"
                            />
                            Temporary restriction (can be lifted)
                          </label>
                        </div>
                        <Button
                          onClick={() => restrictUserMutation.mutate({
                            email: viewingUserProfile,
                            reason: restrictionReason,
                            temporary: isTemporary
                          })}
                          disabled={!restrictionReason.trim() || restrictUserMutation.isPending}
                          className="bg-red-500 hover:bg-red-600 w-full"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          {restrictUserMutation.isPending ? "Restricting..." : "Restrict User"}
                        </Button>
                        <p className="text-xs text-gray-400 mt-2">
                          This will prevent the user from posting trips/requests and hide their existing listings.
                        </p>
                      </Card>
                    )}

                    <div>
                      <Label className="text-gray-300 mb-2 block">Current Flags</Label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {userProfile.admin_flags && userProfile.admin_flags.length > 0 ? (
                          userProfile.admin_flags.map((flag, i) => (
                            <Badge key={i} className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              {flag}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No flags assigned</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Add Flag/Tag</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newFlag}
                          onChange={(e) => setNewFlag(e.target.value)}
                          placeholder="e.g., frequent-disputes, payment-issues, verified-traveler"
                          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                        <Button
                          onClick={() => {
                            if (!newFlag.trim()) return;
                            addUserFlagMutation.mutate({
                              userId: userProfile.id,
                              currentFlags: userProfile.admin_flags,
                              newFlag: newFlag
                            });
                          }}
                          disabled={!newFlag.trim() || addUserFlagMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {addUserFlagMutation.isPending ? "Adding..." : "Add"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Flags help categorize users for better management
                      </p>
                    </div>

                    {permissions.hasPermission('can_delete_users') && (
                      <Card className="p-4 bg-red-500/10 border-red-500/30">
                        <Label className="text-red-300 mb-3 block font-semibold flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Danger Zone - Delete User
                        </Label>
                        <p className="text-sm text-gray-300 mb-4">
                          Permanently delete this user and all their data (trips, requests, messages, reviews, etc.). This action cannot be undone.
                        </p>
                        <Button
                          onClick={() => setUserToDelete(userProfile)}
                          className="bg-red-600 hover:bg-red-700 w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User Permanently
                        </Button>
                      </Card>
                    )}

                    {userProfile.admin_notes && (
                      <div>
                        <Label className="text-gray-300 mb-2 block">Admin Notes</Label>
                        <Card className="p-4 bg-white/5 border-white/10">
                          <p className="text-gray-300 text-sm">{userProfile.admin_notes}</p>
                        </Card>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {permissions.hasPermission('can_delete_users') && (
        <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <DialogContent className="max-w-lg bg-[#0F1D35] border-red-500/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-400 flex items-center gap-3">
                <Trash2 className="w-6 h-6" />
                Confirm User Deletion
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                This action cannot be undone and will permanently delete all user data.
              </DialogDescription>
            </DialogHeader>

            {userToDelete && (
              <div className="space-y-4 mt-4">
                <Card className="p-4 bg-red-500/10 border-red-500/30">
                  <div className="font-semibold text-white mb-2">User to be deleted:</div>
                  <div className="text-gray-300">{userToDelete.full_name || "Unnamed"}</div>
                  <div className="text-sm text-gray-400">{userToDelete.email}</div>
                </Card>

                <Card className="p-4 bg-white/5 border-white/10">
                  <div className="text-sm text-gray-400 mb-3">The following data will be permanently deleted:</div>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>All trips and shipment requests</li>
                    <li>All matches and bookings</li>
                    <li>All messages and conversations</li>
                    <li>All reviews (given and received)</li>
                    <li>All disputes</li>
                    <li>All notifications, saved items, and searches</li>
                    <li>User account and profile data</li>
                  </ul>
                </Card>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 border-white/10 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => deleteUserMutation.mutate(userToDelete.id)}
                    disabled={deleteUserMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteUserMutation.isPending ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Permanently
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {permissions.hasPermission('can_manage_roles') && (
        <Dialog open={!!managingRolesFor} onOpenChange={() => setManagingRolesFor(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0F1D35] border-white/10">
            {managingRolesFor && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <UserCog className="w-6 h-6 text-blue-400" />
                    Manage Roles: {managingRolesFor.full_name || managingRolesFor.email}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Assign additional roles and granular permissions to this user
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <RoleManager
                    user={managingRolesFor}
                    onUpdate={(updates) => handleRoleUpdate(managingRolesFor, updates)}
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}