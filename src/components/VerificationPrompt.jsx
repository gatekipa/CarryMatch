import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, X, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerificationPrompt({ user, onDismiss }) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user is verified or already submitted verification
  if (!user || user.is_verified || user.verification_status === "pending" || user.verification_status === "approved") {
    return null;
  }

  // Check if user has dismissed this session
  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative p-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  Verify Your Identity
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </h3>
                <p className="text-gray-300 mb-4">
                  Get verified to unlock premium benefits and increase your chances of successful matches by up to 300%
                </p>

                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">Stand Out</div>
                      <div className="text-xs text-gray-400">Get priority in search results</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">Build Trust</div>
                      <div className="text-xs text-gray-400">Users prefer verified members</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">Higher Limits</div>
                      <div className="text-xs text-gray-400">Access to premium features</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link to={createPageUrl("VerifyIdentity")} className="flex-1 sm:flex-none">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Now (2 min)
                    </Button>
                  </Link>
                  <div className="hidden sm:block text-xs text-gray-400">
                    Secure & confidential • 100% private
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}