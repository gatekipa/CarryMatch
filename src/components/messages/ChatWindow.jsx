import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ArrowLeft,
  User,
  MoreVertical,
  CheckCheck,
  Check,
  Link as LinkIcon,
  ThumbsUp,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Download,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function ChatWindow({ conversation, currentUser, onBack, onMessageSent }) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef(null);
  const lastSeenIntervalRef = useRef(null);

  const otherUser = conversation.participant_1_email === currentUser.email
    ? {
        email: conversation.participant_2_email,
        name: conversation.participant_2_name
      }
    : {
        email: conversation.participant_1_email,
        name: conversation.participant_1_name
      };

  const isParticipant1 = conversation.participant_1_email === currentUser.email;

  // Fetch messages
   const { data: messages = [], refetch: refetchMessages } = useQuery({
     queryKey: ['messages', conversation.id],
     queryFn: () => base44.entities.Message.filter({
       conversation_id: conversation.id
     }, "created_date"),
     refetchInterval: 3000,
     staleTime: 1000,
     retry: 2
   });

  // Fetch other user's online status
   const { data: otherUserData } = useQuery({
     queryKey: ['user-status', otherUser.email],
     queryFn: async () => {
       const users = await base44.entities.User.filter({ email: otherUser.email });
       return users[0] || null;
     },
     refetchInterval: 15000,
     staleTime: 5000,
     retry: 1
   });

  // Update last seen
  useEffect(() => {
    const updateLastSeen = async () => {
      try {
        const now = new Date().toISOString();

        // Update conversation
        await base44.entities.Conversation.update(conversation.id, {
          [isParticipant1 ? 'participant_1_last_seen' : 'participant_2_last_seen']: now,
          [isParticipant1 ? 'participant_1_typing' : 'participant_2_typing']: false
        });

        // Update user
        await base44.auth.updateMe({
          is_online: true,
          last_seen: now
        });
      } catch (error) {
        console.error('Failed to update last seen:', error);
      }
    };

    updateLastSeen();
    lastSeenIntervalRef.current = setInterval(updateLastSeen, 30000); // Update every 30s

    return () => {
      if (lastSeenIntervalRef.current) {
        clearInterval(lastSeenIntervalRef.current);
      }
      // Mark offline on unmount
      base44.auth.updateMe({ is_online: false }).catch(() => {});
    };
  }, [conversation.id, isParticipant1]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      try {
        const unreadMessages = messages.filter(
          m => m.receiver_email === currentUser.email && !m.is_read
        );

        if (unreadMessages.length === 0) return;

        await Promise.all(
          unreadMessages.map(message =>
            base44.entities.Message.update(message.id, { 
              is_read: true,
              read_at: new Date().toISOString()
            })
          )
        );

        await base44.entities.Conversation.update(conversation.id, {
          [isParticipant1 ? 'unread_count_participant_1' : 'unread_count_participant_2']: 0
        });

        onMessageSent();
        queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    };

    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, currentUser.email, conversation, onMessageSent, queryClient, isParticipant1]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    try {
      await base44.entities.Conversation.update(conversation.id, {
        [isParticipant1 ? 'participant_1_typing' : 'participant_2_typing']: true
      });
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await base44.entities.Conversation.update(conversation.id, {
          [isParticipant1 ? 'participant_1_typing' : 'participant_2_typing']: false
        });
      } catch (error) {
        console.error('Failed to clear typing status:', error);
      }
    }, 3000);
  };

  // Check if other user is typing
  const otherUserTyping = isParticipant1 
    ? conversation.participant_2_typing 
    : conversation.participant_1_typing;

  // Check if other user is online
  const isOtherUserOnline = () => {
    if (!otherUserData?.last_seen) return false;
    const lastSeen = new Date(otherUserData.last_seen);
    const now = new Date();
    const diffMinutes = (now - lastSeen) / 1000 / 60;
    return diffMinutes < 5; // Online if active in last 5 minutes
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (fileUrl) => {
      sendMessageMutation.mutate({
        content: messageText.trim() || "📎 Attachment",
        attachment_url: fileUrl,
        attachment_type: selectedFile.type,
        attachment_name: selectedFile.name,
        attachment_size: selectedFile.size,
        message_type: selectedFile.type.startsWith('image/') ? 'image' : 'file'
      });
      setSelectedFile(null);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setIsUploading(false);
    }
  });

  // Mark message as helpful mutation
  const markHelpfulMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.Message.update(messageId, {
        is_helpful: true,
        helpful_marked_at: new Date().toISOString()
      });

      const message = messages.find(m => m.id === messageId);
      if (message) {
        const senderUsers = await base44.entities.User.filter({ email: message.sender_email });
        if (senderUsers[0]) {
          const newHelpfulCount = (senderUsers[0].helpful_message_count || 0) + 1;
          await base44.entities.User.update(senderUsers[0].id, {
            helpful_message_count: newHelpfulCount,
            messaging_points: (senderUsers[0].messaging_points || 0) + 2
          });

          if (newHelpfulCount === 50) {
            await base44.entities.Notification.create({
              user_email: message.sender_email,
              type: "system",
              title: "🎉 New Badge Unlocked!",
              message: "You've earned the 'Helpful Communicator' badge!",
              priority: "normal"
            });
          }
        }
      }
    },
    onSuccess: () => {
      refetchMessages();
      toast.success("Message marked as helpful!");
    }
  });

  // Send message mutation with optimistic update
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const newMessage = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        receiver_email: otherUser.email,
        content: messageData.content || messageText.trim(),
        is_read: false,
        message_type: messageData.message_type || "text",
        attachment_url: messageData.attachment_url,
        attachment_type: messageData.attachment_type,
        attachment_name: messageData.attachment_name,
        attachment_size: messageData.attachment_size
      });

      const otherUserUnreadKey = isParticipant1
        ? 'unread_count_participant_2'
        : 'unread_count_participant_1';

      const lastMessagePreview = messageData.attachment_url 
        ? (messageData.message_type === 'image' ? '📷 Photo' : '📎 File')
        : (messageData.content || messageText.trim()).substring(0, 100);

      await base44.entities.Conversation.update(conversation.id, {
        last_message: lastMessagePreview,
        last_message_time: new Date().toISOString(),
        [otherUserUnreadKey]: (conversation[otherUserUnreadKey] || 0) + 1,
        [isParticipant1 ? 'participant_1_typing' : 'participant_2_typing']: false
      });

      // Update sender's message stats (batched)
      const users = await base44.entities.User.filter({ email: currentUser.email });
      if (users[0]) {
        await base44.entities.User.update(users[0].id, {
          total_messages_sent: (users[0].total_messages_sent || 0) + 1,
          messaging_points: (users[0].messaging_points || 0) + 1,
          last_message_date: new Date().toISOString().split('T')[0]
        });
      }

      // Create notification (non-blocking)
      base44.entities.Notification.create({
        user_email: otherUser.email,
        type: "message",
        title: "💬 New Message",
        message: `${currentUser.full_name || currentUser.email}: ${lastMessagePreview}`,
        link_url: createPageUrl("Messages"),
        priority: "normal",
        related_id: conversation.id,
        related_entity_type: "conversation"
      }).catch(err => console.error('Failed to create notification:', err));

      return newMessage;
    },
    onMutate: async (messageData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['messages', conversation.id] });
      
      // Get previous messages
      const previousMessages = queryClient.getQueryData(['messages', conversation.id]) || [];
      
      // Create optimistic message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        receiver_email: otherUser.email,
        content: messageData.content || messageText.trim(),
        is_read: false,
        message_type: messageData.message_type || "text",
        attachment_url: messageData.attachment_url,
        attachment_name: messageData.attachment_name,
        attachment_size: messageData.attachment_size,
        created_date: new Date().toISOString(),
        is_optimistic: true
      };
      
      // Update cache with optimistic message
      queryClient.setQueryData(['messages', conversation.id], [...previousMessages, optimisticMessage]);
      
      return { previousMessages };
    },
    onSuccess: () => {
      refetchMessages();
      onMessageSent();
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error, messageData, context) => {
      console.error('Failed to send message:', error);
      // Revert optimistic update on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversation.id], context.previousMessages);
      }
      toast.error("Failed to send message");
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    } else if (messageText.trim()) {
      sendMessageMutation.mutate({ content: messageText.trim() });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#1a1a2e]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden text-gray-300 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to={createPageUrl("UserProfile", `email=${otherUser.email}`)}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  {/* Online indicator */}
                  {isOtherUserOnline() && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">{otherUser.name}</div>
                  <div className="text-xs text-gray-400">
                    {otherUserTyping ? (
                      <span className="text-[#9EFF00]">typing...</span>
                    ) : isOtherUserOnline() ? (
                      <span className="text-green-400">Online</span>
                    ) : otherUserData?.last_seen ? (
                      `Last seen ${format(new Date(otherUserData.last_seen), "MMM d 'at' h:mm a")}`
                    ) : (
                      "Click to view profile"
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0F1D35] border-white/10">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("UserProfile", `email=${otherUser.email}`)} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              {conversation.trip_id && (
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("TripDetails", `id=${conversation.trip_id}`)} className="cursor-pointer">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    View Trip
                  </Link>
                </DropdownMenuItem>
              )}
              {conversation.request_id && (
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("RequestDetails", `id=${conversation.request_id}`)} className="cursor-pointer">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    View Request
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwn = message.sender_email === currentUser.email;
            const showTime = index === 0 ||
              (new Date(message.created_date).getTime() - new Date(messages[index - 1].created_date).getTime() > 300000);

            return (
              <div key={message.id}>
                {showTime && (
                  <div className="text-center text-xs text-gray-500 mb-4">
                    {format(new Date(message.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 relative group ${
                        isOwn
                          ? 'bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A]'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {/* Image attachment */}
                      {message.message_type === 'image' && message.attachment_url && (
                        <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={message.attachment_url} 
                            alt="Attachment"
                            className="rounded-lg mb-2 max-w-full hover:opacity-90 transition-opacity cursor-pointer"
                          />
                        </a>
                      )}

                      {/* File attachment */}
                      {message.message_type === 'file' && message.attachment_url && (
                        <a 
                          href={message.attachment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors mb-2"
                        >
                          <FileText className="w-5 h-5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{message.attachment_name}</div>
                            <div className="text-xs opacity-70">{formatFileSize(message.attachment_size)}</div>
                          </div>
                          <Download className="w-4 h-4 flex-shrink-0" />
                        </a>
                      )}

                      {message.content && message.content !== "📎 Attachment" && (
                        <p className="break-words">{message.content}</p>
                      )}

                      {/* Helpful button */}
                      {!isOwn && !message.is_helpful && (
                        <button
                          onClick={() => markHelpfulMutation.mutate(message.id)}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={markHelpfulMutation.isPending}
                          title="Mark as helpful"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                            <ThumbsUp className="w-3 h-3 text-gray-400 hover:text-[#9EFF00]" />
                          </div>
                        </button>
                      )}

                      {message.is_helpful && !isOwn && (
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                          <ThumbsUp className="w-3 h-3 text-[#9EFF00] fill-[#9EFF00]" />
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.created_date), "h:mm a")}
                      </span>
                      {isOwn && (
                        message.is_read ? (
                          <CheckCheck className="w-3 h-3 text-blue-400" title="Read" />
                        ) : (
                          <Check className="w-3 h-3 text-gray-500" title="Sent" />
                        )
                      )}
                      {message.is_helpful && isOwn && (
                        <span className="text-xs text-[#9EFF00] ml-1">+2pts</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {otherUserTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-[#1a1a2e]">
        {/* File preview */}
        {selectedFile && (
          <div className="mb-2 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-5 h-5 text-blue-400" />
            ) : (
              <FileText className="w-5 h-5 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{selectedFile.name}</div>
              <div className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || sendMessageMutation.isPending}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            disabled={isUploading || sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={(!messageText.trim() && !selectedFile) || isUploading || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A]"
          >
            {isUploading || sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}