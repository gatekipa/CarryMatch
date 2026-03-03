import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PWA Install Prompt Component
 * Shows installation prompt for Progressive Web App
 * Detects iOS Safari, Android Chrome, and other browsers
 */

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed before
    const hasSeenPrompt = localStorage.getItem('pwa-install-dismissed');
    
    if (!isInStandaloneMode && !hasSeenPrompt) {
      // Show after 30 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt (Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt && !isIOS) {
      // If no prompt available, provide manual instructions
      alert("To install:\n1. Open browser menu\n2. Select 'Add to Home Screen' or 'Install App'");
      return;
    }

    if (isIOS) {
      // iOS users need manual installation
      return;
    }

    try {
      // Show browser install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
      // Fallback: provide manual instructions
      alert("To install:\n1. Open browser menu\n2. Select 'Add to Home Screen' or 'Install App'");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md"
      >
        <Card className="p-4 bg-gradient-to-br from-[#9EFF00]/10 to-[#7ACC00]/10 border-[#9EFF00]/30 backdrop-blur-xl shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-start gap-3 pr-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">Install CarryMatch</h3>
              <p className="text-sm text-gray-300 mb-3">
                {isIOS 
                  ? "Add to Home Screen for the best experience"
                  : "Get the app for faster access and offline support"
                }
              </p>

              {isIOS ? (
                <div className="space-y-1.5 text-xs text-gray-400">
                  <p className="flex items-center gap-2">
                    <span className="text-base">1️⃣</span> Tap Share <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500/20 rounded text-base">⎙</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-base">2️⃣</span> Tap "Add to Home Screen"
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-base">3️⃣</span> Tap "Add"
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}