import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bus, Plus, Edit, Trash2, Armchair } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ManageBusVehicles() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    nickname: "",
    plate_number: "",
    seat_map_template_id: "",
    amenities_json: {
      ac: false,
      wifi: false,
      usb: false,
      restroom: false
    },
    status: "active"
  });

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

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', operator?.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['seat-map-templates', operator?.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data) => {
      if (editingVehicle) {
        return await base44.entities.Vehicle.update(editingVehicle.id, data);
      }
      return await base44.entities.Vehicle.create({
        ...data,
        operator_id: operator.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      toast.success(editingVehicle ? "Vehicle updated!" : "Vehicle added!");
      resetForm();
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
      toast.success("Vehicle deleted");
    }
  });

  const resetForm = () => {
    setFormData({
      nickname: "",
      plate_number: "",
      seat_map_template_id: "",
      amenities_json: {
        ac: false,
        wifi: false,
        usb: false,
        restroom: false
      },
      status: "active"
    });
    setEditingVehicle(null);
    setShowDialog(false);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      nickname: vehicle.nickname,
      plate_number: vehicle.plate_number || "",
      seat_map_template_id: vehicle.seat_map_template_id,
      amenities_json: vehicle.amenities_json || {
        ac: false,
        wifi: false,
        usb: false,
        restroom: false
      },
      status: vehicle.status
    });
    setShowDialog(true);
  };

  const getTemplateName = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    return template?.template_name || "Unknown";
  };

  const getTemplateSeats = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return 0;
    return template.layout_json.layout.flat().filter(s => s === 1).length;
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
          <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Vehicles</h1>
            <p className="text-gray-400">Manage your bus fleet</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {templates.length === 0 && (
          <Card className="p-6 bg-yellow-500/10 border-yellow-500/30 mb-6">
            <p className="text-yellow-300">⚠️ Please create at least one seat map template before adding vehicles</p>
          </Card>
        )}

        {isLoading ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </Card>
        ) : vehicles.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Vehicles Yet</h3>
            <p className="text-gray-400">Add your first vehicle to start scheduling trips</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <motion.div key={vehicle.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <Bus className="w-8 h-8 text-blue-400" />
                    <Badge className={vehicle.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                      {vehicle.status}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{vehicle.nickname}</h3>
                  {vehicle.plate_number && (
                    <p className="text-sm text-gray-400 mb-3">Plate: {vehicle.plate_number}</p>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Armchair className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">{getTemplateName(vehicle.seat_map_template_id)}</span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {getTemplateSeats(vehicle.seat_map_template_id)} seats
                    </Badge>
                  </div>

                  {Object.entries(vehicle.amenities_json || {}).some(([k, v]) => v) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {vehicle.amenities_json.ac && <Badge className="bg-cyan-500/20 text-cyan-400">AC</Badge>}
                      {vehicle.amenities_json.wifi && <Badge className="bg-purple-500/20 text-purple-400">WiFi</Badge>}
                      {vehicle.amenities_json.usb && <Badge className="bg-yellow-500/20 text-yellow-400">USB</Badge>}
                      {vehicle.amenities_json.restroom && <Badge className="bg-green-500/20 text-green-400">Restroom</Badge>}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(vehicle)} className="flex-1 border-white/10">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this vehicle?")) {
                          deleteVehicleMutation.mutate(vehicle.id);
                        }
                      }}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Vehicle Dialog */}
        <Dialog open={showDialog} onOpenChange={() => resetForm()}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Vehicle Nickname *</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  placeholder="e.g., VIP Coach 1"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Plate Number</Label>
                <Input
                  value={formData.plate_number}
                  onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                  placeholder="Optional"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Seat Map Template *</Label>
                <Select value={formData.seat_map_template_id} onValueChange={(value) => setFormData({...formData, seat_map_template_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.template_name} ({getTemplateSeats(t.id)} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 mb-3 block">Amenities</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['ac', 'wifi', 'usb', 'restroom'].map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities_json[amenity]}
                        onChange={(e) => setFormData({
                          ...formData,
                          amenities_json: {
                            ...formData.amenities_json,
                            [amenity]: e.target.checked
                          }
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300 capitalize">{amenity === 'ac' ? 'Air Conditioning' : amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => createVehicleMutation.mutate(formData)}
                disabled={!formData.nickname || !formData.seat_map_template_id || createVehicleMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createVehicleMutation.isPending ? "Saving..." : (editingVehicle ? "Update" : "Add Vehicle")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}