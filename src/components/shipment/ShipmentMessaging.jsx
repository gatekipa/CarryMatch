import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ShipmentMessaging({ shipment, vendor, vendorStaff }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['shipment-messages', shipment.id],
    queryFn: async () => {
      return await base44.entities.ShipmentMessage.filter({
        shipment_id: shipment.id
      }, '-created_date');
    },
    refetchInterval: 5000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.ShipmentMessage.create({
        shipment_id: shipment.id,
        tracking_code: shipment.tracking_code,
        vendor_id: vendor.id,
        sender_type: 'VENDOR',
        sender_name: vendorStaff.full_name,
        sender_email: vendorStaff.email,
        recipient_type: 'CUSTOMER',
        recipient_name: shipment.recipient_name,
        recipient_email: shipment.recipient_email,
        recipient_phone: shipment.recipient_phone,
        message: message,
        status: 'SENT'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-messages'] });
      setMessage("");
      toast.success("Message sent to customer!");
    }
  });

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Customer Communication</h3>
      </div>

      <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.sender_type === 'VENDOR'
                  ? 'bg-blue-500/10 border border-blue-500/30 ml-8'
                  : 'bg-green-500/10 border border-green-500/30 mr-8'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-semibold text-white">
                    {msg.sender_name}
                  </span>
                  <Badge className={`text-xs ${
                    msg.sender_type === 'VENDOR' 
                      ? 'bg-blue-500/20 text-blue-300' 
                      : 'bg-green-500/20 text-green-300'
                  }`}>
                    {msg.sender_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {format(new Date(msg.created_date), "MMM d, h:mm a")}
                </div>
              </div>
              <p className="text-sm text-gray-300">{msg.message}</p>
              {msg.status === 'READ' && (
                <p className="text-xs text-gray-500 mt-1">✓ Read</p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to the customer..."
          className="bg-white/5 border-white/10 text-white"
          rows={3}
        />
        <Button
          onClick={() => sendMessageMutation.mutate()}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
        </Button>
        <p className="text-xs text-gray-500">
          Customer will receive this via email and can reply directly
        </p>
      </div>
    </Card>
  );
}