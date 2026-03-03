import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { useCurrentUser } from "../components/hooks/useCurrentUser";
import LoadingCard from "../components/shared/LoadingCard";
import QueryErrorFallback from "../components/shared/QueryErrorFallback";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Search,
  User,
  Send,
  ArrowLeft,
  Inbox,
  Sparkles,
  Users as UsersIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ConversationList from "../components/messages/ConversationList";
import ChatWindow from "../components/messages/ChatWindow";
import GroupChatWindow from "../components/messages/GroupChatWindow";
import MessagingStreak from "../components/messages/MessagingStreak";
import MessagingBadges from "../components/messages/MessagingBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Messages() {
  const { user, loading: userLoading } = useCurrentUser();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedGroupConversation, setSelectedGroupConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGamification, setShowGamification] = React.useState(false);
  const [chatType, setChatType] = useState("direct");
  const [autoOpenAttempted, setAutoOpenAttempted] = useState(false);

  const { data: conversations = [], refetch: refetchConversations, error: conversationsError } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const conv1 = await base44.entities.Conversation.filter({
        participant_1_email: user.email
      }, "-last_message_time");
      
      const conv2 = await base44.entities.Conversation.filter({
        participant_2_email: user.email
      }, "-last_message_time");
      
      const allConversations = [...conv1, ...conv2];
      return allConversations.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time) : new Date(0);
        const timeB = b.last_message_time ? new Date(b.last_message_time) : new Date(0);
        return timeB - timeA;
      });
    },
    enabled: !!user,
    refetchInterval: 8000,
    retry: 3,
    staleTime: 3000
  });

  const { data: groupConversations = [], refetch: refetchGroupConversations, error: groupError } = useQuery({
    queryKey: ['group-conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const allGroups = await base44.entities.GroupConversation.filter(
        { is_active: true }, "-last_message_time"
      );
      return allGroups.filter(g => 
        g.participants?.some(p => p.email === user.email)
      );
    },
    enabled: !!user,
    refetchInterval: 8000,
    retry: 3,
    staleTime: 3000
  });

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = conv.participant_1_email === user?.email 
      ? conv.participant_2_name 
      : conv.participant_1_name;
    return otherParticipant?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGroupConversations = groupConversations.filter(group => {
    if (!searchQuery) return true;
    return group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.participants?.some(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Auto-open conversation from URL param (e.g., ?chatWith=user@email.com)
  useEffect(() => {
    if (autoOpenAttempted || !user || conversations.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const chatWith = params.get("chatWith");
    if (!chatWith) { setAutoOpenAttempted(true); return; }
    
    const conv = conversations.find(c =>
      (c.participant_1_email === chatWith && c.participant_2_email === user.email) ||
      (c.participant_2_email === chatWith && c.participant_1_email === user.email)
    );
    if (conv) setSelectedConversation(conv);
    setAutoOpenAttempted(true);
  }, [conversations, user, autoOpenAttempted]);

  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (conv.participant_1_email === user?.email 
      ? conv.unread_count_participant_1 
      : conv.unread_count_participant_2);
  }, 0);

  const totalGroupUnread = groupConversations.reduce((sum, group) => {
    const participant = group.participants?.find(p => p.email === user?.email);
    return sum + (participant?.unread_count || 0);
  }, 0);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setSelectedGroupConversation(null);
  };

  const handleSelectGroupConversation = (group) => {
    setSelectedGroupConversation(group);
    setSelectedConversation(null);
  };

  if (userLoading) {
    return <LoadingCard message="Loading messages..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">You need to be signed in to access messages</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (conversationsError || groupError) {
    return (
      <QueryErrorFallback 
        error={conversationsError || groupError} 
        onRetry={() => {
          refetchConversations();
          refetchGroupConversations();
        }} 
        title="Failed to load conversations" 
      />
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Conversation List */}
      <div className={`
        ${(selectedConversation || selectedGroupConversation) ? 'hidden lg:flex' : 'flex'}
        flex-col w-full lg:w-96 xl:w-[400px] border-r border-white/10 bg-[#1a1a2e]
      `}>
        <div className="p-3 sm:p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Messages</h1>
                {(totalUnread + totalGroupUnread) > 0 && (
                  <Badge className="bg-red-500 text-white text-xs mt-1">
                    {totalUnread + totalGroupUnread} unread
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGamification(!showGamification)}
              className="text-gray-400 hover:text-[#9EFF00]"
            >
              <Sparkles className={`w-5 h-5 ${showGamification ? 'text-[#9EFF00]' : ''}`} />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {showGamification && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 mb-4 overflow-hidden"
              >
                <MessagingStreak user={user} />
                <MessagingBadges user={user} compact />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-sm"
            />
          </div>

          <Tabs value={chatType} onValueChange={setChatType} className="w-full">
            <TabsList className="w-full bg-white/5 border-white/10 grid grid-cols-2">
              <TabsTrigger value="direct" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Direct</span> ({totalUnread})
              </TabsTrigger>
              <TabsTrigger value="group" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <UsersIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Groups</span> ({totalGroupUnread})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatType === "direct" ? (
            filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Inbox className="w-16 h-16 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
                <p className="text-gray-400 text-sm">
                  Start chatting with travelers or requesters from their profile pages
                </p>
              </div>
            ) : (
              <ConversationList 
                conversations={filteredConversations}
                currentUser={user}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
              />
            )
          ) : (
            filteredGroupConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <UsersIcon className="w-16 h-16 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No group chats yet</h3>
                <p className="text-gray-400 text-sm">
                  Group chats are created automatically for multi-party transactions
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredGroupConversations.map((group, index) => {
                  const participant = group.participants?.find(p => p.email === user.email);
                  const unreadCount = participant?.unread_count || 0;
                  const isSelected = selectedGroupConversation?.id === group.id;

                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        onClick={() => handleSelectGroupConversation(group)}
                        className={`
                          p-4 cursor-pointer transition-all duration-200
                          ${isSelected 
                            ? 'bg-purple-500/20 border-purple-500/30' 
                            : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <UsersIcon className="w-6 h-6 text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className={`font-semibold truncate ${
                                unreadCount > 0 ? 'text-white' : 'text-gray-300'
                              }`}>
                                {group.name || "Group Chat"}
                              </h3>
                              {group.last_message_time && (
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                  {format(new Date(group.last_message_time), "h:mm a")}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-gray-400">
                                {group.participants?.length || 0} participants
                              </p>
                              {unreadCount > 0 && (
                                <Badge className="bg-purple-500 text-white text-xs px-2 py-0.5 flex-shrink-0">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`
        ${(selectedConversation || selectedGroupConversation) ? 'flex' : 'hidden lg:flex'}
        flex-1 flex-col bg-[#16213e]
      `}>
        {selectedConversation ? (
          <ChatWindow 
            conversation={selectedConversation}
            currentUser={user}
            onBack={() => setSelectedConversation(null)}
            onMessageSent={refetchConversations}
          />
        ) : selectedGroupConversation ? (
          <GroupChatWindow
            groupConversation={selectedGroupConversation}
            currentUser={user}
            onBack={() => setSelectedGroupConversation(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Select a conversation</h3>
              <p className="text-gray-400">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}