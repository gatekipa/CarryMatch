import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function MoveSeatsBetweenBranches({ trip, branches, open, onClose }) {
  const queryClient = useQueryClient();
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [seatsCount, setSeatsCount] = useState("");
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const moveSeatsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('moveSeatsBetweenBranches', {
        trip_id: trip.id,
        from_branch_id: fromBranch === 'online' ? null : fromBranch,
        to_branch_id: toBranch === 'online' ? null : toBranch,
        seats_count: parseInt(seatsCount),
        reason: reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      queryClient.invalidateQueries(['rebalance-events']);
      toast.success("Seats moved successfully!");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleClose = () => {
    setFromBranch("");
    setToBranch("");
    setSeatsCount("");
    setReason("");
    setShowConfirm(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!fromBranch || !toBranch || !seatsCount || !reason) {
      toast.error("Fill in all fields");
      return;
    }
    if (fromBranch === toBranch) {
      toast.error("Source and destination cannot be the same");
      return;
    }
    setShowConfirm(true);
  };

  const getBranchLabel = (id) => {
    if (id === 'online') return "Online Pool";
    const branch = branches.find(b => b.id === id);
    return branch ? `${branch.branch_name}, ${branch.city}` : "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Move Seats Between Channels</DialogTitle>
        </DialogHeader>

        {!showConfirm ? (
          <div className="space-y-4">
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-start gap-2 text-yellow-300 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>This will manually override the allocation. Use with caution.</p>
              </div>
            </Card>

            <div>
              <Label className="text-gray-300">Move From *</Label>
              <Select value={fromBranch} onValueChange={setFromBranch}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Pool</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.branch_name}, {b.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Move To *</Label>
              <Select value={toBranch} onValueChange={setToBranch}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Pool</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.branch_name}, {b.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Number of Seats *</Label>
              <Input
                type="number"
                value={seatsCount}
                onChange={(e) => setSeatsCount(e.target.value)}
                placeholder="e.g., 5"
                min="1"
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>

            <div>
              <Label className="text-gray-300">Reason for Override *</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Branch requested additional capacity"
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-500"
            >
              Review Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4 bg-white/5 border-white/10">
              <h4 className="text-white font-semibold mb-3">Confirm Seat Movement</h4>
              
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{getBranchLabel(fromBranch)}</div>
                  <div className="text-sm text-gray-400">Source</div>
                </div>
                
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-8 h-8 text-blue-400 mb-2" />
                  <Badge className="bg-orange-500/20 text-orange-400">
                    {seatsCount} seat{parseInt(seatsCount) > 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{getBranchLabel(toBranch)}</div>
                  <div className="text-sm text-gray-400">Destination</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-sm text-gray-400">Reason:</p>
                <p className="text-white font-medium">{reason}</p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-white/10"
              >
                Back
              </Button>
              <Button
                onClick={() => moveSeatsMutation.mutate()}
                disabled={moveSeatsMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600"
              >
                {moveSeatsMutation.isPending ? "Moving..." : "Confirm & Move Seats"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}