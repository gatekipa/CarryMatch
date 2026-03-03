import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bell, Send } from "lucide-react";

export default function BulkNotifyDialog({ batch, shipments, vendor, onClose }) {
  const [template, setTemplate] = useState(
    `Your shipment is on batch {{batch_code}} from {{origin}} to {{destination}}. ETD: {{etd}}. Track at: {{tracking_url}}`
  );
  const [notifyType, setNotifyType] = useState("both");

  const sendNotificationsMutation = useMutation({
    mutationFn: async () => {
      const notifications = [];
      
      for (const shipment of shipments) {
        const message = template
          .replace(/{{batch_code}}/g, batch.code)
          .replace(/{{origin}}/g, `${batch.origin_city}, ${batch.origin_country}`)
          .replace(/{{destination}}/g, `${batch.destination_city}, ${batch.destination_country}`)
          .replace(/{{etd}}/g, batch.etd_at ? new Date(batch.etd_at).toLocaleDateString() : "TBD")
          .replace(/{{tracking_code}}/g, shipment.tracking_code)
          .replace(/{{tracking_url}}/g, `${window.location.origin}/track/${shipment.tracking_code}`);

        if (notifyType === "sender" || notifyType === "both") {
          notifications.push({
            to: shipment.sender_phone,
            message: `Hi ${shipment.sender_name}, ${message}`
          });
        }

        if (notifyType === "recipient" || notifyType === "both") {
          notifications.push({
            to: shipment.recipient_phone,
            message: `Hi ${shipment.recipient_name}, ${message}`
          });
        }
      }

      // Here you would integrate with your actual notification service
      return notifications.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully queued ${count} notifications!`);
      onClose();
    }
  });

  const previewMessage = template
    .replace(/{{batch_code}}/g, batch.code)
    .replace(/{{origin}}/g, `${batch.origin_city}, ${batch.origin_country}`)
    .replace(/{{destination}}/g, `${batch.destination_city}, ${batch.destination_country}`)
    .replace(/{{etd}}/g, batch.etd_at ? new Date(batch.etd_at).toLocaleDateString() : "TBD")
    .replace(/{{tracking_code}}/g, "XXX-12345")
    .replace(/{{tracking_url}}/g, `${window.location.origin}/track/XXX-12345`);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Bulk Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2">Notify</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setNotifyType("sender")}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  notifyType === "sender" ? "border-[#9EFF00] bg-[#9EFF00]/10" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <p className="text-white font-medium">Senders Only</p>
                <p className="text-xs text-gray-400">{shipments.length} recipients</p>
              </button>
              <button
                onClick={() => setNotifyType("recipient")}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  notifyType === "recipient" ? "border-[#9EFF00] bg-[#9EFF00]/10" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <p className="text-white font-medium">Recipients Only</p>
                <p className="text-xs text-gray-400">{shipments.length} recipients</p>
              </button>
              <button
                onClick={() => setNotifyType("both")}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  notifyType === "both" ? "border-[#9EFF00] bg-[#9EFF00]/10" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <p className="text-white font-medium">Both</p>
                <p className="text-xs text-gray-400">{shipments.length * 2} recipients</p>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2">Message Template</Label>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-2">
              Available variables: {"{"}{"{"} batch_code {"}"}{"}"},  {"{"}{"{"} origin {"}"}{"}"},  {"{"}{"{"} destination {"}"}{"}"},  {"{"}{"{"} etd {"}"}{"}"},  {"{"}{"{"} tracking_code {"}"}{"}"},  {"{"}{"{"} tracking_url {"}"}{"}"} 
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <Label className="text-gray-300 mb-2 block">Preview</Label>
            <p className="text-sm text-white">Hi [Name], {previewMessage}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={() => sendNotificationsMutation.mutate()}
            disabled={sendNotificationsMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendNotificationsMutation.isPending ? "Sending..." : `Send ${notifyType === "both" ? shipments.length * 2 : shipments.length} Notifications`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}