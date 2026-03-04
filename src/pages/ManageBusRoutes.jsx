import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Route, Plus, Edit, MapPin, Trash2, Copy, FileText, Users } from "lucide-react";
import SeatAllocationManager from "../components/bus/SeatAllocationManager";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ManageBusRoutes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("routes");
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [showStopsDialog, setShowStopsDialog] = useState(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showAllocationDialog, setShowAllocationDialog] = useState(null);
  const [allocationType, setAllocationType] = useState(null);

  const [formData, setFormData] = useState({
    origin_city: "",
    destination_city: "",
    route_status: "active",
    notes: ""
  });

  const [templateForm, setTemplateForm] = useState({
    template_name: "",
    origin_city: "",
    destination_city: "",
    stops_json: [],
    default_duration_minutes: "",
    default_departure_branch_id: "",
    default_arrival_branch_text: "",
    default_baggage_policy_text: "",
    is_active: true
  });

  const [stopForm, setStopForm] = useState({
    stop_name: "",
    city: "",
    order_index: 0,
    pickup_allowed: true,
    dropoff_allowed: true
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

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['bus-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: allStops = [] } = useQuery({
    queryKey: ['route-stops', operator?.id],
    queryFn: async () => {
      if (!routes.length) return [];
      return await base44.entities.RouteStop.filter({
        route_id: { $in: routes.map(r => r.id) }
      });
    },
    enabled: !!operator && routes.length > 0
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['route-templates', operator?.id],
    queryFn: () => base44.entities.RouteTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-allocation', operator?.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: seatTemplates = [] } = useQuery({
    queryKey: ['seat-templates-for-allocation', operator?.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data) => {
      if (editingRoute) {
        return await base44.entities.BusRoute.update(editingRoute.id, data);
      }
      return await base44.entities.BusRoute.create({
        ...data,
        operator_id: operator.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-routes'] });
      toast.success(editingRoute ? "Route updated!" : "Route created!");
      resetForm();
    }
  });

  const createStopMutation = useMutation({
    mutationFn: (data) => base44.entities.RouteStop.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops'] });
      toast.success("Stop added!");
      setStopForm({
        stop_name: "",
        city: "",
        order_index: 0,
        pickup_allowed: true,
        dropoff_allowed: true
      });
    }
  });

  const deleteStopMutation = useMutation({
    mutationFn: (id) => base44.entities.RouteStop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-stops'] });
      toast.success("Stop deleted");
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (id) => base44.entities.BusRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-routes'] });
      toast.success("Route deleted");
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        return await base44.entities.RouteTemplate.update(editingTemplate.id, data);
      }
      return await base44.entities.RouteTemplate.create({
        ...data,
        operator_id: operator.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-templates'] });
      toast.success(editingTemplate ? "Template updated!" : "Template created!");
      resetTemplateForm();
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.RouteTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-templates'] });
      toast.success("Template deleted");
    }
  });

  const saveRouteAsTemplateMutation = useMutation({
    mutationFn: async (route) => {
      const stops = getRouteStops(route.id);
      return await base44.entities.RouteTemplate.create({
        operator_id: operator.id,
        template_name: `${route.origin_city} - ${route.destination_city}`,
        origin_city: route.origin_city,
        destination_city: route.destination_city,
        stops_json: stops,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-templates'] });
      toast.success("Route saved as template!");
    }
  });

  const createRouteFromTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const route = await base44.entities.BusRoute.create({
        operator_id: operator.id,
        origin_city: template.origin_city,
        destination_city: template.destination_city,
        route_status: "active",
        notes: `Created from template: ${template.template_name}`
      });

      if (template.stops_json?.length > 0) {
        const stopsWithRouteId = template.stops_json.map(stop => ({
          ...stop,
          route_id: route.id
        }));
        await base44.entities.RouteStop.bulkCreate(stopsWithRouteId);
      }

      return route;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stops'] });
      toast.success("Route created from template!");
      setActiveTab("routes");
    }
  });

  const resetForm = () => {
    setFormData({
      origin_city: "",
      destination_city: "",
      route_status: "active",
      notes: ""
    });
    setEditingRoute(null);
    setShowDialog(false);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      origin_city: route.origin_city,
      destination_city: route.destination_city,
      route_status: route.route_status,
      notes: route.notes || ""
    });
    setShowDialog(true);
  };

  const getRouteStops = (routeId) => {
    return allStops.filter(s => s.route_id === routeId).sort((a, b) => a.order_index - b.order_index);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      template_name: "",
      origin_city: "",
      destination_city: "",
      stops_json: [],
      default_duration_minutes: "",
      default_departure_branch_id: "",
      default_arrival_branch_text: "",
      default_baggage_policy_text: "",
      is_active: true
    });
    setEditingTemplate(null);
    setShowTemplateDialog(false);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm(template);
    setShowTemplateDialog(true);
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
            <h1 className="text-3xl font-bold text-white mb-2">Routes & Templates</h1>
            <p className="text-gray-400">Manage routes and create reusable templates</p>
          </div>
          <Button onClick={() => activeTab === 'routes' ? setShowDialog(true) : setShowTemplateDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'routes' ? 'Add Route' : 'Add Template'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border-white/10">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="routes">

        {isLoading ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </Card>
        ) : routes.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Route className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Routes Yet</h3>
            <p className="text-gray-400">Create your first route to start scheduling trips</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {routes.map((route) => {
              const stops = getRouteStops(route.id);
              return (
                <motion.div key={route.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Route className="w-8 h-8 text-blue-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {route.origin_city} → {route.destination_city}
                            </h3>
                            <Badge className={route.route_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                              {route.route_status}
                            </Badge>
                          </div>
                          {route.notes && <p className="text-sm text-gray-400 mb-3">{route.notes}</p>}
                          
                          {stops.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Stops ({stops.length}):</p>
                              <div className="flex flex-wrap gap-2">
                                {stops.map((stop) => (
                                  <Badge key={stop.id} className="bg-blue-500/20 text-blue-400">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {stop.stop_name}, {stop.city}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setShowStopsDialog(route)} className="border-white/10">
                          <MapPin className="w-3 h-3 mr-1" />
                          Stops
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => saveRouteAsTemplateMutation.mutate(route)}
                          className="border-green-500/30 text-green-400"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Save as Template
                        </Button>
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
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
        </TabsContent>

        <TabsContent value="templates">
          {templates.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-bold text-white mb-2">No Templates Yet</h3>
              <p className="text-gray-400">Create reusable route templates for faster trip scheduling</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {templates.map((template) => (
                <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <FileText className="w-8 h-8 text-purple-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{template.template_name}</h3>
                            <Badge className={template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {template.origin_city} → {template.destination_city}
                          </p>
                          {template.stops_json?.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {template.stops_json.length} stops configured
                            </p>
                          )}
                          {template.default_baggage_policy_text && (
                            <p className="text-xs text-gray-400 mt-2">
                              Baggage: {template.default_baggage_policy_text}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setShowAllocationDialog(template);
                            setAllocationType('template');
                          }}
                          className="border-purple-500/30 text-purple-400"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Allocate Seats
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => createRouteFromTemplateMutation.mutate(template)}
                          className="bg-blue-500"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Create Route
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)} className="border-white/10">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Delete this template?")) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>

        {/* Create/Edit Route Dialog */}
        <Dialog open={showDialog} onOpenChange={() => resetForm()}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">{editingRoute ? "Edit Route" : "Create Route"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Origin City *</Label>
                <Input
                  value={formData.origin_city}
                  onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
                  placeholder="e.g., Douala"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Destination City *</Label>
                <Input
                  value={formData.destination_city}
                  onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                  placeholder="e.g., Yaoundé"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional route details"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Active Route</Label>
                <Switch
                  checked={formData.route_status === 'active'}
                  onCheckedChange={(checked) => setFormData({...formData, route_status: checked ? 'active' : 'inactive'})}
                />
              </div>
              <Button
                onClick={() => createRouteMutation.mutate(formData)}
                disabled={!formData.origin_city || !formData.destination_city || createRouteMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createRouteMutation.isPending ? "Saving..." : (editingRoute ? "Update" : "Create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Stops Dialog */}
        <Dialog open={!!showStopsDialog} onOpenChange={() => setShowStopsDialog(null)}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Manage Stops: {showStopsDialog?.origin_city} → {showStopsDialog?.destination_city}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Existing Stops */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Current Stops</h4>
                {getRouteStops(showStopsDialog?.id).length === 0 ? (
                  <p className="text-sm text-gray-400">No stops added yet</p>
                ) : (
                  <div className="space-y-2">
                    {getRouteStops(showStopsDialog?.id).map((stop) => (
                      <div key={stop.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{stop.stop_name}</p>
                          <p className="text-xs text-gray-400">{stop.city}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteStopMutation.mutate(stop.id)}
                          className="border-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Stop */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-sm font-semibold text-white mb-3">Add New Stop</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-300">Stop Name</Label>
                      <Input
                        value={stopForm.stop_name}
                        onChange={(e) => setStopForm({...stopForm, stop_name: e.target.value})}
                        placeholder="e.g., Central Station"
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">City</Label>
                      <Input
                        value={stopForm.city}
                        onChange={(e) => setStopForm({...stopForm, city: e.target.value})}
                        placeholder="e.g., Bafoussam"
                        className="bg-white/5 border-white/10 text-white mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!stopForm.stop_name || !stopForm.city) {
                        toast.error("Fill in all fields");
                        return;
                      }
                      createStopMutation.mutate({
                        ...stopForm,
                        route_id: showStopsDialog.id,
                        order_index: getRouteStops(showStopsDialog.id).length
                      });
                    }}
                    className="w-full bg-blue-500"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Stop
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={() => resetTemplateForm()}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-gray-300">Template Name *</Label>
                <Input
                  value={templateForm.template_name}
                  onChange={(e) => setTemplateForm({...templateForm, template_name: e.target.value})}
                  placeholder="e.g., Douala-Yaoundé Express"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Origin City *</Label>
                  <Input
                    value={templateForm.origin_city}
                    onChange={(e) => setTemplateForm({...templateForm, origin_city: e.target.value})}
                    placeholder="e.g., Douala"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Destination City *</Label>
                  <Input
                    value={templateForm.destination_city}
                    onChange={(e) => setTemplateForm({...templateForm, destination_city: e.target.value})}
                    placeholder="e.g., Yaoundé"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Default Duration (minutes)</Label>
                <Input
                  type="number"
                  value={templateForm.default_duration_minutes}
                  onChange={(e) => setTemplateForm({...templateForm, default_duration_minutes: e.target.value})}
                  placeholder="e.g., 240"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Default Departure Station</Label>
                <select
                  value={templateForm.default_departure_branch_id}
                  onChange={(e) => setTemplateForm({...templateForm, default_departure_branch_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 mt-2"
                >
                  <option value="">Select station...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}, {b.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-gray-300">Default Arrival Location</Label>
                <Input
                  value={templateForm.default_arrival_branch_text}
                  onChange={(e) => setTemplateForm({...templateForm, default_arrival_branch_text: e.target.value})}
                  placeholder="e.g., Central Station"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Baggage Policy</Label>
                <Textarea
                  value={templateForm.default_baggage_policy_text}
                  onChange={(e) => setTemplateForm({...templateForm, default_baggage_policy_text: e.target.value})}
                  placeholder="e.g., 2 bags up to 20kg each"
                  rows={3}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Active Template</Label>
                <Switch
                  checked={templateForm.is_active}
                  onCheckedChange={(checked) => setTemplateForm({...templateForm, is_active: checked})}
                />
              </div>
              <Button
                onClick={() => createTemplateMutation.mutate(templateForm)}
                disabled={!templateForm.template_name || !templateForm.origin_city || !templateForm.destination_city || createTemplateMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createTemplateMutation.isPending ? "Saving..." : (editingTemplate ? "Update" : "Create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Seat Allocation Dialog */}
        <Dialog open={!!showAllocationDialog} onOpenChange={() => {
          setShowAllocationDialog(null);
          setAllocationType(null);
        }}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Seat Allocation - {showAllocationDialog?.template_name || showAllocationDialog?.service_name}
              </DialogTitle>
            </DialogHeader>
            {showAllocationDialog && allocationType === 'template' && (() => {
              const allocationRule = null;
              const allocations = [];
              return (
                <SeatAllocationManager
                  operatorId={operator.id}
                  totalSeats={(() => {
                    const defaultVehicle = vehicles[0];
                    if (!defaultVehicle) return 50;
                    const template = seatTemplates.find(t => t.id === defaultVehicle.seat_map_template_id);
                    if (!template) return 50;
                    const layout = template.layout_json.layout;
                    return layout.reduce((total, row) => total + row.filter(seat => seat === 1).length, 0);
                  })()}
                  branches={branches}
                  existingRule={allocationRule}
                  existingAllocations={allocations}
                  scope="route_template"
                  scopeId={showAllocationDialog.id}
                  onSave={() => {
                    setShowAllocationDialog(null);
                    setAllocationType(null);
                  }}
                />
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}