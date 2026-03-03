import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Ticket, Download, Share2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import TicketCard from "../components/bus/TicketCard";

export default function BusTicketConfirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("order");

  const { data: order } = useQuery({
    queryKey: ['order-confirmation', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['order-tickets', orderId],
    queryFn: () => base44.entities.Ticket.filter({ order_id: orderId }),
    enabled: !!orderId
  });

  const { data: orderSeats = [] } = useQuery({
    queryKey: ['order-seats', orderId],
    queryFn: () => base44.entities.OrderSeat.filter({ order_id: orderId }),
    enabled: !!orderId
  });

  const shareOnWhatsApp = () => {
    const message = `🎟️ Bus Ticket Confirmation\n\n` +
      `Passenger: ${order.passenger_name}\n` +
      `Seats: ${orderSeats.map(s => s.seat_code).join(', ')}\n` +
      `Tickets: ${tickets.map(t => t.ticket_code).join(', ')}\n\n` +
      `Show this at the station. Safe travels! 🚌`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!order || tickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Success Message */}
          <Card className="p-12 bg-white/5 border-white/10 text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Booking Confirmed! 🎉</h1>
            <p className="text-xl text-gray-300 mb-4">
              Your bus ticket has been booked successfully
            </p>
            <Card className="p-3 bg-blue-500/10 border-blue-500/30 inline-block">
              <p className="text-sm text-blue-300 font-medium">
                📱 Show this ticket at boarding
              </p>
            </Card>
            <div className="mt-6"></div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={shareOnWhatsApp} variant="outline" className="border-white/10">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Link to={createPageUrl("TrackMyBus", `ticket=${tickets[0]?.ticket_code}`)}>
                <Button variant="outline" className="border-purple-500/30 text-purple-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  Track Bus
                </Button>
              </Link>
              <Link to={createPageUrl("MyBusTickets")}>
                <Button className="bg-blue-500">
                  <Ticket className="w-4 h-4 mr-2" />
                  My Tickets
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tickets */}
          <div className="space-y-4">
            {tickets.map(ticket => {
              const seat = orderSeats.find(s => s.seat_code === ticket.ticket_code.slice(-2));
              return (
                <TicketCard 
                  key={ticket.id}
                  ticket={ticket}
                  order={order}
                  seatCode={seat?.seat_code}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}