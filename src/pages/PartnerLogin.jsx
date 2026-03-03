import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Truck, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      // Check if user is vendor staff before login
      const vendorStaff = await base44.entities.VendorStaff.filter({
        email: email.toLowerCase(),
        status: "ACTIVE"
      }).catch(() => {
        // If not found, continue with Base44 auth
        return [];
      });

      if (vendorStaff.length === 0) {
        setError("No active vendor account found. Please apply first or contact support.");
        setIsLoading(false);
        return;
      }

      // Redirect to Base44 login - will redirect back to vendor dashboard
      base44.auth.redirectToLogin(`${window.location.origin}${createPageUrl("VendorDashboard")}`);
    } catch (err) {
      setError("Authentication check failed. Please try again.");
      setIsLoading(false);
    }
  };

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

            {error && (
              <Card className="p-4 bg-red-500/10 border-red-500/30 mb-6">
                <p className="text-sm text-red-300">{error}</p>
              </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@company.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold py-6"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

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