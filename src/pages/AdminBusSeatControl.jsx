import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Lock, Unlock, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminBusSeatControl() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTripId, setSearchTripId] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => setUser(null));
  }, []);

  const { data: trips = [] } = useQuery({
    queryKey: ['admin-recent-trips'],
    queryFn: () => base44.entities.Trip.list('-created_date', 50),
    enabled: !!user
  });

  const { data: seatInventory = [] } = useQuery({
    queryKey: ['admin-seat-inventory', selectedTrip?.id],
    queryFn: () => base44.entities.TripSeatInventory.filter({ trip_id: selectedTrip.id }),
    enabled: !!selectedTrip,
    refetchInterval: 5000
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-seat-audit', selectedTrip?.id],
    queryFn: () => base44.entities.AuditLog.filter({
      entity_type: 'TripSeatInventory',
      payload_json: { trip_id: selectedTrip.id }
    }, '-created_date', 20),
    enabled: !!selectedTrip
  });

  const forceReleaseMutation = useMutation({
    mutationFn: async (seatId) => {
      const seat = seatInventory.find(s => s.id === seatId);
      
      await base44.entities.TripSeatInventory.update(seatId, {
        seat_status: 'available',
        held_until: null,
        held_by_order_id: null
      });

      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: selectedTrip.operator_id,
        action_type: 'seat_force_released',
        entity_type: 'TripSeatInventory',
        entity_id: seatId,
        payload_json: {
          trip_id: selectedTrip.id,
          seat_code: seat.seat_code,
          previous_status: seat.seat_status,
          reason: 'Admin force release'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seat-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-seat-audit'] });
      toast.success("Seat released");
    }
  });

  const blockSeatMutation = useMutation({
    mutationFn: async ({ seatId, reason }) => {
      const seat = seatInventory.find(s => s.id === seatId);
      
      await base44.entities.TripSeatInventory.update(seatId, {
        seat_status: 'blocked'
      });

      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: selectedTrip.operator_id,
        action_type: 'seat_blocked',
        entity_type: 'TripSeatInventory',
        entity_id: seatId,
        payload_json: {
          trip_id: selectedTrip.id,
          seat_code: seat.seat_code,
          reason: reason
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seat-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-seat-audit'] });
      toast.success("Seat blocked");
    }
  });

  const unblockSeatMutation = useMutation({
    mutationFn: async (seatId) => {
      const seat = seatInventory.find(s => s.id === seatId);
      
      await base44.entities.TripSeatInventory.update(seatId, {
        seat_status: 'available'
      });

      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: selectedTrip.operator_id,
        action_type: 'seat_unblocked',
        entity_type: 'TripSeatInventory',
        entity_id: seatId,
        payload_json: {
          trip_id: selectedTrip.id,
          seat_code: seat.seat_code
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seat-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-seat-audit'] });
      toast.success("Seat unblocked");
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Admin Only</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-red-400" />
          <h1 className="text-3xl font-bold text-white">Seat Inventory Control</h1>
        </div>

        {/* Trip Search */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <Label className="text-gray-300 mb-2 block">Search Trip</Label>
          <div className="flex gap-2">
            <Input
              value={searchTripId}
              onChange={(e) => setSearchTripId(e.target.value)}
              placeholder="Enter Trip ID"
              className="bg-white/5 border-white/10 text-white"
            />
            <Button onClick={() => {
              const trip = trips.find(t => t.id === searchTripId);
              if (trip) {
                setSelectedTrip(trip);
              } else {
                toast.error("Trip not found");
              }
            }}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-4">
            <Label className="text-gray-300 mb-2 block">Or Select Recent Trip</Label>
            <Select value={selectedTrip?.id || ""} onValueChange={(id) => {
              const trip = trips.find(t => t.id === id);
              setSelectedTrip(trip);
            }}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Choose a trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.id} • {format(new Date(trip.departure_datetime), "MMM d, h:mm a")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {selectedTrip && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Seat Inventory */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Seat Inventory</h3>
                <div className="space-y-2">
                  {seatInventory.map(seat => (
                    <div key={seat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{seat.seat_code}</span>
                        <Badge className={
                          seat.seat_status === 'available' ? 'bg-green-500/20 text-green-400' :
                          seat.seat_status === 'held' ? 'bg-yellow-500/20 text-yellow-400' :
                          seat.seat_status.includes('sold') ? 'bg-gray-600 text-gray-300' :
                          'bg-orange-500/20 text-orange-400'
                        }>
                          {seat.seat_status}
                        </Badge>
                        {seat.held_until && (
                          <span className="text-xs text-gray-400">
                            Expires: {format(new Date(seat.held_until), "h:mm a")}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {seat.seat_status === 'blocked' ? (
                          <Button
                            size="sm"
                            onClick={() => unblockSeatMutation.mutate(seat.id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        ) : seat.seat_status === 'available' ? (
                          <Button
                            size="sm"
                            onClick={() => blockSeatMutation.mutate({ seatId: seat.id, reason: 'Admin block' })}
                            variant="outline"
                            className="border-orange-500 text-orange-400"
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                        ) : seat.seat_status === 'held' || seat.seat_status.includes('sold') ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (confirm(`Force release seat ${seat.seat_code}? This will create an audit log entry.`)) {
                                forceReleaseMutation.mutate(seat.id);
                              }
                            }}
                            variant="outline"
                            className="border-red-500 text-red-400"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Audit Log */}
            <div>
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Audit Log</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {auditLogs.map(log => (
                    <div key={log.id} className="text-xs p-3 bg-white/5 rounded">
                      <div className="text-blue-400 mb-1">{log.action_type}</div>
                      <div className="text-gray-400">
                        {format(new Date(log.created_date), "MMM d, h:mm a")}
                      </div>
                      <div className="text-gray-300 mt-1">
                        By: {log.actor_user_id}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}