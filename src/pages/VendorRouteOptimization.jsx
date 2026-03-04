import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Route, Plus, MapPin, Trash2, Edit, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function VendorRouteOptimization() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [formData, setFormData] = useState({
    route_name: "",
    origin_city: "",
    origin_country: "",
    destination_city: "",
    destination_country: "",
    waypoints: [],
    estimated_distance_km: "",
    estimated_duration_hours: "",
    route_notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: vendorStaff } = useQuery({
    queryKey: ['vendor-staff-me', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const staff = await base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" });
      return staff[0] || null;
    },
    enabled: !!user
  });

  const { data: vendor } = useQuery({
    queryKey: ['vendor', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return null;
      const vendors = await base44.entities.Vendor.filter({ id: vendorStaff.vendor_id });
      return vendors[0] || null;
    },
    enabled: !!vendorStaff
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['vendor-routes', vendor?.id],
    queryFn: () => base44.entities.VendorRoute.filter({ vendor_id: vendor.id }, "-usage_count"),
    enabled: !!vendor
  });

  const saveRouteMutation = useMutation({
    mutationFn: async (data) => {
      if (editingRoute) {
        return await base44.entities.VendorRoute.update(editingRoute.id, data);
      }
      return await base44.entities.VendorRoute.create({
        ...data,
        vendor_id: vendor.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-routes'] });
      toast.success(editingRoute ? "Route updated!" : "Route created!");
      resetForm();
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.VendorRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-routes'] });
      toast.success("Route deleted");
    }
  });

  const addWaypoint = () => {
    setFormData({
      ...formData,
      waypoints: [...formData.waypoints, { city: "", country: "", sequence: formData.waypoints.length + 1 }]
    });
  };

  const updateWaypoint = (index, field, value) => {
    const updated = [...formData.waypoints];
    updated[index][field] = value;
    setFormData({ ...formData, waypoints: updated });
  };

  const removeWaypoint = (index) => {
    const updated = formData.waypoints.filter((_, i) => i !== index);
    setFormData({ ...formData, waypoints: updated });
  };

  const resetForm = () => {
    setFormData({
      route_name: "",
      origin_city: "",
      origin_country: "",
      destination_city: "",
      destination_country: "",
      waypoints: [],
      estimated_distance_km: "",
      estimated_duration_hours: "",
      route_notes: ""
    });
    setEditingRoute(null);
    setShowDialog(false);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData(route);
    setShowDialog(true);
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Route className="w-16 h-16 mx-auto mb-4 text-gray-500" />
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
            <h1 className="text-3xl font-bold text-white mb-2">Route Optimization</h1>
            <p className="text-gray-400">Define and manage optimal delivery routes</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Route
          </Button>
        </div>

        {/* Routes Grid */}
        {routes.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Route className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Routes Defined</h3>
            <p className="text-gray-400">Create your first optimized route</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {routes.map(route => (
              <Card key={route.id} className="p-6 bg-white/5 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">{route.route_name}</h3>
                    </div>
                    <Badge className={route.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {route.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(route)} className="border-white/10">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this route?")) {
                          deleteRouteMutation.mutate(route.id);
                        }
                      }}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      {route.origin_city}, {route.origin_country}
                    </span>
                  </div>

                  {route.waypoints.length > 0 && (
                    <div className="pl-6 space-y-1">
                      {route.waypoints.map((wp, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          {wp.city}, {wp.country}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-gray-300">
                      {route.destination_city}, {route.destination_country}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Distance</p>
                      <p className="text-white font-semibold">{route.estimated_distance_km || 'N/A'} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="text-white font-semibold">{route.estimated_duration_hours || 'N/A'} hrs</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Used {route.usage_count || 0} times</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={resetForm}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white">{editingRoute ? "Edit Route" : "Create Route"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-gray-300">Route Name *</Label>
                <Input
                  value={formData.route_name}
                  onChange={(e) => setFormData({...formData, route_name: e.target.value})}
                  placeholder="e.g., Douala to Yaoundé Express"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Origin City *</Label>
                  <Input
                    value={formData.origin_city}
                    onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Origin Country *</Label>
                  <Input
                    value={formData.origin_country}
                    onChange={(e) => setFormData({...formData, origin_country: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              {/* Waypoints */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300">Waypoints (Optional)</Label>
                  <Button size="sm" variant="outline" onClick={addWaypoint} className="border-white/10 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Stop
                  </Button>
                </div>
                {formData.waypoints.map((wp, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={wp.city}
                      onChange={(e) => updateWaypoint(idx, 'city', e.target.value)}
                      placeholder="City"
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      value={wp.country}
                      onChange={(e) => updateWaypoint(idx, 'country', e.target.value)}
                      placeholder="Country"
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeWaypoint(idx)}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Destination City *</Label>
                  <Input
                    value={formData.destination_city}
                    onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Destination Country *</Label>
                  <Input
                    value={formData.destination_country}
                    onChange={(e) => setFormData({...formData, destination_country: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Est. Distance (km)</Label>
                  <Input
                    type="number"
                    value={formData.estimated_distance_km}
                    onChange={(e) => setFormData({...formData, estimated_distance_km: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Est. Duration (hours)</Label>
                  <Input
                    type="number"
                    value={formData.estimated_duration_hours}
                    onChange={(e) => setFormData({...formData, estimated_duration_hours: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Route Notes</Label>
                <Textarea
                  value={formData.route_notes}
                  onChange={(e) => setFormData({...formData, route_notes: e.target.value})}
                  placeholder="Special instructions, road conditions, etc."
                  className="bg-white/5 border-white/10 text-white mt-2"
                  rows={3}
                />
              </div>

              <Button
                onClick={() => saveRouteMutation.mutate(formData)}
                disabled={!formData.route_name || !formData.origin_city || !formData.destination_city || saveRouteMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {saveRouteMutation.isPending ? "Saving..." : (editingRoute ? "Update Route" : "Create Route")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}