import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/components/hooks/useCurrentUser";
import { useBusOperator } from "@/components/hooks/useBusOperator";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bus, Plus, Calendar, MapPin, DollarSign, X, CheckCircle, Plane, Flag, FileText, Truck, Copy, Layers, UserCheck, MessageSquare, Users, RefreshCw, ArrowRightLeft, AlertTriangle, Navigation } from "lucide-react";
import SeatAllocationManager from "../components/bus/SeatAllocationManager";
import MoveSeatsBetweenBranches from "../components/bus/MoveSeatsBetweenBranches";
import LoadingCard from "../components/shared/LoadingCard";
import EmptyState from "../components/shared/EmptyState";
import StatusBadge from "../components/shared/StatusBadge";
import QueryErrorFallback from "../components/shared/QueryErrorFallback";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import SeatSelector from "../components/bus/SeatSelector";

export default function ManageBusTrips() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useCurrentUser();
  const { data: operator } = useBusOperator(user?.email);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [cloningTrip, setCloningTrip] = useState(null);
  const [cloneDates, setCloneDates] = useState([]);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [step, setStep] = useState(1);
  const [showAllocationDialog, setShowAllocationDialog] = useState(null);
  const [showMoveSeatsDialog, setShowMoveSeatsDialog] = useState(null);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(null);
  const [emergencyReason, setEmergencyReason] = useState("");

  const initialFormData = {
    route_template_id: "",
    route_id: "",
    vehicle_id: "",
    driver_id: "",
    departure_datetime: "",
    arrival_estimate_datetime: "",
    departure_branch_id: "",
    arrival_branch_text: "",
    base_price_xaf: "",
    sales_channels_enabled_json: {
      online: true,
      offline: true
    },
    online_seat_pool_rule: "all",
    selected_online_seats: []
  };

  const [formData, setFormData] = useState(initialFormData);

  const initialBulkForm = {
    route_template_id: "",
    departure_time: "",
    base_price_xaf: "",
    vehicle_assignment_type: "fixed",
    vehicle_id: "",
    vehicle_pool_json: [],
    date_range_start: "",
    date_range_end: "",
    days_of_week: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    sales_channels_enabled_json: { online: true, offline: true },
    online_seat_pool_rule: "all"
  };

  const [bulkForm, setBulkForm] = useState(initialBulkForm);

  const { data: trips = [], isLoading, error: tripsError, refetch: refetchTrips } = useQuery({
    queryKey: ['trips', operator?.id],
    queryFn: () => base44.entities.Trip.filter({ operator_id: operator.id }, "-departure_datetime"),
    enabled: !!operator,
    refetchInterval: 60000,
    retry: 2
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator,
    staleTime: 10 * 60 * 1000
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-list', operator?.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator,
    staleTime: 10 * 60 * 1000
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator,
    staleTime: 10 * 60 * 1000
  });

  const { data: seatMapTemplates = [] } = useQuery({
    queryKey: ['seat-templates-list', operator?.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator,
    staleTime: 15 * 60 * 1000
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['trip-drivers', operator?.id],
    queryFn: () => base44.entities.Driver.filter({ operator_id: operator.id, status: "active" }),
    enabled: !!operator,
    staleTime: 5 * 60 * 1000
  });

  const { data: routeTemplates = [] } = useQuery({
    queryKey: ['route-templates', operator?.id],
    queryFn: () => base44.entities.RouteTemplate.filter({ operator_id: operator.id, is_active: true }),
    enabled: !!operator,
    staleTime: 10 * 60 * 1000
  });

  const createTripMutation = useMutation({
    mutationFn: async (data) => {
      if (!operator || !data.route_id || !data.vehicle_id) {
        throw new Error("Missing required trip data");
      }
      // Create trip
      const trip = await base44.entities.Trip.create({
        operator_id: operator.id,
        route_id: data.route_id,
        vehicle_id: data.vehicle_id,
        driver_id: data.driver_id || undefined,
        departure_datetime: data.departure_datetime,
        arrival_estimate_datetime: data.arrival_estimate_datetime,
        departure_branch_id: data.departure_branch_id,
        arrival_branch_text: data.arrival_branch_text,
        base_price_xaf: parseFloat(data.base_price_xaf),
        trip_status: "scheduled",
        sales_channels_enabled_json: data.sales_channels_enabled_json,
        online_seat_pool_rule: data.online_seat_pool_rule
      });

      // Get vehicle's seat map template
      const vehicle = vehicles.find(v => v.id === data.vehicle_id);
      const template = seatMapTemplates.find(t => t.id === vehicle.seat_map_template_id);

      // Generate seat inventory
      const seatInventory = [];
      const layout = template.layout_json.layout;
      const seatClasses = template.layout_json.seatClasses || {};
      const pricingRules = template.default_seat_class_rules_json || {};

      for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
        const row = layout[rowIndex];
        let seatNumber = 1;
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === 1) {
            const rowLabel = String.fromCharCode(65 + rowIndex);
            const seatCode = `${rowLabel}${seatNumber}`;
            const isVip = seatClasses[seatCode] === 'vip';

            let price = parseFloat(data.base_price_xaf);
            if (isVip && pricingRules.vip_multiplier) {
              price = price * pricingRules.vip_multiplier;
            }
            if (rowIndex === 0 && pricingRules.front_row_premium) {
              price += pricingRules.front_row_premium;
            }

            const isOnlineAllowed = data.online_seat_pool_rule === 'all' || data.selected_online_seats.includes(seatCode);

            seatInventory.push({
              trip_id: trip.id,
              seat_code: seatCode,
              seat_class: isVip ? 'vip' : 'standard',
              seat_status: isOnlineAllowed ? 'available' : 'blocked',
              price_xaf: Math.round(price)
            });

            seatNumber++;
          }
        }
      }

      // Bulk create seat inventory
      await base44.entities.TripSeatInventory.bulkCreate(seatInventory);

      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      toast.success("Trip created with seat inventory!");
      setShowCreateDialog(false);
      setStep(1);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create trip: " + error.message);
    }
  });

  const updateTripStatusMutation = useMutation({
    mutationFn: async ({ tripId, status, cancelReason }) => {
      if (status === 'canceled') {
        // Use server function which handles: status update + notification + seat release + audit
        await base44.functions.invoke('sendCancelNotice', {
          trip_id: tripId,
          cancel_reason: cancelReason || 'Canceled by operator'
        });
        
        // Also release held seats and cancel orders (not done by sendCancelNotice)
        const seats = await base44.entities.TripSeatInventory.filter({ trip_id: tripId });
        for (const seat of seats) {
          if (seat.seat_status === 'held') {
            await base44.entities.TripSeatInventory.update(seat.id, {
              seat_status: 'canceled', held_until: null, held_by_order_id: null
            }).catch(e => console.error('Seat release failed:', e));
          }
        }
        
        const orders = await base44.entities.Order.filter({ trip_id: tripId, order_status: 'paid' });
        for (const order of orders) {
          await base44.entities.Order.update(order.id, {
            order_status: 'canceled',
            cancellation_reason: cancelReason || 'Trip canceled by operator',
            canceled_at: new Date().toISOString()
          }).catch(e => console.error('Order cancel failed:', e));
        }
      } else {
        await base44.entities.Trip.update(tripId, { trip_status: status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trips']);
      toast.success("Trip status updated!");
    }
  });

  const cloneTripMutation = useMutation({
    mutationFn: async ({ tripId, dates }) => {
      const response = await base44.functions.invoke('cloneTrip', {
        trip_id: tripId,
        new_dates: dates
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['trips']);
      toast.success(`Cloned ${data.trips_created} ${data.trips_created === 1 ? 'trip' : 'trips'}!`);
      setShowCloneDialog(false);
      setCloningTrip(null);
      setCloneDates([]);
    },
    onError: (error) => {
      toast.error("Clone failed: " + error.message);
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('bulkCreateTrips', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['trips']);
      toast.success(`Created ${data.trips_created} ${data.trips_created === 1 ? 'trip' : 'trips'}!`);
      setShowBulkDialog(false);
      setBulkPreview([]);
      setBulkForm(initialBulkForm);
    },
    onError: (error) => {
      toast.error("Bulk create failed: " + error.message);
    }
  });

  const rebalanceSeatsMutation = useMutation({
    mutationFn: async (tripId) => {
      const response = await base44.functions.invoke('rebalanceSeats', {
        trip_id: tripId,
        triggered_by: 'admin',
        actor_user_id: user.email
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['trips']);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error("Rebalance failed: " + error.message);
    }
  });

  const toggleEmergencyMutation = useMutation({
    mutationFn: async ({ tripId, enable, reason }) => {
      const response = await base44.functions.invoke('toggleEmergencyMode', {
        trip_id: tripId,
        enable: enable,
        reason: reason
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['trips']);
      toast.success(data.message);
      setShowEmergencyDialog(null);
      setEmergencyReason("");
    },
    onError: (error) => {
      toast.error("Emergency mode failed: " + error.message);
    }
  });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const getSelectedSeatTemplate = () => {
    const vehicle = vehicles.find(v => v.id === formData.vehicle_id);
    if (!vehicle) return null;
    return seatMapTemplates.find(t => t.id === vehicle.seat_map_template_id);
  };

  const handleTemplateSelect = (templateId) => {
    const template = routeTemplates.find(t => t.id === templateId);
    if (!template) return;

    const route = routes.find(r => 
      r.origin_city === template.origin_city && 
      r.destination_city === template.destination_city
    );

    setFormData({
      ...formData,
      route_template_id: templateId,
      route_id: route?.id || "",
      departure_branch_id: template.default_departure_branch_id || "",
      arrival_branch_text: template.default_arrival_branch_text || "",
      base_price_xaf: ""
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.route_id || !formData.vehicle_id || !formData.departure_datetime || !formData.base_price_xaf) {
        toast.error("Fill in all required fields");
        return;
      }
    }
    setStep(step + 1);
  };

  const generateBulkPreview = () => {
    const preview = [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const start = new Date(bulkForm.date_range_start);
    const end = new Date(bulkForm.date_range_end);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()];
      if (bulkForm.days_of_week[dayName]) {
        const [hours, minutes] = bulkForm.departure_time.split(':');
        const departureDate = new Date(d);
        departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        preview.push({
          date: new Date(d),
          departure: departureDate
        });
      }
    }

    setBulkPreview(preview);
  };

  if (userLoading || !user || !operator) {
    return <LoadingCard />;
  }

  if (tripsError) {
    return <QueryErrorFallback error={tripsError} onRetry={refetchTrips} title="Failed to load trips" />;
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Trip Scheduling</h1>
            <p className="text-sm sm:text-base text-gray-400">Schedule and manage your trips</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowBulkDialog(true)} variant="outline" className="border-white/10 flex-1 sm:flex-none" size="sm">
              <Layers className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Bulk Create</span>
              <span className="sm:hidden">Bulk</span>
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 flex-1 sm:flex-none" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Schedule Trip</span>
              <span className="sm:hidden">New Trip</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingCard message="Loading trips..." />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Bus}
            title="No Trips Scheduled"
            description="Create your first trip to start selling tickets"
          />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {trips.map((trip) => {
              const route = routes.find(r => r.id === trip.route_id);
              const vehicle = vehicles.find(v => v.id === trip.vehicle_id);

              return (
                <motion.div key={trip.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                        <Bus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                              {route?.origin_city} → {route?.destination_city}
                            </h3>
                            <StatusBadge status={trip.trip_status} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <span>{format(new Date(trip.departure_datetime), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span>{trip.base_price_xaf.toLocaleString()} XAF</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Bus className="w-4 h-4 text-purple-400" />
                              <span>{vehicle?.nickname || "Unknown Vehicle"}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {trip.sales_channels_enabled_json?.online && (
                                <Badge className="bg-blue-500/20 text-blue-400 text-xs">Online</Badge>
                              )}
                              {trip.sales_channels_enabled_json?.offline && (
                                <Badge className="bg-green-500/20 text-green-400 text-xs">Offline</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                        {trip.trip_status === 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCloningTrip(trip);
                                setShowCloneDialog(true);
                              }}
                              className="border-purple-500/30 text-purple-400"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Clone
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateTripStatusMutation.mutate({ tripId: trip.id, status: 'boarding' })}
                              className="bg-green-500"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Open Boarding
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm("Cancel this trip?")) {
                                  updateTripStatusMutation.mutate({ tripId: trip.id, status: 'canceled' });
                                }
                              }}
                              className="border-red-500/30 text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAllocationDialog(trip)}
                          className="border-purple-500/30 text-purple-400"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Allocate
                        </Button>
                        {trip.trip_status === 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm("Rebalance unused seats to online pool?")) {
                                  rebalanceSeatsMutation.mutate(trip.id);
                                }
                              }}
                              disabled={rebalanceSeatsMutation.isPending}
                              className="border-orange-500/30 text-orange-400"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Rebalance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowMoveSeatsDialog(trip)}
                              className="border-yellow-500/30 text-yellow-400"
                            >
                              <ArrowRightLeft className="w-3 h-3 mr-1" />
                              Move
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowEmergencyDialog(trip)}
                              className={trip.emergency_mode_enabled ? "border-red-500 text-red-400 bg-red-500/10" : "border-red-500/30 text-red-400"}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {trip.emergency_mode_enabled ? "Emergency ON" : "Emergency"}
                            </Button>
                          </>
                        )}
                        <Link to={createPageUrl("TripManifest", `id=${trip.id}`)}>
                          <Button size="sm" variant="outline" className="border-white/10">
                            <FileText className="w-3 h-3 mr-1" />
                            Manifest
                          </Button>
                        </Link>
                        <Link to={createPageUrl("TripManifest", `id=${trip.id}&driver=true`)}>
                          <Button size="sm" variant="outline" className="border-white/10">
                            <Truck className="w-3 h-3 mr-1" />
                            Driver
                          </Button>
                        </Link>
                        {(trip.trip_status === 'boarding' || trip.trip_status === 'scheduled' || trip.trip_status === 'delayed') && (
                          <>
                            <Link to={createPageUrl("VendorBoardingDashboard", `id=${trip.id}`)}>
                              <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Boarding
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {trip.trip_status === 'boarding' && (
                      <Button
                        size="sm"
                        onClick={() => updateTripStatusMutation.mutate({ tripId: trip.id, status: 'departed' })}
                        className="bg-purple-500"
                      >
                        <Plane className="w-3 h-3 mr-1" />
                        Depart
                      </Button>
                    )}

                    {trip.trip_status === 'departed' && (
                      <Button
                        size="sm"
                        onClick={() => updateTripStatusMutation.mutate({ tripId: trip.id, status: 'completed' })}
                        className="bg-gray-500"
                      >
                        <Flag className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Trip Multi-Step Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#0F1D35] border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Schedule New Trip</h2>
                  <Button variant="ghost" onClick={() => { setShowCreateDialog(false); setStep(1); resetForm(); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Trip Info</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-gray-700" />
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Sales & Seats</span>
                  </div>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    {routeTemplates.length > 0 && (
                      <div>
                        <Label className="text-gray-300">Quick Start: Use Template</Label>
                        <Select value={formData.route_template_id} onValueChange={handleTemplateSelect}>
                          <SelectTrigger className="bg-purple-500/20 border-purple-500/30 text-white mt-2">
                            <SelectValue placeholder="Choose a route template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {routeTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">Auto-fills route details and settings</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Route *</Label>
                        <Select value={formData.route_id} onValueChange={(value) => setFormData({...formData, route_id: value})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                          <SelectContent>
                            {routes.map(r => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.origin_city} → {r.destination_city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Vehicle *</Label>
                        <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.nickname}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Driver (Optional)</Label>
                      <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>No driver assigned</SelectItem>
                          {drivers.map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Departure Date & Time *</Label>
                        <Input
                          type="datetime-local"
                          value={formData.departure_datetime}
                          onChange={(e) => setFormData({...formData, departure_datetime: e.target.value})}
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Estimated Arrival</Label>
                        <Input
                          type="datetime-local"
                          value={formData.arrival_estimate_datetime}
                          onChange={(e) => setFormData({...formData, arrival_estimate_datetime: e.target.value})}
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Departure Station</Label>
                        <Select value={formData.departure_branch_id} onValueChange={(value) => setFormData({...formData, departure_branch_id: value})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                            <SelectValue placeholder="Select station" />
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
                        <Label className="text-gray-300">Arrival Location</Label>
                        <Input
                          value={formData.arrival_branch_text}
                          onChange={(e) => setFormData({...formData, arrival_branch_text: e.target.value})}
                          placeholder="Arrival station/location"
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
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

                    <Button onClick={handleNext} className="w-full bg-blue-500">
                      Next: Sales & Seats
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
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
                          <span className="text-white">Offline Sales (Walk-in)</span>
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
                                All seats available online (Recommended)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="subset" id="subset" />
                              <Label htmlFor="subset" className="text-gray-300 cursor-pointer">
                                Select specific seats for online (others offline-only)
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {formData.online_seat_pool_rule === 'subset' && getSelectedSeatTemplate() && (
                      <SeatSelector
                        template={getSelectedSeatTemplate()}
                        selectedSeats={formData.selected_online_seats}
                        onSelectSeats={(seats) => setFormData({...formData, selected_online_seats: seats})}
                      />
                    )}

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-white/10">
                        Back
                      </Button>
                      <Button
                        onClick={() => createTripMutation.mutate(formData)}
                        disabled={createTripMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                      >
                        {createTripMutation.isPending ? "Creating..." : "Create Trip"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Clone Trip Dialog */}
        {showCloneDialog && cloningTrip && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#0F1D35] border-white/10 max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Clone Trip</h2>
                  <Button variant="ghost" onClick={() => { setShowCloneDialog(false); setCloningTrip(null); setCloneDates([]); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <Card className="p-4 bg-white/5 border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Cloning trip:</p>
                    <p className="text-white font-semibold">
                      {routes.find(r => r.id === cloningTrip.route_id)?.origin_city} → {routes.find(r => r.id === cloningTrip.route_id)?.destination_city}
                    </p>
                    <p className="text-sm text-gray-400">
                      Original: {format(new Date(cloningTrip.departure_datetime), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </Card>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Select New Dates</Label>
                    <p className="text-xs text-gray-500 mb-3">Enter dates separated by commas (e.g., 2025-01-15, 2025-01-16)</p>
                    <Input
                      type="text"
                      placeholder="2025-01-15, 2025-01-16, 2025-01-17"
                      onChange={(e) => {
                        const dateStrings = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                        setCloneDates(dateStrings);
                      }}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  {cloneDates.length > 0 && (
                    <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                      <p className="text-sm text-gray-300 mb-2">Will create {cloneDates.length} {cloneDates.length === 1 ? 'trip' : 'trips'}</p>
                      <div className="space-y-1">
                        {cloneDates.map((dateStr, idx) => (
                          <p key={idx} className="text-xs text-gray-400">
                            • {dateStr} at {format(new Date(cloningTrip.departure_datetime), "h:mm a")}
                          </p>
                        ))}
                      </div>
                    </Card>
                  )}

                  <Button
                    onClick={() => cloneTripMutation.mutate({ tripId: cloningTrip.id, dates: cloneDates })}
                    disabled={cloneDates.length === 0 || cloneTripMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    {cloneTripMutation.isPending ? "Cloning..." : `Clone to ${cloneDates.length} ${cloneDates.length === 1 ? 'Date' : 'Dates'}`}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Bulk Create Dialog */}
        {showBulkDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#0F1D35] border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Bulk Create Trips</h2>
                  <Button variant="ghost" onClick={() => { setShowBulkDialog(false); setBulkPreview([]); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {bulkPreview.length === 0 ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Route Template *</Label>
                      <Select value={bulkForm.route_template_id} onValueChange={(value) => setBulkForm({...bulkForm, route_template_id: value})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {routeTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Departure Time *</Label>
                        <Input
                          type="time"
                          value={bulkForm.departure_time}
                          onChange={(e) => setBulkForm({...bulkForm, departure_time: e.target.value})}
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Base Price (XAF) *</Label>
                        <Input
                          type="number"
                          value={bulkForm.base_price_xaf}
                          onChange={(e) => setBulkForm({...bulkForm, base_price_xaf: e.target.value})}
                          placeholder="5000"
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-3 block">Vehicle Assignment *</Label>
                      <RadioGroup value={bulkForm.vehicle_assignment_type} onValueChange={(value) => setBulkForm({...bulkForm, vehicle_assignment_type: value})}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="bulk-fixed" />
                          <Label htmlFor="bulk-fixed" className="text-gray-300 cursor-pointer">Fixed Vehicle</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pool" id="bulk-pool" />
                          <Label htmlFor="bulk-pool" className="text-gray-300 cursor-pointer">Vehicle Pool</Label>
                        </div>
                      </RadioGroup>

                      {bulkForm.vehicle_assignment_type === 'fixed' && (
                        <Select value={bulkForm.vehicle_id} onValueChange={(value) => setBulkForm({...bulkForm, vehicle_id: value})}>
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

                      {bulkForm.vehicle_assignment_type === 'pool' && (
                        <div className="mt-3 space-y-2">
                          {vehicles.map(v => (
                            <label key={v.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={bulkForm.vehicle_pool_json.includes(v.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkForm({...bulkForm, vehicle_pool_json: [...bulkForm.vehicle_pool_json, v.id]});
                                  } else {
                                    setBulkForm({...bulkForm, vehicle_pool_json: bulkForm.vehicle_pool_json.filter(id => id !== v.id)});
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-white text-sm">{v.nickname}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Start Date *</Label>
                        <Input
                          type="date"
                          value={bulkForm.date_range_start}
                          onChange={(e) => setBulkForm({...bulkForm, date_range_start: e.target.value})}
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">End Date *</Label>
                        <Input
                          type="date"
                          value={bulkForm.date_range_end}
                          onChange={(e) => setBulkForm({...bulkForm, date_range_end: e.target.value})}
                          className="bg-white/5 border-white/10 text-white mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-3 block">Days of Week *</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setBulkForm({
                              ...bulkForm,
                              days_of_week: {...bulkForm.days_of_week, [day]: !bulkForm.days_of_week[day]}
                            })}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                              bulkForm.days_of_week[day] ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'
                            }`}
                          >
                            {day.slice(0, 3).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={generateBulkPreview}
                      disabled={!bulkForm.route_template_id || !bulkForm.departure_time || !bulkForm.base_price_xaf || 
                        !bulkForm.date_range_start || !bulkForm.date_range_end ||
                        (bulkForm.vehicle_assignment_type === 'fixed' && !bulkForm.vehicle_id) ||
                        (bulkForm.vehicle_assignment_type === 'pool' && bulkForm.vehicle_pool_json.length === 0)}
                      className="w-full bg-blue-500"
                    >
                      Preview Trips
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card className="p-4 bg-white/5 border-white/10">
                      <p className="text-white font-semibold mb-2">Preview: {bulkPreview.length} Trips</p>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {bulkPreview.map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-400">
                            {format(item.departure, "EEE, MMM d, yyyy 'at' h:mm a")}
                          </p>
                        ))}
                      </div>
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setBulkPreview([])} className="flex-1 border-white/10">
                        Back
                      </Button>
                      <Button
                        onClick={() => bulkCreateMutation.mutate(bulkForm)}
                        disabled={bulkCreateMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                      >
                        {bulkCreateMutation.isPending ? "Creating..." : `Create ${bulkPreview.length} Trips`}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Seat Allocation Dialog for Trips */}
        {showAllocationDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#0F1D35] border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Seat Allocation - Trip Override</h2>
                  <Button variant="ghost" onClick={() => setShowAllocationDialog(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <SeatAllocationManager
                  operatorId={operator.id}
                  totalSeats={(() => {
                    const vehicle = vehicles.find(v => v.id === showAllocationDialog.vehicle_id);
                    if (!vehicle) return 50;
                    const template = seatMapTemplates.find(t => t.id === vehicle.seat_map_template_id);
                    if (!template) return 50;
                    const layout = template.layout_json.layout;
                    return layout.reduce((total, row) => total + row.filter(seat => seat === 1).length, 0);
                  })()}
                  branches={branches}
                  scope="trip"
                  scopeId={showAllocationDialog.id}
                  onSave={() => setShowAllocationDialog(null)}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Move Seats Dialog */}
        {showMoveSeatsDialog && (
          <MoveSeatsBetweenBranches
            trip={showMoveSeatsDialog}
            branches={branches}
            open={!!showMoveSeatsDialog}
            onClose={() => setShowMoveSeatsDialog(null)}
          />
        )}

        {/* Emergency Mode Dialog */}
        {showEmergencyDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="bg-[#0F1D35] border-white/10 max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Emergency Mode</h2>
                  <Button variant="ghost" onClick={() => {
                    setShowEmergencyDialog(null);
                    setEmergencyReason("");
                  }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {showEmergencyDialog.emergency_mode_enabled ? (
                  <div className="space-y-4">
                    <Card className="p-4 bg-red-500/10 border-red-500/30">
                      <div className="flex items-center gap-2 text-red-300">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-semibold">Emergency Mode ACTIVE</p>
                      </div>
                      <p className="text-xs text-red-400 mt-2">
                        Reason: {showEmergencyDialog.emergency_mode_reason}
                      </p>
                    </Card>

                    <p className="text-sm text-gray-300">
                      All seat allocations are currently bypassed. All seats can be sold on any channel.
                    </p>

                    <Button
                      onClick={() => toggleEmergencyMutation.mutate({
                        tripId: showEmergencyDialog.id,
                        enable: false,
                        reason: ""
                      })}
                      disabled={toggleEmergencyMutation.isPending}
                      className="w-full bg-green-500"
                    >
                      {toggleEmergencyMutation.isPending ? "Disabling..." : "Disable Emergency Mode"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                      <div className="flex items-start gap-2 text-yellow-300 text-sm">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-1">Use only in emergencies!</p>
                          <p>This will bypass all seat allocations and allow all seats to be sold on any channel.</p>
                        </div>
                      </div>
                    </Card>

                    <div>
                      <Label className="text-gray-300">Reason for Emergency Mode *</Label>
                      <Input
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        placeholder="e.g., System failure, urgent capacity needed..."
                        className="bg-white/5 border-white/10 text-white mt-2"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        if (!emergencyReason) {
                          toast.error("Reason required");
                          return;
                        }
                        if (confirm("Enable emergency mode? This bypasses all allocations!")) {
                          toggleEmergencyMutation.mutate({
                            tripId: showEmergencyDialog.id,
                            enable: true,
                            reason: emergencyReason
                          });
                        }
                      }}
                      disabled={!emergencyReason || toggleEmergencyMutation.isPending}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      {toggleEmergencyMutation.isPending ? "Enabling..." : "Enable Emergency Mode"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}