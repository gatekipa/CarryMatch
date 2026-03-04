import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, Play, Pause, Zap, Clock, DollarSign, Users } from "lucide-react";
import SeatAllocationManager from "../components/bus/SeatAllocationManager";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SeatSelector from "../components/bus/SeatSelector";

export default function ManageRecurringServices() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [showAllocationDialog, setShowAllocationDialog] = useState(null);

  const [formData, setFormData] = useState({
    service_name: "",
    route_template_id: "",
    vehicle_assignment_type: "fixed",
    vehicle_id: "",
    vehicle_pool_json: [],
    base_price_xaf: "",
    seat_pricing_rules_json: {},
    sales_channels_enabled_json: { online: true, offline: true },
    online_seat_pool_rule: "all",
    subset_seats_json: [],
    departure_time_local: "",
    days_of_week_json: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    start_date: "",
    end_date: "",
    generate_days_ahead: 14,
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

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['recurring-services', operator?.id],
    queryFn: () => base44.entities.RecurringService.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: routeTemplates = [] } = useQuery({
    queryKey: ['route-templates', operator?.id],
    queryFn: () => base44.entities.RouteTemplate.filter({ operator_id: operator.id, is_active: true }),
    enabled: !!operator
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-list', operator?.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: seatMapTemplates = [] } = useQuery({
    queryKey: ['seat-templates-list', operator?.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-for-allocation', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        operator_id: operator.id,
        base_price_xaf: parseFloat(data.base_price_xaf),
        generate_days_ahead: parseInt(data.generate_days_ahead),
        vehicle_id: data.vehicle_assignment_type === 'fixed' ? data.vehicle_id : null,
        vehicle_pool_json: data.vehicle_assignment_type === 'pool' ? data.vehicle_pool_json : null
      };

      if (editingService) {
        return await base44.entities.RecurringService.update(editingService.id, payload);
      }
      return await base44.entities.RecurringService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-services'] });
      toast.success(editingService ? "Service updated!" : "Service created!");
      resetForm();
    }
  });

  const toggleServiceStatusMutation = useMutation({
    mutationFn: ({ serviceId, status }) => base44.entities.RecurringService.update(serviceId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-services'] });
      toast.success("Service status updated!");
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-services'] });
      toast.success("Service deleted");
    }
  });

  const generateTripsMutation = useMutation({
    mutationFn: async ({ serviceId, daysAhead }) => {
      const response = await base44.functions.invoke('generateRecurringTrips', {
        service_id: serviceId,
        days_ahead: daysAhead
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success(`Generated ${data.trips_created} ${data.trips_created === 1 ? 'trip' : 'trips'}!`);
      setGeneratingFor(null);
    },
    onError: (error) => {
      toast.error("Failed to generate trips: " + error.message);
      setGeneratingFor(null);
    }
  });

  const resetForm = () => {
    setFormData({
      service_name: "",
      route_template_id: "",
      vehicle_assignment_type: "fixed",
      vehicle_id: "",
      vehicle_pool_json: [],
      base_price_xaf: "",
      seat_pricing_rules_json: {},
      sales_channels_enabled_json: { online: true, offline: true },
      online_seat_pool_rule: "all",
      subset_seats_json: [],
      departure_time_local: "",
      days_of_week_json: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
      },
      start_date: "",
      end_date: "",
      generate_days_ahead: 14,
      status: "active"
    });
    setEditingService(null);
    setShowDialog(false);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      ...service,
      vehicle_assignment_type: service.vehicle_id ? "fixed" : "pool"
    });
    setShowDialog(true);
  };

  const getSelectedSeatTemplate = () => {
    const vehicleId = formData.vehicle_assignment_type === 'fixed' ? formData.vehicle_id : formData.vehicle_pool_json[0];
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return null;
    return seatMapTemplates.find(t => t.id === vehicle.seat_map_template_id);
  };

  const toggleDay = (day) => {
    setFormData({
      ...formData,
      days_of_week_json: {
        ...formData.days_of_week_json,
        [day]: !formData.days_of_week_json[day]
      }
    });
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
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Recurring Services</h1>
            <p className="text-gray-400">Permanent schedules that auto-generate trips</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {isLoading ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </Card>
        ) : services.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Recurring Services</h3>
            <p className="text-gray-400">Create a recurring service to automatically generate trips</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {services.map((service) => {
              const template = routeTemplates.find(t => t.id === service.route_template_id);
              const activeDays = Object.entries(service.days_of_week_json || {}).filter(([_, v]) => v).map(([k]) => k);
              
              return (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Calendar className="w-8 h-8 text-purple-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{service.service_name}</h3>
                            <Badge className={service.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                              {service.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <span>{service.departure_time_local}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span>{service.base_price_xaf.toLocaleString()} XAF</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
                            {activeDays.map(day => (
                              <Badge key={day} className="bg-blue-500/20 text-blue-400 text-xs">
                                {day.slice(0, 3)}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-xs text-gray-500">
                            Route: {template?.origin_city} → {template?.destination_city}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAllocationDialog(service)}
                          className="border-purple-500/30 text-purple-400"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Allocate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setGeneratingFor(service.id);
                            generateTripsMutation.mutate({ serviceId: service.id, daysAhead: 30 });
                          }}
                          disabled={generatingFor === service.id}
                          className="bg-purple-500"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {generatingFor === service.id ? "Generating..." : "Generate 30 Days"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleServiceStatusMutation.mutate({
                            serviceId: service.id,
                            status: service.status === 'active' ? 'paused' : 'active'
                          })}
                          className="border-white/10"
                        >
                          {service.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(service)} className="border-white/10">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Delete this service?")) {
                              deleteServiceMutation.mutate(service.id);
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

        {/* Create/Edit Service Dialog */}
        <Dialog open={showDialog} onOpenChange={() => resetForm()}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{editingService ? "Edit Service" : "Create Recurring Service"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pr-2">
              <div>
                <Label className="text-gray-300">Service Name *</Label>
                <Input
                  value={formData.service_name}
                  onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                  placeholder="e.g., Morning Douala-Yaoundé Express"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-300">Route Template *</Label>
                <Select value={formData.route_template_id} onValueChange={(value) => setFormData({...formData, route_template_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {routeTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Departure Time *</Label>
                  <Input
                    type="time"
                    value={formData.departure_time_local}
                    onChange={(e) => setFormData({...formData, departure_time_local: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Base Price (XAF) *</Label>
                  <Input
                    type="number"
                    value={formData.base_price_xaf}
                    onChange={(e) => setFormData({...formData, base_price_xaf: e.target.value})}
                    placeholder="e.g., 5000"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Days of Week *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {days.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.days_of_week_json[day]
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Vehicle Assignment *</Label>
                <RadioGroup value={formData.vehicle_assignment_type} onValueChange={(value) => setFormData({...formData, vehicle_assignment_type: value})}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <Label htmlFor="fixed" className="text-gray-300 cursor-pointer">
                        Fixed Vehicle
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pool" id="pool" />
                      <Label htmlFor="pool" className="text-gray-300 cursor-pointer">
                        Vehicle Pool (Rotate)
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {formData.vehicle_assignment_type === 'fixed' && (
                  <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-3">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.nickname}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.vehicle_assignment_type === 'pool' && (
                  <div className="mt-3 space-y-2">
                    {vehicles.map(v => (
                      <label key={v.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={formData.vehicle_pool_json.includes(v.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, vehicle_pool_json: [...formData.vehicle_pool_json, v.id]});
                            } else {
                              setFormData({...formData, vehicle_pool_json: formData.vehicle_pool_json.filter(id => id !== v.id)});
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-white">{v.nickname}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-gray-300 mb-3 block">Sales Channels</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sales_channels_enabled_json.online}
                      onChange={(e) => setFormData({
                        ...formData,
                        sales_channels_enabled_json: {
                          ...formData.sales_channels_enabled_json,
                          online: e.target.checked
                        }
                      })}
                      className="w-4 h-4"
                    />
                    <span className="text-white">Online Sales</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sales_channels_enabled_json.offline}
                      onChange={(e) => setFormData({
                        ...formData,
                        sales_channels_enabled_json: {
                          ...formData.sales_channels_enabled_json,
                          offline: e.target.checked
                        }
                      })}
                      className="w-4 h-4"
                    />
                    <span className="text-white">Offline Sales</span>
                  </label>
                </div>
              </div>

              {formData.sales_channels_enabled_json.online && (
                <div>
                  <Label className="text-gray-300 mb-3 block">Online Seat Pool</Label>
                  <RadioGroup value={formData.online_seat_pool_rule} onValueChange={(value) => setFormData({...formData, online_seat_pool_rule: value})}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="text-gray-300 cursor-pointer">
                          All seats available online
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subset" id="subset" />
                        <Label htmlFor="subset" className="text-gray-300 cursor-pointer">
                          Select specific seats for online
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {formData.online_seat_pool_rule === 'subset' && getSelectedSeatTemplate() && (
                    <div className="mt-4">
                      <SeatSelector
                        template={getSelectedSeatTemplate()}
                        selectedSeats={formData.subset_seats_json}
                        onSelectSeats={(seats) => setFormData({...formData, subset_seats_json: seats})}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">End Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Auto-Generate Days Ahead</Label>
                <Input
                  type="number"
                  value={formData.generate_days_ahead}
                  onChange={(e) => setFormData({...formData, generate_days_ahead: e.target.value})}
                  placeholder="14"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Trips will be auto-generated this many days in advance</p>
              </div>

              <Button
                onClick={() => createServiceMutation.mutate(formData)}
                disabled={
                  !formData.service_name || 
                  !formData.route_template_id || 
                  !formData.departure_time_local || 
                  !formData.base_price_xaf ||
                  (formData.vehicle_assignment_type === 'fixed' && !formData.vehicle_id) ||
                  (formData.vehicle_assignment_type === 'pool' && formData.vehicle_pool_json.length === 0) ||
                  createServiceMutation.isPending
                }
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createServiceMutation.isPending ? "Saving..." : (editingService ? "Update" : "Create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Seat Allocation Dialog for Services */}
        <Dialog open={!!showAllocationDialog} onOpenChange={() => setShowAllocationDialog(null)}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Seat Allocation - {showAllocationDialog?.service_name}
              </DialogTitle>
            </DialogHeader>
            {showAllocationDialog && (
              <SeatAllocationManager
                operatorId={operator.id}
                totalSeats={(() => {
                  const vehicleId = showAllocationDialog.vehicle_id || showAllocationDialog.vehicle_pool_json?.[0];
                  const vehicle = vehicles.find(v => v.id === vehicleId);
                  if (!vehicle) return 50;
                  const template = seatMapTemplates.find(t => t.id === vehicle.seat_map_template_id);
                  if (!template) return 50;
                  const layout = template.layout_json.layout;
                  return layout.reduce((total, row) => total + row.filter(seat => seat === 1).length, 0);
                })()}
                branches={branches}
                scope="service"
                scopeId={showAllocationDialog.id}
                onSave={() => setShowAllocationDialog(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}