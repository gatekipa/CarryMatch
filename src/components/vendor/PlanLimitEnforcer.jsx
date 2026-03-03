import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── Plan limits (single source of truth, matches VendorPricing) ─────────────
export const PLAN_LIMITS = {
  STARTER:    { shipments: 50,     branches: 1,   staff: 2,   overage: 0.50 },
  GROWTH:     { shipments: 500,    branches: 3,   staff: 5,   overage: 0.25 },
  PRO:        { shipments: 2000,   branches: 10,  staff: 15,  overage: 0.15 },
  ENTERPRISE: { shipments: 999999, branches: 999, staff: 999, overage: 0    },
};

// ─── Feature access per plan tier ────────────────────────────────────────────
const PLAN_FEATURES = {
  STARTER: {
    basic_tracking: true, email_support: true,
    real_time_tracking: false, priority_support: false, analytics: false,
    bulk_operations: false, advanced_tracking: false, phone_support: false,
    api_access: false, custom_branding: false, insurance: false,
    dedicated_am: false, custom_integrations: false, white_label: false,
  },
  GROWTH: {
    basic_tracking: true, email_support: true,
    real_time_tracking: true, priority_support: true, analytics: true,
    bulk_operations: true, advanced_tracking: false, phone_support: false,
    api_access: false, custom_branding: false, insurance: false,
    dedicated_am: false, custom_integrations: false, white_label: false,
  },
  PRO: {
    basic_tracking: true, email_support: true,
    real_time_tracking: true, priority_support: true, analytics: true,
    bulk_operations: true, advanced_tracking: true, phone_support: true,
    api_access: true, custom_branding: true, insurance: true,
    dedicated_am: false, custom_integrations: false, white_label: false,
  },
  ENTERPRISE: {
    basic_tracking: true, email_support: true,
    real_time_tracking: true, priority_support: true, analytics: true,
    bulk_operations: true, advanced_tracking: true, phone_support: true,
    api_access: true, custom_branding: true, insurance: true,
    dedicated_am: true, custom_integrations: true, white_label: true,
  },
};

const FEATURE_MIN_PLAN = {
  analytics: "GROWTH", bulk_operations: "GROWTH",
  real_time_tracking: "GROWTH", priority_support: "GROWTH",
  advanced_tracking: "PRO", phone_support: "PRO",
  api_access: "PRO", custom_branding: "PRO", insurance: "PRO",
  dedicated_am: "ENTERPRISE", custom_integrations: "ENTERPRISE", white_label: "ENTERPRISE",
};

// ─── usePlanLimits hook ──────────────────────────────────────────────────────
export function usePlanLimits(vendor) {
  const planName = vendor?.current_plan || "STARTER";
  const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.STARTER;
  const features = PLAN_FEATURES[planName] || PLAN_FEATURES.STARTER;

  if (!vendor) {
    return {
      hasReachedShipmentLimit: false, hasReachedBranchLimit: false, hasReachedStaffLimit: false,
      remainingShipments: 0, remainingBranches: 0, remainingStaff: 0,
      shipmentUsagePercent: 0, branchUsagePercent: 0, staffUsagePercent: 0,
      isLimited: false, limits, currentPlan: "STARTER", overageFee: 0.50,
      hasFeature: () => true, minPlanFor: () => "STARTER",
    };
  }

  const su = vendor.shipments_this_period || 0;
  const bc = vendor.branch_count || 0;
  const sc = vendor.staff_count || 0;

  return {
    hasReachedShipmentLimit: su >= limits.shipments,
    hasReachedBranchLimit: bc >= limits.branches,
    hasReachedStaffLimit: sc >= limits.staff,
    remainingShipments: Math.max(0, limits.shipments - su),
    remainingBranches: Math.max(0, limits.branches - bc),
    remainingStaff: Math.max(0, limits.staff - sc),
    shipmentUsagePercent: Math.min(100, (su / limits.shipments) * 100),
    branchUsagePercent: Math.min(100, (bc / limits.branches) * 100),
    staffUsagePercent: Math.min(100, (sc / limits.staff) * 100),
    isLimited: su >= limits.shipments || bc >= limits.branches || sc >= limits.staff,
    limits, overageFee: limits.overage, currentPlan: planName,
    hasFeature: (feat) => features[feat] === true,
    minPlanFor: (feat) => FEATURE_MIN_PLAN[feat] || "STARTER",
  };
}

// ─── PlanGate component — wraps pages behind plan feature checks ─────────────
export function PlanGate({ vendor, feature, featureLabel, children }) {
  const planName = vendor?.current_plan || "STARTER";
  const features = PLAN_FEATURES[planName] || PLAN_FEATURES.STARTER;
  if (features[feature] === true) return children;

  const minPlan = FEATURE_MIN_PLAN[feature] || "GROWTH";
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="p-10 bg-white/5 border-white/10 text-center max-w-lg">
        <div className="w-16 h-16 mx-auto mb-6 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-yellow-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          {featureLabel || feature.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </h3>
        <p className="text-gray-400 mb-2">
          This feature requires the <span className="text-[#9EFF00] font-bold">{minPlan}</span> plan or higher.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You're on the <span className="text-white font-semibold">{planName}</span> plan.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to={createPageUrl("VendorBilling")}>
            <Button className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold">
              Upgrade Plan <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to={createPageUrl("VendorPricing")}>
            <Button variant="outline" className="border-white/10 text-gray-300">Compare Plans</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ─── PlanLimitWarning ────────────────────────────────────────────────────────
export function PlanLimitWarning({ message, type = "warning" }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${
      type === "error" ? "bg-red-500/10 border-red-500/30" : "bg-yellow-500/10 border-yellow-500/30"
    }`}>
      <AlertTriangle className={`w-5 h-5 ${type === "error" ? "text-red-400" : "text-yellow-400"}`} />
      <p className={`text-sm ${type === "error" ? "text-red-300" : "text-yellow-300"}`}>{message}</p>
    </div>
  );
}

// ─── PlanUsageBadge ──────────────────────────────────────────────────────────
export function PlanUsageBadge({ current, limit, label }) {
  const pct = Math.min(100, (current / limit) * 100);
  const near = pct >= 80;
  const over = pct >= 100;
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex-1">
        <p className="text-sm text-gray-400">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-lg font-bold text-white">{limit >= 99999 ? `${current} / Unlimited` : `${current} / ${limit}`}</p>
          {over ? <Badge className="bg-red-500/20 text-red-300 text-xs">Over Limit</Badge> : near ? <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">Near Limit</Badge> : null}
        </div>
      </div>
      <div className="w-32">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full transition-all ${over ? "bg-red-500" : near ? "bg-yellow-500" : "bg-[#9EFF00]"}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(pct)}%</p>
      </div>
    </div>
  );
}
