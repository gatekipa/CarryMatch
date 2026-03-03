import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_TO_TEMPLATE = {
  'RECEIVED': 'shipment_received',
  'IN_TRANSIT': 'in_transit',
  'SHIPPED': 'in_transit',
  'OUT_FOR_DELIVERY': 'out_for_delivery',
  'DELIVERED': 'delivered',
  'DELAYED': 'delayed',
  'ON_HOLD': 'on_hold',
  'CUSTOMS': 'customs_clearance',
  'READY_PICKUP': 'ready_pickup'
};

export default function NotificationTrigger({ shipment, compact = false }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  const sendNotificationMutation = useMutation({
    mutationFn: async (templateType) => {
      const response = await base44.functions.invoke('sendShipmentNotification', {
        shipment_id: shipment.id,
        template_type: templateType,
        manual_trigger: true
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.skipped) {
        toast.info(data.error || "No template configured");
      } else {
        toast.success(data.message);
        queryClient.invalidateQueries(['notification-logs']);
      }
      setShowDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to send: " + error.message);
    }
  });

  const templateType = STATUS_TO_TEMPLATE[shipment.status];

  if (compact) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (templateType) {
            sendNotificationMutation.mutate(templateType);
          } else {
            toast.info("No notification template for this status");
          }
        }}
        disabled={!templateType || sendNotificationMutation.isPending}
        className="border-white/10"
      >
        {sendNotificationMutation.isPending ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Bell className="w-3 h-3 mr-1" />
        )}
        Notify
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="border-white/10"
      >
        <Bell className="w-4 h-4 mr-2" />
        Send Notification
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0F1D35] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Send Customer Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Shipment:</p>
              <p className="text-white font-mono font-semibold">{shipment.tracking_code}</p>
              <Badge className="mt-2 bg-blue-500/20 text-blue-400">
                {shipment.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Will notify:</p>
              <div className="space-y-1 text-sm">
                {shipment.sender_phone && (
                  <p className="text-gray-300">📞 Sender: {shipment.sender_phone}</p>
                )}
                {shipment.recipient_phone && (
                  <p className="text-gray-300">📞 Recipient: {shipment.recipient_phone}</p>
                )}
              </div>
            </div>

            {templateType ? (
              <Button
                onClick={() => sendNotificationMutation.mutate(templateType)}
                disabled={sendNotificationMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {sendNotificationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                <p className="text-sm text-yellow-300">No template configured for this status</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}