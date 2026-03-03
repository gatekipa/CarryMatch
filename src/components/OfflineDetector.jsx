import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Offline Detector Component
 * Shows banner when user goes offline
 * Auto-hides when back online
 */

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-16 left-0 right-0 z-50 px-4"
          >
            <Card className="max-w-2xl mx-auto p-4 bg-red-500/90 border-red-600 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-white" />
                <div className="flex-1">
                  <p className="font-semibold text-white">You're offline</p>
                  <p className="text-sm text-red-100">Some features may be limited until connection is restored</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReconnected && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-16 left-0 right-0 z-50 px-4"
          >
            <Card className="max-w-2xl mx-auto p-4 bg-green-500/90 border-green-600 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-white" />
                <div className="flex-1">
                  <p className="font-semibold text-white">Back online!</p>
                  <p className="text-sm text-green-100">Connection restored successfully</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}