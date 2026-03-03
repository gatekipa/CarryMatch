import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ShipmentTracker, { TRACKING_STAGES } from "@/components/tracking/ShipmentTracker";
import StatusUpdateModal from "@/components/tracking/StatusUpdateModal";
import {
  Handshake,
  Plane,
  Package,
  Plus,
  Shield,
  Key,
  Copy,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  X,
  DollarSign,
  Star,
  TrendingUp // New import
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function MyMatches() {
  const [user, setUser] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [decliningMatch, setDecliningMatch] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // New state for tabs
  const [trackingMatchId, setTrackingMatchId] = useState(null); // New state
  const [statusUpdateMatch, setStatusUpdateMatch] = useState(null); // New state
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['my-matches', user?.email],
    queryFn: async () => {
      if (!user) return [];

      const asRequester = await base44.entities.Match.filter({
        requester_email: user.email
      }, "-created_date");

      const asTraveler = await base44.entities.Match.filter({
        traveler_email: user.email
      }, "-created_date");

      return [...asRequester, ...asTraveler].map(match => ({
        ...match,
        role: match.requester_email === user.email ? 'requester' : 'traveler'
      }));
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  // Filter matches for tabs
  const pendingMatches = matches.filter(match =>
    match.booking_status === "pending" || (match.booking_status === "accepted" && !match.match_fee_paid)
  );

  const activeMatches = matches.filter(match =>
    match.booking_status === "confirmed" && match.status !== "delivered" && match.status !== "cancelled"
  );

  const completedMatches = matches.filter(match =>
    match.status === "delivered" || match.status === "cancelled" || match.booking_status === "declined"
  );

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const enablePinMutation = useMutation({
    mutationFn: async (matchId) => {
      const pin = generatePin();
      return await base44.entities.Match.update(matchId, {
        delivery_pin_enabled: true,
        delivery_pin: pin
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-matches']);
    }
  });

  const verifyDeliveryMutation = useMutation({
    mutationFn: async ({ matchId, pin }) => {
      const match = matches.find(m => m.id === matchId);

      if (match.delivery_pin_enabled && match.delivery_pin !== pin) {
        // Wrong PIN - increment attempts
        const newAttempts = (match.pin_attempts || 0) + 1;

        await base44.entities.Match.update(matchId, {
          pin_attempts: newAttempts
        });

        if (newAttempts >= 3) {
          // Flag as violation
          await base44.entities.Match.update(matchId, {
            delivery_attempted_without_pin: true
          });

          // Update traveler's violation count
          const travelerUsers = await base44.entities.User.filter({ email: match.traveler_email });
          if (travelerUsers.length > 0) {
            const traveler = travelerUsers[0];
            const newViolations = (traveler.pin_violations || 0) + 1;

            // Restrict user if 2+ violations
            const shouldRestrict = newViolations >= 2;

            await base44.entities.User.update(traveler.id, {
              pin_violations: newViolations,
              is_restricted: shouldRestrict,
              restriction_reason: shouldRestrict ? "Multiple delivery PIN violations" : undefined
            });

            // Notify admin
            await base44.entities.Notification.create({
              user_email: "admin@carrymatch.com", // You'd want admin emails
              type: "system",
              title: "⚠️ PIN Violation Detected",
              message: `User ${match.traveler_email} failed PIN verification 3 times on match ${matchId}`,
              priority: "high",
              related_id: matchId,
              related_entity_type: "match"
            });
          }
        }

        throw new Error(`Wrong PIN. ${3 - newAttempts} attempts remaining.`);
      }

      // Correct PIN — mark as delivered
      await base44.entities.Match.update(matchId, {
        delivery_verified: true,
        status: "delivered",
        delivered_at: new Date().toISOString(),
        can_leave_review: true
      });

      // Increment traveler's verified delivery count
      try {
        const travelerUsers = await base44.entities.User.filter({ email: match.traveler_email });
        if (travelerUsers.length > 0) {
          const traveler = travelerUsers[0];
          await base44.entities.User.update(traveler.id, {
            verified_deliveries_count: (traveler.verified_deliveries_count || 0) + 1
          });
        }
      } catch (e) {
        console.warn("Could not update delivery count:", e);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-matches']);
      setPinInput("");
      setShowPinDialog(false);
      toast.success("Delivery verified successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const acceptBookingMutation = useMutation({
    mutationFn: async (matchId) => {
      return await base44.entities.Match.update(matchId, {
        booking_status: "accepted"
      });
    },
    onSuccess: async (_, matchId) => {
      queryClient.invalidateQueries(['my-matches']);

      const match = matches.find(m => m.id === matchId);
      if (match) {
        // Notify the initiator
        const otherPartyEmail = match.initiated_by === user.email
          ? (match.traveler_email === user.email ? match.requester_email : match.traveler_email)
          : match.initiated_by;

        await base44.entities.Notification.create({
          user_email: otherPartyEmail,
          type: "system",
          title: "✅ Booking Request Accepted!",
          message: `Your booking request has been accepted. Pay the $5 platform fee to confirm.`,
          link_url: createPageUrl("MyMatches"),
          priority: "high",
          related_id: matchId,
          related_entity_type: "match"
        });
      }
    }
  });

  const declineBookingMutation = useMutation({
    mutationFn: async ({ matchId, reason }) => {
      return await base44.entities.Match.update(matchId, {
        booking_status: "declined",
        declined_reason: reason
      });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(['my-matches']);

      const match = matches.find(m => m.id === variables.matchId);
      if (match) {
        const otherPartyEmail = match.initiated_by === user.email
          ? (match.traveler_email === user.email ? match.requester_email : match.traveler_email)
          : match.initiated_by;

        await base44.entities.Notification.create({
          user_email: otherPartyEmail,
          type: "system",
          title: "❌ Booking Request Declined",
          message: `Your booking request was declined. ${variables.reason || 'No reason provided.'}`,
          link_url: createPageUrl("MyMatches"),
          priority: "normal",
          related_id: variables.matchId,
          related_entity_type: "match"
        });
      }

      setDecliningMatch(null);
      setDeclineReason("");
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async (matchId) => {
      // TODO: Replace with actual payment processor (Stripe, etc.)
      return await base44.entities.Match.update(matchId, {
        booking_status: "confirmed",
        match_fee_paid: true,
        status: "confirmed",
        payment_status: "paid",
        payment_amount: 5,
        payment_method: "platform_placeholder",
        payment_date: new Date().toISOString()
      });
    },
    onSuccess: async (_, matchId) => {
      queryClient.invalidateQueries(['my-matches']);

      const match = matches.find(m => m.id === matchId);
      if (match) {
        // Create conversation NOW — fee is paid, chat is unlocked
        try {
          const existingConv1 = await base44.entities.Conversation.filter({
            participant_1_email: match.traveler_email, participant_2_email: match.requester_email
          });
          const existingConv2 = await base44.entities.Conversation.filter({
            participant_1_email: match.requester_email, participant_2_email: match.traveler_email
          });
          if (existingConv1.length === 0 && existingConv2.length === 0) {
            await base44.entities.Conversation.create({
              participant_1_email: match.traveler_email,
              participant_1_name: match.traveler_email,
              participant_2_email: match.requester_email,
              participant_2_name: match.requester_email,
              trip_id: match.trip_id || "",
              request_id: match.shipment_request_id || "",
              last_message: "Match confirmed! Negotiate your delivery price and details here.",
              last_message_time: new Date().toISOString(),
              unread_count_participant_1: 1,
              unread_count_participant_2: 1
            });
          }
        } catch (e) {
          console.warn("Failed to create conversation:", e);
        }

        // Notify both parties
        await base44.entities.Notification.create({
          user_email: match.traveler_email,
          type: "system",
          title: "🎉 Booking Confirmed!",
          message: "Fee paid — your match is confirmed. Chat is now open to negotiate delivery details.",
          link_url: createPageUrl("MyMatches"),
          priority: "high",
          related_id: matchId,
          related_entity_type: "match"
        });

        await base44.entities.Notification.create({
          user_email: match.requester_email,
          type: "system",
          title: "🎉 Booking Confirmed!",
          message: "Fee paid — your match is confirmed. Chat is now open to negotiate delivery details.",
          link_url: createPageUrl("MyMatches"),
          priority: "high",
          related_id: matchId,
          related_entity_type: "match"
        });
      }

      toast.success("Booking confirmed! $5 fee processed. Chat is now open.");
    }
  });

  const completeMatchMutation = useMutation({
    mutationFn: async (matchId) => {
      return await base44.entities.Match.update(matchId, {
        status: "delivered",
        delivered_at: new Date().toISOString(),
        can_leave_review: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-matches']);
    }
  });

  const cancelMatchMutation = useMutation({
    mutationFn: async (matchId) => {
      return await base44.entities.Match.update(matchId, {
        status: "cancelled",
        can_leave_review: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-matches']);
    }
  });

  const copyPinToClipboard = (pin) => {
    navigator.clipboard.writeText(pin);
    toast.success("PIN copied to clipboard!");
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    in_transit: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    delivered: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };

  const bookingStatusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    accepted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    declined: "bg-red-500/20 text-red-400 border-red-500/30",
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30"
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <Handshake className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">Sign in to view your matches</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">My Matches</h1>
            <p className="text-xl text-gray-400">Track your active deliveries and connections</p>
          </div>

          {isLoading ? (
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                  <div className="h-6 bg-white/10 rounded mb-3" />
                  <div className="h-4 bg-white/10 rounded" />
                </Card>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Handshake className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No matches yet</h3>
              <p className="text-gray-400 mb-6">
                Start by browsing trips or requests and connecting with other users
              </p>
              <div className="flex gap-4 justify-center">
                <Link to={createPageUrl("BrowseTrips")}>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <Plane className="w-4 h-4 mr-2" />
                    Browse Trips
                  </Button>
                </Link>
                <Link to={createPageUrl("BrowseRequests")}>
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                    <Package className="w-4 h-4 mr-2" />
                    Browse Requests
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/5 border-white/10">
                <TabsTrigger value="pending">
                  Pending Actions ({pendingMatches.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active Matches ({activeMatches.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed/Cancelled ({completedMatches.length})
                </TabsTrigger>
              </TabsList>

              {/* Pending Actions Tab */}
              <TabsContent value="pending">
                {pendingMatches.length === 0 ? (
                  <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
                    <Handshake className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No pending actions</h3>
                    <p className="text-gray-400 mb-6">
                      All your booking requests are accepted or resolved.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                      {pendingMatches.map((match, index) => {
                        const isInitiator = match.initiated_by === user.email;
                        const needsResponse = !isInitiator && match.booking_status === "pending";
                        const needsPayment = isInitiator && match.booking_status === "accepted" && !match.match_fee_paid;

                        return (
                          <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                          >
                            <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge className={statusColors[match.status]}>
                                      {match.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className={bookingStatusColors[match.booking_status]}>
                                      {match.booking_status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                      {match.role === 'requester' ? 'Sender' : 'Traveler'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    Match with: {match.role === 'requester' ? match.traveler_email : match.requester_email}
                                  </p>
                                </div>
                                {match.agreed_price && (
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-white">${match.agreed_price}</div>
                                    <div className="text-xs text-gray-400">Agreed Price</div>
                                  </div>
                                )}
                              </div>

                              {/* Booking Actions */}
                              {needsResponse && (
                                <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mb-6">
                                  <h4 className="text-sm font-semibold text-yellow-400 mb-3">Booking Request Pending</h4>
                                  <p className="text-sm text-gray-300 mb-4">
                                    {match.role === 'requester' ? match.traveler_email : match.requester_email} wants to book this match.
                                  </p>
                                  <div className="flex gap-3">
                                    <Button
                                      onClick={() => acceptBookingMutation.mutate(match.id)}
                                      disabled={acceptBookingMutation.isPending}
                                      className="flex-1 bg-green-500 hover:bg-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Accept
                                    </Button>
                                    <Button
                                      onClick={() => setDecliningMatch(match.id)}
                                      variant="outline"
                                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Decline
                                    </Button>
                                  </div>
                                </Card>
                              )}

                              {needsPayment && (
                                <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-6">
                                  <h4 className="text-sm font-semibold text-blue-400 mb-3">Payment Required</h4>
                                  <p className="text-sm text-gray-300 mb-4">
                                    Your booking was accepted! Pay the ${match.platform_fee || 5} platform fee to confirm.
                                  </p>
                                  <Button
                                    onClick={() => {
                                      if (confirm(`Confirm payment of $${match.platform_fee || 5} platform fee?`)) {
                                        confirmBookingMutation.mutate(match.id);
                                      }
                                    }}
                                    disabled={confirmBookingMutation.isPending}
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                  >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    {confirmBookingMutation.isPending ? "Processing..." : `Pay $${match.platform_fee || 5} Fee & Confirm`}
                                  </Button>
                                </Card>
                              )}

                              {match.booking_status === "declined" && match.declined_reason && (
                                <Card className="p-4 bg-red-500/10 border-red-500/30 mb-6">
                                  <h4 className="text-sm font-semibold text-red-400 mb-2">Booking Declined</h4>
                                  <p className="text-sm text-gray-300">{match.declined_reason}</p>
                                </Card>
                              )}

                              {/* Notes */}
                              {match.notes && (
                                <div className="p-3 rounded-lg bg-white/5 mb-4">
                                  <p className="text-sm text-gray-300">{match.notes}</p>
                                </div>
                              )}

                              {/* Actions — no chat until fee is paid */}
                              {!needsResponse && !needsPayment && match.booking_status !== "declined" && (
                                <p className="text-xs text-gray-500 text-center py-2">Chat unlocks after the $5 matching fee is paid.</p>
                              )}
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              {/* Active Matches Tab */}
              <TabsContent value="active">
                {activeMatches.length === 0 ? (
                  <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
                    <Handshake className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No active matches</h3>
                    <p className="text-gray-400 mb-6">
                      Confirmed matches will appear here for tracking and management.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Link to={createPageUrl("BrowseTrips")}>
                        <Button className="bg-blue-500 hover:bg-blue-600">
                          <Plane className="w-4 h-4 mr-2" />
                          Browse Trips
                        </Button>
                      </Link>
                      <Link to={createPageUrl("BrowseRequests")}>
                        <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                          <Package className="w-4 h-4 mr-2" />
                          Browse Requests
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                      {activeMatches.map((match, index) => {
                        return (
                          <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            layout
                          >
                            <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-all">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge className={statusColors[match.status]}>
                                      {match.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className={bookingStatusColors[match.booking_status]}>
                                      {match.booking_status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                      {match.role === 'requester' ? 'Sender' : 'Traveler'}
                                    </Badge>
                                    {match.delivery_pin_enabled && (
                                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                        <Key className="w-3 h-3 mr-1" />
                                        PIN Protected
                                      </Badge>
                                    )}
                                    {match.delivery_verified && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  {/* NEW: Tracking Status Badge */}
                                  {match.tracking_status && (
                                    <div className="mb-4">
                                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                        {TRACKING_STAGES.find(s => s.id === match.tracking_status)?.label || "In Progress"}
                                      </Badge>
                                    </div>
                                  )}
                                  <p className="text-sm text-gray-400">
                                    Match with: {match.role === 'requester' ? match.traveler_email : match.requester_email}
                                  </p>
                                </div>
                                {match.agreed_price && (
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-white">${match.agreed_price}</div>
                                    <div className="text-xs text-gray-400">Agreed Price</div>
                                  </div>
                                )}
                              </div>

                              {/* PIN Section for Senders */}
                              {match.role === 'requester' && match.status !== 'delivered' && match.status !== 'cancelled' && (
                                <div className="mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <Label className="text-gray-300">Delivery PIN Protection</Label>
                                    <Switch
                                      checked={match.delivery_pin_enabled}
                                      onCheckedChange={async (checked) => {
                                        if (checked) {
                                          await enablePinMutation.mutateAsync(match.id);
                                        } else {
                                          await base44.entities.Match.update(match.id, {
                                            delivery_pin_enabled: false,
                                            delivery_pin: null
                                          });
                                          queryClient.invalidateQueries(['my-matches']);
                                        }
                                      }}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                  </div>

                                  {match.delivery_pin_enabled && (
                                    <Card className="p-4 bg-green-500/10 border-green-500/30">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm text-gray-300 mb-1">Your Delivery PIN</p>
                                          <div className="flex items-center gap-3">
                                            <div className="text-3xl font-bold text-white tracking-wider">
                                              {match.delivery_pin}
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => copyPinToClipboard(match.delivery_pin)}
                                              className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                                            >
                                              <Copy className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                        <Shield className="w-12 h-12 text-green-400" />
                                      </div>
                                      <p className="text-xs text-gray-400 mt-3">
                                        Share this PIN with the traveler only at delivery. They must enter it to confirm delivery.
                                      </p>
                                    </Card>
                                  )}
                                </div>
                              )}

                              {/* PIN Entry for Travelers */}
                              {match.role === 'traveler' && match.status === 'in_transit' && match.delivery_pin_enabled && !match.delivery_verified && (
                                <div className="mb-6">
                                  <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                                    <Label className="text-gray-300 mb-2 block">Enter Delivery PIN from Sender</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="text"
                                        maxLength={4}
                                        value={pinInput}
                                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 4-digit PIN"
                                        className="flex-1 bg-white/5 border-white/10 text-white text-2xl tracking-widest text-center"
                                      />
                                      <Button
                                        onClick={() => {
                                          setVerifyingPin(true);
                                          verifyDeliveryMutation.mutate(
                                            { matchId: match.id, pin: pinInput },
                                            {
                                              onSettled: () => setVerifyingPin(false)
                                            }
                                          );
                                        }}
                                        disabled={pinInput.length !== 4 || verifyingPin}
                                        className="bg-green-500 hover:bg-green-600"
                                      >
                                        {verifyingPin ? "Verifying..." : "Verify"}
                                      </Button>
                                    </div>
                                    {match.pin_attempts > 0 && (
                                      <p className="text-xs text-yellow-400 mt-2">
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        {match.pin_attempts} failed attempt(s). {3 - match.pin_attempts} remaining.
                                      </p>
                                    )}
                                  </Card>
                                </div>
                              )}

                              {/* Violation Warning */}
                              {match.delivery_attempted_without_pin && (
                                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                  <div className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="w-5 h-5" />
                                    <p className="font-semibold">PIN Violation Detected</p>
                                  </div>
                                  <p className="text-sm text-gray-300 mt-2">
                                    Multiple failed PIN attempts detected. This incident has been reported to administrators.
                                  </p>
                                </div>
                              )}

                              {/* Notes */}
                              {match.notes && (
                                <div className="p-3 rounded-lg bg-white/5 mb-4">
                                  <p className="text-sm text-gray-300">{match.notes}</p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-3 flex-wrap">
                                {/* NEW: Track Shipment Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setTrackingMatchId(match.id)}
                                  className="flex-1 border-white/10 text-gray-300 hover:text-white"
                                >
                                  <TrendingUp className="w-4 h-4 mr-2" />
                                  Track
                                </Button>

                                {/* NEW: Update Status Button (only for traveler) */}
                                {match.traveler_email === user?.email && match.status !== "delivered" && (
                                  <Button
                                    size="sm"
                                    onClick={() => setStatusUpdateMatch(match)}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                  >
                                    Update Status
                                  </Button>
                                )}

                                <Link to={createPageUrl("Messages", `chatWith=${match.role === "requester" ? match.traveler_email : match.requester_email}`)} className="flex-1 min-w-[200px]">
                                  <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white">
                                    Chat with {match.role === 'requester' ? 'Traveler' : 'Sender'}
                                  </Button>
                                </Link>

                                {match.booking_status === "confirmed" && match.status !== "delivered" && match.status !== "cancelled" && (
                                  <>
                                    <Button
                                      onClick={() => {
                                        if (confirm("Are you sure you want to mark this match as complete? This action cannot be undone.")) {
                                          completeMatchMutation.mutate(match.id);
                                        }
                                      }}
                                      className="flex-1 min-w-[200px] bg-green-500 hover:bg-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Mark Complete
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        if (confirm("Are you sure you want to cancel this match?")) {
                                          cancelMatchMutation.mutate(match.id);
                                        }
                                      }}
                                      variant="outline"
                                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Cancel Match
                                    </Button>
                                  </>
                                )}
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              {/* Completed/Cancelled Tab */}
              <TabsContent value="completed">
                {completedMatches.length === 0 ? (
                  <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
                    <Handshake className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-2xl font-bold text-white mb-2">No completed matches</h3>
                    <p className="text-gray-400 mb-6">
                      Delivered, cancelled, or declined matches will appear here.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                      {completedMatches.map((match, index) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                        >
                          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                              <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge className={statusColors[match.status]}>
                                    {match.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={bookingStatusColors[match.booking_status]}>
                                    {match.booking_status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    {match.role === 'requester' ? 'Sender' : 'Traveler'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                  Match with: {match.role === 'requester' ? match.traveler_email : match.requester_email}
                                </p>
                              </div>
                              {match.agreed_price && (
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-white">${match.agreed_price}</div>
                                  <div className="text-xs text-gray-400">Agreed Price</div>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {match.notes && (
                              <div className="p-3 rounded-lg bg-white/5 mb-4">
                                <p className="text-sm text-gray-300">{match.notes}</p>
                              </div>
                            )}

                            <div className="flex gap-3 flex-wrap">
                              <Link to={createPageUrl("Messages", `chatWith=${match.role === "requester" ? match.traveler_email : match.requester_email}`)} className="flex-1 min-w-[200px]">
                                <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white">
                                  Chat with {match.role === 'requester' ? 'Traveler' : 'Sender'}
                                </Button>
                              </Link>
                              {match.can_leave_review && (
                                <Link
                                  to={createPageUrl("LeaveReview", `reviewee_email=${match.role === 'requester' ? match.traveler_email : match.requester_email}&reviewee_name=${match.role === 'requester' ? match.traveler_email : match.requester_email}&type=${match.role === 'requester' ? 'traveler' : 'requester'}&match_id=${match.id}`)}
                                  className="flex-1 min-w-[200px]"
                                >
                                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600">
                                    <Star className="w-4 h-4 mr-2" />
                                    Leave Review
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>

      {/* Decline Reason Dialog */}
      <Dialog open={!!decliningMatch} onOpenChange={() => setDecliningMatch(null)}>
        <DialogContent className="max-w-md bg-[#0F1D35] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Decline Booking Request</DialogTitle>
            <DialogDescription className="text-gray-400">
              Provide a reason for declining this booking request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Reason (Optional)</Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Let them know why you're declining..."
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDecliningMatch(null);
                  setDeclineReason("");
                }}
                className="flex-1 border-white/10 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  declineBookingMutation.mutate({
                    matchId: decliningMatch,
                    reason: declineReason
                  });
                }}
                disabled={declineBookingMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {declineBookingMutation.isPending ? "Declining..." : "Decline Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW: Tracking Dialog */}
      <Dialog open={!!trackingMatchId} onOpenChange={() => setTrackingMatchId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0F1D35] border-white/10">
          {trackingMatchId && (() => {
            const match = matches.find(m => m.id === trackingMatchId); // Find the match from the full list
            return match ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">
                    Shipment Tracking
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    View real-time tracking updates for your shipment
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <ShipmentTracker match={match} showTimeline={true} />
                </div>
              </>
            ) : null;
          })()}
        </DialogContent>
      </Dialog>

      {/* NEW: Status Update Modal */}
      {statusUpdateMatch && (
        <StatusUpdateModal
          match={statusUpdateMatch}
          isOpen={!!statusUpdateMatch}
          onClose={() => setStatusUpdateMatch(null)}
          currentUser={user}
        />
      )}
    </div>
  );
}