import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Search, QrCode, User, Phone, Calendar, MapPin, AlertTriangle, Lock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PassengerAutocomplete from "../components/bus/PassengerAutocomplete";
import AgentLockScreen from "../components/bus/AgentLockScreen";
import AgentSessionBar from "../components/bus/AgentSessionBar";
import StartSessionDialog from "../components/bus/StartSessionDialog";
import { useAgentSession } from "../components/bus/useAgentSession";
import { useBusVendorPermissions } from "../components/bus/useBusVendorPermissions";

export default function VendorBusCheckin() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("ticket_code"); // ticket_code or phone
  const [foundTicket, setFoundTicket] = useState(null);
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['checkin-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const permissions = useBusVendorPermissions(user, operator);
  const agentSession = useAgentSession(user, operator);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-checkin', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: order } = useQuery({
    queryKey: ['ticket-order', foundTicket?.order_id],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: foundTicket.order_id });
      return orders[0];
    },
    enabled: !!foundTicket
  });

  const { data: trip } = useQuery({
    queryKey: ['ticket-trip', order?.trip_id],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: order.trip_id });
      return trips[0];
    },
    enabled: !!order
  });

  const { data: route } = useQuery({
    queryKey: ['ticket-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: orderSeats = [] } = useQuery({
    queryKey: ['ticket-seats', foundTicket?.order_id],
    queryFn: () => base44.entities.OrderSeat.filter({ order_id: foundTicket.order_id }),
    enabled: !!foundTicket
  });

  const searchMutation = useMutation({
    mutationFn: async ({ query, type }) => {
      if (type === "ticket_code") {
        const tickets = await base44.entities.Ticket.filter({ ticket_code: query.toUpperCase() });
        if (tickets.length === 0) throw new Error("Ticket not found");
        return tickets[0];
      } else {
        // Search by phone
        const orders = await base44.entities.Order.filter({ passenger_phone: query });
        if (orders.length === 0) throw new Error("No tickets found for this phone number");
        
        // Get tickets for the most recent order
        const latestOrder = orders.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        )[0];
        
        const tickets = await base44.entities.Ticket.filter({ order_id: latestOrder.id });
        if (tickets.length === 0) throw new Error("No tickets found");
        return tickets[0];
      }
    },
    onSuccess: (ticket) => {
      setFoundTicket(ticket);
    },
    onError: (error) => {
      toast.error(error.message);
      setFoundTicket(null);
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      // Validation checks
      if (foundTicket.checkin_status === "checked_in") {
        throw new Error("Ticket already checked in");
      }

      if (order.order_status === "canceled" || order.order_status === "refunded") {
        throw new Error(`Ticket has been ${order.order_status}`);
      }

      // Check if trip is for this operator
      if (trip.operator_id !== operator.id) {
        throw new Error("This ticket is for a different operator");
      }

      // Check if trip date matches today
      const tripDate = new Date(trip.departure_datetime);
      const today = new Date();
      if (tripDate.toDateString() !== today.toDateString()) {
        const daysDiff = Math.floor((tripDate - today) / (1000 * 60 * 60 * 24));
        if (daysDiff > 0) {
          throw new Error(`This trip is scheduled for ${format(tripDate, "MMM d")} (${daysDiff} days from now)`);
        } else {
          throw new Error(`This trip was scheduled for ${format(tripDate, "MMM d")} (${Math.abs(daysDiff)} days ago)`);
        }
      }

      // Perform check-in
      await base44.entities.Ticket.update(foundTicket.id, {
        checkin_status: "checked_in",
        checkin_time: new Date().toISOString(),
        checked_in_by_user_id: user.email
      });

      // Create audit log
      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: operator.id,
        action_type: "passenger_checked_in",
        entity_type: "Ticket",
        entity_id: foundTicket.id,
        payload_json: {
          ticket_code: foundTicket.ticket_code,
          order_id: foundTicket.order_id,
          trip_id: order.trip_id,
          passenger_name: order.passenger_name
        }
      });

      return foundTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-order'] });
      toast.success("✅ Passenger checked in successfully!");
      // Keep ticket visible for confirmation
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchMutation.mutate({ query: searchQuery.trim(), type: searchType });
  };

  const getSeatCode = () => {
    if (!orderSeats.length) return "N/A";
    return orderSeats.map(s => s.seat_code).join(", ");
  };

  // Require session for check-in staff
  useEffect(() => {
    if (permissions.isCheckin && !agentSession.hasActiveSession && !showStartSessionDialog) {
      setShowStartSessionDialog(true);
    }
  }, [permissions.isCheckin, agentSession.hasActiveSession]);

  if (agentSession.isLocked) {
    return <AgentLockScreen onUnlock={agentSession.unlock} />;
  }

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Passenger Check-In</h1>
          {agentSession.staff && (
            <Button
              variant="outline"
              size="sm"
              onClick={agentSession.lock}
              className="border-white/10"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock Screen
            </Button>
          )}
        </div>

        {agentSession.activeSession && (
          <AgentSessionBar
            session={agentSession.activeSession}
            branch={agentSession.sessionBranch}
            staff={agentSession.staff}
            onLock={agentSession.lock}
            onEndSession={() => {
              if (confirm("End your shift?")) {
                agentSession.endSession();
                agentSession.lock();
              }
            }}
          />
        )}

        {/* Search Form */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Search By</Label>
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  onClick={() => setSearchType("ticket_code")}
                  variant={searchType === "ticket_code" ? "default" : "outline"}
                  className={searchType === "ticket_code" ? "bg-blue-500" : "border-white/10"}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ticket Code
                </Button>
                <Button
                  type="button"
                  onClick={() => setSearchType("phone")}
                  variant={searchType === "phone" ? "default" : "outline"}
                  className={searchType === "phone" ? "bg-blue-500" : "border-white/10"}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              {searchType === "phone" ? (
                <PassengerAutocomplete
                  operatorId={operator.id}
                  value={searchQuery}
                  onSelect={(profile, phone) => {
                    setSearchQuery(phone);
                  }}
                  placeholder="Enter phone number"
                />
              ) : (
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter ticket code"
                  className="bg-white/5 border-white/10 text-white text-lg"
                  autoFocus
                />
              )}
              <Button type="submit" disabled={searchMutation.isPending} className="bg-blue-500">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </Card>

        {/* Ticket Details */}
        {foundTicket && order && trip && route && (
          <Card className="p-6 bg-white/5 border-white/10">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-6">
              <Badge className={
                foundTicket.checkin_status === "checked_in"
                  ? "bg-green-500/20 text-green-400 text-lg px-4 py-2"
                  : "bg-yellow-500/20 text-yellow-400 text-lg px-4 py-2"
              }>
                {foundTicket.checkin_status === "checked_in" ? "✓ CHECKED IN" : "AWAITING CHECK-IN"}
              </Badge>
              <span className="text-gray-400 text-sm">#{foundTicket.ticket_code}</span>
            </div>

            {/* Passenger Info */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Passenger Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{order.passenger_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-green-400" />
                  <span>{order.passenger_phone}</span>
                </div>
              </div>
            </div>

            {/* Trip Info */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Trip Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Route</span>
                  <span className="text-white font-medium">{route.origin_city} → {route.destination_city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Departure</span>
                  <span className="text-white">{format(new Date(trip.departure_datetime), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Seat(s)</span>
                  <span className="text-white font-bold text-2xl">{getSeatCode()}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white font-medium">{order.amount_xaf.toLocaleString()} XAF</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Payment Method</span>
                <span className="text-white uppercase">{order.payment_provider}</span>
              </div>
            </div>

            {/* Check-in Info */}
            {foundTicket.checkin_status === "checked_in" && (
              <Card className="p-4 bg-green-500/10 border-green-500/30 mb-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Already Checked In</span>
                </div>
                <div className="text-sm text-gray-300">
                  {foundTicket.checkin_time && (
                    <div>Checked in at {format(new Date(foundTicket.checkin_time), "h:mm a")}</div>
                  )}
                  {foundTicket.checked_in_by_user_id && (
                    <div>By: {foundTicket.checked_in_by_user_id}</div>
                  )}
                </div>
              </Card>
            )}

            {/* Validation Warnings */}
            {order.order_status === "canceled" && (
              <Card className="p-4 bg-red-500/10 border-red-500/30 mb-4">
                <div className="flex items-center gap-2 text-red-400">
                  <X className="w-5 h-5" />
                  <span className="font-semibold">Ticket Canceled</span>
                </div>
              </Card>
            )}

            {trip.operator_id !== operator.id && (
              <Card className="p-4 bg-orange-500/10 border-orange-500/30 mb-4">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Wrong Operator</span>
                </div>
              </Card>
            )}

            {/* Check-in Button */}
            {foundTicket.checkin_status !== "checked_in" && 
             order.order_status === "paid" && 
             trip.operator_id === operator.id && (
              <Button
                onClick={() => checkinMutation.mutate()}
                disabled={checkinMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-xl py-8"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                {checkinMutation.isPending ? "Processing..." : "Check In Passenger"}
              </Button>
            )}

            {/* New Search Button */}
            <Button
              onClick={() => {
                setFoundTicket(null);
                setSearchQuery("");
              }}
              variant="outline"
              className="w-full mt-3 border-white/10"
            >
              Search Another Ticket
            </Button>
          </Card>
        )}

        {/* Start Session Dialog */}
        <StartSessionDialog
          open={showStartSessionDialog}
          onClose={() => {
            if (agentSession.hasActiveSession) {
              setShowStartSessionDialog(false);
            }
          }}
          branches={branches}
          onStart={(data) => {
            agentSession.startSession(data);
            setShowStartSessionDialog(false);
          }}
          isPending={agentSession.isStartingSession}
        />
      </div>
    </div>
  );
}