import React, { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Clock, CheckCircle, Ticket, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSalesWindowCheck } from "../components/bus/useSalesWindowCheck";
import { useCurrentUser } from "../components/hooks/useCurrentUser";

const getLegacyTripSeatInventoryEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.TripSeatInventory;
};

const getLegacyPromoCodeEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.PromoCode;
};

const getLegacyOrderEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.Order;
};

const getLegacyReferralCodeEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.ReferralCode;
};

const getLegacyOrderSeatEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.OrderSeat;
};

const getLegacyAuditLogEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.AuditLog;
};

const getLegacyTicketEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.Ticket;
};

export default function BusCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("trip");
  const seatCodes = urlParams.get("seats")?.split(',') || [];
  const passengerName = decodeURIComponent(urlParams.get("name") || "");
  const passengerPhone = decodeURIComponent(urlParams.get("phone") || "");
  
  const { user } = useCurrentUser();
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [referralCode, setReferralCode] = useState(urlParams.get("ref") || "");
  const [appliedReferral, setAppliedReferral] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentCompletedRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("Reservation expired. Please try again.");
          navigate(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: trip } = useQuery({
    queryKey: ['checkout-trip', tripId],
    queryFn: async () => {
      const trips = await Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId
  });

  const { data: seatInventory = [] } = useQuery({
    queryKey: ['checkout-seats', tripId],
    queryFn: () => getLegacyTripSeatInventoryEntity().filter({
      trip_id: tripId,
      seat_code: { $in: seatCodes }
    }),
    enabled: !!tripId && seatCodes.length > 0
  });

  const { data: operator } = useQuery({
    queryKey: ['checkout-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const salesCheck = useSalesWindowCheck(trip, 'online');

  // Verify seats are held on mount, release on unmount if payment not completed
  useEffect(() => {
    let mounted = true;
    
    return () => {
      mounted = false;
      // ONLY release seats if payment was NOT completed
      if (paymentCompletedRef.current) return;
      if (seatInventory.length > 0 && user) {
        seatInventory.forEach(seat => {
          if (seat.seat_status === 'held' && seat.held_by_order_id === user.email) {
            getLegacyTripSeatInventoryEntity().update(seat.id, {
              seat_status: 'available',
              held_until: null,
              held_by_order_id: null
            }).catch(err => console.error('Failed to release seat:', err));
          }
        });
      }
    };
  }, [seatInventory.length, user?.email]);

  const applyPromoMutation = useMutation({
    mutationFn: async (code) => {
      const promos = await getLegacyPromoCodeEntity().filter({
        code: code.toUpperCase(),
        operator_id: trip.operator_id,
        is_active: true
      });
      
      if (promos.length === 0) {
        throw new Error("Invalid promo code");
      }

      const promo = promos[0];
      const today = new Date().toISOString().split('T')[0];
      
      if (promo.valid_from && promo.valid_from > today) {
        throw new Error("Promo code not yet valid");
      }
      if (promo.valid_until && promo.valid_until < today) {
        throw new Error("Promo code expired");
      }
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        throw new Error("Promo code usage limit reached");
      }

      // Check route restrictions
      if (promo.applicable_routes_json && promo.applicable_routes_json.length > 0) {
        if (!promo.applicable_routes_json.includes(trip.route_id)) {
          throw new Error("Promo code not valid for this route");
        }
      }

      // Check per-user limit
      if (promo.usage_limit_per_user) {
        const userOrders = await getLegacyOrderEntity().filter({
          user_id: user.email,
          operator_id: trip.operator_id
        });
        const userPromoUsage = userOrders.filter(o => 
          o.payment_reference && o.payment_reference.includes(`PROMO:${promo.code}`)
        ).length;
        
        if (userPromoUsage >= promo.usage_limit_per_user) {
          throw new Error("You've already used this promo code");
        }
      }

      return promo;
    },
    onSuccess: (promo) => {
      setAppliedPromo(promo);
      toast.success(`Promo applied: ${promo.discount_type === 'percentage' ? promo.discount_value + '%' : promo.discount_value + ' XAF'} off!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const applyReferralMutation = useMutation({
    mutationFn: async (code) => {
      const referrals = await getLegacyReferralCodeEntity().filter({
        code: code.toUpperCase(),
        operator_id: trip.operator_id,
        status: "active"
      });
      
      if (referrals.length === 0) {
        throw new Error("Invalid referral code");
      }

      return referrals[0];
    },
    onSuccess: (referral) => {
      setAppliedReferral(referral);
      toast.success(`Referral applied: ${referral.discount_value} XAF off!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // Check sales window
      if (!salesCheck.eligible) {
        throw new Error(salesCheck.reason);
      }

      // Check seat allocation for online channel
      const allocationCheck = await checkSeatAllocation({
        trip_id: tripId,
        seat_codes: seatCodes,
        channel: 'online',
        branch_id: null
      });

      if (!allocationCheck.data.allowed) {
        throw new Error(allocationCheck.data.reason);
      }

      // Verify seats are still held by this user (fresh server-side check)
      const freshSeats = await getLegacyTripSeatInventoryEntity().filter({
        trip_id: tripId,
        seat_code: { $in: seatCodes }
      });
      
      for (const seat of freshSeats) {
        if (seat.seat_status !== 'held' || seat.held_by_order_id !== user.email) {
          throw new Error(`Seat ${seat.seat_code} is no longer available`);
        }
        
        // Check hold hasn't expired
        if (seat.held_until && new Date(seat.held_until) < new Date()) {
          throw new Error(`Your reservation has expired. Please start again.`);
        }
      }
      
      if (freshSeats.length !== seatCodes.length) {
        throw new Error("Some seats could not be found. Please start again.");
      }
      
      // Create order
      const subtotal = freshSeats.reduce((sum, seat) => sum + seat.price_xaf, 0);
      let promoDiscount = 0;
      let referralDiscount = 0;
      
      if (appliedPromo) {
        if (appliedPromo.discount_type === 'percentage') {
          promoDiscount = Math.round(subtotal * (appliedPromo.discount_value / 100));
        } else {
          promoDiscount = appliedPromo.discount_value;
        }
      }

      if (appliedReferral) {
        referralDiscount = appliedReferral.discount_value;
      }

      const totalDiscount = promoDiscount + referralDiscount;
      const discountedSubtotal = subtotal - totalDiscount;
      const platformFee = Math.max(200, Math.round(discountedSubtotal * 0.05));
      const totalAmount = discountedSubtotal + platformFee;

      const paymentRef = `MOCK_${Date.now()}${appliedPromo ? `:PROMO:${appliedPromo.code}` : ''}${appliedReferral ? `:REF:${appliedReferral.code}` : ''}`;

      const order = await getLegacyOrderEntity().create({
        user_id: user.email,
        trip_id: tripId,
        operator_id: trip.operator_id,
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        channel: "online",
        order_status: "paid",
        amount_xaf: totalAmount,
        fee_xaf: platformFee,
        net_to_operator_xaf: discountedSubtotal,
        payment_provider: paymentMethod,
        payment_reference: paymentRef,
        paid_at: new Date().toISOString()
      });

      // Create OrderSeats
      await getLegacyOrderSeatEntity().bulkCreate(
        seatCodes.map(seatCode => {
          const seat = freshSeats.find(s => s.seat_code === seatCode);
          return {
            order_id: order.id,
            trip_id: tripId,
            seat_code: seatCode,
            seat_price_xaf: seat.price_xaf
          };
        })
      );

      // Update seat inventory to sold (atomic conversion from held to sold)
      for (const seat of freshSeats) {
        await getLegacyTripSeatInventoryEntity().update(seat.id, {
          seat_status: 'sold_online',
          held_until: null,
          held_by_order_id: order.id
        });
        
        // Create audit log
        await getLegacyAuditLogEntity().create({
          actor_user_id: user.email,
          operator_id: trip.operator_id,
          action_type: "seat_sold_online",
          entity_type: "TripSeatInventory",
          entity_id: seat.id,
          payload_json: {
            trip_id: tripId,
            seat_code: seat.seat_code,
            order_id: order.id,
            price_xaf: seat.price_xaf
          }
        });
      }

      // Create tickets
      const tickets = await getLegacyTicketEntity().bulkCreate(
        seatCodes.map((seatCode, idx) => {
          const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
          return {
            order_id: order.id,
            ticket_code: `${trip.operator_id.slice(0,3).toUpperCase()}${Date.now().toString().slice(-5)}${rand}${seatCode}`,
            qr_payload: `TICKET:${order.id}:${seatCode}`,
            checkin_status: "not_checked_in"
          };
        })
      );

      // Update promo usage
      if (appliedPromo) {
        await getLegacyPromoCodeEntity().update(appliedPromo.id, {
          current_uses: appliedPromo.current_uses + 1
        });

        // Create audit log
        await getLegacyAuditLogEntity().create({
          actor_user_id: user.email,
          operator_id: trip.operator_id,
          action_type: "promo_code_used",
          entity_type: "PromoCode",
          entity_id: appliedPromo.id,
          payload_json: {
            code: appliedPromo.code,
            discount_xaf: promoDiscount,
            order_id: order.id
          }
        });
      }

      // Track referral usage
      if (appliedReferral) {
        await getLegacyAuditLogEntity().create({
          actor_user_id: user.email,
          operator_id: trip.operator_id,
          action_type: "referral_code_used",
          entity_type: "ReferralCode",
          entity_id: appliedReferral.id,
          payload_json: {
            code: appliedReferral.code,
            discount_xaf: referralDiscount,
            commission_xaf: appliedReferral.commission_xaf,
            order_id: order.id,
            staff_user_id: appliedReferral.issued_to_staff_user_id
          }
        });
      }

      return { order, tickets };
    },
    onSuccess: ({ order }) => {
      paymentCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['checkout-seats'] });
      navigate(createPageUrl("BusTicketConfirmation", `order=${order.id}`));
    },
    onError: (error) => {
      toast.error("Payment failed: " + error.message);
      // Release seats on payment failure
      seatInventory.forEach(seat => {
        if (seat.seat_status === 'held' && seat.held_by_order_id === user.email) {
          getLegacyTripSeatInventoryEntity().update(seat.id, {
            seat_status: 'available',
            held_until: null,
            held_by_order_id: null
          }).catch(err => console.error('Failed to release seat:', err));
        }
      });
    }
  });

  if (!trip || seatInventory.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const subtotal = seatInventory.reduce((sum, seat) => sum + seat.price_xaf, 0);
  let promoDiscount = 0;
  let referralDiscount = 0;
  
  if (appliedPromo) {
    if (appliedPromo.discount_type === 'percentage') {
      promoDiscount = Math.round(subtotal * (appliedPromo.discount_value / 100));
    } else {
      promoDiscount = appliedPromo.discount_value;
    }
  }

  if (appliedReferral) {
    referralDiscount = appliedReferral.discount_value;
  }

  const totalDiscount = promoDiscount + referralDiscount;
  const discountedSubtotal = subtotal - totalDiscount;
  const platformFee = Math.max(200, Math.round(discountedSubtotal * 0.05));
  const total = discountedSubtotal + platformFee;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Sales Window Warning */}
        {!salesCheck.eligible && (
          <Card className="p-4 bg-red-500/10 border-red-500/30 mb-6">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">{salesCheck.reason}</span>
            </div>
          </Card>
        )}

        {/* Timer */}
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30 mb-6">
          <div className="flex items-center justify-center gap-2 text-yellow-300">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">
              Seats reserved for {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </Card>

        {/* Sales Closing Info */}
        {salesCheck.eligible && salesCheck.settings && (
          <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-6">
            <p className="text-sm text-blue-300 text-center">
              Online sales close {salesCheck.settings.sales_close_minutes_before_departure} minutes before departure
              {salesCheck.minutesUntilDeparture && ` (${Math.floor(salesCheck.minutesUntilDeparture / 60)}h ${Math.round(salesCheck.minutesUntilDeparture % 60)}m remaining)`}
            </p>
          </Card>
        )}

        <Card className="p-8 bg-white/5 border-white/10">
          <h1 className="text-3xl font-bold text-white mb-8">Complete Your Booking</h1>

          {/* Order Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {seatInventory.map(seat => (
                <div key={seat.seat_code} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    Seat {seat.seat_code} {seat.seat_class === 'vip' && <Badge className="bg-purple-500/20 text-purple-400 text-xs ml-1">VIP</Badge>}
                  </span>
                  <span className="text-white">{seat.price_xaf.toLocaleString()} XAF</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-white">{subtotal.toLocaleString()} XAF</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Promo ({appliedPromo.code})</span>
                  <span>-{promoDiscount.toLocaleString()} XAF</span>
                </div>
              )}
              {appliedReferral && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Referral ({appliedReferral.code})</span>
                  <span>-{referralDiscount.toLocaleString()} XAF</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Service Fee (5%)</span>
                <span className="text-white">{platformFee.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-white/10 pt-3">
                <span className="text-white">Total</span>
                <span className="text-blue-400">{total.toLocaleString()} XAF</span>
              </div>
            </div>
          </div>

          {/* Promo Code */}
          <div className="mb-6">
            <Label className="text-gray-300 mb-2 block">Promo Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                disabled={!!appliedPromo}
                className="bg-white/5 border-white/10 text-white"
              />
              {appliedPromo ? (
                <Button
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoCode("");
                  }}
                  variant="outline"
                  className="border-white/10"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={() => applyPromoMutation.mutate(promoCode)}
                  disabled={!promoCode || applyPromoMutation.isPending}
                  variant="outline"
                  className="border-white/10"
                >
                  Apply
                </Button>
              )}
            </div>
          </div>

          {/* Referral Code */}
          <div className="mb-8">
            <Label className="text-gray-300 mb-2 block">Referral Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                disabled={!!appliedReferral}
                className="bg-white/5 border-white/10 text-white"
              />
              {appliedReferral ? (
                <Button
                  onClick={() => {
                    setAppliedReferral(null);
                    setReferralCode("");
                  }}
                  variant="outline"
                  className="border-white/10"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={() => applyReferralMutation.mutate(referralCode)}
                  disabled={!referralCode || applyReferralMutation.isPending}
                  variant="outline"
                  className="border-white/10"
                >
                  Apply
                </Button>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-8">
            <Label className="text-gray-300 mb-4 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-lg bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-all">
                  <RadioGroupItem value="momo" id="momo" />
                  <Smartphone className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">MTN Mobile Money</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-all">
                  <RadioGroupItem value="orange" id="orange" />
                  <Smartphone className="w-5 h-5 text-orange-400" />
                  <span className="text-white">Orange Money</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg bg-white/5 cursor-pointer hover:bg-white/[0.08] transition-all">
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Credit/Debit Card</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Pay Button */}
          <Button
            onClick={async () => {
              setIsProcessing(true);
              
              // Simulate payment processing
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              checkoutMutation.mutate();
            }}
            disabled={isProcessing || checkoutMutation.isPending || !salesCheck.eligible}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
          >
            {isProcessing || checkoutMutation.isPending ? (
              <>Processing Payment...</>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Pay {total.toLocaleString()} XAF
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Secure payment powered by CarryMatch. Your payment information is encrypted.
          </p>
        </Card>
      </div>
    </div>
  );
}
