import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Ticket, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import TicketCard from "../components/bus/TicketCard";

export default function MyBusTickets() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-bus-orders', user?.email],
    queryFn: async () => {
      return await base44.entities.Order.filter({
        user_id: user.email,
        channel: "online"
      }, "-created_date");
    },
    enabled: !!user
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ['my-bus-tickets', orders.map(o => o.id)],
    queryFn: async () => {
      if (!orders.length) return [];
      return await base44.entities.Ticket.filter({
        order_id: { $in: orders.map(o => o.id) }
      });
    },
    enabled: orders.length > 0
  });

  const { data: allOrderSeats = [] } = useQuery({
    queryKey: ['my-order-seats', orders.map(o => o.id)],
    queryFn: async () => {
      if (!orders.length) return [];
      return await base44.entities.OrderSeat.filter({
        order_id: { $in: orders.map(o => o.id) }
      });
    },
    enabled: orders.length > 0
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['ticket-trips', orders.map(o => o.trip_id)],
    queryFn: async () => {
      if (!orders.length) return [];
      return await base44.entities.Trip.filter({
        id: { $in: orders.map(o => o.trip_id) }
      });
    },
    enabled: orders.length > 0
  });

  const upcomingOrders = orders.filter(order => {
    const trip = allTrips.find(t => t.id === order.trip_id);
    return trip && new Date(trip.departure_datetime) > new Date();
  });

  const pastOrders = orders.filter(order => {
    const trip = allTrips.find(t => t.id === order.trip_id);
    return trip && new Date(trip.departure_datetime) <= new Date();
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
          <button onClick={() => base44.auth.redirectToLogin()} className="text-blue-400 hover:underline">
            Sign in to view tickets
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">My Bus Tickets</h1>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5">
            <TabsTrigger value="upcoming">Upcoming ({upcomingOrders.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingOrders.length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Upcoming Tickets</h3>
                <p className="text-gray-400">Book a bus ticket to see it here</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingOrders.map(order => {
                  const orderTickets = allTickets.filter(t => t.order_id === order.id);
                  const orderSeatsList = allOrderSeats.filter(s => s.order_id === order.id);
                  
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      {orderTickets.map(ticket => {
                        const seat = orderSeatsList.find(s => s.order_id === ticket.order_id);
                        return (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            order={order}
                            seatCode={seat?.seat_code}
                          />
                        );
                      })}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastOrders.length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Past Tickets</h3>
                <p className="text-gray-400">Your travel history will appear here</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastOrders.map(order => {
                  const orderTickets = allTickets.filter(t => t.order_id === order.id);
                  const orderSeatsList = allOrderSeats.filter(s => s.order_id === order.id);
                  
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      {orderTickets.map(ticket => {
                        const seat = orderSeatsList.find(s => s.order_id === ticket.order_id);
                        return (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            order={order}
                            seatCode={seat?.seat_code}
                          />
                        );
                      })}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}