import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Weight, 
  DollarSign,
  ArrowLeft,
  User,
  Phone,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Handshake,
  Star,
  Edit,
  Trash2,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import ShipmentTracker from "../components/tracking/ShipmentTracker"; // NEW IMPORT

export default function RequestDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get("id");
  const [user, setUser] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: request, isLoading, error: fetchError } = useQuery({
    queryKey: ['shipment-request', requestId, user?.email],
    queryFn: async () => {
      const requests = await base44.entities.ShipmentRequest.filter({ id: requestId });
      return requests[0] || null;
    },
    enabled: !!requestId && !!user,
    retry: false
  });

  // Check if item is saved
  const { data: savedItem } = useQuery({
    queryKey: ['saved-request', requestId, user?.email],
    queryFn: async () => {
      if (!user) return null;
      const saved = await base44.entities.SavedItem.filter({
        user_email: user.email,
        item_id: requestId,
        item_type: "request"
      });
      return saved[0] || null;
    },
    enabled: !!user && !!requestId
  });

  // Fetch requester profile data
  const { data: requesterProfile } = useQuery({
    queryKey: ['requester-profile', request?.created_by],
    queryFn: async () => {
      if (!request) return null;
      const users = await base44.entities.User.filter({ email: request.created_by });
      return users[0] || null;
    },
    enabled: !!request
  });

  // Fetch match data for the current user and request that is not pending
  const { data: userMatch } = useQuery({
    queryKey: ['user-traveler-match-for-request', requestId, user?.email],
    queryFn: async () => {
      if (!user || !requestId) return null;
      // Fetch matches where the current user is the traveler for this request
      const matches = await base44.entities.Match.filter({
        shipment_request_id: requestId,
        traveler_email: user.email 
      });
      // Return the first match that is not pending (e.g., confirmed, completed, cancelled)
      return matches.find(m => m.status !== 'pending') || null;
    },
    enabled: !!user?.email && !!requestId
  });

  React.useEffect(() => {
    setIsSaved(!!savedItem);
  }, [savedItem]);

  const toggleSave = async () => {
    if (!user || !request) return;

    if (isSaved && savedItem) {
      await base44.entities.SavedItem.delete(savedItem.id);
      setIsSaved(false);
      queryClient.invalidateQueries({ queryKey: ['saved-request'] });
    } else {
      await base44.entities.SavedItem.create({
        user_email: user.email,
        item_type: "request",
        item_id: request.id,
        item_data: request,
        last_price: request.offered_price,
        last_date: request.needed_by_date,
        notify_on_update: true
      });
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['saved-request'] });
    }
  };

  const urgencyColors = {
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  const startChat = async () => {
    if (!user || !request) return;

    setIsCreatingChat(true);
    try {
      // Check if conversation already exists
      const existingConv1 = await base44.entities.Conversation.filter({
        participant_1_email: user.email,
        participant_2_email: request.created_by
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        participant_1_email: request.created_by,
        participant_2_email: user.email
      });

      let conversationId;

      if (existingConv1.length > 0) {
        conversationId = existingConv1[0].id;
      } else if (existingConv2.length > 0) {
        conversationId = existingConv2[0].id;
      } else {
        // Create new conversation
        const newConv = await base44.entities.Conversation.create({
          participant_1_email: user.email,
          participant_1_name: user.full_name || user.email,
          participant_2_email: request.created_by,
          participant_2_name: request.requester_name,
          request_id: request.id,
          last_message: "New conversation started",
          last_message_time: new Date().toISOString(),
          unread_count_participant_1: 0,
          unread_count_participant_2: 0 // Initialize unread count for both participants
        });
        conversationId = newConv.id;
      }

      navigate(createPageUrl("Messages"));
    } catch (error) {
      console.error("Error creating chat:", error);
    }
    setIsCreatingChat(false);
  };

  const createMatch = async () => {
    if (!user || !request) return;

    // Prevent duplicate matches
    if (userMatch) {
      toast.error("You already have a match for this request.");
      return;
    }

    setIsCreatingMatch(true);
    try {
      // Server-side duplicate check
      const existingMatches = await base44.entities.Match.filter({
        shipment_request_id: request.id,
        traveler_email: user.email
      });
      if (existingMatches.length > 0) {
        toast.error("You already have a booking for this request.");
        setIsCreatingMatch(false);
        return;
      }

      // Find traveler's best matching active trip for this route
      let bestTripId = "";
      try {
        const myTrips = await base44.entities.Trip.filter({
          created_by: user.email,
          status: "active"
        });
        const routeMatch = myTrips.find(t =>
          t.from_city?.toLowerCase() === request.from_city?.toLowerCase() &&
          t.to_city?.toLowerCase() === request.to_city?.toLowerCase()
        );
        const countryMatch = myTrips.find(t =>
          t.from_country?.toLowerCase() === request.from_country?.toLowerCase() &&
          t.to_country?.toLowerCase() === request.to_country?.toLowerCase()
        );
        bestTripId = (routeMatch || countryMatch || myTrips[0])?.id || "";
      } catch (e) {
        console.warn("Could not auto-link trip:", e);
      }

      const newMatch = await base44.entities.Match.create({
        trip_id: bestTripId,
        shipment_request_id: request.id,
        traveler_email: user.email,
        requester_email: request.created_by,
        initiated_by: user.email,
        booking_status: "pending",
        status: "pending",
        platform_fee: 5,
        match_fee_paid: false
      });

      await base44.entities.Notification.create({
        user_email: request.created_by,
        type: "system",
        title: "📬 New Booking Request!",
        message: `${user.full_name || user.email} wants to help with your shipment from ${request.from_city} to ${request.to_city}. A $5 matching fee applies once accepted.`,
        link_url: createPageUrl("MyMatches"),
        priority: "high",
        related_id: newMatch.id,
        related_entity_type: "match"
      });

      toast.success("Booking request sent! The sender will review and accept.");
      navigate(createPageUrl("MyMatches"));
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create booking request.");
    }
    setIsCreatingMatch(false);
  };

  const handleDelete = async () => {
    // If request is active or matched, ask to cancel instead
    if (request.status === 'active' || request.status === 'matched') {
      if (!window.confirm("Are you sure you want to cancel this request? It will be marked as cancelled.")) {
        return;
      }
      setIsDeleting(true);
      try {
        await base44.entities.ShipmentRequest.update(request.id, { status: "cancelled" });
        queryClient.invalidateQueries({ queryKey: ['shipment-request'] });
        toast.success("Request cancelled successfully.");
      } catch (error) {
        console.error("Error cancelling request:", error);
        toast.error("Failed to cancel request.");
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (!window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await base44.entities.ShipmentRequest.delete(request.id);
      navigate(createPageUrl("MyRequests"));
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-white/5 border-white/10 animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-4" />
            <div className="h-4 bg-white/10 rounded mb-2" />
            <div className="h-4 bg-white/10 rounded" />
          </Card>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-white/5 border-white/10 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Request Not Found</h2>
            <p className="text-gray-400 mb-4">The request you are looking for does not exist or you do not have permission to view it.</p>
            {fetchError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{fetchError.message}</p>
              </div>
            )}
            <div className="text-xs text-gray-500 mb-6">
              Request ID: {requestId}<br />
              User: {user?.email}
            </div>
            <Button onClick={() => navigate(-1)} variant="outline" className="border-white/10 text-gray-300">
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnRequest = user && request.created_by === user.email;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Shipment Request</h1>
                  <div className="flex gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {request.status}
                    </Badge>
                    <Badge className={urgencyColors[request.urgency]}>
                      {request.urgency === 'high' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {request.urgency} urgency
                    </Badge>
                  </div>
                </div>
              </div>
              {user && !isOwnRequest && (
                <Button
                  onClick={toggleSave}
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:text-white"
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Route */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Route</h2>
              <div className="flex items-center gap-6 p-6 rounded-xl bg-white/5">
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-2">From</div>
                  <div className="text-2xl font-bold text-white">{request.from_city}</div>
                  <div className="text-gray-300">{request.from_country}</div>
                </div>
                <ArrowRight className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div className="flex-1 text-right">
                  <div className="text-sm text-gray-400 mb-2">To</div>
                  <div className="text-2xl font-bold text-white">{request.to_city}</div>
                  <div className="text-gray-300">{request.to_country}</div>
                </div>
              </div>
            </div>

            {/* Destination Flexibility */}
            {request.destination_flexibility && request.destination_flexibility !== "specific" && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Destination Flexibility</h2>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">
                      {request.destination_flexibility === "metro" && "Metro Area Flexibility"}
                      {request.destination_flexibility === "state" && "State-wide Flexibility"}
                      {request.destination_flexibility === "national" && "Nationwide Flexibility"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {request.destination_flexibility === "metro" && request.alternate_destination_airports?.length > 0 && (
                      <span>Accepts delivery to: {request.alternate_destination_airports.join(", ")}</span>
                    )}
                    {request.destination_flexibility === "state" && request.destination_state && (
                      <span>Accepts delivery to any airport in {request.destination_state}</span>
                    )}
                    {request.destination_flexibility === "national" && request.destination_country && (
                      <span>Accepts delivery to any airport in {request.destination_country}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Item Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Item Description</h2>
              <div className="p-6 rounded-xl bg-white/5">
                <p className="text-gray-300 leading-relaxed text-lg">{request.item_description}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Delivery Details</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-sm text-gray-400">Needed By</div>
                      <div className="text-white font-medium">{request.needed_by_date ? format(new Date(request.needed_by_date), "MMMM d, yyyy") : "No date"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                    <Weight className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm text-gray-400">Estimated Weight</div>
                      <div className="text-white font-medium">~{request.estimated_weight_kg} kg</div>
                    </div>
                  </div>
                  {request.delivery_type && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <Package className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400">Delivery Type</div>
                        <div className="text-white font-medium">
                          {request.delivery_type === "airport-to-airport" && "✈️ Airport to Airport"}
                          {request.delivery_type === "door-to-airport" && "🏠→✈️ Door to Airport"}
                          {request.delivery_type === "airport-to-door" && "✈️→🏠 Airport to Door"}
                          {request.delivery_type === "door-to-door" && "🏠→🏠 Door to Door"}
                        </div>
                      </div>
                    </div>
                  )}
                  {request.pickup_address && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
                      <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-400">Pickup Address</div>
                        <div className="text-white font-medium text-sm">{request.pickup_address}</div>
                      </div>
                    </div>
                  )}
                  {request.delivery_address && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
                      <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-400">Delivery Address</div>
                        <div className="text-white font-medium text-sm">{request.delivery_address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Payment Offer</h2>
                <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-yellow-400" />
                    <div className="text-3xl font-bold text-white">${request.offered_price}</div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Direct payment to traveler<br />
                    + $5 CarryMatch fee (paid separately)
                  </div>
                </div>
              </div>
            </div>

            {/* Preferred Traveler Badge */}
            {request.preferred_traveler_emails && request.preferred_traveler_emails.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Preferred Travelers</h2>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <p className="text-sm text-gray-300 mb-2">
                    This requester has preferred travelers. If you're on their list, you'll get priority matching!
                  </p>
                  {user && request.preferred_traveler_emails.includes(user.email) && (
                    <Badge className="bg-[#9EFF00] text-[#1A1A1A]">
                      ⭐ You're a preferred traveler!
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Requester Info - Enhanced */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Requester Information</h2>
              <Link 
                to={createPageUrl("UserProfile", `email=${request.created_by}`)}
                className="block group"
              >
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    {requesterProfile?.profile_picture_url ? (
                      <img
                        src={requesterProfile.profile_picture_url}
                        alt={request.requester_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                          {request.requester_name}
                        </div>
                      </div>

                      {requesterProfile && (
                        <>
                          {/* Rating */}
                          {requesterProfile.average_rating > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.round(requesterProfile.average_rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-300">
                                {requesterProfile.average_rating.toFixed(1)} ({requesterProfile.total_reviews} reviews)
                              </span>
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 mb-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Package className="w-4 h-4 text-purple-400" />
                              <span>{requesterProfile.total_shipments || 0} shipments completed</span>
                            </div>
                            {requesterProfile.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-4 h-4 text-green-400" />
                                <span>{requesterProfile.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Trust Score */}
                          {requesterProfile.trust_score !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Trust Score</span>
                                <span className={`text-xs font-semibold ${
                                  requesterProfile.trust_score >= 75 ? 'text-green-400' :
                                  requesterProfile.trust_score >= 50 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {requesterProfile.trust_score}/100
                                </span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    requesterProfile.trust_score >= 75 ? 'bg-green-500' :
                                    requesterProfile.trust_score >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${requesterProfile.trust_score}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Bio Preview */}
                          {requesterProfile.bio && (
                            <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                              {requesterProfile.bio}
                            </p>
                          )}
                        </>
                      )}

                      {/* Contact Info */}
                      <div className="flex items-center gap-2 text-gray-300 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{request.requester_phone}</span>
                      </div>

                      <div className="text-sm text-purple-400 group-hover:underline">
                        Click to view full profile →
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Action Buttons */}
            {!isOwnRequest && user && (
              <>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <Button
                  onClick={() => window.location.href = `tel:${request.requester_phone}`}
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button
                  onClick={startChat}
                  disabled={isCreatingChat}
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isCreatingChat ? "Opening..." : "Message"}
                </Button>
                <Button
                  onClick={createMatch}
                  disabled={isCreatingMatch || !!userMatch}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Handshake className="w-4 h-4 mr-2" />
                  {isCreatingMatch ? "Creating..." : userMatch ? "Already Matched" : "Create Match"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">A $5 matching fee applies once accepted. You and the sender negotiate the delivery price via chat.</p>
            </>
            )}

            {isOwnRequest && (
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <Link to={createPageUrl("PostRequest", `id=${request.id}`)}>
                  <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Request
                  </Button>
                </Link>
                <Button 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  variant="outline" 
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? (request.status === 'active' ? "Cancelling..." : "Deleting...") : (request.status === 'active' ? "Cancel Request" : "Delete Request")}
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-gray-400">
              Contact the requester to finalize details. Both parties must pay the $5 CarryMatch match fee.
            </p>
          </Card>
        </motion.div>

        {/* NEW: Shipment Tracking (if userMatch exists and is confirmed/not pending) */}
        {userMatch && userMatch.status !== "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <ShipmentTracker match={userMatch} showTimeline={false} />
          </motion.div>
        )}

      </div>
    </div>
  );
}