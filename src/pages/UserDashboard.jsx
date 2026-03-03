import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Star,
  Plane,
  Package,
  MessageSquare,
  Bell,
  Plus,
  Activity,
  TrendingUp,
  ArrowRight,
  Calendar,
  Weight,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  // Fetch active trips
  const { data: activeTrips = [] } = useQuery({
    queryKey: ['dashboard-active-trips', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const trips = await base44.entities.Trip.filter({
        created_by: user.email,
        status: "active"
      }, "-created_date", 20);
      // Filter to P2P trips only (bus trips have operator_id)
      return trips.filter(t => !t.operator_id).slice(0, 5);
    },
    enabled: !!user
  });

  // Fetch active requests
  const { data: activeRequests = [] } = useQuery({
    queryKey: ['dashboard-active-requests', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ShipmentRequest.filter({
        created_by: user.email,
        status: "active"
      }, "-created_date", 5);
    },
    enabled: !!user
  });

  // Fetch unread messages count
  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ['dashboard-unread-messages', user?.email],
    queryFn: async () => {
      if (!user) return 0;

      const conv1 = await base44.entities.Conversation.filter({
        participant_1_email: user.email
      });

      const conv2 = await base44.entities.Conversation.filter({
        participant_2_email: user.email
      });

      const totalUnread = [...conv1, ...conv2].reduce((sum, conv) => {
        return sum + (conv.participant_1_email === user.email
          ? conv.unread_count_participant_1
          : conv.unread_count_participant_2);
      }, 0);

      return totalUnread;
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  // Fetch recent notifications
  const { data: recentNotifications = [] } = useQuery({
    queryKey: ['dashboard-recent-notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Notification.filter({
        user_email: user.email
      }, "-created_date", 5);
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  // Fetch recent conversations
  const { data: recentConversations = [] } = useQuery({
    queryKey: ['dashboard-recent-conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];

      const conv1 = await base44.entities.Conversation.filter({
        participant_1_email: user.email
      }, "-last_message_time", 3);

      const conv2 = await base44.entities.Conversation.filter({
        participant_2_email: user.email
      }, "-last_message_time", 3);

      return [...conv1, ...conv2]
        .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time))
        .slice(0, 3);
    },
    enabled: !!user
  });

  // Fetch pending matches
  const { data: pendingMatches = [] } = useQuery({
    queryKey: ['dashboard-pending-matches', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const asTraveler = await base44.entities.Match.filter({
        traveler_email: user.email,
        booking_status: "pending"
      });

      const asRequester = await base44.entities.Match.filter({
        requester_email: user.email,
        booking_status: "pending"
      });

      return [...asTraveler, ...asRequester];
    },
    enabled: !!user
  });

  const unreadNotificationCount = recentNotifications.filter(n => !n.is_read).length;

  const getTrustScoreColor = (score) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getTrustScoreBg = (score) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading...</h3>
            <p className="text-gray-400">Getting your dashboard ready</p>
          </Card>
        </div>
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
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">{user.full_name || "Traveler"}</span>! 👋
            </h1>
            <p className="text-gray-400">Here's what's happening with your account</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => navigate(createPageUrl("BrowseTrips"))}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{activeTrips.length}</div>
              <div className="text-sm text-gray-400">Active Trips</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => navigate(createPageUrl("BrowseRequests"))}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{activeRequests.length}</div>
              <div className="text-sm text-gray-400">Active Requests</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => navigate(createPageUrl("Messages"))}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                {unreadMessageCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadMessageCount}</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{unreadMessageCount}</div>
              <div className="text-sm text-gray-400">Unread Messages</div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => navigate(createPageUrl("Notifications"))}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-400" />
                </div>
                {unreadNotificationCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadNotificationCount}</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{unreadNotificationCount}</div>
              <div className="text-sm text-gray-400">New Notifications</div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Trust Score Card */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#9EFF00]" />
                  Trust Score
                </h3>
                <Link to={createPageUrl("UserProfile", `email=${user.email}`)}>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    View Details
                  </Button>
                </Link>
              </div>
              <div className={`text-5xl font-bold mb-3 ${getTrustScoreColor(user.trust_score || 50)}`}>
                {user.trust_score || 50}<span className="text-2xl text-gray-500">/100</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all ${getTrustScoreBg(user.trust_score || 50)}`}
                  style={{ width: `${user.trust_score || 50}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">Based on your activity and reviews</p>
              
              {!user.is_verified && (
                <Link to={createPageUrl("VerifyIdentity")} className="block mt-4">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Identity
                  </Button>
                </Link>
              )}
            </Card>

            {/* Activity Stats */}
            <Card className="p-6 bg-white/5 border-white/10 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#9EFF00]" />
                <h3 className="font-semibold text-white">Activity Overview</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Total Trips</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{user.total_trips || 0}</div>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Total Shipments</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{user.total_shipments || 0}</div>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Average Rating</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {user.average_rating ? user.average_rating.toFixed(1) : "N/A"}
                  </div>
                </div>
              </div>

              {pendingMatches.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-300">
                        You have {pendingMatches.length} pending match{pendingMatches.length !== 1 ? 'es' : ''}
                      </p>
                      <p className="text-xs text-gray-400">Review and respond to booking requests</p>
                    </div>
                    <Link to={createPageUrl("MyMatches")}>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6 bg-white/5 border-white/10 mb-8">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={createPageUrl("PostTrip")} className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-auto py-4">
                  <Plane className="w-5 h-5 mr-2" />
                  Post a Trip
                </Button>
              </Link>
              <Link to={createPageUrl("PostRequest")} className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white h-auto py-4">
                  <Package className="w-5 h-5 mr-2" />
                  Post a Request
                </Button>
              </Link>
              <Link to={createPageUrl("BrowseTrips")} className="block">
                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-auto py-4">
                  <Plane className="w-5 h-5 mr-2" />
                  Browse Trips
                </Button>
              </Link>
              <Link to={createPageUrl("BrowseRequests")} className="block">
                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-auto py-4">
                  <Package className="w-5 h-5 mr-2" />
                  Browse Requests
                </Button>
              </Link>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Active Trips */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Plane className="w-5 h-5 text-blue-400" />
                  Active Trips ({activeTrips.length})
                </h3>
                <Link to={createPageUrl("BrowseTrips")}>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {activeTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <Plane className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-500 text-sm mb-4">No active trips</p>
                    <Link to={createPageUrl("PostTrip")}>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  activeTrips.map((trip) => (
                    <Link key={trip.id} to={createPageUrl("TripDetails", `id=${trip.id}`)}>
                      <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2 text-white font-medium">
                          <span>{trip.from_city}</span>
                          <ArrowRight className="w-4 h-4 text-blue-400" />
                          <span>{trip.to_city}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(trip.departure_date), "MMM d")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3" />
                            {trip.available_weight_kg}kg
                          </span>
                          {trip.price_per_kg && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${trip.price_per_kg}/kg
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Active Requests */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  Active Requests ({activeRequests.length})
                </h3>
                <Link to={createPageUrl("BrowseRequests")}>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {activeRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-500 text-sm mb-4">No active requests</p>
                    <Link to={createPageUrl("PostRequest")}>
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Request
                      </Button>
                    </Link>
                  </div>
                ) : (
                  activeRequests.map((request) => (
                    <Link key={request.id} to={createPageUrl("RequestDetails", `id=${request.id}`)}>
                      <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2 text-white font-medium">
                          <span>{request.from_city}</span>
                          <ArrowRight className="w-4 h-4 text-purple-400" />
                          <span>{request.to_city}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-1">{request.item_description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(request.needed_by_date), "MMM d")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3" />
                            {request.estimated_weight_kg}kg
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Messages */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  Recent Messages
                </h3>
                <Link to={createPageUrl("Messages")}>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentConversations.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">No recent messages</p>
                ) : (
                  recentConversations.map((conv) => {
                    const otherParticipant = conv.participant_1_email === user.email
                      ? { email: conv.participant_2_email, name: conv.participant_2_name }
                      : { email: conv.participant_1_email, name: conv.participant_1_name };
                    const unreadCount = conv.participant_1_email === user.email
                      ? conv.unread_count_participant_1
                      : conv.unread_count_participant_2;

                    return (
                      <Link key={conv.id} to={createPageUrl("Messages")}>
                        <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">{otherParticipant.name}</span>
                            {unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-1">{conv.last_message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.last_message_time && format(new Date(conv.last_message_time), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Recent Notifications */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-400" />
                  Recent Notifications
                </h3>
                <Link to={createPageUrl("Notifications")}>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentNotifications.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">No notifications</p>
                ) : (
                  recentNotifications.map((notification) => (
                    <Link key={notification.id} to={notification.link_url || createPageUrl("Notifications")}>
                      <div className={`p-4 rounded-lg transition-all border ${
                        notification.is_read
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
                      }`}>
                        <div className="flex items-start gap-3">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-orange-400 rounded-full mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm mb-1">{notification.title}</p>
                            <p className="text-gray-400 text-xs line-clamp-2">{notification.message}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              {format(new Date(notification.created_date), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}