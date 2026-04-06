import React, { useRef, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BusOperator, Trip } from "@/api/entities";
import { checkSeatAllocation } from "@/api/functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bus, Calendar, MapPin, User, Phone, Mail, ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import SeatMapSelector from "../components/bus/SeatMapSelector";
import QRTracker from "../components/bus/QRTracker";
import { useCurrentUser } from "../components/hooks/useCurrentUser";
import { useAuth } from "@/lib/AuthContext";

const getLegacyBusRouteEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.BusRoute;
};

const getLegacyOperatorBranchEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.OperatorBranch;
};

const getLegacyVehicleEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.Vehicle;
};

const getLegacySeatMapTemplateEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.SeatMapTemplate;
};

const getLegacyTripSeatInventoryEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.TripSeatInventory;
};

export default function BusTripDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const { user } = useCurrentUser();
  const { navigateToLogin } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isProceeding, setIsProceeding] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const hasPrefilledPassengerInfo = useRef(false);

  useEffect(() => {
    if (!user || hasPrefilledPassengerInfo.current) {
      return;
    }

    setPassengerInfo({
      name: user.full_name || "",
      phone: user.phone_number || "",
      email: user.email
    });
    hasPrefilledPassengerInfo.current = true;
  }, [user]);

  const { data: trip } = useQuery({
    queryKey: ['trip-detail', tripId],
    queryFn: async () => {
      const trips = await Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId
  });

  const { data: route } = useQuery({
    queryKey: ['trip-route', trip?.route_id],
    queryFn: async () => {
      const routes = await getLegacyBusRouteEntity().filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: operator } = useQuery({
    queryKey: ['trip-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['trip-branches', operator?.id],
    queryFn: () => getLegacyOperatorBranchEntity().filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: vehicle } = useQuery({
    queryKey: ['trip-vehicle', trip?.vehicle_id],
    queryFn: async () => {
      const vehicles = await getLegacyVehicleEntity().filter({ id: trip.vehicle_id });
      return vehicles[0];
    },
    enabled: !!trip
  });

  const { data: template } = useQuery({
    queryKey: ['vehicle-template', vehicle?.seat_map_template_id],
    queryFn: async () => {
      const templates = await getLegacySeatMapTemplateEntity().filter({ id: vehicle.seat_map_template_id });
      return templates[0];
    },
    enabled: !!vehicle
  });

  const { data: seatInventory = [] } = useQuery({
    queryKey: ['seat-inventory', tripId],
    queryFn: () => getLegacyTripSeatInventoryEntity().filter({ trip_id: tripId }),
    enabled: !!tripId,
    refetchInterval: 5000
  });

  const getTotalPrice = () => {
    return selectedSeats.reduce((sum, seatCode) => {
      const seat = seatInventory.find(s => s.seat_code === seatCode);
      return sum + (seat?.price_xaf || 0);
    }, 0);
  };

  const handleProceed = async () => {
    if (isProceeding) return; // Prevent double-click
    
    if (!user) {
      toast.error("Please sign in to continue");
      navigateToLogin();
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    if (!passengerInfo.name || !passengerInfo.phone) {
      toast.error("Please fill in passenger information");
      return;
    }

    // Check online allocation before holding seats
    setIsProceeding(true);
    try {
      const allocationCheck = await checkSeatAllocation({
        trip_id: tripId,
        seat_codes: selectedSeats,
        channel: 'online',
        branch_id: null
      });

      if (!allocationCheck.data.allowed) {
        toast.error(allocationCheck.data.reason);
        return;
      }

      // Hold seats before proceeding to checkout
      const holdUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Re-fetch fresh seat data to avoid stale cache race condition
      const freshSeats = await getLegacyTripSeatInventoryEntity().filter({ trip_id: tripId });
      const heldSeatIds = []; // Track successfully held seats for rollback
      
      for (const seatCode of selectedSeats) {
        const seat = freshSeats.find(s => s.seat_code === seatCode);
        if (!seat) {
          throw new Error(`Seat ${seatCode} not found`);
        }
        
        // Check seat is still available (using fresh data)
        if (seat.seat_status !== 'available') {
          // Rollback any seats we already held
          for (const heldId of heldSeatIds) {
            await getLegacyTripSeatInventoryEntity().update(heldId, {
              seat_status: 'available', held_until: null, held_by_order_id: null
            }).catch(e => console.error('Rollback failed:', e));
          }
          toast.error(`Seat ${seatCode} is no longer available`);
          return;
        }
        
        // Attempt to hold the seat
        await getLegacyTripSeatInventoryEntity().update(seat.id, {
          seat_status: 'held',
          held_until: holdUntil,
          held_by_order_id: user.email
        });
        heldSeatIds.push(seat.id);
      }
      
      navigate(createPageUrl("BusCheckout", `trip=${tripId}&seats=${selectedSeats.join(',')}&name=${encodeURIComponent(passengerInfo.name)}&phone=${encodeURIComponent(passengerInfo.phone)}`));
    } catch (error) {
      setIsProceeding(false);
      toast.error("Failed to reserve seats: " + error.message);
      console.error(error);
    }
  };

  if (!trip || !route || !operator || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const platformFee = 500;
  const totalPrice = getTotalPrice();
  const grandTotal = totalPrice + platformFee;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {trip && operator && <QRTracker qrType="trip" targetId={trip.id} operatorId={operator.id} />}
      
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Trip Info & Seat Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Header */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start gap-4 mb-6">
                {operator.logo_url ? (
                  <img src={operator.logo_url} alt={operator.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Bus className="w-8 h-8 text-blue-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{operator.name}</h2>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xl font-bold text-white">{format(new Date(trip.departure_datetime), "h:mm a")}</div>
                      <div className="text-sm text-gray-400">{route.origin_city}</div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                    <div>
                      <div className="text-xl font-bold text-white">
                        {trip.arrival_estimate_datetime ? format(new Date(trip.arrival_estimate_datetime), "h:mm a") : "TBD"}
                      </div>
                      <div className="text-sm text-gray-400">{route.destination_city}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(trip.departure_datetime), "EEEE, MMMM d, yyyy")}</span>
              </div>
            </Card>

            {/* Comfort Options First */}
            <Card className="p-6 bg-white/5 border-white/10 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Choose Your Comfort</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const standardSeats = seatInventory.filter(s => 
                      s.seat_class === 'standard' && s.seat_status === 'available'
                    );
                    if (standardSeats.length > 0) {
                      setSelectedSeats([standardSeats[0].seat_code]);
                      window.scrollTo({ top: document.querySelector('.seat-map-section')?.offsetTop - 100, behavior: 'smooth' });
                    }
                  }}
                  className="p-5 bg-white/5 border-2 border-white/10 rounded-lg hover:border-blue-500/50 hover:bg-white/10 transition-all text-left"
                >
                  <div className="text-lg font-bold text-white mb-2">Standard Seat</div>
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {trip.base_price_xaf.toLocaleString()} XAF
                  </div>
                  <p className="text-sm text-gray-400">Comfortable seating for your journey</p>
                </button>

                {seatInventory.some(s => s.seat_class === 'vip') && (
                  <button
                    onClick={() => {
                      const vipSeats = seatInventory.filter(s => 
                        s.seat_class === 'vip' && s.seat_status === 'available'
                      );
                      if (vipSeats.length > 0) {
                        setSelectedSeats([vipSeats[0].seat_code]);
                        window.scrollTo({ top: document.querySelector('.seat-map-section')?.offsetTop - 100, behavior: 'smooth' });
                      }
                    }}
                    className="p-5 bg-purple-500/10 border-2 border-purple-500/30 rounded-lg hover:border-purple-500/50 hover:bg-purple-500/20 transition-all text-left"
                  >
                    <div className="text-lg font-bold text-white mb-2">VIP Seat</div>
                    <div className="text-2xl font-bold text-purple-400 mb-2">
                      {(() => {
                        const vipSeat = seatInventory.find(s => s.seat_class === 'vip');
                        return vipSeat ? vipSeat.price_xaf.toLocaleString() : '—';
                      })()} XAF
                    </div>
                    <p className="text-sm text-gray-400">Extra legroom and premium comfort</p>
                  </button>
                )}
              </div>
            </Card>

            {/* Seat Selection */}
            <Card className="p-6 bg-white/5 border-white/10 seat-map-section">
              <h3 className="text-xl font-bold text-white mb-4">Pick Your Exact Seat</h3>
              
              {(() => {
                const availableOnline = seatInventory.filter(s => s.seat_status === 'available').length;
                const hasBlocked = seatInventory.some(s => s.seat_status === 'blocked');

                return availableOnline === 0 && hasBlocked ? (
                  <Card className="p-6 bg-blue-500/10 border-blue-500/30 text-center mb-4">
                    <h4 className="text-lg font-bold text-white mb-2">Online Seats Sold Out</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Some seats are available at the agency counter.
                    </p>
                    <p className="text-xs text-gray-400">
                      Contact {operator.name} at {operator.phone} for counter bookings.
                    </p>
                  </Card>
                ) : null;
              })()}

              <SeatMapSelector
                template={template}
                seatInventory={seatInventory}
                selectedSeats={selectedSeats}
                onSelectSeats={setSelectedSeats}
                tripId={tripId}
              />
            </Card>
          </div>

          {/* Right: Summary & Passenger Info */}
          <div className="space-y-6">
            {/* Passenger Info */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Passenger Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Full Name *</Label>
                  <Input
                    value={passengerInfo.name}
                    onChange={(e) => setPassengerInfo({...passengerInfo, name: e.target.value})}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Phone *</Label>
                  <Input
                    value={passengerInfo.phone}
                    onChange={(e) => setPassengerInfo({...passengerInfo, phone: e.target.value})}
                    placeholder="+237 xxx xxx xxx"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    value={passengerInfo.email}
                    disabled
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Price Summary */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Price Summary</h3>
              
              {selectedSeats.length > 0 ? (
                <div className="space-y-3">
                  {selectedSeats.map(seatCode => {
                    const seat = seatInventory.find(s => s.seat_code === seatCode);
                    return (
                      <div key={seatCode} className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          Seat {seatCode} {seat?.seat_class === 'vip' && <Badge className="bg-purple-500/20 text-purple-400 text-xs ml-1">VIP</Badge>}
                        </span>
                        <span className="text-white font-medium">{seat?.price_xaf.toLocaleString()} XAF</span>
                      </div>
                    );
                  })}
                  
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="text-white">{totalPrice.toLocaleString()} XAF</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-300">CarryMatch Fee</span>
                      <span className="text-white">{platformFee.toLocaleString()} XAF</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3">
                      <span className="text-white">Total</span>
                      <span className="text-blue-400">{grandTotal.toLocaleString()} XAF</span>
                    </div>
                  </div>

                  <Button onClick={handleProceed} disabled={isProceeding} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 mt-4">
                    {isProceeding ? (
                      <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" /> Reserving Seats...</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4 mr-2" /> Proceed to Payment</>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Select seats to see pricing</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
