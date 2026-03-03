import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  Upload,
  Key,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import OfflinePaymentDialog from "@/components/vendor/OfflinePaymentDialog";
import RedeemCodeDialog from "@/components/vendor/RedeemCodeDialog";
import { toast } from "sonner";

export default function VendorBilling() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [showOfflinePayment, setShowOfflinePayment] = useState(false);
  const [showRedeemCode, setShowRedeemCode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return base44.entities.Vendor.filter({ id: staff[0].vendor_id });
          }
        })
        .then(vendors => {
          if (vendors) {
            setVendor(vendors?.[0]);
          }
        });
    }
  }, [user]);

  const permissions = useVendorPermissions(vendorStaff);

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const dbPlans = await base44.entities.SubscriptionPlan.filter({ is_active: true });
      if (dbPlans.length > 0) return dbPlans;
      // Fallback plans when DB is empty
      return [
        { name: "STARTER", display_name: "Starter", monthly_price: 0, annual_price: 0, included_shipments: 50, overage_fee: 0.5, included_branches: 1, included_staff_seats: 2, is_active: true, features: ["Basic tracking", "Email support", "Label printing"] },
        { name: "GROWTH", display_name: "Growth", monthly_price: 29, annual_price: 290, included_shipments: 500, overage_fee: 0.25, included_branches: 3, included_staff_seats: 5, is_active: true, features: ["Real-time tracking", "Priority support", "Analytics", "Bulk operations"] },
        { name: "PRO", display_name: "Pro", monthly_price: 79, annual_price: 790, included_shipments: 2000, overage_fee: 0.15, included_branches: 10, included_staff_seats: 15, is_active: true, features: ["Advanced tracking", "Phone support", "API access", "Custom branding", "Insurance management"] },
        { name: "ENTERPRISE", display_name: "Enterprise", monthly_price: 0, annual_price: 0, included_shipments: 999999, overage_fee: 0, included_branches: 999, included_staff_seats: 999, is_active: true, features: ["Dedicated account manager", "Custom integrations", "White label", "SLA guarantee", "Unlimited everything"] },
      ];
    }
  });

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['vendor-pending-payments', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      return await base44.entities.SubscriptionPayment.filter({
        vendor_id: vendor.id,
        status: "AWAITING_VERIFICATION"
      }, "-created_date");
    },
    enabled: !!vendor
  });

  const currentPlan = plans.find(p => p.name === vendor?.current_plan);
  const usagePercent = currentPlan 
    ? Math.min(100, ((vendor.shipments_this_period || 0) / currentPlan.included_shipments) * 100)
    : 0;

  const overageCount = currentPlan && vendor.shipments_this_period > currentPlan.included_shipments
    ? vendor.shipments_this_period - currentPlan.included_shipments
    : 0;

  const overageFee = overageCount * (currentPlan?.overage_fee || 0);

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

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!permissions.isOwner && !permissions.isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <p className="text-gray-400">Only owners and managers can access billing</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
            <p className="text-gray-400">Manage your plan and usage</p>
          </div>

          {/* Renewal Warning Banner */}
          {vendor.plan_expires_at && (() => {
            const daysLeft = differenceInDays(new Date(vendor.plan_expires_at), new Date());
            if (daysLeft <= 0) {
              return (
                <Card className="p-4 bg-red-500/10 border-red-500/40 mb-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                      <div>
                        <p className="text-red-300 font-bold">Your subscription has expired</p>
                        <p className="text-sm text-red-400/80">Renew now to avoid service interruption. Some features may be restricted.</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowRedeemCode(true)} className="bg-red-500 text-white font-bold hover:bg-red-600">
                      <Key className="w-4 h-4 mr-2" /> Renew Now
                    </Button>
                  </div>
                </Card>
              );
            } else if (daysLeft <= 3) {
              return (
                <Card className="p-4 bg-amber-500/10 border-amber-500/40 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-amber-400" />
                      <div>
                        <p className="text-amber-300 font-bold">Your plan expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                        <p className="text-sm text-amber-400/80">Renew to keep your current features and avoid disruption.</p>
                      </div>
                    </div>
                    <Button onClick={() => setShowRedeemCode(true)} className="bg-amber-500 text-black font-bold hover:bg-amber-600">
                      <Key className="w-4 h-4 mr-2" /> Renew
                    </Button>
                  </div>
                </Card>
              );
            }
            return null;
          })()}

          {/* Current Plan */}
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {currentPlan?.display_name || "Free Plan"}
                  </h2>
                  {vendor.plan_expires_at && (() => {
                    const daysLeft = Math.ceil((new Date(vendor.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 0) {
                      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Expired</Badge>;
                    } else if (daysLeft <= 3) {
                      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">Expires in {daysLeft}d</Badge>;
                    } else if (daysLeft <= 7) {
                      return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Expires in {daysLeft}d</Badge>;
                    }
                    return <Badge className="bg-green-500/20 text-green-300"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
                  })()}
                </div>
                {vendor.plan_expires_at && (
                  <p className="text-sm text-gray-400">
                    Renews on {format(new Date(vendor.plan_expires_at), "MMMM d, yyyy")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRedeemCode(true)}
                  variant="outline"
                  className="border-white/10 text-gray-300"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Redeem Code
                </Button>
              </div>
            </div>

            {currentPlan && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Shipments Used</span>
                    <span className="text-sm font-bold text-white">
                      {vendor.shipments_this_period || 0} / {currentPlan.included_shipments >= 99999 ? "Unlimited" : currentPlan.included_shipments}
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-2" />
                </div>

                {overageCount > 0 && currentPlan.overage_fee > 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400">
                      ⚠️ Overage: {overageCount} shipments × ${currentPlan.overage_fee} = ${overageFee.toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Branches</p>
                    <p className="text-lg font-bold text-white">{currentPlan.included_branches >= 999 ? "Unlimited" : currentPlan.included_branches}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Staff Seats</p>
                    <p className="text-lg font-bold text-white">{currentPlan.included_staff_seats >= 999 ? "Unlimited" : currentPlan.included_staff_seats}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400">Overage Fee</p>
                    <p className="text-lg font-bold text-white">{currentPlan.overage_fee > 0 ? `$${currentPlan.overage_fee}/shipment` : "N/A"}</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Pending Payments */}
          {pendingPayments.length > 0 && (
            <Card className="p-6 bg-yellow-500/10 border-yellow-500/30 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-yellow-400">Pending Payment Verification</h3>
              </div>
              {pendingPayments.map(payment => (
                <div key={payment.id} className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white">{payment.plan_name} - {payment.billing_period}</p>
                  <p className="text-sm text-gray-400">Submitted {format(new Date(payment.created_date), "MMM d, yyyy")}</p>
                </div>
              ))}
            </Card>
          )}

          {/* Available Plans */}
          <h2 className="text-xl font-bold text-white mb-4">Available Plans</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all ${
                  plan.name === vendor.current_plan ? "ring-2 ring-[#9EFF00]" : ""
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{plan.display_name}</h3>
                    {plan.name === vendor.current_plan && (
                      <Badge className="bg-[#9EFF00]/20 text-[#9EFF00] border border-[#9EFF00]/30">Current</Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-[#9EFF00] mb-4">
                    {plan.name === "ENTERPRISE" ? "Custom" : plan.monthly_price === 0 ? "Free" : `$${plan.monthly_price}`}
                    {plan.monthly_price > 0 && <span className="text-sm text-gray-400">/mo</span>}
                  </p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-400">
                      <Package className="w-3 h-3 inline mr-1" />
                      {plan.included_shipments >= 99999 ? "Unlimited" : plan.included_shipments} shipments/mo
                    </p>
                    {plan.overage_fee > 0 && (
                      <p className="text-sm text-gray-400">
                        ${plan.overage_fee} per extra shipment
                      </p>
                    )}
                    <p className="text-sm text-gray-400">
                      {plan.included_branches >= 999 ? "Unlimited" : plan.included_branches} branches
                    </p>
                    <p className="text-sm text-gray-400">
                      {plan.included_staff_seats >= 999 ? "Unlimited" : plan.included_staff_seats} staff seats
                    </p>
                  </div>
                  {plan.features && plan.features.length > 0 && (
                    <div className="space-y-1 mb-4 border-t border-white/5 pt-3">
                      {plan.features.map((feature, idx) => (
                        <p key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-[#9EFF00]" />
                          {feature}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {plan.name === "ENTERPRISE" ? (
                      <Button onClick={() => window.location.href = "mailto:partners@carrymatch.com?subject=Enterprise Plan Inquiry"} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold">
                        Contact Sales
                      </Button>
                    ) : plan.name === vendor.current_plan ? (
                      <Button disabled className="w-full bg-white/10 text-gray-400">
                        <CheckCircle className="w-4 h-4 mr-2" /> Current Plan
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => toast.info("Online payment coming soon")} disabled className="w-full bg-blue-500/50 text-white opacity-50">
                          <CreditCard className="w-4 h-4 mr-2" /> Pay Online
                        </Button>
                        <Button onClick={() => { setSelectedPlan(plan); setShowOfflinePayment(true); }} variant="outline" className="w-full border-white/10 text-gray-300">
                          <Upload className="w-4 h-4 mr-2" /> Pay Offline
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {showOfflinePayment && selectedPlan && (
        <OfflinePaymentDialog
          plan={selectedPlan}
          vendor={vendor}
          vendorStaff={vendorStaff}
          onClose={() => {
            setShowOfflinePayment(false);
            setSelectedPlan(null);
          }}
        />
      )}

      {showRedeemCode && (
        <RedeemCodeDialog
          vendor={vendor}
          vendorStaff={vendorStaff}
          onClose={() => setShowRedeemCode(false)}
        />
      )}
    </div>
  );
}