import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Image as ImageIcon, FileText } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";

export default function ConversationList({ 
  conversations, 
  currentUser, 
  selectedConversation,
  onSelectConversation 
}) {
  const getOtherParticipant = (conversation) => {
    return conversation.participant_1_email === currentUser.email
      ? {
          name: conversation.participant_2_name,
          email: conversation.participant_2_email
        }
      : {
          name: conversation.participant_1_name,
          email: conversation.participant_1_email
        };
  };

  const getUnreadCount = (conversation) => {
    return conversation.participant_1_email === currentUser.email
      ? conversation.unread_count_participant_1
      : conversation.unread_count_participant_2;
  };

  const getLastSeenStatus = (conversation) => {
    const isParticipant1 = conversation.participant_1_email === currentUser.email;
    const otherLastSeen = isParticipant1 
      ? conversation.participant_2_last_seen 
      : conversation.participant_1_last_seen;

    if (!otherLastSeen) return false;
    
    const lastSeen = new Date(otherLastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / 1000 / 60;
    
    return diffMinutes < 5; // Online if active in last 5 minutes
  };

  const isOtherUserTyping = (conversation) => {
    const isParticipant1 = conversation.participant_1_email === currentUser.email;
    return isParticipant1 
      ? conversation.participant_2_typing 
      : conversation.participant_1_typing;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const getMessagePreview = (message) => {
    if (!message) return "No messages yet";
    
    // Check for special attachment indicators
    if (message === "📷 Photo") {
      return (
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          Photo
        </span>
      );
    }
    if (message === "📎 File") {
      return (
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          File
        </span>
      );
    }
    
    return message;
  };

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation, index) => {
        const otherParticipant = getOtherParticipant(conversation);
        const unreadCount = getUnreadCount(conversation);
        const isSelected = selectedConversation?.id === conversation.id;
        const isOnline = getLastSeenStatus(conversation);
        const typing = isOtherUserTyping(conversation);

        return (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              onClick={() => onSelectConversation(conversation)}
              className={`
                p-4 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'bg-blue-500/20 border-blue-500/30' 
                  : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  {/* Online indicator */}
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-semibold truncate ${
                      unreadCount > 0 ? 'text-white' : 'text-gray-300'
                    }`}>
                      {otherParticipant.name}
                    </h3>
                    {conversation.last_message_time && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${
                      unreadCount > 0 ? 'text-gray-300 font-medium' : 'text-gray-400'
                    }`}>
                      {typing ? (
                        <span className="text-[#9EFF00]">typing...</span>
                      ) : (
                        getMessagePreview(conversation.last_message)
                      )}
                    </p>
                    {unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 flex-shrink-0">
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
  );
}