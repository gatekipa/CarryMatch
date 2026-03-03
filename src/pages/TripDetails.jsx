import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Weight, 
  DollarSign,
  ArrowLeft,
  User,
  Phone,
  Shield,
  MessageSquare,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Handshake,
  Star,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import ShipmentTracker from "../components/tracking/ShipmentTracker";

export default function TripDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const [user, setUser] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['trip', tripId, user?.email],
    queryFn: async () => {
      
      if (!tripId) {
        throw new Error("No trip ID provided");
      }

      try {
        const trips = await base44.entities.Trip.filter({ id: tripId });
        
        const foundTrip = trips[0];
        
        if (!foundTrip) {
          throw new Error("Trip not found in database");
        }
        
        return foundTrip;
      } catch (err) {
        console.error("❌ Error fetching trip:", err);
        throw err;
      }
    },
    enabled: !!tripId && !!user,
    retry: 1,
    retryDelay: 1000
  });

  const { data: savedItem } = useQuery({
    queryKey: ['saved-trip', tripId, user?.email],
    queryFn: async () => {
      if (!user) return null;
      const saved = await base44.entities.SavedItem.filter({
        user_email: user.email,
        item_id: tripId,
        item_type: "trip"
      });
      return saved[0] || null;
    },
    enabled: !!user && !!tripId
  });

  const { data: travelerProfile } = useQuery({
    queryKey: ['traveler-profile', trip?.created_by],
    queryFn: async () => {
      if (!trip?.created_by) return null;
      
      try {
        // Filter by email instead of listing all users
        const users = await base44.entities.User.filter({ email: trip.created_by });
        return users[0] || null;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
      }
    },
    enabled: !!trip?.created_by
  });

  const { data: userMatch } = useQuery({
    queryKey: ['user-match-for-trip', tripId, user?.email],
    queryFn: async () => {
      if (!user || !tripId) return null;

      const matchesAsRequester = await base44.entities.Match.filter({
        trip_id: tripId,
        requester_email: user.email
      });

      if (matchesAsRequester.length > 0) {
        return matchesAsRequester[0];
      }

      const matchesAsTraveler = await base44.entities.Match.filter({
        trip_id: tripId,
        traveler_email: user.email
      });

      if (matchesAsTraveler.length > 0) {
        return matchesAsTraveler[0];
      }

      return null;
    },
    enabled: !!user && !!tripId
  });


  useEffect(() => {
    setIsSaved(!!savedItem);
  }, [savedItem]);

  const toggleSave = async () => {
    if (!user || !trip) return;

    if (isSaved && savedItem) {
      await base44.entities.SavedItem.delete(savedItem.id);
      setIsSaved(false);
      queryClient.invalidateQueries({ queryKey: ['saved-trip'] });
    } else {
      await base44.entities.SavedItem.create({
        user_email: user.email,
        item_type: "trip",
        item_id: trip.id,
        item_data: trip,
        last_price: trip.price_per_kg,
        last_date: trip.departure_date,
        notify_on_update: true
      });
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['saved-trip'] });
    }
  };

  const startChat = async () => {
    if (!user || !trip) return;

    setIsCreatingChat(true);
    try {
      const existingConv1 = await base44.entities.Conversation.filter({
        participant_1_email: user.email,
        participant_2_email: trip.created_by
      });

      const existingConv2 = await base44.entities.Conversation.filter({
        participant_1_email: trip.created_by,
        participant_2_email: user.email
      });

      let conversationId;

      if (existingConv1.length > 0) {
        conversationId = existingConv1[0].id;
      } else if (existingConv2.length > 0) {
        conversationId = existingConv2[0].id;
      } else {
        const newConv = await base44.entities.Conversation.create({
          participant_1_email: user.email,
          participant_1_name: user.full_name || user.email,
          participant_2_email: trip.created_by,
          participant_2_name: trip.traveler_name,
          trip_id: trip.id,
          last_message: "New conversation started",
          last_message_time: new Date().toISOString(),
          unread_count_participant_1: 0,
          unread_count_participant_2: 0
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
    if (!user || !trip) return;

    // Prevent duplicate matches
    if (userMatch) {
      toast.error("You already have a match for this trip.");
      return;
    }

    setIsCreatingMatch(true);
    try {
      // Server-side duplicate check
      const existingMatches = await base44.entities.Match.filter({
        trip_id: trip.id,
        requester_email: user.email
      });
      if (existingMatches.length > 0) {
        toast.error("You already have a booking for this trip.");
        setIsCreatingMatch(false);
        return;
      }

      const newMatch = await base44.entities.Match.create({
        trip_id: trip.id,
        shipment_request_id: "",
        traveler_email: trip.created_by,
        requester_email: user.email,
        initiated_by: user.email,
        booking_status: "pending",
        status: "pending",
        platform_fee: 5,
        match_fee_paid: false
      });

      await base44.entities.Notification.create({
        user_email: trip.created_by,
        type: "system",
        title: "📬 New Booking Request!",
        message: `${user.full_name || user.email} wants to book your trip from ${trip.from_city} to ${trip.to_city}. A $5 matching fee applies once accepted.`,
        link_url: createPageUrl("MyMatches"),
        priority: "high",
        related_id: newMatch.id,
        related_entity_type: "match"
      });

      toast.success("Booking request sent! The traveler will review and accept.");
      navigate(createPageUrl("MyMatches"));
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create booking request. Please try again.");
    }
    setIsCreatingMatch(false);
  };

  const handleDelete = async () => {
    // If trip is active or matched, ask to cancel instead
    if (trip.status === 'active' || trip.status === 'matched') {
      if (!window.confirm("Are you sure you want to cancel this trip? It will be marked as cancelled.")) {
        return;
      }
      setIsDeleting(true);
      try {
        await base44.entities.Trip.update(trip.id, { status: "cancelled" });
        queryClient.invalidateQueries({ queryKey: ['trip'] });
        toast.success("Trip cancelled successfully.");
      } catch (error) {
        console.error("Error cancelling trip:", error);
        toast.error("Failed to cancel trip.");
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (!window.confirm("Are you sure you want to delete this trip listing? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await base44.entities.Trip.delete(trip.id);
      navigate(createPageUrl("MyTrips"));
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.error("Failed to delete trip.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading Trip Details...</h3>
            <p className="text-gray-400">Please wait</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    console.error("❌ Error or no trip:", { error, trip, tripId });
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-2xl font-bold text-white mb-2">Trip Not Found</h3>
            <p className="text-gray-400 mb-2">
              {error?.message || "This trip doesn't exist or couldn't be loaded."}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Trip ID: {tripId || 'Not provided'}
            </p>
            <Button
              onClick={() => navigate(createPageUrl("BrowseTrips"))}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A]"
            >
              Back to Browse Trips
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnTrip = user && trip.created_by === user.email;

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
            Back to Trips
          </Button>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            {/* ... keep all existing JSX from the previous version ... */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center relative">
                  <Plane className="w-8 h-8 text-white" />
                  {trip.is_verified && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-4 border-[#1a1a2e] shadow-lg">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Trip Details</h1>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {trip.status}
                    </Badge>
                    {trip.is_verified && (
                      <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified Traveler
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {user && !isOwnTrip && (
                <Button
                  onClick={toggleSave}
                  variant="outline"
                  className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
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

            {trip.is_verified && !isOwnTrip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-300 mb-1">ID Verified Traveler</h3>
                    <p className="text-sm text-gray-300">
                      This traveler has successfully verified their identity with government-issued ID. 
                      You can book with confidence knowing their identity is confirmed.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {!trip.is_verified && !isOwnTrip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-300 mb-1">Unverified Traveler</h3>
                    <p className="text-sm text-gray-300">
                      This traveler hasn't completed ID verification yet. We recommend using our delivery PIN system for added security.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Route</h2>
              <div className="flex items-center gap-6 p-6 rounded-xl bg-white/5">
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-2">From</div>
                  <div className="text-2xl font-bold text-white">{trip.from_city}</div>
                  <div className="text-gray-300">{trip.from_country}</div>
                </div>
                <ArrowRight className="w-8 h-8 text-blue-400 flex-shrink-0" />
                <div className="flex-1 text-right">
                  <div className="text-sm text-gray-400 mb-2">To</div>
                  <div className="text-2xl font-bold text-white">{trip.to_city}</div>
                  <div className="text-gray-300">{trip.to_country}</div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Travel Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-gray-400">Departure</div>
                      <div className="text-white font-medium">{trip.departure_date ? format(new Date(trip.departure_date), "MMMM d, yyyy") : "No date"}</div>
                    </div>
                  </div>
                  {trip.arrival_date && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400">Arrival</div>
                        <div className="text-white font-medium">{format(new Date(trip.arrival_date), "MMMM d, yyyy")}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Luggage & Pricing</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                    <Weight className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm text-gray-400">Available Weight</div>
                      <div className="text-white font-medium">{trip.available_weight_kg} kg</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-sm text-gray-400">Price per kg</div>
                      <div className="text-white font-medium">${trip.price_per_kg}/kg</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Services Offered */}
            {trip.delivery_services && Array.isArray(trip.delivery_services) && trip.delivery_services.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Delivery Services Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {trip.delivery_services.map((service) => (
                    <Badge key={service} className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1.5">
                      {service === "airport-to-airport" && "✈️ Airport to Airport"}
                      {service === "door-to-airport" && "🏠→✈️ Door to Airport"}
                      {service === "airport-to-door" && "✈️→🏠 Airport to Door"}
                      {service === "door-to-door" && "🏠→🏠 Door to Door"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {trip.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Additional Details</h2>
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-gray-300 leading-relaxed">{trip.description}</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Traveler Information</h2>
              <Link 
                to={createPageUrl("UserProfile", `email=${trip.created_by}`)}
                className="block group"
              >
                <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    {travelerProfile?.profile_picture_url ? (
                      <img
                        src={travelerProfile.profile_picture_url}
                        alt={trip.traveler_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="text-xl font-bold text-white group-hover:text-[#9EFF00] transition-colors">
                          {trip.traveler_name || trip.created_by}
                        </div>
                        {trip.is_verified && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      {travelerProfile && (
                        <>
                          {travelerProfile.average_rating > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.round(travelerProfile.average_rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-300">
                                {travelerProfile.average_rating.toFixed(1)} ({travelerProfile.total_reviews} reviews)
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mb-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Plane className="w-4 h-4 text-blue-400" />
                              <span>{travelerProfile.total_trips || 0} trips completed</span>
                            </div>
                            {travelerProfile.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-4 h-4 text-green-400" />
                                <span>{travelerProfile.location}</span>
                              </div>
                            )}
                          </div>

                          {travelerProfile.trust_score !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Trust Score</span>
                                <span className={`text-xs font-semibold ${
                                  travelerProfile.trust_score >= 75 ? 'text-green-400' :
                                  travelerProfile.trust_score >= 50 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>
                                  {travelerProfile.trust_score}/100
                                </span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    travelerProfile.trust_score >= 75 ? 'bg-green-500' :
                                    travelerProfile.trust_score >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${travelerProfile.trust_score}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {travelerProfile.bio && (
                            <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                              {travelerProfile.bio}
                            </p>
                          )}
                        </>
                      )}

                      {trip.traveler_phone && (
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{trip.traveler_phone}</span>
                        </div>
                      )}

                      <div className="text-sm text-[#9EFF00] group-hover:underline">
                        Click to view full profile →
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {!isOwnTrip && user && (
              <>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {trip.traveler_phone && (
                  <Button
                    onClick={() => window.location.href = `tel:${trip.traveler_phone}`}
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                )}
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
              <p className="text-xs text-gray-500 text-center">A $5 matching fee applies once accepted. You and the traveler negotiate the delivery price via chat.</p>
            </>
            )}

            {isOwnTrip && (
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <Link to={createPageUrl("PostTrip", `id=${trip.id}`)}>
                  <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Trip
                  </Button>
                </Link>
                <Button 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  variant="outline" 
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? (trip.status === 'active' ? "Cancelling..." : "Deleting...") : (trip.status === 'active' ? "Cancel Trip" : "Delete Trip")}
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-gray-400">
              Remember: Pay the $5 match fee to CarryMatch, then arrange payment and delivery directly with the traveler
            </p>
          </Card>

          {userMatch && userMatch.status !== "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Shipment Progress</h2>
              <ShipmentTracker match={userMatch} showTimeline={true} />
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}