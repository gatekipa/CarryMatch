import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Lock, Unlock, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SeatAllocationManager({
  operatorId,
  totalSeats,
  branches = [],
  existingRule = null,
  existingAllocations = [],
  scope,
  scopeId,
  onSave
}) {
  const queryClient = useQueryClient();
  const [allocations, setAllocations] = useState({});
  const [allowRebalance, setAllowRebalance] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (existingAllocations.length > 0) {
      const allocationMap = {};
      existingAllocations.forEach(alloc => {
        const key = alloc.channel === "online" ? "online" : alloc.branch_id;
        allocationMap[key] = {
          count: alloc.allocated_seats_count,
          locked: alloc.locked
        };
      });
      setAllocations(allocationMap);
    } else {
      // Default: all online
      setAllocations({ online: { count: totalSeats, locked: false } });
    }

    if (existingRule) {
      setAllowRebalance(existingRule.allow_rebalance);
    }
  }, [existingAllocations, existingRule, totalSeats]);

  const allocatedTotal = Object.values(allocations).reduce((sum, a) => sum + (a.count || 0), 0);
  const remaining = totalSeats - allocatedTotal;
  const isValid = remaining >= 0;

  const handleAllocationChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setAllocations({
      ...allocations,
      [key]: { count: Math.max(0, numValue), locked: allocations[key]?.locked || false }
    });
  };

  const handleSliderChange = (key, values) => {
    setAllocations({
      ...allocations,
      [key]: { count: values[0], locked: allocations[key]?.locked || false }
    });
  };

  const toggleLock = (key) => {
    setAllocations({
      ...allocations,
      [key]: { ...allocations[key], locked: !allocations[key]?.locked }
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!operatorId) throw new Error("Operator ID is required");
      if (totalSeats <= 0) throw new Error("Total seats must be greater than zero");
      if (!isValid) {
        throw new Error("Total allocation exceeds available seats");
      }

      // Create or update rule
      let ruleId = existingRule?.id;
      const ruleData = {
        operator_id: operatorId,
        allocation_scope: scope,
        allow_rebalance: allowRebalance
      };

      if (scope === "trip") ruleData.trip_id = scopeId;
      if (scope === "route_template") ruleData.route_template_id = scopeId;
      if (scope === "service") ruleData.route_template_id = scopeId;

      if (ruleId) {
        await base44.entities.SeatAllocationRule.update(ruleId, ruleData);
      } else {
        const newRule = await base44.entities.SeatAllocationRule.create(ruleData);
        ruleId = newRule.id;
      }

      // Delete old allocations
      if (existingAllocations.length > 0) {
        for (const alloc of existingAllocations) {
          await base44.entities.SeatAllocation.delete(alloc.id);
        }
      }

      // Create new allocations
      const newAllocations = [];
      if (allocations.online?.count > 0) {
        newAllocations.push({
          seat_allocation_rule_id: ruleId,
          branch_id: null,
          channel: "online",
          allocated_seats_count: allocations.online.count,
          locked: allocations.online.locked || false
        });
      }

      branches.forEach(branch => {
        if (allocations[branch.id]?.count > 0) {
          newAllocations.push({
            seat_allocation_rule_id: ruleId,
            branch_id: branch.id,
            channel: "branch",
            allocated_seats_count: allocations[branch.id].count,
            locked: allocations[branch.id].locked || false
          });
        }
      });

      if (newAllocations.length > 0) {
        await base44.entities.SeatAllocation.bulkCreate(newAllocations);
      }

      return { ruleId, allocations: newAllocations };
    },
    onSuccess: (data) => {
      toast.success("Seat allocation saved!");
      queryClient.invalidateQueries({ queryKey: ['allocation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      if (onSave) onSave(data);
    },
    onError: (error) => {
      toast.error("Failed to save allocation: " + error.message);
    }
  });

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Seat Allocation</h3>
          <p className="text-sm text-gray-400">Distribute seats between online and branch counters</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Total Seats</div>
          <div className="text-3xl font-bold text-white">{totalSeats}</div>
        </div>
      </div>

      {!isValid && (
        <Card className="p-3 bg-red-500/10 border-red-500/30 mb-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Over-allocated by {Math.abs(remaining)} seats!</span>
          </div>
        </Card>
      )}

      <div className="space-y-6 mb-6">
        {/* Online Allocation */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Label className="text-gray-300 font-semibold">Online Sales</Label>
              <Badge className="bg-blue-500/20 text-blue-400">
                {allocations.online?.count || 0} seats
              </Badge>
            </div>
            <button
              onClick={() => toggleLock("online")}
              className="text-gray-400 hover:text-white transition-colors"
              title={allocations.online?.locked ? "Unlock" : "Lock allocation"}
            >
              {allocations.online?.locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[allocations.online?.count || 0]}
              onValueChange={(values) => handleSliderChange("online", values)}
              max={totalSeats}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={allocations.online?.count || 0}
              onChange={(e) => handleAllocationChange("online", e.target.value)}
              className="w-20 bg-white/5 border-white/10 text-white text-center"
              min={0}
              max={totalSeats}
            />
          </div>
        </div>

        {/* Branch Allocations */}
        {branches.map(branch => (
          <div key={branch.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Label className="text-gray-300 font-semibold">
                  {branch.branch_name}, {branch.city}
                </Label>
                <Badge className="bg-green-500/20 text-green-400">
                  {allocations[branch.id]?.count || 0} seats
                </Badge>
              </div>
              <button
                onClick={() => toggleLock(branch.id)}
                className="text-gray-400 hover:text-white transition-colors"
                title={allocations[branch.id]?.locked ? "Unlock" : "Lock allocation"}
              >
                {allocations[branch.id]?.locked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[allocations[branch.id]?.count || 0]}
                onValueChange={(values) => handleSliderChange(branch.id, values)}
                max={totalSeats}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={allocations[branch.id]?.count || 0}
                onChange={(e) => handleAllocationChange(branch.id, e.target.value)}
                className="w-20 bg-white/5 border-white/10 text-white text-center"
                min={0}
                max={totalSeats}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-white/10 border-white/10 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-400">Allocated</div>
            <div className={`text-2xl font-bold ${isValid ? 'text-white' : 'text-red-400'}`}>
              {allocatedTotal}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Remaining</div>
            <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {remaining}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Total</div>
            <div className="text-2xl font-bold text-white">{totalSeats}</div>
          </div>
        </div>
      </Card>

      {/* Options */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allowRebalance}
            onCheckedChange={setAllowRebalance}
          />
          <Label className="text-gray-300 cursor-pointer">
            Allow dynamic rebalancing between channels
          </Label>
        </div>
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={!isValid || saveMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
      >
        <Save className="w-4 h-4 mr-2" />
        {saveMutation.isPending ? "Saving..." : "Save Allocation"}
      </Button>
    </Card>
  );
}