import React from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { format } from "date-fns";

export default function ShareTicketButton({ ticket, order, trip, route, operator, template }) {
  const fillTemplate = () => {
    if (!template) {
      return `Hi! Your ticket is confirmed for ${route.origin_city} → ${route.destination_city} on ${format(new Date(trip.departure_datetime), "MMM d, yyyy 'at' h:mm a")}. Ticket: ${ticket.ticket_code}`;
    }

    return template
      .replace(/{passenger_name}/g, order.passenger_name)
      .replace(/{route}/g, `${route.origin_city} → ${route.destination_city}`)
      .replace(/{date}/g, format(new Date(trip.departure_datetime), "MMM d, yyyy"))
      .replace(/{time}/g, format(new Date(trip.departure_datetime), "h:mm a"))
      .replace(/{seat}/g, ticket.seat_code || "N/A")
      .replace(/{ticket_code}/g, ticket.ticket_code)
      .replace(/{branch}/g, trip.departure_branch_name || "Main Station")
      .replace(/{operator_phone}/g, operator.phone || "")
      .replace(/{operator_name}/g, operator.name);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(fillTemplate());
    const url = `https://wa.me/${order.passenger_phone.replace(/\D/g, '')}?text=${message}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(fillTemplate());
    window.location.href = `sms:${order.passenger_phone}?body=${message}`;
  };

  return (
    <div className="flex gap-2">
      <Button onClick={shareViaWhatsApp} size="sm" variant="outline" className="border-green-500/30 text-green-400">
        <Share2 className="w-3 h-3 mr-2" />
        WhatsApp
      </Button>
      <Button onClick={shareViaSMS} size="sm" variant="outline" className="border-blue-500/30 text-blue-400">
        <Share2 className="w-3 h-3 mr-2" />
        SMS
      </Button>
    </div>
  );
}