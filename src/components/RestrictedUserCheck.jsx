import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";

export default function RestrictedUserCheck({ children }) {
  const [user, setUser] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRestriction = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.is_restricted) {
          setIsRestricted(true);
        }
      } catch (error) {
        // Not logged in or error
      }
      setLoading(false);
    };

    checkRestriction();
  }, []);

  if (loading) {
    return children;
  }

  if (isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A1628] via-[#0F1D35] to-[#0A1628]">
        <Card className="p-12 bg-white/5 border-red-500/30 text-center backdrop-blur-sm max-w-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Account Restricted</h1>
          <p className="text-xl text-gray-300 mb-6">
            Your account has been restricted from the CarryMatch platform.
          </p>
          {user?.restriction_reason && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-6">
              <p className="text-sm font-semibold text-red-400 mb-2">Reason:</p>
              <p className="text-gray-300">{user.restriction_reason}</p>
            </div>
          )}
          <p className="text-gray-400 mb-8">
            If you believe this is an error, please contact our support team at{" "}
            <a href="mailto:info@carrymatch.com" className="text-blue-400 hover:text-blue-300">
              info@carrymatch.com
            </a>
          </p>
          <Button
            onClick={() => base44.auth.logout()}
            variant="outline"
            className="border-white/10 text-gray-300 hover:text-white"
          >
            Sign Out
          </Button>
        </Card>
      </div>
    );
  }

  return children;
}