import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign } from "lucide-react";

export default function StartSessionDialog({ open, onClose, branches, onStart, isPending }) {
  const [branchId, setBranchId] = useState("");
  const [openingCash, setOpeningCash] = useState("");

  const handleSubmit = () => {
    if (!branchId) {
      return;
    }
    onStart({
      branch_id: branchId,
      opening_cash_xaf: openingCash ? parseFloat(openingCash) : 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1D35] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Start Your Shift</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-gray-300">Select Branch/Station *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                <SelectValue placeholder="Choose your location" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.branch_name}, {b.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Opening Cash (XAF) - Optional</Label>
            <Input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0"
              className="bg-white/5 border-white/10 text-white mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Starting cash in drawer for reconciliation</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!branchId || isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isPending ? "Starting..." : "Start Shift"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}