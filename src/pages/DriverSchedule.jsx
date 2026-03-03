import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Plus, Bus } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { toast } from "sonner";

export default function DriverSchedule() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    driver_id: "",
    shift_date: "",
    start_time: "",
    end_time: "",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['schedule-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['schedule-drivers', operator?.id],
    queryFn: () => base44.entities.Driver.filter({ operator_id: operator.id, status: "active" }),
    enabled: !!operator
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const { data: shifts = [] } = useQuery({
    queryKey: ['driver-shifts', operator?.id, currentWeekStart],
    queryFn: () => {
      const endDate = addDays(currentWeekStart, 6);
      return base44.entities.DriverShift.filter({
        operator_id: operator.id,
        shift_date: {
          $gte: format(currentWeekStart, "yyyy-MM-dd"),
          $lte: format(endDate, "yyyy-MM-dd")
        }
      });
    },
    enabled: !!operator
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['schedule-trips', operator?.id, currentWeekStart],
    queryFn: async () => {
      const endDate = addDays(currentWeekStart, 6);
      return base44.entities.Trip.filter({
        operator_id: operator.id,
        departure_datetime: {
          $gte: currentWeekStart.toISOString(),
          $lte: endDate.toISOString()
        }
      });
    },
    enabled: !!operator
  });

  const createShiftMutation = useMutation({
    mutationFn: (data) => base44.entities.DriverShift.create({
      operator_id: operator.id,
      ...data,
      status: "scheduled",
      assigned_trips_json: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['driver-shifts']);
      toast.success("Shift scheduled!");
      setShowCreateDialog(false);
      setFormData({
        driver_id: "",
        shift_date: "",
        start_time: "",
        end_time: "",
        notes: ""
      });
    }
  });

  const getDriverShiftsForDay = (driverId, date) => {
    return shifts.filter(s => 
      s.driver_id === driverId && 
      s.shift_date === format(date, "yyyy-MM-dd")
    );
  };

  const getDriverTripsForDay = (driverId, date) => {
    return trips.filter(t => {
      const tripDate = new Date(t.departure_datetime);
      return t.driver_id === driverId && 
        format(tripDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });
  };

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Driver Schedule</h1>
            <p className="text-gray-400">Manage driver shifts and availability</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Shift
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <Card className="p-4 bg-white/5 border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <Button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))} variant="outline" className="border-white/10">
              Previous Week
            </Button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </h3>
            </div>
            <Button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} variant="outline" className="border-white/10">
              Next Week
            </Button>
          </div>
        </Card>

        {/* Weekly Schedule Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="p-3 bg-white/5 border-white/10 rounded-lg">
                <div className="text-sm font-semibold text-gray-300">Driver</div>
              </div>
              {weekDays.map(day => (
                <div key={day.toISOString()} className="p-3 bg-white/5 border-white/10 rounded-lg text-center">
                  <div className="text-sm font-semibold text-white">{format(day, "EEE")}</div>
                  <div className="text-xs text-gray-400">{format(day, "MMM d")}</div>
                </div>
              ))}
            </div>

            {/* Driver Rows */}
            {drivers.map(driver => (
              <div key={driver.id} className="grid grid-cols-8 gap-2 mb-2">
                <Card className="p-3 bg-white/5 border-white/10 flex items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">{driver.full_name}</div>
                    <div className="text-xs text-gray-400">{driver.phone}</div>
                  </div>
                </Card>

                {weekDays.map(day => {
                  const dayShifts = getDriverShiftsForDay(driver.id, day);
                  const dayTrips = getDriverTripsForDay(driver.id, day);

                  return (
                    <Card key={day.toISOString()} className="p-2 bg-white/5 border-white/10 min-h-[80px]">
                      {dayShifts.length > 0 ? (
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <div key={shift.id} className="bg-blue-500/20 rounded p-2">
                              <div className="flex items-center gap-1 text-xs text-blue-300">
                                <Clock className="w-3 h-3" />
                                <span>{shift.start_time} - {shift.end_time}</span>
                              </div>
                              <Badge className="bg-blue-500/30 text-blue-400 text-xs mt-1">
                                {shift.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : dayTrips.length > 0 ? (
                        <div className="space-y-1">
                          {dayTrips.map(trip => (
                            <div key={trip.id} className="bg-green-500/20 rounded p-2">
                              <div className="flex items-center gap-1 text-xs text-green-300">
                                <Bus className="w-3 h-3" />
                                <span>{format(new Date(trip.departure_datetime), "HH:mm")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 text-center py-2">Off</div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ))}

            {drivers.length === 0 && (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Drivers</h3>
                <p className="text-gray-400">Add drivers first to schedule shifts</p>
              </Card>
            )}
          </div>
        </div>

        {/* Create Shift Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Schedule Driver Shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Driver *</Label>
                <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Shift Date *</Label>
                <Input
                  type="date"
                  value={formData.shift_date}
                  onChange={(e) => setFormData({...formData, shift_date: e.target.value})}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Start Time *</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">End Time *</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <Button
                onClick={() => createShiftMutation.mutate(formData)}
                disabled={!formData.driver_id || !formData.shift_date || !formData.start_time || !formData.end_time}
                className="w-full bg-blue-500"
              >
                Schedule Shift
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}