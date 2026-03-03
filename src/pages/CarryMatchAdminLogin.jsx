import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CarryMatchAdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-check if user is already logged in as admin
    base44.auth.me()
      .then(user => {
        if (user.role === "admin") {
          navigate(createPageUrl("CarryMatchAdminDashboard"));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleLogin = () => {
    // Use Base44's built-in authentication
    base44.auth.redirectToLogin(window.location.pathname);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <p className="text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CarryMatch Admin</h1>
          <p className="text-gray-400">Internal Management Portal</p>
        </div>

        <div className="p-8 bg-white/5 border border-red-500/20 backdrop-blur-xl rounded-xl">
          <div className="text-center space-y-6">
            <p className="text-gray-300">
              You need to sign in with an admin account to access this portal.
            </p>
            
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-6 text-lg"
            >
              Sign In with Base44
            </Button>

            <p className="text-xs text-gray-500">
              Only authorized admin accounts can access this portal
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          CarryMatch Internal Use Only • Unauthorized access is prohibited
        </p>
      </motion.div>
    </div>
  );
}