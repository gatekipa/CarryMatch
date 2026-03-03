import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Key, Edit, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ManageAgentPINs() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['operator-staff', operator?.id],
    queryFn: () => base44.entities.OperatorStaff.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const setPinMutation = useMutation({
    mutationFn: async ({ staffId, pin }) => {
      // Simple hash (in production, use bcrypt)
      const hash = btoa(pin);
      return await base44.entities.OperatorStaff.update(staffId, { pin_hash: hash });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['operator-staff']);
      toast.success("PIN set successfully!");
      setShowPinDialog(false);
      setSelectedStaff(null);
      setPinInput("");
      setConfirmPin("");
    }
  });

  const handleSetPin = () => {
    if (pinInput.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    if (pinInput !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    setPinMutation.mutate({ staffId: selectedStaff.id, pin: pinInput });
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Agent PINs</h1>
          <p className="text-gray-400">Manage staff PINs for agent mode access</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {staff.map((member) => (
            <Card key={member.id} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{member.user_id.split('@')[0]}</h3>
                    <p className="text-sm text-gray-400">{member.user_id}</p>
                  </div>
                </div>
                <Badge className={
                  member.staff_role === 'vendor_bus_operator' ? 'bg-purple-500/20 text-purple-400' :
                  member.staff_role === 'vendor_bus_agent' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }>
                  {member.staff_role === 'vendor_bus_operator' ? 'Operator' :
                   member.staff_role === 'vendor_bus_agent' ? 'Agent' : 'Check-in'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                {member.pin_hash ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">PIN Configured</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No PIN set</span>
                )}

                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedStaff(member);
                    setShowPinDialog(true);
                  }}
                  className="bg-blue-500"
                >
                  <Key className="w-3 h-3 mr-1" />
                  {member.pin_hash ? 'Change PIN' : 'Set PIN'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {staff.length === 0 && (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Staff Members</h3>
            <p className="text-gray-400">Add staff members to set their PINs</p>
          </Card>
        )}

        {/* Set PIN Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Set PIN for {selectedStaff?.user_id.split('@')[0]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Enter 4-Digit PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest mt-2"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-gray-300">Confirm PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest mt-2"
                />
              </div>

              <Button
                onClick={handleSetPin}
                disabled={pinInput.length !== 4 || confirmPin.length !== 4 || setPinMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {setPinMutation.isPending ? "Saving..." : "Set PIN"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Staff will use this PIN to unlock agent mode on tablets
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}