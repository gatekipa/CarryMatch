import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bus, Calendar, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ShareTicketButton from "./ShareTicketButton";
import RateTrip from "./RateTrip";

export default function TicketCard({ ticket, order, seatCode }) {
  const [showRating, setShowRating] = useState(false);
  
  const { data: trip } = useQuery({
    queryKey: ['ticket-trip', order.trip_id],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: order.trip_id });
      return trips[0];
    }
  });

  const { data: route } = useQuery({
    queryKey: ['ticket-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: operator } = useQuery({
    queryKey: ['ticket-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const { data: departureBranch } = useQuery({
    queryKey: ['ticket-branch', trip?.departure_branch_id],
    queryFn: async () => {
      if (!trip.departure_branch_id) return null;
      const branches = await base44.entities.OperatorBranch.filter({ id: trip.departure_branch_id });
      return branches[0];
    },
    enabled: !!trip?.departure_branch_id
  });

  const { data: purchaseTemplate } = useQuery({
    queryKey: ['purchase-template', operator?.id],
    queryFn: async () => {
      const templates = await base44.entities.MessageTemplate.filter({
        operator_id: operator.id,
        template_type: "purchase"
      });
      return templates[0];
    },
    enabled: !!operator
  });

  const { data: existingRating } = useQuery({
    queryKey: ['trip-rating', trip?.id, order?.user_id],
    queryFn: async () => {
      const ratings = await base44.entities.TripRating.filter({
        trip_id: trip.id,
        user_id: order.user_id
      });
      return ratings[0];
    },
    enabled: !!trip && !!order
  });

  const isPastTrip = trip && new Date(trip.departure_datetime) < new Date();
  const tripCompleted = trip?.trip_status === 'completed';
  const canRate = (isPastTrip || tripCompleted) && !existingRating && !showRating;

  if (!trip || !route || !operator) {
    return <div className="animate-pulse h-64 bg-white/5 rounded-lg" />;
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_payload)}`;

  if (showRating && trip && operator && route) {
    return (
      <RateTrip
        trip={trip}
        operator={operator}
        route={route}
        order={order}
        onComplete={() => setShowRating(false)}
      />
    );
  }

  return (
    <Card className="overflow-hidden bg-white/5 border-white/10">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {operator.logo_url ? (
              <img src={operator.logo_url} alt={operator.name} className="w-12 h-12 rounded-lg bg-white object-cover" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-white">{operator.name}</h3>
              <p className="text-xs text-white/80">Ticket #{ticket.ticket_code}</p>
            </div>
          </div>
          <Badge className={
            ticket.checkin_status === 'checked_in' 
              ? 'bg-green-500 text-white' 
              : 'bg-white/20 text-white'
          }>
            {ticket.checkin_status === 'checked_in' ? 'Checked In' : 'Not Checked In'}
          </Badge>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-3 gap-6">
        {/* Trip Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">FROM</div>
              <div className="font-bold text-white">{route.origin_city}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">TO</div>
              <div className="font-bold text-white">{route.destination_city}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{format(new Date(trip.departure_datetime), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Bus className="w-4 h-4 text-purple-400" />
              <span className="text-sm">{format(new Date(trip.departure_datetime), "HH:mm")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <User className="w-4 h-4 text-green-400" />
            <span className="text-sm">{order.passenger_name}</span>
          </div>

          {departureBranch && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="text-sm">{departureBranch.branch_name}, {departureBranch.city}</span>
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-gray-500 mb-1">SEAT NUMBER</div>
            <div className="text-3xl font-bold text-blue-400">{seatCode}</div>
          </div>
          
          <Card className="p-3 bg-blue-500/10 border-blue-500/30">
            <p className="text-xs text-blue-300 text-center font-medium">
              📱 Show this ticket when boarding
            </p>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <ShareTicketButton
              ticket={ticket}
              order={order}
              trip={trip}
              route={route}
              operator={operator}
              template={purchaseTemplate?.content_text}
            />
            {trip.trip_status === 'departed' && (
              <Link to={createPageUrl("TrackMyBus", `ticket=${ticket.ticket_code}`)}>
                <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400">
                  <MapPin className="w-3 h-3 mr-1" />
                  Track Bus
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white p-3 rounded-lg">
            <img src={qrCodeUrl} alt="Ticket QR" className="w-32 h-32" />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">Scan at check-in</p>
        </div>
      </div>

      {/* Rating Prompt */}
      {canRate && (
        <div className="border-t border-white/10 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">How was your trip?</p>
              <p className="text-xs text-gray-400">Share your experience</p>
            </div>
            <button
              onClick={() => setShowRating(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg text-white font-medium text-sm hover:shadow-lg transition-all"
            >
              Rate Trip
            </button>
          </div>
        </div>
      )}

      {existingRating && (
        <div className="border-t border-white/10 p-4 bg-green-500/10">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓ You rated this trip {existingRating.rating}/5</span>
          </div>
        </div>
      )}
    </Card>
  );
}