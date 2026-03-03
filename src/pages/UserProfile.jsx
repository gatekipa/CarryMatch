import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
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
  Award,
  MessageSquare,
  Edit,
  AlertCircle,
  ArrowLeft,
  Activity,
  Loader2,
  Calendar,
  Weight,
  DollarSign,
  ArrowRight,
  Globe,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import ReviewCard from "@/components/ReviewCard";
import UserProfileEdit from "@/components/UserProfileEdit";
import { getRoleBadgeColor, getRoleLabel } from "@/components/permissions/usePermissions";
import { formatSafeDate } from "@/components/utils/formatSafeDate";
import { toast } from "sonner";

export default function UserProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmailFromUrl = urlParams.get("email");
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    bio: "",
    location: "",
    phone: "",
    languages_spoken: [],
    travel_preferences: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const profileEmail = profileEmailFromUrl || currentUser?.email;
  const isOwnProfile = currentUser && profileEmail === currentUser.email;

  const { data: profileUser, isLoading, error, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;

      try {
        let baseUser;
        if (isOwnProfile) {
          baseUser = currentUser;
        } else {
          const users = await base44.entities.User.filter({ email: profileEmail });
          baseUser = users[0] || null;
        }

        // Merge extended user data (DOB, etc.) from User entity
        if (baseUser) {
          try {
            const extUsers = await base44.entities.User.filter({ email: profileEmail });
            if (extUsers[0]) {
              return { ...baseUser, date_of_birth: extUsers[0].date_of_birth || baseUser.date_of_birth, bio: baseUser.bio || extUsers[0].bio };
            }
          } catch {}
        }

        return baseUser;
      } catch (err) {
        console.error("Error fetching user:", err);
        throw err;
      }
    },
    enabled: !!profileEmail && !!currentUser,
    retry: 3,
    retryDelay: 1000
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const userReviews = await base44.entities.Review.filter({
        reviewee_email: profileEmail,
        is_hidden: false
      }, "-created_date");
      return userReviews;
    },
    enabled: !!profileEmail && !!currentUser
  });

  const { data: userTrips = [] } = useQuery({
    queryKey: ['user-trips', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const trips = await base44.entities.Trip.filter({
        created_by: profileEmail
      }, "-created_date", 10);
      return trips;
    },
    enabled: !!profileEmail && !!currentUser
  });

  const { data: userRequests = [] } = useQuery({
    queryKey: ['user-requests', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const requests = await base44.entities.ShipmentRequest.filter({
        created_by: profileEmail
      }, "-created_date", 10);
      return requests;
    },
    enabled: !!profileEmail && !!currentUser
  });

  const { data: recentMatches = [] } = useQuery({
    queryKey: ['user-recent-matches', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const matchesAsTraveler = await base44.entities.Match.filter({
        traveler_email: profileEmail
      }, "-created_date", 5);
      const matchesAsRequester = await base44.entities.Match.filter({
        requester_email: profileEmail
      }, "-created_date", 5);
      return [...matchesAsTraveler, ...matchesAsRequester]
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
    },
    enabled: !!profileEmail && !!currentUser
  });

  const { data: lastMessage } = useQuery({
    queryKey: ['user-last-message', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const sentMessages = await base44.entities.Message.filter({
        sender_email: profileEmail
      }, "-created_date", 1);
      return sentMessages[0] || null;
    },
    enabled: !!profileEmail && !!currentUser
  });

  useEffect(() => {
    if (profileUser && !isEditing) {
      setEditedProfile({
        bio: profileUser.bio || "",
        location: profileUser.location || "",
        phone: profileUser.phone || "",
        languages_spoken: profileUser.languages_spoken || [],
        travel_preferences: profileUser.travel_preferences || []
      });
    }
  }, [profileUser, isEditing]);

  const handleSaveProfile = async () => {
    if (!currentUser || !isOwnProfile) return;

    setIsSaving(true);
    try {
      await base44.auth.updateMe(editedProfile);
      
      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);
      
      await refetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !isOwnProfile) return;

    setIsDeleting(true);
    try {
      await base44.auth.deleteAccount();
      toast.success("Account deleted successfully");
      await base44.auth.logout();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading...</h3>
            <p className="text-gray-400">Checking authentication</p>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading Profile...</h3>
            <p className="text-gray-400">Please wait</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-white/5 border-white/10 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {error ? "Error Loading Profile" : "Profile Not Found"}
            </h3>
            <p className="text-gray-400 mb-6">
              {error?.message || "This user profile doesn't exist or couldn't be loaded."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => refetchProfile()} variant="outline" className="border-white/10 text-gray-300">
                Try Again
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline" className="border-white/10 text-gray-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

  const calculateTrustBreakdown = (user) => {
    const breakdown = [];
    
    // Verification (25 points)
    if (user.is_verified) {
      breakdown.push({ label: "ID Verified", points: 25, max: 25, icon: Shield });
    } else {
      breakdown.push({ label: "ID Verified", points: 0, max: 25, icon: Shield });
    }
    
    // Reviews & Rating (30 points)
    const reviewPoints = user.total_reviews > 0 
      ? Math.min(30, (user.average_rating / 5) * 20 + Math.min(10, user.total_reviews))
      : 0;
    breakdown.push({ label: "Reviews & Rating", points: Math.round(reviewPoints), max: 30, icon: Star });
    
    // Activity (25 points)
    const totalActivity = (user.total_trips || 0) + (user.total_shipments || 0);
    const activityPoints = Math.min(25, totalActivity * 2);
    breakdown.push({ label: "Activity Level", points: activityPoints, max: 25, icon: Activity });
    
    // Completion Rate (20 points)
    const completionRate = totalActivity > 0 
      ? ((user.completed_transactions || 0) / totalActivity) * 20
      : 0;
    breakdown.push({ label: "Completion Rate", points: Math.round(completionRate), max: 20, icon: CheckCircle });
    
    return breakdown;
  };

  const trustBreakdown = calculateTrustBreakdown(profileUser);

  // Determine user type
  const isTraveler = (userTrips?.length || 0) > 0;
  const isShipper = (userRequests?.length || 0) > 0;
  const userType = isTraveler && isShipper ? "both" : isTraveler ? "traveler" : isShipper ? "shipper" : "new";

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
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
            Back
          </Button>

          {/* Header Card */}
          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {profileUser.profile_picture_url ? (
                  <img
                    src={profileUser.profile_picture_url}
                    alt={profileUser.full_name}
                    className="w-32 h-32 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{profileUser.full_name || "User"}</h1>
                    {profileUser.location && (
                      <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {profileUser.location}
                      </p>
                    )}
                    {profileUser.date_of_birth && (
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Born {formatSafeDate(profileUser.date_of_birth, "MMM d, yyyy")}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {profileUser.is_verified && (
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {profileUser.role === "admin" && (
                        <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white border-0">
                          <Award className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {(profileUser.additional_roles || []).map(role => (
                        <Badge key={role} className={`${getRoleBadgeColor(role)} text-white border-0`}>
                          {role === 'verified_traveler' && <Plane className="w-3 h-3 mr-1" />}
                          {role === 'verified_shipper' && <Package className="w-3 h-3 mr-1" />}
                          {getRoleLabel(role)}
                        </Badge>
                      ))}
                      {profileUser.is_featured && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {userType === "both" && (
                        <Badge className="bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-0">
                          <Plane className="w-3 h-3 mr-1" />
                          <Package className="w-3 h-3 mr-1" />
                          Traveler & Shipper
                        </Badge>
                      )}
                      {userType === "traveler" && (
                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Plane className="w-3 h-3 mr-1" />
                          Traveler
                        </Badge>
                      )}
                      {userType === "shipper" && (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <Package className="w-3 h-3 mr-1" />
                          Shipper
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && !isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-white/10 text-gray-300 hover:text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {profileUser.average_rating > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(profileUser.average_rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-white">
                      {profileUser.average_rating.toFixed(1)}
                    </span>
                    <span className="text-gray-400">({profileUser.total_reviews} reviews)</span>
                  </div>
                )}

                {!isEditing && (
                  <div className="space-y-3">
                    {Array.isArray(profileUser.languages_spoken) && profileUser.languages_spoken.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {profileUser.languages_spoken.map((lang, i) => (
                            <Badge key={typeof lang === 'string' ? lang : lang?.name || i} className="bg-blue-500/20 text-blue-300">
                              {typeof lang === 'string' ? lang : lang?.name || 'Unknown'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(profileUser.travel_preferences) && profileUser.travel_preferences.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Plane className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {profileUser.travel_preferences.slice(0, 3).map(pref => (
                            <Badge key={pref} className="bg-purple-500/20 text-purple-300 text-xs">
                              {pref}
                            </Badge>
                          ))}
                          {profileUser.travel_preferences.length > 3 && (
                            <Badge className="bg-gray-500/20 text-gray-300 text-xs">
                              +{profileUser.travel_preferences.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="mt-6 flex gap-3">
                <Link to={createPageUrl("Messages")} className="flex-1">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
              </div>
            )}

            {isOwnProfile && !profileUser.is_verified && (
              <div className="mt-6">
                <Link to={createPageUrl("VerifyIdentity")}>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Your Identity
                  </Button>
                </Link>
              </div>
            )}

            {isOwnProfile && profileUser.is_verified && !(profileUser.additional_roles || []).includes('verified_traveler') && !(profileUser.additional_roles || []).includes('verified_shipper') && (
              <div className="mt-6">
                <Link to={createPageUrl("ApplyForVerification")}>
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
                    <Award className="w-4 h-4 mr-2" />
                    Apply for Premium Role Verification
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Edit Mode */}
          {isEditing ? (
            <UserProfileEdit
              user={currentUser}
              editedProfile={editedProfile}
              setEditedProfile={setEditedProfile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
              isSaving={isSaving}
            />
          ) : (
            <>
              {/* Stats & Trust Score Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Trust Score</h3>
                    <Activity className="w-5 h-5 text-[#9EFF00]" />
                  </div>
                  <div className={`text-4xl font-bold mb-2 ${getTrustScoreColor(profileUser.trust_score || 50)}`}>
                    {profileUser.trust_score || 50}/100
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getTrustScoreBg(profileUser.trust_score || 50)}`}
                      style={{ width: `${profileUser.trust_score || 50}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">Based on activity and reviews</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Plane className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{profileUser.total_trips || 0}</div>
                      <div className="text-sm text-gray-400">Trips Completed</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{profileUser.total_shipments || 0}</div>
                      <div className="text-sm text-gray-400">Shipments Sent</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Trust Score Breakdown */}
              <Card className="p-6 bg-white/5 border-white/10 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#9EFF00]" />
                  <h3 className="font-semibold text-white">Trust Score Breakdown</h3>
                </div>
                <div className="space-y-4">
                  {trustBreakdown.map((item, index) => {
                    const Icon = item.icon;
                    const percentage = (item.points / item.max) * 100;
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">{item.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {item.points}/{item.max}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              percentage >= 75 ? 'bg-green-500' :
                              percentage >= 50 ? 'bg-yellow-500' :
                              percentage >= 25 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6 bg-white/5 border-white/10 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {userTrips.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <Plane className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white">Last trip posted</p>
                        <p className="text-xs text-gray-400">
                          {userTrips[0].from_city} → {userTrips[0].to_city} • {formatSafeDate(userTrips[0].created_date, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                  {userRequests.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <Package className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white">Last shipment request</p>
                        <p className="text-xs text-gray-400">
                          {userRequests[0].from_city} → {userRequests[0].to_city} • {formatSafeDate(userRequests[0].created_date, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                  {lastMessage && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white">Last message sent</p>
                        <p className="text-xs text-gray-400">
                          {formatSafeDate(lastMessage.created_date, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                  {recentMatches.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-5 h-5 text-[#9EFF00]" />
                      <div className="flex-1">
                        <p className="text-sm text-white">Recent match</p>
                        <p className="text-xs text-gray-400">
                          {recentMatches[0].status} • {formatSafeDate(recentMatches[0].created_date, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                  {userTrips.length === 0 && userRequests.length === 0 && !lastMessage && recentMatches.length === 0 && (
                    <p className="text-gray-500 text-sm italic text-center py-4">No recent activity</p>
                  )}
                </div>
              </Card>

              {/* Bio */}
              {profileUser.bio && (
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <h3 className="font-semibold text-white mb-4">About</h3>
                  <p className="text-gray-300 leading-relaxed">{profileUser.bio}</p>
                </Card>
              )}

              {/* Full Travel Preferences */}
              {Array.isArray(profileUser.travel_preferences) && profileUser.travel_preferences.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Plane className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Travel Preferences</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.travel_preferences.map(pref => (
                      <Badge key={pref} className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Past Trips Section */}
              {userTrips.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Plane className="w-5 h-5 text-blue-400" />
                      Recent Trips ({userTrips.length})
                    </h3>
                    {userTrips.length >= 10 && (
                      <span className="text-xs text-gray-500">Showing latest 10</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {userTrips.map((trip) => (
                      <Link
                        key={trip.id}
                        to={createPageUrl("TripDetails", `id=${trip.id}`)}
                        className="block"
                      >
                        <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-blue-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-white font-medium">
                              <span>{trip.from_city}</span>
                              <ArrowRight className="w-4 h-4 text-blue-400" />
                              <span>{trip.to_city}</span>
                            </div>
                            <Badge className={
                              trip.status === "completed" ? "bg-green-500/20 text-green-400" :
                              trip.status === "active" ? "bg-blue-500/20 text-blue-400" :
                              trip.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }>
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatSafeDate(trip.departure_date, "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Weight className="w-3 h-3" />
                              {trip.available_weight_kg} kg
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${trip.price_per_kg}/kg
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Past Requests Section */}
              {userRequests.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-400" />
                      Recent Shipment Requests ({userRequests.length})
                    </h3>
                    {userRequests.length >= 10 && (
                      <span className="text-xs text-gray-500">Showing latest 10</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {userRequests.map((request) => (
                      <Link
                        key={request.id}
                        to={createPageUrl("RequestDetails", `id=${request.id}`)}
                        className="block"
                      >
                        <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-purple-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-white font-medium">
                              <span>{request.from_city}</span>
                              <ArrowRight className="w-4 h-4 text-purple-400" />
                              <span>{request.to_city}</span>
                            </div>
                            <Badge className={
                              request.status === "completed" ? "bg-green-500/20 text-green-400" :
                              request.status === "active" ? "bg-blue-500/20 text-blue-400" :
                              request.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-1">{request.item_description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatSafeDate(request.needed_by_date, "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Weight className="w-3 h-3" />
                              {request.estimated_weight_kg} kg
                            </span>
                            {request.offered_price && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${request.offered_price}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <h3 className="font-semibold text-white mb-4">
                    Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} currentUser={currentUser} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Security & Privacy Section - Own Profile Only */}
              {isOwnProfile && (
                <Card className="p-6 bg-white/5 border-white/10 mb-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white text-lg">Security & Privacy</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Delete Account Option */}
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Delete Account</p>
                            <p className="text-xs text-gray-400">Permanently delete your account and all data</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowDeleteConfirm(true)}
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation Dialog */}
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1a1a2e] border border-red-500/30 rounded-xl p-6 max-w-sm"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                          </div>
                          <h2 className="text-xl font-bold text-white">Delete Account?</h2>
                        </div>
                        <p className="text-gray-400 mb-6 text-sm">
                          This action cannot be undone. Your account, profile, trips, requests, messages, and all associated data will be permanently deleted from CarryMatch.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setShowDeleteConfirm(false)}
                            variant="outline"
                            className="flex-1 border-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete Account'
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </Card>
              )}
              </>
              )}
              </motion.div>
              </div>
              </div>
              );
              }