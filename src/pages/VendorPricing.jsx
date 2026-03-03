import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Users,
  Building2,
  Zap,
  ArrowRight,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

const FALLBACK_PLANS = [
  { id: "starter", name: "STARTER", display_name: "Starter", description: "Perfect for new logistics partners starting out", monthly_price: 0, annual_price: 0, included_shipments: 50, overage_fee: 0.5, included_branches: 1, included_staff_seats: 2, features: ["Basic tracking", "Email support", "Single branch", "Up to 50 shipments/mo"], is_active: true, is_most_popular: false, sort_order: 1 },
  { id: "growth", name: "GROWTH", display_name: "Growth", description: "For growing businesses expanding their reach", monthly_price: 29, annual_price: 290, included_shipments: 500, overage_fee: 0.25, included_branches: 3, included_staff_seats: 5, features: ["Real-time tracking", "Priority support", "3 branches", "500 shipments/mo", "Analytics dashboard", "Bulk operations"], is_active: true, is_most_popular: false, sort_order: 2 },
  { id: "pro", name: "PRO", display_name: "Pro", description: "Full-featured plan for established operations", monthly_price: 79, annual_price: 790, included_shipments: 2000, overage_fee: 0.15, included_branches: 10, included_staff_seats: 15, features: ["Advanced tracking", "24/7 phone support", "10 branches", "2000 shipments/mo", "Advanced analytics", "API access", "Custom branding", "Insurance claims"], is_active: true, is_most_popular: true, sort_order: 3 },
  { id: "enterprise", name: "ENTERPRISE", display_name: "Enterprise", description: "Custom solutions for large-scale operations", monthly_price: 0, annual_price: 0, included_shipments: 999999, overage_fee: 0, included_branches: 999, included_staff_seats: 999, features: ["Unlimited everything", "Dedicated account manager", "Custom integrations", "SLA guarantee", "White-label options", "Priority routing"], is_active: true, is_most_popular: false, sort_order: 4 },
];

export default function VendorPricing() {
  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ['subscription-plans-public'],
    queryFn: async () => {
      try {
        const allPlans = await base44.entities.SubscriptionPlan.filter({ is_active: true });
        const active = allPlans.filter(p => p.is_active === true).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        return active.length > 0 ? active : FALLBACK_PLANS;
      } catch (err) {
        console.error('Failed to fetch plans, using defaults:', err);
        return FALLBACK_PLANS;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-16">
            <Badge className="bg-[#9EFF00]/20 text-[#9EFF00] mb-4">
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Scale your logistics operations with CarryMatch. All plans include our core platform features.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9EFF00]"></div>
              <p className="text-gray-400 mt-4">Loading plans...</p>
            </div>
          ) : error || plans.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-lg border border-white/10">
              <p className="text-gray-400 mb-4">Unable to load pricing plans. Please try again later.</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10">
                Reload Page
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {plans.map((plan, index) => {
                const isPopular = plan.is_most_popular;
                const isEnterprise = plan.name === "ENTERPRISE";
                const annualSavings = plan.annual_price ? Math.round((1 - plan.annual_price / (plan.monthly_price * 12)) * 100) : 0;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`p-6 bg-white/5 border-white/10 h-full relative flex flex-col transition-all hover:border-white/20 ${
                      isPopular ? "ring-2 ring-[#9EFF00] lg:col-span-1" : ""
                    }`}>
                      {isPopular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#9EFF00] text-[#1A1A1A] font-bold">
                          Most Popular
                        </Badge>
                      )}

                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.display_name}</h3>
                        <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                        
                        <div className="mb-4">
                          {isEnterprise ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-[#9EFF00]">Custom</span>
                            </div>
                          ) : plan.monthly_price === 0 ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold text-[#9EFF00]">Free</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-[#9EFF00]">${plan.monthly_price}</span>
                                <span className="text-gray-400">/month</span>
                              </div>
                              {plan.annual_price > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  ${plan.annual_price}/year (save {annualSavings}%)
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.included_shipments !== undefined && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Package className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <div>
                              <p className="text-white font-medium">{plan.included_shipments >= 99999 ? "Unlimited" : plan.included_shipments.toLocaleString()} shipments/mo</p>
                              {plan.overage_fee > 0 && <p className="text-xs text-gray-500">${plan.overage_fee} per extra</p>}
                            </div>
                          </div>
                        )}

                        {plan.included_branches !== undefined && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div>
                              <p className="text-white font-medium">{plan.included_branches >= 999 ? "Unlimited" : plan.included_branches} {plan.included_branches < 999 ? (plan.included_branches === 1 ? 'branch' : 'branches') : 'branches'}</p>
                            </div>
                          </div>
                        )}

                        {plan.included_staff_seats !== undefined && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <Users className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <div>
                              <p className="text-white font-medium">{plan.included_staff_seats >= 999 ? "Unlimited" : plan.included_staff_seats} staff seats</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-2 mb-6 flex-grow">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-[#9EFF00] flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300">{feature}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <Link to={isEnterprise ? createPageUrl("ContactUs") : createPageUrl("PartnerSignup")} className="mt-auto block">
                        <Button className={`w-full font-bold ${
                          isPopular 
                            ? "bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A]" 
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}>
                          {isEnterprise ? "Contact Sales" : "Get Started"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Features Comparison */}
          <Card className="p-8 bg-white/5 border-white/10 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">All Plans Include</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Fast Setup", desc: "Get started in minutes" },
                { icon: DollarSign, title: "Flexible Payment", desc: "Online & offline options" },
                { icon: CheckCircle, title: "No Lock-in", desc: "Cancel anytime" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#9EFF00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#9EFF00]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Logistics?</h2>
            <p className="text-gray-400 mb-8">Join hundreds of vendors using CarryMatch</p>
            <div className="flex gap-4 justify-center">
              <Link to={createPageUrl("PartnerSignup")}>
                <Button size="lg" className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold px-8">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("ContactUs")}>
                <Button size="lg" variant="outline" className="border-white/10 text-gray-300 px-8">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}