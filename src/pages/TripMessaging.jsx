import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TripMessaging() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  
  const [user, setUser] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [messageContent, setMessageContent] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: trip } = useQuery({
    queryKey: ['msg-trip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId
  });

  const { data: operator } = useQuery({
    queryKey: ['msg-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const { data: route } = useQuery({
    queryKey: ['msg-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['trip-templates', operator?.id],
    queryFn: () => base44.entities.MessageTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: passengers = [] } = useQuery({
    queryKey: ['trip-passengers', tripId],
    queryFn: async () => {
      const onlineOrders = await base44.entities.Order.filter({
        trip_id: tripId,
        order_status: "paid"
      });

      const offlineSales = await base44.entities.OfflineSale.filter({
        trip_id: tripId
      });

      return [
        ...onlineOrders.map(o => ({ name: o.passenger_name, phone: o.passenger_phone, type: "online" })),
        ...offlineSales.map(s => ({ name: s.passenger_name, phone: s.passenger_phone, type: "offline" }))
      ];
    },
    enabled: !!tripId
  });

  const sendMessagesMutation = useMutation({
    mutationFn: async () => {
      const message = messageContent
        .replace(/{route}/g, `${route.origin_city} → ${route.destination_city}`)
        .replace(/{date}/g, format(new Date(trip.departure_datetime), "MMM d, yyyy"))
        .replace(/{time}/g, format(new Date(trip.departure_datetime), "h:mm a"))
        .replace(/{operator_phone}/g, operator.phone || "")
        .replace(/{operator_name}/g, operator.name);

      // In production, this would trigger actual SMS/WhatsApp sends
      // For now, we'll just log it
      passengers.forEach(p => {
        const personalizedMsg = message.replace(/{passenger_name}/g, p.name);
        console.log(`Would send to ${p.phone}: ${personalizedMsg}`);
      });

      return { sent: passengers.length };
    },
    onSuccess: (data) => {
      toast.success(`Prepared ${data.sent} message(s) - Check console for preview`);
    }
  });

  const handleTemplateSelect = (templateType) => {
    const template = templates.find(t => t.template_type === templateType);
    if (template) {
      setMessageContent(template.content_text);
      setSelectedTemplate(templateType);
    }
  };

  if (!trip || !operator || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Send Trip Messages</h1>
          <p className="text-gray-400">{route.origin_city} → {route.destination_city}</p>
          <p className="text-sm text-gray-500">{format(new Date(trip.departure_datetime), "MMM d, yyyy 'at' h:mm a")}</p>
        </div>

        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">Recipients</span>
          </div>
          <div className="text-3xl font-bold text-white">{passengers.length} passengers</div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <Label className="text-gray-300 mb-3 block">Use Template</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Choose a template or write custom message" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boarding_reminder">Boarding Reminder</SelectItem>
              <SelectItem value="time_update">Time Update</SelectItem>
              <SelectItem value="cancel">Cancellation</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <Label className="text-gray-300 mb-3 block">Message Content</Label>
          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={6}
            placeholder="Write your message or select a template above..."
            className="bg-white/5 border-white/10 text-white font-mono text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {["{passenger_name}", "{route}", "{date}", "{time}", "{operator_phone}"].map(ph => (
              <Badge key={ph} className="bg-blue-500/20 text-blue-300 font-mono text-xs cursor-pointer"
                onClick={() => setMessageContent(messageContent + ph)}>
                {ph}
              </Badge>
            ))}
          </div>
        </Card>

        <Button
          onClick={() => sendMessagesMutation.mutate()}
          disabled={!messageContent || sendMessagesMutation.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-lg py-6"
        >
          <Send className="w-5 h-5 mr-2" />
          {sendMessagesMutation.isPending ? "Sending..." : `Send to ${passengers.length} Passengers`}
        </Button>

        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mt-6">
          <p className="text-yellow-300 text-sm">
            💡 Messages will be sent via WhatsApp when available, otherwise SMS
          </p>
        </Card>
      </div>
    </div>
  );
}