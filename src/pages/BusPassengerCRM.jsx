import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Phone, User, Calendar, Edit, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BusPassengerCRM() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    id_number: "",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: passengers = [] } = useQuery({
    queryKey: ['passengers', operator?.id, searchQuery],
    queryFn: async () => {
      const query = { operator_id: operator.id };
      if (searchQuery) {
        query.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { phone: { $regex: searchQuery, $options: 'i' } }
        ];
      }
      return await base44.entities.PassengerProfile.filter(query, '-updated_date', 100);
    },
    enabled: !!operator
  });

  const { data: passengerHistory = [] } = useQuery({
    queryKey: ['passenger-history', selectedPassenger?.id],
    queryFn: async () => {
      const sales = await base44.entities.OfflineSale.filter({
        operator_id: operator.id,
        passenger_phone: selectedPassenger.phone
      }, '-created_date', 20);
      return sales;
    },
    enabled: !!selectedPassenger && !!operator
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['passenger-trips', operator?.id],
    queryFn: () => base44.entities.Trip.filter({ operator_id: operator.id }),
    enabled: !!operator && passengerHistory.length > 0
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['passenger-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator && passengerHistory.length > 0
  });

  const updatePassengerMutation = useMutation({
    mutationFn: (data) => base44.entities.PassengerProfile.update(selectedPassenger.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      toast.success("Passenger updated!");
      setShowEditDialog(false);
      setSelectedPassenger(null);
    }
  });

  const handleEdit = (passenger) => {
    setSelectedPassenger(passenger);
    setEditForm({
      name: passenger.name,
      phone: passenger.phone,
      id_number: passenger.id_number || "",
      notes: passenger.notes || ""
    });
    setShowEditDialog(true);
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in to access this page.</p>
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
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Passenger Database</h1>
          <p className="text-gray-400">Search and manage frequent passengers</p>
        </div>

        {/* Search */}
        <Card className="p-4 bg-white/5 border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="bg-transparent border-0 text-white focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Passengers List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passengers.map((passenger) => (
            <motion.div key={passenger.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{passenger.name}</h3>
                      <p className="text-sm text-gray-400">{passenger.phone}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(passenger)}
                    className="border-white/10"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>

                {passenger.id_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>ID: {passenger.id_number}</span>
                  </div>
                )}

                {passenger.notes && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{passenger.notes}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Last seen: {format(new Date(passenger.updated_date), "MMM d, yyyy")}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {passengers.length === 0 && (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Passengers Found</h3>
            <p className="text-gray-400">Passengers will appear here after offline sales</p>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Passenger</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">ID Number (Optional)</Label>
                <Input
                  value={editForm.id_number}
                  onChange={(e) => setEditForm({...editForm, id_number: e.target.value})}
                  placeholder="Passport or national ID"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300">Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  placeholder="Special requirements, preferences, etc."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              {/* History */}
              {passengerHistory.length > 0 && (
                <div>
                  <Label className="text-gray-300 mb-3 block">Recent Trips ({passengerHistory.length})</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {passengerHistory.map(sale => {
                      const trip = trips.find(t => t.id === sale.trip_id);
                      const route = routes.find(r => r.id === trip?.route_id);
                      return (
                        <Card key={sale.id} className="p-3 bg-white/5 border-white/10">
                          <div className="flex justify-between items-start text-sm">
                            <div>
                              <p className="text-white font-medium">
                                {route?.origin_city} → {route?.destination_city}
                              </p>
                              <p className="text-gray-400 text-xs">Seat: {sale.seat_code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white">{sale.sale_price_xaf.toLocaleString()} XAF</p>
                              <p className="text-gray-400 text-xs">{format(new Date(sale.created_date), "MMM d")}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                onClick={() => updatePassengerMutation.mutate(editForm)}
                disabled={!editForm.name || !editForm.phone || updatePassengerMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {updatePassengerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}