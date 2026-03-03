import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your CarryMatch AI assistant. I can help you with:\n• Tracking your shipments\n• Answering questions about our services\n• Resolving basic issues\n\nHow can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      // Check if message contains tracking code
      const trackingCodeMatch = userMessage.match(/[A-Z0-9]{8,12}/);
      let trackingContext = "";

      if (trackingCodeMatch) {
        const trackingCode = trackingCodeMatch[0];
        const shipments = await base44.entities.Shipment.filter({
          tracking_code: trackingCode
        });

        if (shipments.length > 0) {
          const shipment = shipments[0];
          trackingContext = `\n\nSHIPMENT DATA (use this to answer):\n- Tracking: ${shipment.tracking_code}\n- Status: ${shipment.status}\n- From: ${shipment.sender_city}, ${shipment.sender_country}\n- To: ${shipment.recipient_city}, ${shipment.recipient_country}\n- Recipient: ${shipment.recipient_name}\n- Created: ${format(new Date(shipment.created_date), "MMM d, yyyy")}`;
        }
      }

      // Build conversation history
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call LLM
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful customer support assistant for CarryMatch, a logistics and parcel delivery platform. Answer the user's question based on the conversation history and any shipment data provided.

CONVERSATION HISTORY:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

USER'S LATEST MESSAGE: ${userMessage}
${trackingContext}

INSTRUCTIONS:
- Be friendly, concise, and helpful
- If tracking data is provided, use it to give specific updates
- For complex issues or if you cannot help, say: "I'd like to connect you with our support team. Let me create a ticket for you."
- For FAQs about shipping, delivery times, or services, answer confidently
- Keep responses under 150 words

YOUR RESPONSE:`,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date()
      }]);
      setIsTyping(false);

      // Check if escalation is needed
      if (response.toLowerCase().includes("support team") || response.toLowerCase().includes("create a ticket")) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "system",
            content: "I've notified our support team. They'll reach out to you shortly via email or phone.",
            timestamp: new Date(),
            action: "escalated"
          }]);
        }, 1000);
      }
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again or contact support@carrymatch.com",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    sendMessageMutation.mutate(input);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="bg-[#1a1a2e] border-white/10 shadow-2xl overflow-hidden flex flex-col" style={{ height: '600px', maxHeight: '80vh' }}>
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">CarryMatch AI</h3>
                    <p className="text-xs text-white/80">Always here to help</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {message.role === "system" && (
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : message.role === "system"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          : "bg-white/10 text-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {format(message.timestamp, "h:mm a")}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your message..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Share your tracking code for instant updates
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}