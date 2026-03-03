import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, DollarSign, Clock, Shield, CheckCircle, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminBusSettings() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const [platformFeeType, setPlatformFeeType] = useState("percentage");
  const [platformFeeValue, setPlatformFeeValue] = useState("5");
  const [holdTimeoutMinutes, setHoldTimeoutMinutes] = useState("15");
  const [selectedOperator, setSelectedOperator] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operators = [] } = useQuery({
    queryKey: ['all-bus-operators'],
    queryFn: () => base44.entities.BusOperator.filter({}),
    enabled: !!user && user.role === 'admin'
  });

  const suspendOperatorMutation = useMutation({
    mutationFn: async (operatorId) => {
      await base44.entities.BusOperator.update(operatorId, { status: "suspended" });
      
      // Hide all their trips
      const trips = await base44.entities.Trip.filter({ operator_id: operatorId });
      for (const trip of trips) {
        await base44.entities.Trip.update(trip.id, { trip_status: "canceled" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bus-operators']);
      toast.success("Operator suspended and trips hidden");
    },
    onError: () => {
      toast.error("Failed to suspend operator");
    }
  });

  const activateOperatorMutation = useMutation({
    mutationFn: (operatorId) => base44.entities.BusOperator.update(operatorId, { status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bus-operators']);
      toast.success("Operator activated");
    }
  });

  const verifyOperatorMutation = useMutation({
    mutationFn: (operatorId) => base44.entities.BusOperator.update(operatorId, { 
      verification_status: "verified",
      verification_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bus-operators']);
      toast.success("Operator verified");
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-2xl font-bold text-white mb-2">Admin Access Required</h3>
          <p className="text-gray-400">You don't have permission to access this page</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bus System Settings</h1>
          <p className="text-gray-400">Configure platform fees, policies, and manage operators</p>
        </div>

        {/* Platform Configuration */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Platform Fee Model</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Fee Type</Label>
                <Select value={platformFeeType} onValueChange={setPlatformFeeType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Amount (XAF)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">
                  {platformFeeType === "flat" ? "Fee Amount (XAF)" : "Fee Percentage (%)"}
                </Label>
                <Input
                  type="number"
                  value={platformFeeValue}
                  onChange={(e) => setPlatformFeeValue(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder={platformFeeType === "flat" ? "e.g., 500" : "e.g., 5"}
                />
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  Current Model: {platformFeeType === "flat" 
                    ? `${platformFeeValue} XAF per ticket` 
                    : `${platformFeeValue}% of ticket price`}
                </p>
              </div>

              <Button className="w-full bg-green-500">
                <Settings className="w-4 h-4 mr-2" />
                Save Fee Settings
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Seat Hold Policy</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Hold Timeout (Minutes)</Label>
                <Input
                  type="number"
                  value={holdTimeoutMinutes}
                  onChange={(e) => setHoldTimeoutMinutes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., 15"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Time before unpaid reservations are automatically released
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-400">
                  Current: Seats held for {holdTimeoutMinutes} minutes
                </p>
              </div>

              <Button className="w-full bg-purple-500">
                <Settings className="w-4 h-4 mr-2" />
                Update Hold Policy
              </Button>
            </div>
          </Card>
        </div>

        {/* Operator Management */}
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Operator Management</h3>
          </div>

          <div className="space-y-4">
            {operators.map(operator => (
              <div key={operator.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-white">{operator.name}</h4>
                      <Badge className={
                        operator.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        operator.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {operator.status}
                      </Badge>
                      {operator.verification_status === 'verified' && (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {operator.email} • {operator.phone}
                    </p>
                    {operator.hq_city && (
                      <p className="text-xs text-gray-500 mt-1">HQ: {operator.hq_city}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {operator.status !== 'suspended' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOperator(operator)}
                            className="border-red-500/30 text-red-400"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Suspend
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0F1D35] border-white/10">
                          <DialogHeader>
                            <DialogTitle className="text-white">Suspend Operator</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-red-400 font-semibold mb-2">
                                    This will immediately:
                                  </p>
                                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                                    <li>Suspend the operator's account</li>
                                    <li>Cancel all their scheduled trips</li>
                                    <li>Hide their trips from public view</li>
                                    <li>Prevent new ticket sales</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button variant="outline" className="flex-1 border-white/10">
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  suspendOperatorMutation.mutate(operator.id);
                                  setSelectedOperator(null);
                                }}
                                className="flex-1 bg-red-500"
                              >
                                Confirm Suspension
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {operator.status === 'suspended' && (
                      <Button
                        size="sm"
                        onClick={() => activateOperatorMutation.mutate(operator.id)}
                        className="bg-green-500"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activate
                      </Button>
                    )}

                    {operator.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => activateOperatorMutation.mutate(operator.id)}
                        className="bg-blue-500"
                      >
                        Approve
                      </Button>
                    )}

                    {operator.verification_status !== 'verified' && (
                      <Button
                        size="sm"
                        onClick={() => verifyOperatorMutation.mutate(operator.id)}
                        variant="outline"
                        className="border-blue-500/30 text-blue-400"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {operators.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No operators registered yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}