import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Truck, Bus, Package, Loader2, LogIn } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Unified Partner Login page.
 *
 * 1. If already logged in → checks VendorStaff AND BusOperator for the user's email.
 *    • parcel partner only  → auto-redirect to VendorDashboard
 *    • bus operator only    → auto-redirect to VendorBusDashboard
 *    • both                 → show choice buttons
 *    • neither              → "No partner account" with signup links
 * 2. If not logged in → single "Sign In" button via Base44 auth.
 */
export default function PartnerLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [isBusOperator, setIsBusOperator] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const currentUser = await base44.auth.me();
        if (cancelled) return;
        setUser(currentUser);
        setChecking(true);

        // Check both partner types in parallel
        const [vendorStaff, busOperators] = await Promise.all([
          base44.entities.VendorStaff.filter({ email: currentUser.email, status: "ACTIVE" }).catch(() => []),
          base44.entities.BusOperator.filter({ created_by: currentUser.email }).catch(() => []),
        ]);

        if (cancelled) return;

        const hasVendor = vendorStaff.length > 0;
        const hasBus = busOperators.length > 0;
        setIsVendor(hasVendor);
        setIsBusOperator(hasBus);

        // Auto-redirect if only one type
        if (hasVendor && !hasBus) {
          navigate(createPageUrl("VendorDashboard"), { replace: true });
          return;
        }
        if (hasBus && !hasVendor) {
          navigate(createPageUrl("VendorBusDashboard"), { replace: true });
          return;
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) { setAuthChecked(true); setChecking(false); }
      }
    }

    checkAccess();
    return () => { cancelled = true; };
  }, [navigate]);

  // Loading state
  if (!authChecked || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("LogisticsPartners"))}
            className="mb-6 text-gray-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Partners
          </Button>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Partner Login</h1>
              <p className="text-gray-400">Access your CML logistics dashboard</p>
            </div>

            {/* ── Not logged in ── */}
            {!user && (
              <div className="space-y-4">
                <Button
                  onClick={() => base44.auth.redirectToLogin(`${window.location.origin}${createPageUrl("PartnerLogin")}`)}
                  className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold py-6"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In with your Account
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  You'll be redirected to sign in, then brought back here automatically.
                </p>
              </div>
            )}

            {/* ── Logged in + BOTH partner types ── */}
            {user && isVendor && isBusOperator && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 text-center mb-4">
                  Welcome back, <span className="text-white font-medium">{user.full_name || user.email}</span>.
                  Choose your dashboard:
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("VendorDashboard"))}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 justify-start"
                >
                  <Package className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Parcel / Logistics Dashboard</div>
                    <div className="text-xs opacity-70">Shipments, batches, manifests</div>
                  </div>
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("VendorBusDashboard"))}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 justify-start"
                >
                  <Bus className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Bus Operations Dashboard</div>
                    <div className="text-xs opacity-70">Tickets, routes, fleet</div>
                  </div>
                </Button>
              </div>
            )}

            {/* ── Logged in but NO partner account ── */}
            {user && !isVendor && !isBusOperator && (
              <div className="space-y-4">
                <Card className="p-4 bg-amber-500/10 border-amber-500/30">
                  <p className="text-sm text-amber-200">
                    No partner account found for <span className="font-medium">{user.email}</span>.
                  </p>
                </Card>
                <p className="text-sm text-gray-400 text-center">
                  Register as a partner to get started:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("PartnerSignup"))}
                    className="border-white/10 text-gray-300 hover:bg-white/10 py-5"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Logistics Partner
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("BusOperatorSignup"))}
                    className="border-white/10 text-gray-300 hover:bg-white/10 py-5"
                  >
                    <Bus className="w-4 h-4 mr-2" />
                    Bus Operator
                  </Button>
                </div>
              </div>
            )}

            {/* ── Bottom link ── */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don't have a partner account?{" "}
                <button
                  onClick={() => navigate(createPageUrl("PartnerSignup"))}
                  className="text-[#9EFF00] hover:text-[#7ACC00] font-medium"
                >
                  Apply Now
                </button>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
