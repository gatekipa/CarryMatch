import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageSquare, 
  AlertTriangle, 
  Star,
  Sparkles,
  Check,
  CheckCheck,
  Trash2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Notification.filter(
        { user_email: user.email },
        "-created_date",
        50
      );
    },
    enabled: !!user,
    refetchInterval: 10000 // Poll every 10 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifs = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifs.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-notifications']);
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unread-notifications']);
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message": return MessageSquare;
      case "dispute":
      case "dispute_update": return AlertTriangle;
      case "review": return Star;
      case "match_found": return Sparkles;
      default: return Bell;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "message": return "from-blue-500 to-blue-600";
      case "dispute":
      case "dispute_update": return "from-red-500 to-orange-600";
      case "review": return "from-yellow-400 to-orange-500";
      case "match_found": return "from-purple-500 to-pink-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">Sign in to see your notifications</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
              <p className="text-gray-400">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                variant="outline"
                className="border-white/10 text-gray-300 hover:text-white"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filters */}
          <Tabs value={filter} onValueChange={setFilter} className="mb-6">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="message">Messages</TabsTrigger>
              <TabsTrigger value="match_found">Matches</TabsTrigger>
              <TabsTrigger value="review">Reviews</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                  <div className="h-6 bg-white/10 rounded mb-3" />
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No notifications</h3>
              <p className="text-gray-400">
                {filter === "unread" ? "You're all caught up!" : "You'll see notifications here when something happens"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const gradientColor = getNotificationColor(notification.type);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      layout
                    >
                      <Card 
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          notification.is_read 
                            ? 'bg-white/5 border-white/10 hover:bg-white/[0.07]' 
                            : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`font-semibold ${notification.is_read ? 'text-gray-300' : 'text-white'}`}>
                                {notification.title}
                              </h3>
                              {!notification.is_read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {notification.created_date 
                                  ? formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })
                                  : "Recently"}
                              </span>
                              {notification.priority === 'high' && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification.id);
                                }}
                                className="text-gray-400 hover:text-white hover:bg-white/5"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}