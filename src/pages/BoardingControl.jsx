import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bus, Clock, AlertTriangle, CheckCircle, UserX, Unlock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

export default function BoardingControl() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  
  const [user, setUser] = useState(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [releaseReason, setReleaseReason] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: trip } = useQuery({
    queryKey: ['boarding-trip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
    refetchInterval: 10000
  });

  const { data: operator } = useQuery({
    queryKey: ['boarding-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const { data: settings } = useQuery({
    queryKey: ['boarding-settings', operator?.id],
    queryFn: async () => {
      const s = await base44.entities.OperatorSettings.filter({ operator_id: operator.id });
      return s[0] || {
        boarding_opens_minutes_before_departure: 45,
        no_show_cutoff_minutes: 10,
        release_requires_admin: true
      };
    },
    enabled: !!operator
  });

  const { data: route } = useQuery({
    queryKey: ['boarding-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: seatInventory = [] } = useQuery({
    queryKey: ['boarding-seats', tripId],
    queryFn: () => base44.entities.TripSeatInventory.filter({ trip_id: tripId }),
    enabled: !!tripId,
    refetchInterval: 5000
  });

  const { data: checkedInTickets = [] } = useQuery({
    queryKey: ['checked-in-tickets', tripId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ trip_id: tripId, order_status: "paid" });
      const orderIds = orders.map(o => o.id);
      if (orderIds.length === 0) return [];
      
      return await base44.entities.Ticket.filter({
        order_id: { $in: orderIds },
        checkin_status: "checked_in"
      });
    },
    enabled: !!tripId
  });

  const { data: staff } = useQuery({
    queryKey: ['boarding-staff', user?.email, operator?.id],
    queryFn: async () => {
      const staffArr = await base44.entities.OperatorStaff.filter({
        user_id: user.email,
        operator_id: operator.id,
        status: "active"
      });
      return staffArr[0];
    },
    enabled: !!user && !!operator
  });

  const releaseSeatsMutation = useMutation({
    mutationFn: async ({ seatIds, reason }) => {
      // Check permission
      if (settings.release_requires_admin && staff?.staff_role !== 'vendor_bus_operator') {
        throw new Error("Only operator admins can release seats");
      }

      // Release each seat
      for (const seatId of seatIds) {
        const seat = seatInventory.find(s => s.id === seatId);
        if (!seat) continue;

        await base44.entities.TripSeatInventory.update(seatId, {
          seat_status: 'released_for_walkin',
          released_at: new Date().toISOString(),
          released_by_user_id: user.email,
          release_reason: reason
        });

        // Create audit log
        await base44.entities.AuditLog.create({
          actor_user_id: user.email,
          operator_id: operator.id,
          action_type: "seat_force_released",
          entity_type: "TripSeatInventory",
          entity_id: seatId,
          payload_json: {
            trip_id: tripId,
            seat_code: seat.seat_code,
            reason: reason,
            original_status: seat.seat_status,
            minutes_before_departure: minutesUntilDeparture
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-seats'] });
      toast.success("Seats released for walk-in sales!");
      setShowReleaseDialog(false);
      setSelectedSeats([]);
      setReleaseReason("");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const openBoardingMutation = useMutation({
    mutationFn: () => base44.entities.Trip.update(tripId, { trip_status: "boarding" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-trip'] });
      toast.success("Boarding opened!");
    }
  });

  if (!trip || !operator || !settings || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const departureTime = new Date(trip.departure_datetime);
  const now = new Date();
  const minutesUntilDeparture = differenceInMinutes(departureTime, now);
  const canOpenBoarding = minutesUntilDeparture <= settings.boarding_opens_minutes_before_departure;
  const isPastCutoff = minutesUntilDeparture <= settings.no_show_cutoff_minutes;

  // Categorize seats
  const soldSeats = seatInventory.filter(s => s.seat_status === 'sold_online' || s.seat_status === 'sold_offline');
  const checkedInSeatCodes = new Set(checkedInTickets.flatMap(t => {
    const order = seatInventory.find(s => s.held_by_order_id === t.order_id);
    return order ? [order.seat_code] : [];
  }));
  
  const noShowSeats = soldSeats.filter(s => !checkedInSeatCodes.has(s.seat_code) && s.seat_status !== 'released_for_walkin');
  const releasedSeats = seatInventory.filter(s => s.seat_status === 'released_for_walkin');
  const canRelease = isPastCutoff && (!settings.release_requires_admin || staff?.staff_role === 'vendor_bus_operator');

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Boarding Control</h1>
          <p className="text-gray-400">{route.origin_city} → {route.destination_city}</p>
        </div>

        {/* Trip Status Card */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bus className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  {format(departureTime, "MMM d, yyyy 'at' h:mm a")}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge className={
                  trip.trip_status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                  trip.trip_status === 'boarding' ? 'bg-green-500/20 text-green-400' :
                  trip.trip_status === 'departed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }>
                  {trip.trip_status}
                </Badge>
                <div className="text-gray-300">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {minutesUntilDeparture > 0 
                    ? `${Math.floor(minutesUntilDeparture / 60)}h ${minutesUntilDeparture % 60}m until departure`
                    : 'Departed'}
                </div>
              </div>
            </div>

            {trip.trip_status === 'scheduled' && canOpenBoarding && (
              <Button onClick={() => openBoardingMutation.mutate()} className="bg-green-500">
                <CheckCircle className="w-4 h-4 mr-2" />
                Open Boarding
              </Button>
            )}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Checked In</span>
            </div>
            <div className="text-3xl font-bold text-white">{checkedInTickets.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <UserX className="w-5 h-5 text-red-400" />
              <span className="text-gray-400">No-Shows</span>
            </div>
            <div className="text-3xl font-bold text-white">{noShowSeats.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Unlock className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Released</span>
            </div>
            <div className="text-3xl font-bold text-white">{releasedSeats.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Cutoff Status</span>
            </div>
            <Badge className={isPastCutoff ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
              {isPastCutoff ? 'Past Cutoff' : `${minutesUntilDeparture}m until`}
            </Badge>
          </Card>
        </div>

        {/* No-Show Management */}
        {trip.trip_status === 'boarding' && (
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">No-Show Management</h3>
              {isPastCutoff && (
                <Badge className="bg-red-500/20 text-red-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Cutoff Reached ({settings.no_show_cutoff_minutes}min before departure)
                </Badge>
              )}
            </div>

            {!isPastCutoff && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-6">
                <p className="text-blue-300 text-sm">
                  Seat release will be available {settings.no_show_cutoff_minutes} minutes before departure
                  ({format(new Date(departureTime.getTime() - settings.no_show_cutoff_minutes * 60000), "h:mm a")})
                </p>
              </Card>
            )}

            {noShowSeats.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-gray-400">All passengers checked in!</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-4 gap-3 mb-6">
                  {noShowSeats.map(seat => (
                    <button
                      key={seat.id}
                      onClick={() => {
                        if (selectedSeats.includes(seat.id)) {
                          setSelectedSeats(selectedSeats.filter(id => id !== seat.id));
                        } else {
                          setSelectedSeats([...selectedSeats, seat.id]);
                        }
                      }}
                      disabled={!canRelease}
                      className={`p-4 rounded-lg transition-all ${
                        selectedSeats.includes(seat.id)
                          ? 'bg-purple-500/30 border-2 border-purple-500'
                          : 'bg-white/5 border-2 border-white/10 hover:bg-white/10'
                      } ${!canRelease ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-2xl font-bold text-white mb-1">{seat.seat_code}</div>
                      <div className="text-xs text-gray-400">{seat.seat_class === 'vip' ? 'VIP' : 'Standard'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {seat.seat_status === 'sold_online' ? 'Online' : 'Offline'}
                      </div>
                    </button>
                  ))}
                </div>

                {canRelease ? (
                  <>
                    {selectedSeats.length > 0 && (
                      <Card className="p-4 bg-purple-500/10 border-purple-500/30 mb-4">
                        <p className="text-purple-300 text-sm mb-2">
                          {selectedSeats.length} seat(s) selected for release
                        </p>
                        <p className="text-xs text-gray-400">
                          Released seats will be available for immediate walk-in sales
                        </p>
                      </Card>
                    )}

                    <Button
                      onClick={() => setShowReleaseDialog(true)}
                      disabled={selectedSeats.length === 0}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Release {selectedSeats.length} Seat(s) for Walk-In
                    </Button>
                  </>
                ) : (
                  <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                    <p className="text-yellow-300 text-sm">
                      {settings.release_requires_admin && staff?.staff_role !== 'vendor_bus_operator'
                        ? "Only operator admins can release seats"
                        : `Wait until ${settings.no_show_cutoff_minutes} minutes before departure to release seats`}
                    </p>
                  </Card>
                )}
              </>
            )}
          </Card>
        )}

        {/* Released Seats */}
        {releasedSeats.length > 0 && (
          <Card className="p-6 bg-white/5 border-white/10 mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Released for Walk-In ({releasedSeats.length})</h3>
            <div className="grid md:grid-cols-6 gap-3">
              {releasedSeats.map(seat => (
                <div key={seat.id} className="p-3 bg-green-500/20 border-2 border-green-500/30 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-400">{seat.seat_code}</div>
                  <div className="text-xs text-gray-400 mt-1">Available</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Release Dialog */}
        <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Release Seats for Walk-In Sales</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-300 font-semibold text-sm mb-1">
                      Releasing {selectedSeats.length} no-show seat(s)
                    </p>
                    <p className="text-yellow-400 text-xs">
                      These seats will become available for immediate walk-in sales. This action will be logged.
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <Label className="text-gray-300">Reason for Release *</Label>
                <Textarea
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="e.g., Passenger no-show, maximize occupancy..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReleaseDialog(false);
                    setReleaseReason("");
                  }}
                  className="flex-1 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => releaseSeatsMutation.mutate({ seatIds: selectedSeats, reason: releaseReason })}
                  disabled={!releaseReason || releaseSeatsMutation.isPending}
                  className="flex-1 bg-purple-500"
                >
                  {releaseSeatsMutation.isPending ? "Releasing..." : "Confirm Release"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}