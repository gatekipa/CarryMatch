import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Package, Calendar, User, MapPin, Loader2, Filter, ArrowRight, Trash2, Ban, Star, AlertCircle, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function AdminListings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  // Mutations for Trips
  const deleteTripMutation = useMutation({
    mutationFn: (id) => base44.entities.Trip.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-trips'] }),
    onError: () => toast.error("Failed to delete trip")
  });

  const updateTripStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Trip.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-trips'] }),
    onError: () => toast.error("Failed to update trip status")
  });

  const toggleTripRecommendMutation = useMutation({
    mutationFn: ({ id, isRecommended }) => base44.entities.Trip.update(id, { is_recommended: isRecommended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-trips'] }),
    onError: () => toast.error("Failed to toggle recommendation")
  });

  // Mutations for Requests
  const deleteRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.ShipmentRequest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] }),
    onError: () => toast.error("Failed to delete request")
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ShipmentRequest.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] }),
    onError: () => toast.error("Failed to update request status")
  });

  const toggleRequestRecommendMutation = useMutation({
    mutationFn: ({ id, isRecommended }) => base44.entities.ShipmentRequest.update(id, { is_recommended: isRecommended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] }),
    onError: () => toast.error("Failed to toggle recommendation")
  });

  const handleDeleteTrip = (id) => {
    if (window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      deleteTripMutation.mutate(id);
    }
  };

  const handleDeleteRequest = (id) => {
    if (window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      deleteRequestMutation.mutate(id);
    }
  };

  useEffect(() => {
    base44.auth.me().then((currentUser) => {
      if (currentUser.role !== "admin") {
        navigate(createPageUrl("Home"));
      } else {
        setUser(currentUser);
      }
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, [navigate]);

  // Fetch all trips
  const { data: allTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['admin-all-trips'],
    queryFn: async () => {
      const trips = await base44.entities.Trip.list("-created_date");
      return trips.map(trip => ({
        ...trip,
        created_by: trip.created_by || trip.traveler_email || 'unknown'
      }));
    },
    enabled: !!user
  });

  // Fetch all requests
  const { data: allRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-all-requests'],
    queryFn: async () => {
      const requests = await base44.entities.ShipmentRequest.list("-created_date");
      return requests.map(request => ({
        ...request,
        created_by: request.created_by || request.requester_email || 'unknown'
      }));
    },
    enabled: !!user
  });

  // Filter by date
  const filterByDate = (items) => {
    if (dateFilter === "all") return items;
    
    const now = new Date();
    const cutoff = new Date();
    
    if (dateFilter === "7days") {
      cutoff.setDate(now.getDate() - 7);
    } else if (dateFilter === "30days") {
      cutoff.setDate(now.getDate() - 30);
    } else if (dateFilter === "90days") {
      cutoff.setDate(now.getDate() - 90);
    }
    
    return items.filter(item => new Date(item.created_date) >= cutoff);
  };

  // Filter by status
  const filterByStatus = (items) => {
    if (statusFilter === "all") return items;
    return items.filter(item => item.status === statusFilter);
  };

  const filteredTrips = filterByStatus(filterByDate(allTrips));
  const filteredRequests = filterByStatus(filterByDate(allRequests));

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading...</h3>
            <p className="text-gray-400">Checking permissions</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Listings</span>
            </h1>
            <p className="text-gray-400">View and manage all user trips and requests</p>
          </div>

          {/* Filters */}
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-[#9EFF00]" />
              <h3 className="font-semibold text-white">Filters</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="trips" className="data-[state=active]:bg-white/10">
                <Plane className="w-4 h-4 mr-2" />
                Trips ({filteredTrips.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-white/10">
                <Package className="w-4 h-4 mr-2" />
                Requests ({filteredRequests.length})
              </TabsTrigger>
            </TabsList>

            {/* Trips Tab */}
            <TabsContent value="trips">
              <Card className="p-6 bg-white/5 border-white/10">
                {tripsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#9EFF00] animate-spin" />
                    <p className="text-gray-400">Loading trips...</p>
                  </div>
                ) : filteredTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <Plane className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No trips found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Traveler</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Route</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Departure</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Weight</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Created</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrips.map((trip) => (
                          <tr key={trip.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" />
                                <div>
                                  <p className="text-sm text-white">{trip.traveler_name || "Not provided"}</p>
                                  <p className="text-xs text-gray-500">{trip.created_by}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-sm text-white">
                                <span>{trip.from_city}</span>
                                <ArrowRight className="w-3 h-3 text-gray-500" />
                                <span>{trip.to_city}</span>
                              </div>
                              <p className="text-xs text-gray-500">{trip.from_country} → {trip.to_country}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-white">
                                  {trip.departure_date ? format(new Date(trip.departure_date), "MMM d, yyyy") : <span className="text-gray-500">No date</span>}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-white">{trip.available_weight_kg} kg</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={
                                trip.status === "active" ? "bg-green-500/20 text-green-400" :
                                trip.status === "completed" ? "bg-gray-500/20 text-gray-400" :
                                trip.status === "matched" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }>
                                {trip.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-400">{format(new Date(trip.created_date), "MMM d, yyyy")}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Link to={createPageUrl(`TripDetails?id=${trip.id}`)}>
                                  <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 h-8 w-8" title="View">
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                </Link>
                                
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  disabled={toggleTripRecommendMutation.isPending}
                                  className={`${trip.is_recommended ? "text-yellow-400 hover:text-yellow-300" : "text-gray-500 hover:text-yellow-400"} hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed`}
                                  onClick={() => toggleTripRecommendMutation.mutate({ id: trip.id, isRecommended: !trip.is_recommended })}
                                  title={trip.is_recommended ? "Unrecommend" : "Recommend"}
                                >
                                  <Star className={`w-4 h-4 ${trip.is_recommended ? "fill-yellow-400" : ""}`} />
                                </Button>

                                {trip.status === 'suspended' ? (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    disabled={updateTripStatusMutation.isPending}
                                    className="text-green-500 hover:text-green-400 hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => updateTripStatusMutation.mutate({ id: trip.id, status: 'active' })}
                                    title="Activate"
                                  >
                                    <PlayCircle className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    disabled={updateTripStatusMutation.isPending}
                                    className="text-orange-500 hover:text-orange-400 hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => updateTripStatusMutation.mutate({ id: trip.id, status: 'suspended' })}
                                    title="Suspend"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                )}

                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  disabled={deleteTripMutation.isPending}
                                  className="text-red-500 hover:text-red-400 hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleDeleteTrip(trip.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests">
              <Card className="p-6 bg-white/5 border-white/10">
                {requestsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#9EFF00] animate-spin" />
                    <p className="text-gray-400">Loading requests...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No requests found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Sender</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Route</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Item</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Needed By</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Weight</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Created</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request) => (
                          <tr key={request.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-400" />
                                <div>
                                  <p className="text-sm text-white">{request.requester_name || "Not provided"}</p>
                                  <p className="text-xs text-gray-500">{request.created_by}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-sm text-white">
                                <span>{request.from_city}</span>
                                <ArrowRight className="w-3 h-3 text-gray-500" />
                                <span>{request.to_city}</span>
                              </div>
                              <p className="text-xs text-gray-500">{request.from_country} → {request.to_country}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-white line-clamp-2 max-w-xs">{request.item_description}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-400" />
                                <span className="text-sm text-white">
                                  {request.needed_by_date ? format(new Date(request.needed_by_date), "MMM d, yyyy") : <span className="text-gray-500">No date</span>}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-white">{request.estimated_weight_kg} kg</span>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={
                                request.status === "active" ? "bg-green-500/20 text-green-400" :
                                request.status === "completed" ? "bg-gray-500/20 text-gray-400" :
                                request.status === "matched" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }>
                                {request.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-400">{format(new Date(request.created_date), "MMM d, yyyy")}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Link to={createPageUrl(`RequestDetails?id=${request.id}`)}>
                                  <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 h-8 w-8" title="View">
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                </Link>

                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  disabled={toggleRequestRecommendMutation.isPending}
                                  className={`${request.is_recommended ? "text-yellow-400 hover:text-yellow-300" : "text-gray-500 hover:text-yellow-400"} hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed`}
                                  onClick={() => toggleRequestRecommendMutation.mutate({ id: request.id, isRecommended: !request.is_recommended })}
                                  title={request.is_recommended ? "Unrecommend" : "Recommend"}
                                >
                                  <Star className={`w-4 h-4 ${request.is_recommended ? "fill-yellow-400" : ""}`} />
                                </Button>

                                {request.status === 'suspended' ? (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    disabled={updateRequestStatusMutation.isPending}
                                    className="text-green-500 hover:text-green-400 hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: 'active' })}
                                    title="Activate"
                                  >
                                    <PlayCircle className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    disabled={updateRequestStatusMutation.isPending}
                                    className="text-orange-500 hover:text-orange-400 hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => updateRequestStatusMutation.mutate({ id: request.id, status: 'suspended' })}
                                    title="Suspend"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                )}

                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  disabled={deleteRequestMutation.isPending}
                                  className="text-red-500 hover:text-red-400 hover:bg-white/10 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleDeleteRequest(request.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
