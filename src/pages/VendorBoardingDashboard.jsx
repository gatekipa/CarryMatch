import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bus, CheckCircle, Clock, Users, Search, Printer, FileText, Send, AlertTriangle, X, QrCode, Phone, User, Ticket, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useBusVendorPermissions } from "../components/bus/useBusVendorPermissions";

export default function VendorBoardingDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [ticketCodeInput, setTicketCodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [reminderType, setReminderType] = useState("reminder");
  const [customReminderMessage, setCustomReminderMessage] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['boarding-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const permissions = useBusVendorPermissions(user, operator);

  const { data: trip } = useQuery({
    queryKey: ['boarding-trip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
    refetchInterval: 10000
  });

  const { data: route } = useQuery({
    queryKey: ['boarding-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: branch } = useQuery({
    queryKey: ['boarding-branch', trip?.departure_branch_id],
    queryFn: async () => {
      if (!trip.departure_branch_id) return null;
      const branches = await base44.entities.OperatorBranch.filter({ id: trip.departure_branch_id });
      return branches[0];
    },
    enabled: !!trip?.departure_branch_id
  });

  const { data: seatInventory = [] } = useQuery({
    queryKey: ['boarding-inventory', tripId],
    queryFn: () => base44.entities.TripSeatInventory.filter({ trip_id: tripId }),
    enabled: !!tripId,
    refetchInterval: 5000
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['boarding-orders', tripId],
    queryFn: () => base44.entities.Order.filter({ trip_id: tripId, order_status: "paid" }),
    enabled: !!tripId,
    refetchInterval: 5000
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['boarding-tickets', orders.map(o => o.id)],
    queryFn: async () => {
      if (!orders.length) return [];
      return await base44.entities.Ticket.filter({ order_id: { $in: orders.map(o => o.id) } });
    },
    enabled: orders.length > 0,
    refetchInterval: 5000
  });

  const { data: offlineSales = [] } = useQuery({
    queryKey: ['boarding-offline', tripId],
    queryFn: () => base44.entities.OfflineSale.filter({ trip_id: tripId }),
    enabled: !!tripId,
    refetchInterval: 5000
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['all-operator-branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const checkInMutation = useMutation({
    mutationFn: async (ticketCode) => {
      const ticket = tickets.find(t => t.ticket_code.toUpperCase() === ticketCode.toUpperCase());
      if (!ticket) {
        throw new Error("Ticket not found");
      }

      if (ticket.checkin_status === 'checked_in') {
        throw new Error("Already checked in");
      }

      await base44.entities.Ticket.update(ticket.id, {
        checkin_status: 'checked_in',
        checkin_time: new Date().toISOString(),
        checked_in_by_user_id: user.email
      });

      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: operator.id,
        action_type: "passenger_checked_in",
        entity_type: "Ticket",
        entity_id: ticket.id,
        payload_json: {
          trip_id: tripId,
          ticket_code: ticketCode,
          checkin_time: new Date().toISOString()
        }
      });

      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries(['boarding-tickets']);
      toast.success(`✓ ${ticket.ticket_code} checked in!`);
      setTicketCodeInput("");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const undoCheckInMutation = useMutation({
    mutationFn: async (ticketId) => {
      await base44.entities.Ticket.update(ticketId, {
        checkin_status: 'not_checked_in',
        checkin_time: null,
        checked_in_by_user_id: null
      });

      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: operator.id,
        action_type: "undo_checkin",
        entity_type: "Ticket",
        entity_id: ticketId,
        payload_json: {
          trip_id: tripId
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['boarding-tickets']);
      toast.success("Check-in undone");
    }
  });

  const updateTripStatusMutation = useMutation({
    mutationFn: ({ status }) => base44.entities.Trip.update(tripId, { trip_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['boarding-trip']);
      toast.success("Trip status updated!");
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ template_type }) => {
      const response = await base44.functions.invoke('sendTemplateMessage', {
        trip_id: tripId,
        template_type: template_type,
        recipient_filter: 'not_checked_in_only',
        manual_send: true,
        actor_user_id: user.email
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Sent to ${data.recipients_count} ${data.recipients_count === 1 ? 'passenger' : 'passengers'}!`);
      setShowReminderModal(false);
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    }
  });

  const sendDelayMutation = useMutation({
    mutationFn: async ({ delayMinutes, reason }) => {
      const newDeparture = new Date(trip.departure_datetime);
      newDeparture.setMinutes(newDeparture.getMinutes() + parseInt(delayMinutes));
      
      const response = await base44.functions.invoke('sendDelayNotice', {
        trip_id: tripId,
        new_departure_time: newDeparture.toISOString(),
        delay_reason: reason,
        delay_minutes: parseInt(delayMinutes)
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['boarding-trip']);
      toast.success(data.message);
      setShowDelayModal(false);
      setDelayMinutes("");
      setDelayReason("");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    }
  });

  const sendCancelMutation = useMutation({
    mutationFn: async (reason) => {
      const response = await base44.functions.invoke('sendCancelNotice', {
        trip_id: tripId,
        cancel_reason: reason
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['boarding-trip']);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    }
  });

  const handleQuickCheckIn = (e) => {
    e.preventDefault();
    if (ticketCodeInput.length >= 6) {
      checkInMutation.mutate(ticketCodeInput);
    }
  };

  const handleSendReminder = () => {
    const templateTypeMap = {
      'reminder': 'reminder_60',
      'last_call': 'reminder_30',
      'boarding_open': 'boarding_open'
    };
    
    sendReminderMutation.mutate({
      template_type: templateTypeMap[reminderType]
    });
  };

  // Build passenger list
  const passengers = [];
  
  tickets.forEach(ticket => {
    const order = orders.find(o => o.id === ticket.order_id);
    if (order) {
      passengers.push({
        id: ticket.id,
        seat_code: ticket.ticket_code.slice(-2),
        name: order.passenger_name,
        phone: order.passenger_phone,
        ticket_code: ticket.ticket_code,
        channel: "Online",
        checkin_status: ticket.checkin_status,
        checkin_time: ticket.checkin_time,
        order_id: order.id
      });
    }
  });

  offlineSales.forEach(sale => {
    const seats = sale.seat_code.split(',');
    seats.forEach(seatCode => {
      const seat = seatInventory.find(s => s.seat_code === seatCode.trim());
      const branchName = seat?.sold_by_branch_id 
        ? branches.find(b => b.id === seat.sold_by_branch_id)?.branch_name 
        : "Counter";
      
      passengers.push({
        id: sale.id,
        seat_code: seatCode.trim(),
        name: sale.passenger_name,
        phone: sale.passenger_phone,
        ticket_code: sale.receipt_number_optional || sale.id.slice(0, 8),
        channel: branchName,
        checkin_status: 'not_checked_in',
        checkin_time: null,
        is_offline: true
      });
    });
  });

  passengers.sort((a, b) => a.seat_code.localeCompare(b.seat_code));

  // Filter passengers
  let filteredPassengers = passengers.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seat_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'checked_in' && p.checkin_status === 'checked_in') ||
      (filterStatus === 'not_checked_in' && p.checkin_status !== 'checked_in');
    
    const matchesChannel = filterChannel === 'all' ||
      (filterChannel === 'online' && p.channel === 'Online') ||
      (filterChannel === 'offline' && p.channel !== 'Online');
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const stats = {
    total: seatInventory.filter(s => s.seat_status === 'sold_online' || s.seat_status === 'sold_offline').length,
    checkedIn: passengers.filter(p => p.checkin_status === 'checked_in').length,
    notCheckedIn: passengers.filter(p => p.checkin_status !== 'checked_in').length,
    remaining: seatInventory.filter(s => s.seat_status === 'available').length
  };

  if (!user || !operator || !trip || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* A) Trip Header */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{operator.name}</h1>
              {branch && (
                <p className="text-gray-400 text-sm mb-3">{branch.branch_name}, {branch.city}</p>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xl font-bold text-white">
                  {route.origin_city} → {route.destination_city}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(trip.departure_datetime), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-lg font-semibold">{format(new Date(trip.departure_datetime), "HH:mm")}</span>
                </div>
                <Badge className={
                  trip.trip_status === 'boarding' ? 'bg-green-500/20 text-green-400' :
                  trip.trip_status === 'departed' ? 'bg-purple-500/20 text-purple-400' :
                  trip.trip_status === 'delayed' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }>
                  {trip.trip_status}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {trip.trip_status === 'scheduled' && (
                <Button
                  onClick={() => updateTripStatusMutation.mutate({ status: 'boarding' })}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Open Boarding
                </Button>
              )}
              <Button
                onClick={() => setShowDelayModal(true)}
                variant="outline"
                className="border-orange-500/30 text-orange-400"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Mark Delayed
              </Button>
              {permissions.isOperator && (
                <Button
                  onClick={() => {
                    const reason = prompt("Reason for cancellation:");
                    if (reason && confirm("Cancel this trip and notify all passengers?")) {
                      sendCancelMutation.mutate(reason);
                    }
                  }}
                  variant="outline"
                  className="border-red-500/30 text-red-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Trip
                </Button>
              )}
              {(trip.trip_status === 'boarding' || trip.trip_status === 'delayed') && (
                <Button
                  onClick={() => {
                    if (confirm("Mark trip as departed?")) {
                      updateTripStatusMutation.mutate({ status: 'departed' });
                    }
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Bus className="w-4 h-4 mr-2" />
                  Mark Departed
                </Button>
              )}
              <Link to={createPageUrl("TripManifest", `id=${tripId}`)}>
                <Button variant="outline" className="border-white/10">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* B) Live Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Seats Sold</div>
            </div>
          </Card>
          <Card className="p-4 bg-green-500/10 border-green-500/30">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.checkedIn}</div>
              <div className="text-xs text-gray-400">Checked In</div>
            </div>
          </Card>
          <Card className="p-4 bg-orange-500/10 border-orange-500/30">
            <div className="text-center">
              <Clock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.notCheckedIn}</div>
              <div className="text-xs text-gray-400">Not Checked In</div>
            </div>
          </Card>
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="text-center">
              <Ticket className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">{stats.remaining}</div>
              <div className="text-xs text-gray-400">Seats Left</div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* D) Quick Check-in */}
            <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <h3 className="text-lg font-bold text-white mb-4">Quick Check-In</h3>
              <form onSubmit={handleQuickCheckIn} className="flex gap-3">
                <Input
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter ticket code or scan QR"
                  className="bg-white/10 border-white/20 text-white text-lg flex-1"
                  autoFocus
                />
                <Button 
                  type="submit"
                  disabled={checkInMutation.isPending || ticketCodeInput.length < 6}
                  className="bg-green-500 hover:bg-green-600 px-8"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Check In
                </Button>
              </form>
            </Card>

            {/* C) Passenger List */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Passengers ({filteredPassengers.length})</h3>
              </div>

              {/* Search & Filters */}
              <div className="grid md:grid-cols-4 gap-3 mb-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, seat..."
                  className="bg-white/5 border-white/10 text-white md:col-span-2"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterChannel} onValueChange={setFilterChannel}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="online">Online Only</SelectItem>
                    <SelectItem value="offline">Counter Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Passenger Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Seat</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Passenger</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Phone</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Ticket</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Channel</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Status</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPassengers.map((p) => (
                      <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <span className="font-bold text-white">{p.seat_code}</span>
                        </td>
                        <td className="py-3 px-2 text-gray-300">{p.name}</td>
                        <td className="py-3 px-2 text-gray-400 text-xs">{p.phone}</td>
                        <td className="py-3 px-2">
                          <code className="text-xs text-gray-400">{p.ticket_code}</code>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={
                            p.channel === 'Online' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-green-500/20 text-green-400'
                          }>
                            {p.channel}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {p.checkin_status === 'checked_in' ? (
                            <div>
                              <Badge className="bg-green-500/20 text-green-400">✓ Checked In</Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(p.checkin_time), "HH:mm")}
                              </p>
                            </div>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400">Not Checked In</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {p.checkin_status !== 'checked_in' && !p.is_offline ? (
                            <Button
                              size="sm"
                              onClick={() => checkInMutation.mutate(p.ticket_code)}
                              disabled={checkInMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Check In
                            </Button>
                          ) : p.checkin_status === 'checked_in' && permissions.isOperator && !p.is_offline ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm("Undo check-in?")) {
                                  undoCheckInMutation.mutate(p.id);
                                }
                              }}
                              className="border-red-500/30 text-red-400"
                            >
                              Undo
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* E) Reminders & Notifications */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Send Notifications</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setReminderType("boarding_open");
                    setShowReminderModal(true);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600"
                  size="lg"
                >
                  <Bus className="w-5 h-5 mr-2" />
                  Boarding Open
                </Button>
                <Button
                  onClick={() => {
                    setReminderType("reminder");
                    setShowReminderModal(true);
                  }}
                  variant="outline"
                  className="w-full border-blue-500/30 text-blue-400"
                  size="lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Reminder
                </Button>
                <Button
                  onClick={() => {
                    setReminderType("last_call");
                    setShowReminderModal(true);
                  }}
                  variant="outline"
                  className="w-full border-orange-500/30 text-orange-400"
                  size="lg"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Last Call
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 Reminders sent only to passengers not checked in
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Online Bookings:</span>
                  <span className="text-white font-semibold">{orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Counter Sales:</span>
                  <span className="text-white font-semibold">{offlineSales.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Check-in Rate:</span>
                  <span className="text-white font-semibold">
                    {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Delay Modal */}
        <Dialog open={showDelayModal} onOpenChange={setShowDelayModal}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Report Delay</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Delay (minutes)</Label>
                <Input
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                  placeholder="30"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300 mb-2 block">Reason</Label>
                <Textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="e.g., Traffic, mechanical issue..."
                  className="bg-white/5 border-white/10 text-white h-24"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDelayModal(false)} className="flex-1 border-white/10">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!delayMinutes || !delayReason) {
                      toast.error("Fill in all fields");
                      return;
                    }
                    sendDelayMutation.mutate({ delayMinutes, reason: delayReason });
                  }}
                  disabled={!delayMinutes || !delayReason || sendDelayMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {sendDelayMutation.isPending ? "Sending..." : "Notify Passengers"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reminder Modal */}
        <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {reminderType === 'boarding_open' ? 'Boarding Open Notification' :
                 reminderType === 'last_call' ? 'Last Call Notice' : 'Send Reminder'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <p className="text-sm text-blue-300 mb-2">
                  Will send to: <strong>{stats.notCheckedIn} {stats.notCheckedIn === 1 ? 'passenger' : 'passengers'}</strong> (not checked in)
                </p>
                <p className="text-xs text-gray-400">
                  {stats.checkedIn} already checked in (will not receive notification)
                </p>
              </Card>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReminderModal(false)} 
                  className="flex-1 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReminder}
                  disabled={sendReminderMutation.isPending || stats.notCheckedIn === 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  {sendReminderMutation.isPending ? "Sending..." : `Send to ${stats.notCheckedIn}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}