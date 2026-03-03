import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function AgentLockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    setIsChecking(true);
    try {
      await onUnlock(pin);
      setPin("");
    } catch (error) {
      toast.error("Invalid PIN");
      setPin("");
    }
    setIsChecking(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] z-[100] flex items-center justify-center p-4">
      <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-xl text-center max-w-md w-full">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Agent Mode Locked</h2>
        <p className="text-gray-400 mb-8">Enter your 4-digit PIN to continue</p>

        <form onSubmit={handleUnlock}>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • •"
            className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest mb-6"
            autoFocus
          />
          
          <Button
            type="submit"
            disabled={pin.length !== 4 || isChecking}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-lg py-6"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isChecking ? "Checking..." : "Unlock"}
          </Button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          Contact your manager if you forgot your PIN
        </p>
      </Card>
    </div>
  );
}