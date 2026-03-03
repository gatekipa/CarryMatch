import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bus, User, Phone, DollarSign, CheckCircle, Printer, X, AlertTriangle, Lock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import OfflineSeatMap from "../components/bus/OfflineSeatMap";
import { useSalesWindowCheck } from "../components/bus/useSalesWindowCheck";
import { useBusVendorPermissions } from "../components/bus/useBusVendorPermissions";
import PassengerAutocomplete from "../components/bus/PassengerAutocomplete";
import AgentLockScreen from "../components/bus/AgentLockScreen";
import AgentSessionBar from "../components/bus/AgentSessionBar";
import StartSessionDialog from "../components/bus/StartSessionDialog";
import { useAgentSession } from "../components/bus/useAgentSession";

export default function VendorOfflineSales() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [showReceipt, setShowReceipt] = useState(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [selectedPassengerProfile, setSelectedPassengerProfile] = useState(null);
  const [savePassenger, setSavePassenger] = useState(true);

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

  const permissions = useBusVendorPermissions(user, operator);
  const agentSession = useAgentSession(user, operator);

  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-list', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: upcomingTrips = [] } = useQuery({
    queryKey: ['upcoming-trips', operator?.id],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({
        operator_id: operator.id,
        trip_status: { $in: ["scheduled", "boarding"] }
      }, "departure_datetime");
      return trips.filter(t => new Date(t.departure_datetime) >= new Date());
    },
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['offline-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['offline-vehicles', operator?.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['offline-templates', operator?.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: seatInventory = [] } = useQuery({
    queryKey: ['offline-seat-inventory', selectedTrip?.id],
    queryFn: () => base44.entities.TripSeatInventory.filter({ trip_id: selectedTrip.id }),
    enabled: !!selectedTrip,
    refetchInterval: 3000
  });

  const { data: allocationInfo } = useQuery({
    queryKey: ['branch-allocation', selectedTrip?.id, agentSession.sessionBranch?.id],
    queryFn: async () => {
      if (!agentSession.sessionBranch) {
        return { allocated: 0, sold: 0, available: 0 };
      }

      const response = await base44.functions.invoke('checkSeatAllocation', {
        trip_id: selectedTrip.id,
        seat_codes: [],
        channel: 'branch',
        branch_id: agentSession.sessionBranch.id
      });
      return response.data;
    },
    enabled: !!selectedTrip && !!agentSession.sessionBranch,
    refetchInterval: 5000
  });

  const salesCheck = useSalesWindowCheck(selectedTrip, 'offline');

  const completeSaleMutation = useMutation({
    mutationFn: async (forceOverride = false) => {
      // Check sales window (allow override for operators)
      if (!salesCheck.eligible && !forceOverride) {
        if (salesCheck.requiresOverride && permissions.isOperator) {
          setShowOverrideDialog(true);
          throw new Error("Requires admin override");
        } else {
          throw new Error(salesCheck.reason);
        }
      }

      // Check branch allocation
      if (agentSession.sessionBranch) {
        const allocationCheck = await base44.functions.invoke('checkSeatAllocation', {
          trip_id: selectedTrip.id,
          seat_codes: selectedSeats,
          channel: 'branch',
          branch_id: agentSession.sessionBranch.id
        });

        if (!allocationCheck.data.allowed) {
          throw new Error(allocationCheck.data.reason);
        }
      }
      // Verify seats are available
      for (const seatCode of selectedSeats) {
        const seat = seatInventory.find(s => s.seat_code === seatCode);
        if (!seat || seat.seat_status !== 'available') {
          throw new Error(`Seat ${seatCode} is not available for sale`);
        }
      }
      
      const totalPrice = selectedSeats.reduce((sum, seatCode) => {
        const seat = seatInventory.find(s => s.seat_code === seatCode);
        return sum + (seat?.price_xaf || 0);
      }, 0);

      // Create offline sale
      const sale = await base44.entities.OfflineSale.create({
        operator_id: operator.id,
        trip_id: selectedTrip.id,
        sold_by_user_id: user.email,
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        seat_code: selectedSeats.join(','),
        sale_price_xaf: totalPrice,
        payment_method: paymentMethod,
        receipt_number_optional: receiptNumber || undefined
      });

      // Update seat inventory to sold_offline atomically
      for (const seatCode of selectedSeats) {
        const seat = seatInventory.find(s => s.seat_code === seatCode);
        if (seat) {
          await base44.entities.TripSeatInventory.update(seat.id, {
            seat_status: 'sold_offline',
            sold_by_branch_id: agentSession.sessionBranch?.id || null
          });
          
          // Create audit log
          await base44.entities.AuditLog.create({
            actor_user_id: user.email,
            operator_id: operator.id,
            action_type: "seat_sold_offline",
            entity_type: "TripSeatInventory",
            entity_id: seat.id,
            payload_json: {
              trip_id: selectedTrip.id,
              seat_code: seatCode,
              sale_id: sale.id,
              price_xaf: seat.price_xaf,
              payment_method: paymentMethod,
              ...(forceOverride && { 
                override: true, 
                override_reason: overrideReason,
                sales_window_violation: salesCheck.reason 
              })
            }
          });
        }
      }

      // Save/update passenger profile if requested
      if (savePassenger) {
        if (selectedPassengerProfile) {
          await base44.entities.PassengerProfile.update(selectedPassengerProfile.id, {
            name: passengerName,
            phone: passengerPhone
          });
        } else {
          await base44.entities.PassengerProfile.create({
            operator_id: operator.id,
            name: passengerName,
            phone: passengerPhone
          });
        }
      }

      return sale;
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries(['offline-seat-inventory']);
      queryClient.invalidateQueries(['passenger-suggestions']);
      toast.success("Sale completed!");
      setShowReceipt(sale);
      setShowOverrideDialog(false);
      setOverrideReason("");
      resetForm();
    },
    onError: (error) => {
      if (error.message !== "Requires admin override") {
        toast.error("Sale failed: " + error.message);
      }
    }
  });

  const resetForm = () => {
    setSelectedSeats([]);
    setPassengerName("");
    setPassengerPhone("");
    setPaymentMethod("cash");
    setReceiptNumber("");
    setSelectedPassengerProfile(null);
    setSavePassenger(true);
  };

  const handleCompleteSale = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    if (!passengerName || !passengerPhone) {
      toast.error("Please enter passenger details");
      return;
    }
    completeSaleMutation.mutate();
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((sum, seatCode) => {
      const seat = seatInventory.find(s => s.seat_code === seatCode);
      return sum + (seat?.price_xaf || 0);
    }, 0);
  };

  const printReceipt = () => {
    if (!showReceipt) return;
    
    const trip = upcomingTrips.find(t => t.id === showReceipt.trip_id);
    const route = routes.find(r => r.id === trip?.route_id);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${showReceipt.id}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${operator.name}</h1>
        <p style="text-align: center; font-size: 12px;">RECEIPT</p>
        <div class="line"></div>
        <div class="row"><span>Date:</span><span>${format(new Date(), "MMM d, yyyy h:mm a")}</span></div>
        <div class="row"><span>Trip:</span><span>${route?.origin_city} → ${route?.destination_city}</span></div>
        <div class="row"><span>Departure:</span><span>${format(new Date(trip.departure_datetime), "MMM d, h:mm a")}</span></div>
        <div class="line"></div>
        <div class="row"><span>Passenger:</span><span>${showReceipt.passenger_name}</span></div>
        <div class="row"><span>Phone:</span><span>${showReceipt.passenger_phone}</span></div>
        <div class="row"><span>Seat(s):</span><span>${showReceipt.seat_code}</span></div>
        <div class="line"></div>
        <div class="row"><span>Payment:</span><span>${showReceipt.payment_method.toUpperCase()}</span></div>
        <div class="row total"><span>TOTAL:</span><span>${showReceipt.sale_price_xaf.toLocaleString()} XAF</span></div>
        <div class="line"></div>
        <p style="text-align: center; font-size: 10px; margin-top: 20px;">
          Thank you for traveling with us!<br/>
          ${operator.phone || ''}<br/>
          Sale ID: ${showReceipt.id.slice(0, 8)}
        </p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getSelectedTemplate = () => {
    if (!selectedTrip) return null;
    const vehicle = vehicles.find(v => v.id === selectedTrip.vehicle_id);
    if (!vehicle) return null;
    return templates.find(t => t.id === vehicle.seat_map_template_id);
  };

  // Require session for agents (must be before early returns per React hooks rules)
  useEffect(() => {
    if (permissions.isAgent && !agentSession.hasActiveSession && !showStartSessionDialog) {
      setShowStartSessionDialog(true);
    }
  }, [permissions.isAgent, agentSession.hasActiveSession]);

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
          <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  const template = getSelectedTemplate();

  if (agentSession.isLocked) {
    return <AgentLockScreen onUnlock={agentSession.unlock} />;
  }

  return (
    <div className="min-h-screen py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Counter Sales</h1>
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
              if (confirm("End your shift? This will lock the screen.")) {
                agentSession.endSession();
                agentSession.lock();
              }
            }}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Trip Selection & Seat Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Selection */}
            <Card className="p-6 bg-white/5 border-white/10">
              <Label className="text-gray-300 mb-2 block">Select Trip</Label>
              <Select value={selectedTrip?.id || ""} onValueChange={(id) => {
                const trip = upcomingTrips.find(t => t.id === id);
                setSelectedTrip(trip);
                setSelectedSeats([]);
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose a trip" />
                </SelectTrigger>
                <SelectContent>
                  {upcomingTrips.map(trip => {
                    const route = routes.find(r => r.id === trip.route_id);
                    return (
                      <SelectItem key={trip.id} value={trip.id}>
                        {route?.origin_city} → {route?.destination_city} • {format(new Date(trip.departure_datetime), "MMM d, h:mm a")}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Card>

            {/* Seat Map */}
            {selectedTrip && template && (
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">Select Seats</h3>
                  
                  {/* Sales Window Warning */}
                  {!salesCheck.eligible && (
                    <Card className="p-3 bg-yellow-500/10 border-yellow-500/30 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-300 font-semibold text-sm">{salesCheck.reason}</p>
                          {salesCheck.requiresOverride && permissions.isOperator && (
                            <p className="text-yellow-400 text-xs mt-1">⚠ Admin override available</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Allocation Info */}
                {allocationInfo && allocationInfo.allocated > 0 && (
                  <Card className="p-3 bg-blue-500/10 border-blue-500/30 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-300">Branch Allocation:</span>
                      <span className="text-white font-semibold">
                        {allocationInfo.available} / {allocationInfo.allocated} available
                      </span>
                    </div>
                  </Card>
                )}

                {allocationInfo && !allocationInfo.allowed && (
                  <Card className="p-3 bg-red-500/10 border-red-500/30 mb-4">
                    <div className="flex items-center gap-2 text-red-300 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{allocationInfo.reason}</span>
                    </div>
                  </Card>
                )}

                <OfflineSeatMap
                  template={template}
                  seatInventory={seatInventory}
                  selectedSeats={selectedSeats}
                  onSelectSeats={setSelectedSeats}
                  allocationInfo={allocationInfo}
                />
              </Card>
            )}
          </div>

          {/* Right: Passenger Info & Payment */}
          <div className="space-y-6">
            {/* Passenger Details */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Passenger Details</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Phone * {selectedPassengerProfile && "✓"}</Label>
                  <PassengerAutocomplete
                    operatorId={operator.id}
                    value={passengerPhone}
                    onSelect={(profile, phone) => {
                      setPassengerPhone(phone);
                      if (profile) {
                        setSelectedPassengerProfile(profile);
                        setPassengerName(profile.name);
                      } else {
                        setSelectedPassengerProfile(null);
                      }
                    }}
                    placeholder="+237 xxx xxx xxx"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Full Name *</Label>
                  <Input
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savePassenger}
                    onChange={(e) => setSavePassenger(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">
                    {selectedPassengerProfile ? "Update passenger profile" : "Save to passenger database"}
                  </span>
                </label>
              </div>
            </Card>

            {/* Payment */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Payment</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="momo">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Receipt # (Optional)</Label>
                  <Input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Manual receipt number"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Summary & Confirm */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
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
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-white">TOTAL</span>
                      <span className="text-blue-400">{getTotalPrice().toLocaleString()} XAF</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteSale}
                    disabled={!passengerName || !passengerPhone || completeSaleMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-lg py-6 mt-4"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {completeSaleMutation.isPending ? "Processing..." : "Complete Sale"}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Select seats to begin</p>
              )}
            </Card>
          </div>
        </div>

        {/* Receipt Dialog */}
        <Dialog open={!!showReceipt} onOpenChange={() => setShowReceipt(null)}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Sale Complete ✓</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-6 bg-white/10 border-white/10">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Payment Received</h3>
                  <div className="text-3xl font-bold text-green-400">{showReceipt?.sale_price_xaf.toLocaleString()} XAF</div>
                </div>

                <div className="space-y-2 text-sm border-t border-white/10 pt-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Passenger:</span>
                    <span className="text-white">{showReceipt?.passenger_name}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Phone:</span>
                    <span className="text-white">{showReceipt?.passenger_phone}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Seat(s):</span>
                    <span className="text-white font-bold">{showReceipt?.seat_code}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Payment:</span>
                    <span className="text-white uppercase">{showReceipt?.payment_method}</span>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button onClick={printReceipt} className="flex-1 bg-blue-500">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button onClick={() => setShowReceipt(null)} variant="outline" className="flex-1 border-white/10">
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Override Dialog */}
        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Sales Window Override Required</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-3 bg-yellow-500/10 border-yellow-500/30">
                <p className="text-yellow-300 text-sm font-semibold">{salesCheck.reason}</p>
              </Card>

              <div>
                <Label className="text-gray-300">Override Reason *</Label>
                <Input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Customer emergency, special arrangement..."
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowOverrideDialog(false);
                    setOverrideReason("");
                  }}
                  className="flex-1 border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => completeSaleMutation.mutate(true)}
                  disabled={!overrideReason || completeSaleMutation.isPending}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                >
                  {completeSaleMutation.isPending ? "Processing..." : "Override & Complete Sale"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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