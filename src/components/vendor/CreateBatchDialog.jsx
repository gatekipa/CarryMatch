import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function CreateBatchDialog({ open, onOpenChange, vendor, vendorStaff, onSuccess }) {
  const [formData, setFormData] = useState({
    origin_branch_id: "",
    destination_branch_id: "",
    mode: "AIR",
    origin_country: "",
    origin_city: "",
    destination_country: "",
    destination_city: "",
    cutoff_at: "",
    etd_at: "",
    eta_at: "",
    flight_number: "",
    carrier: "",
    notes: ""
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['vendor-branches', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      return await base44.entities.Branch.filter({ vendor_id: vendor.id, active: true });
    },
    enabled: !!vendor
  });

  useEffect(() => {
    if (branches.length > 0 && !formData.origin_branch_id) {
      setFormData(prev => ({ ...prev, origin_branch_id: branches[0].id }));
    }
  }, [branches, formData.origin_branch_id]);

  const createBatchMutation = useMutation({
    mutationFn: async (data) => {
      const code = `${formData.origin_city.substring(0, 3).toUpperCase()}-${formData.destination_city.substring(0, 3).toUpperCase()}-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}`;
      
      return await base44.entities.Batch.create({
        vendor_id: vendor.id,
        code,
        route: `${formData.origin_city} → ${formData.destination_city}`,
        origin_country: formData.origin_country,
        origin_city: formData.origin_city,
        destination_country: formData.destination_country,
        destination_city: formData.destination_city,
        mode: formData.mode,
        origin_branch_id: formData.origin_branch_id,
        destination_branch_id: formData.destination_branch_id || undefined,
        cutoff_at: formData.cutoff_at ? new Date(formData.cutoff_at).toISOString() : undefined,
        etd_at: formData.etd_at ? new Date(formData.etd_at).toISOString() : undefined,
        eta_at: formData.eta_at ? new Date(formData.eta_at).toISOString() : undefined,
        flight_number: formData.flight_number || undefined,
        carrier: formData.carrier || undefined,
        notes: formData.notes || undefined,
        status: "OPEN",
        currency: vendor.base_currency || "USD"
      });
    },
    onSuccess: () => {
      onSuccess();
      setFormData({
        origin_branch_id: branches[0]?.id || "",
        destination_branch_id: "",
        mode: "AIR",
        origin_country: "",
        origin_city: "",
        destination_country: "",
        destination_city: "",
        cutoff_at: "",
        etd_at: "",
        eta_at: "",
        flight_number: "",
        carrier: "",
        notes: ""
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Batch</DialogTitle>
          <DialogDescription className="text-gray-400">
            Group shipments for a specific departure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Origin Branch *</Label>
              <Select value={formData.origin_branch_id} onValueChange={(value) => setFormData({...formData, origin_branch_id: value})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Destination Branch</Label>
              <Select value={formData.destination_branch_id} onValueChange={(value) => setFormData({...formData, destination_branch_id: value})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Transport Mode *</Label>
            <Select value={formData.mode} onValueChange={(value) => setFormData({...formData, mode: value})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AIR">Air</SelectItem>
                <SelectItem value="SEA">Sea</SelectItem>
                <SelectItem value="ROAD">Road</SelectItem>
                <SelectItem value="BUS">Bus</SelectItem>
                <SelectItem value="RAIL">Rail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Origin Country *</Label>
              <Input
                value={formData.origin_country}
                onChange={(e) => setFormData({...formData, origin_country: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Origin City *</Label>
              <Input
                value={formData.origin_city}
                onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Destination Country *</Label>
              <Input
                value={formData.destination_country}
                onChange={(e) => setFormData({...formData, destination_country: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Destination City *</Label>
              <Input
                value={formData.destination_city}
                onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Carrier / Airline</Label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                placeholder="e.g., American Airlines"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Flight/Vessel/Bus Number</Label>
              <Input
                value={formData.flight_number}
                onChange={(e) => setFormData({...formData, flight_number: e.target.value})}
                placeholder="e.g., AA123"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-300">Cut-off Time</Label>
              <Input
                type="datetime-local"
                value={formData.cutoff_at}
                onChange={(e) => setFormData({...formData, cutoff_at: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">ETD</Label>
              <Input
                type="datetime-local"
                value={formData.etd_at}
                onChange={(e) => setFormData({...formData, etd_at: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">ETA</Label>
              <Input
                type="datetime-local"
                value={formData.eta_at}
                onChange={(e) => setFormData({...formData, eta_at: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={() => createBatchMutation.mutate()}
            disabled={createBatchMutation.isPending || !formData.origin_city || !formData.destination_city}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
          >
            {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}