import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Phone, Mail, CreditCard, Star, AlertTriangle, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ManageDrivers() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [incidentDescription, setIncidentDescription] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    license_expiry: "",
    experience_years: "",
    status: "active",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['drivers-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers', operator?.id],
    queryFn: () => base44.entities.Driver.filter({ operator_id: operator.id }, "-created_date"),
    enabled: !!operator
  });

  const createDriverMutation = useMutation({
    mutationFn: (data) => base44.entities.Driver.create({
      operator_id: operator.id,
      ...data,
      experience_years: data.experience_years ? parseFloat(data.experience_years) : 0,
      rating: 0,
      total_trips: 0,
      incidents_json: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Driver added!");
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Driver updated!");
      setShowCreateDialog(false);
      setEditingDriver(null);
      resetForm();
    }
  });

  const logIncidentMutation = useMutation({
    mutationFn: async () => {
      const incidents = selectedDriver.incidents_json || [];
      incidents.push({
        date: new Date().toISOString(),
        description: incidentDescription,
        logged_by: user.email
      });

      await base44.entities.Driver.update(selectedDriver.id, {
        incidents_json: incidents
      });

      // Audit log
      await base44.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: operator.id,
        action_type: "driver_incident_logged",
        entity_type: "Driver",
        entity_id: selectedDriver.id,
        payload_json: {
          driver_name: selectedDriver.full_name,
          description: incidentDescription
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Incident logged!");
      setShowIncidentDialog(false);
      setIncidentDescription("");
      setSelectedDriver(null);
    }
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      license_number: "",
      license_expiry: "",
      experience_years: "",
      status: "active",
      notes: ""
    });
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      full_name: driver.full_name,
      phone: driver.phone,
      email: driver.email || "",
      license_number: driver.license_number,
      license_expiry: driver.license_expiry ? format(new Date(driver.license_expiry), "yyyy-MM-dd") : "",
      experience_years: driver.experience_years?.toString() || "",
      status: driver.status,
      notes: driver.notes || ""
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.full_name || !formData.phone || !formData.license_number) {
      toast.error("Fill in all required fields");
      return;
    }

    if (editingDriver) {
      updateDriverMutation.mutate({ id: editingDriver.id, data: formData });
    } else {
      createDriverMutation.mutate(formData);
    }
  };

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const totalTrips = drivers.reduce((sum, d) => sum + (d.total_trips || 0), 0);
  const avgRating = drivers.length > 0 
    ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Driver Management</h1>
            <p className="text-gray-400">Manage your driver team</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Drivers</span>
            </div>
            <div className="text-3xl font-bold text-white">{drivers.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Active Drivers</span>
            </div>
            <div className="text-3xl font-bold text-white">{activeDrivers}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Total Trips</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalTrips}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Avg Rating</span>
            </div>
            <div className="text-3xl font-bold text-white">{avgRating}</div>
          </Card>
        </div>

        {/* Drivers List */}
        <div className="space-y-4">
          {drivers.map(driver => (
            <Card key={driver.id} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{driver.full_name}</h3>
                      <Badge className={
                        driver.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        driver.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }>
                        {driver.status}
                      </Badge>
                      {driver.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-yellow-400">{driver.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span>{driver.phone}</span>
                      </div>
                      {driver.email && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-purple-400" />
                          <span>{driver.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-300">
                        <CreditCard className="w-4 h-4 text-green-400" />
                        <span>License: {driver.license_number}</span>
                      </div>
                      {driver.license_expiry && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-yellow-400" />
                          <span>Expires: {format(new Date(driver.license_expiry), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 mt-3 text-xs text-gray-400">
                      <span>{driver.total_trips || 0} trips completed</span>
                      {driver.experience_years && <span>{driver.experience_years} years experience</span>}
                      {driver.incidents_json?.length > 0 && (
                        <span className="text-red-400">{driver.incidents_json.length} incident(s)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(driver)} className="border-white/10">
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedDriver(driver);
                      setShowIncidentDialog(true);
                    }}
                    className="border-red-500/30 text-red-400"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Log Incident
                  </Button>
                </div>
              </div>

              {driver.notes && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-300">{driver.notes}</p>
                </div>
              )}
            </Card>
          ))}

          {drivers.length === 0 && (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-bold text-white mb-2">No Drivers Yet</h3>
              <p className="text-gray-400">Add your first driver to get started</p>
            </Card>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingDriver(null);
            resetForm();
          }
        }}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">{editingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+237 xxx xxx xxx"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="driver@example.com"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Experience (Years)</Label>
                  <Input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                    placeholder="5"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">License Number *</Label>
                  <Input
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                    placeholder="DL123456789"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">License Expiry</Label>
                  <Input
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({...formData, license_expiry: e.target.value})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional information about the driver..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              <Button onClick={handleSubmit} className="w-full bg-blue-500">
                {editingDriver ? "Update Driver" : "Add Driver"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Incident Dialog */}
        <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
          <DialogContent className="bg-[#0F1D35] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Log Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-4 bg-white/5 border-white/10">
                <p className="text-sm text-gray-400 mb-1">Driver:</p>
                <p className="text-white font-semibold">{selectedDriver?.full_name}</p>
              </Card>

              <div>
                <Label className="text-gray-300">Incident Description *</Label>
                <Textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Describe the incident..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>

              {selectedDriver?.incidents_json?.length > 0 && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                  <p className="text-yellow-300 text-sm">
                    This driver has {selectedDriver.incidents_json.length} previous incident(s) on record
                  </p>
                </Card>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  setShowIncidentDialog(false);
                  setIncidentDescription("");
                  setSelectedDriver(null);
                }} className="flex-1 border-white/10">
                  Cancel
                </Button>
                <Button
                  onClick={() => logIncidentMutation.mutate()}
                  disabled={!incidentDescription || logIncidentMutation.isPending}
                  className="flex-1 bg-red-500"
                >
                  {logIncidentMutation.isPending ? "Logging..." : "Log Incident"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}