import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plane, 
  Package, 
  Sparkles, 
  Shield, 
  MessageSquare,
  ArrowRight,
  X,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WelcomeOnboarding({ user }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(`onboarding-${user.email}`);
    
    if (!hasSeenOnboarding) {
      // Show welcome after 500ms
      setTimeout(() => setShowWelcome(true), 500);
    }
  }, [user]);

  const markOnboardingComplete = () => {
    localStorage.setItem(`onboarding-${user.email}`, 'true');
    setShowWelcome(false);
    setShowTour(false);
  };

  const startTour = () => {
    setShowWelcome(false);
    setShowTour(true);
  };

  const tourSteps = [
    {
      title: "Browse & Search",
      description: "Find travelers heading your way or requests that match your trip. Use filters to find perfect matches.",
      icon: Plane,
      highlight: "Browse Trips & Browse Requests",
      action: createPageUrl("BrowseTrips")
    },
    {
      title: "Post Your Listings",
      description: "Traveling? Post your trip to offer luggage space. Need something delivered? Post a request.",
      icon: Package,
      highlight: "Post Trip or Post Request",
      action: createPageUrl("PostTrip")
    },
    {
      title: "Smart AI Matching",
      description: "Our AI finds matches for you automatically and suggests optimal routes, packing tips, and travel times.",
      icon: Sparkles,
      highlight: "Smart Matches & AI Trip Planner",
      action: createPageUrl("SmartMatches")
    },
    {
      title: "Communicate Safely",
      description: "Chat in-app to negotiate terms, arrange meetups, and coordinate delivery. All messages are secure.",
      icon: MessageSquare,
      highlight: "Messages",
      action: createPageUrl("Messages")
    },
    {
      title: "Get Verified",
      description: "Complete ID verification to build trust, increase your match rate, and access premium features.",
      icon: Shield,
      highlight: "Profile Verification",
      action: createPageUrl("VerifyIdentity")
    }
  ];

  return (
    <>
      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] border-[#9EFF00]/20 text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-6"
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/4080502d7_Logohorizontal.png"
                alt="CarryMatch"
                className="h-16 w-auto"
              />
            </div>

            {/* Welcome Content */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">CarryMatch!</span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Send items faster, cheaper through trusted, KYC-verified travelers
              </p>
            </div>

            {/* Value Props */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 bg-white/5 border-white/10 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Plane className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <h3 className="font-semibold text-white mb-1">For Travelers</h3>
                <p className="text-sm text-gray-400">Earn money using unused luggage space</p>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">For Senders</h3>
                <p className="text-sm text-gray-400">Fast, affordable delivery worldwide</p>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">100% Secure</h3>
                <p className="text-sm text-gray-400">KYC verified users & dispute protection</p>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={startTour}
                className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold"
              >
                Take a Quick Tour
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={markOnboardingComplete}
                variant="outline"
                className="flex-1 border-[#9EFF00]/30 text-white hover:bg-[#9EFF00]/10"
              >
                Skip & Explore
              </Button>
            </div>

            {/* Profile Completion Reminder */}
            {user && !user.is_verified && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-400 mb-1">Complete Your Profile</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Get verified to unlock full platform features and build trust with other users.
                    </p>
                    <Link to={createPageUrl("VerifyIdentity")}>
                      <Button
                        size="sm"
                        onClick={markOnboardingComplete}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        Get Verified Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Tour Modal */}
      <Dialog open={showTour} onOpenChange={setShowTour}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] border-[#9EFF00]/20 text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative p-6"
            >
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Step {currentStep + 1} of {tourSteps.length}
                  </span>
                  <button
                    onClick={markOnboardingComplete}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step Content */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {React.createElement(tourSteps[currentStep].icon, {
                    className: "w-10 h-10 text-[#1A1A1A]"
                  })}
                </div>

                <h3 className="text-3xl font-bold mb-4 text-white">
                  {tourSteps[currentStep].title}
                </h3>
                <p className="text-lg text-gray-300 mb-4">
                  {tourSteps[currentStep].description}
                </p>
                <div className="inline-block px-4 py-2 rounded-lg bg-[#9EFF00]/10 border border-[#9EFF00]/30">
                  <span className="text-sm text-[#9EFF00] font-medium">
                    📍 {tourSteps[currentStep].highlight}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                {currentStep > 0 && (
                  <Button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    variant="outline"
                    className="flex-1 border-white/10 text-gray-300 hover:text-white"
                  >
                    Previous
                  </Button>
                )}
                
                {currentStep < tourSteps.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={markOnboardingComplete}
                    className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                )}
              </div>

              {/* Quick Action */}
              {currentStep === tourSteps.length - 1 && (
                <Link to={tourSteps[currentStep].action}>
                  <Button
                    onClick={markOnboardingComplete}
                    variant="outline"
                    className="w-full mt-4 border-[#9EFF00]/30 text-white hover:bg-[#9EFF00]/10"
                  >
                    Go to {tourSteps[currentStep].highlight}
                  </Button>
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}