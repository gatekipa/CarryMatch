import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Search, Calendar, MapPin, ArrowRight, TrendingUp, Star, Building2, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import QRTracker from "../components/bus/QRTracker";

const POPULAR_ROUTES = [
  { from: "Douala", to: "Yaoundé" },
  { from: "Yaoundé", to: "Douala" },
  { from: "Douala", to: "Buea" },
  { from: "Yaoundé", to: "Bamenda" },
  { from: "Douala", to: "Bamenda" },
  { from: "Yaoundé", to: "Garoua" }
];

const CAMEROON_CITIES = [
  "Douala", "Yaoundé", "Bafoussam", "Bamenda", "Buea", "Garoua", 
  "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi", "Limbe"
];

export default function BusSearch() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const operatorSlug = urlParams.get("operator");
  const routeTemplateId = urlParams.get("route");
  
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("agency");
  
  // Agency tab
  const [searchAgency, setSearchAgency] = useState("");
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [anyBranch, setAnyBranch] = useState(true);
  
  // Route tab
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [travelDate, setTravelDate] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operators = [] } = useQuery({
    queryKey: ['active-operators'],
    queryFn: () => base44.entities.BusOperator.filter({ 
      status: "active",
      verification_status: "verified"
    }),
  });

  const { data: myRecentTickets = [] } = useQuery({
    queryKey: ['recent-tickets', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const orders = await base44.entities.Order.filter({
        user_id: user.email,
        order_status: "paid"
      }, "-created_date", 5);
      return orders;
    },
    enabled: !!user
  });

  const recentOperatorIds = [...new Set(myRecentTickets.map(t => t.operator_id))];
  const recentOperators = operators.filter(op => recentOperatorIds.includes(op.id));

  const { data: operatorRatings = [] } = useQuery({
    queryKey: ['operator-ratings', operators.map(o => o.id).join(',')],
    queryFn: async () => {
      if (operators.length === 0) return [];
      const results = await Promise.all(
        operators.map(op => base44.entities.TripRating.filter({ operator_id: op.id }, "-created_date", 100))
      );
      return results.flat();
    },
    enabled: operators.length > 0
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['operator-branches', selectedOperator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: selectedOperator.id }),
    enabled: !!selectedOperator
  });

  const { data: qrOperator } = useQuery({
    queryKey: ['qr-operator', operatorSlug],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ public_slug: operatorSlug });
      return ops[0];
    },
    enabled: !!operatorSlug
  });

  const getOperatorRating = (operatorId) => {
    const opRatings = operatorRatings.filter(r => r.operator_id === operatorId);
    if (opRatings.length === 0) return null;
    const avg = opRatings.reduce((sum, r) => sum + r.rating, 0) / opRatings.length;
    return { avg: avg.toFixed(1), count: opRatings.length };
  };

  const filteredOperators = operators.filter(op => 
    op.name.toLowerCase().includes(searchAgency.toLowerCase())
  );

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleAgencySearch = () => {
    if (!selectedOperator) {
      return;
    }
    
    const params = new URLSearchParams();
    params.set('operator', selectedOperator.id);
    if (!anyBranch && selectedBranch) {
      params.set('branch', selectedBranch);
    }
    
    navigate(createPageUrl("BusTrips", params.toString()));
  };

  const handleRouteSearch = (e) => {
    e.preventDefault();
    if (!fromCity || !toCity) {
      toast.error("Please select both departure and arrival cities");
      return;
    }
    if (fromCity === toCity) {
      toast.error("Departure and arrival cities must be different");
      return;
    }
    
    const params = new URLSearchParams();
    params.set('from', fromCity);
    params.set('to', toCity);
    if (travelDate) params.set('date', travelDate);
    
    navigate(createPageUrl("BusTrips", params.toString()));
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {qrOperator && (
        <QRTracker qrType="operator" targetId={qrOperator.id} operatorId={qrOperator.id} />
      )}
      
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Bus Tickets – Cameroon</h1>
            <p className="text-lg text-gray-400">Choose your bus agency or search by route. Pick your seat and travel comfortably.</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="text-blue-400 font-medium text-xs">5% service fee included at checkout</span>
              <span className="text-gray-500 text-xs">· Operators set ticket prices</span>
            </div>
          </div>

          {/* Main Search Tabs */}
          <Card className="p-6 md:p-8 bg-white/5 border-white/10 backdrop-blur-sm mb-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="agency">By Agency (Recommended)</TabsTrigger>
                <TabsTrigger value="route">By Route</TabsTrigger>
              </TabsList>

              {/* TAB 1: By Agency */}
              <TabsContent value="agency" className="space-y-6">
                {/* Recently Used (logged in users) */}
                {user && recentOperators.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-gray-300 mb-3 block text-sm">Recently Used</Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {recentOperators.map(op => {
                        const rating = getOperatorRating(op.id);
                        return (
                          <button
                            key={op.id}
                            onClick={() => setSelectedOperator(op)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              selectedOperator?.id === op.id
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {op.logo_url ? (
                                <img src={op.logo_url} alt={op.name} onError={(e) => { e.target.style.display="none" }} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                  <Bus className="w-6 h-6 text-blue-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-white font-semibold">{op.name}</p>
                                {rating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-gray-400">{rating.avg}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Agency Search */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Search Bus Agency</Label>
                  <Input
                    value={searchAgency}
                    onChange={(e) => setSearchAgency(e.target.value)}
                    placeholder="Search bus agency (Finexs, General Express...)"
                    className="bg-white/5 border-white/10 text-white text-lg"
                  />
                </div>

                {/* Agency Cards */}
                {searchAgency && (
                  <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredOperators.map(op => {
                      const rating = getOperatorRating(op.id);
                      return (
                        <button
                          key={op.id}
                          onClick={() => {
                            setSelectedOperator(op);
                            setSearchAgency("");
                          }}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            selectedOperator?.id === op.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {op.logo_url ? (
                              <img src={op.logo_url} alt={op.name} onError={(e) => { e.target.style.display="none" }} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-14 h-14 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bus className="w-7 h-7 text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold mb-1">{op.name}</p>
                              <div className="flex items-center gap-3 text-xs">
                                {rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-gray-400">{rating.avg} ({rating.count})</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Building2 className="w-3 h-3" />
                                  <span>Multiple branches</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected Agency + Branch Selector */}
                {selectedOperator && (
                  <Card className="p-6 bg-blue-500/10 border-blue-500/30">
                    <div className="flex items-start gap-4 mb-4">
                      {selectedOperator.logo_url ? (
                        <img src={selectedOperator.logo_url} alt={selectedOperator.name} onError={(e) => { e.target.style.display="none" }} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Bus className="w-8 h-8 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{selectedOperator.name}</h3>
                        <p className="text-sm text-gray-400">{selectedOperator.hq_city}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOperator(null)}>
                        Change
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <input
                            id="any-branch"
                            type="checkbox"
                            checked={anyBranch}
                            onChange={(e) => setAnyBranch(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                            aria-label="Show departures from all branches"
                          />
                          <Label htmlFor="any-branch" className="text-gray-300 cursor-pointer">Show departures from all branches</Label>
                        </div>

                      {!anyBranch && (
                        <div>
                          <Label className="text-gray-300 mb-2 block">Select Branch / Station</Label>
                          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Choose your nearest branch..." />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map(b => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.branch_name} - {b.city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button 
                        onClick={handleAgencySearch}
                        disabled={!anyBranch && !selectedBranch}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-lg py-6"
                      >
                        <Search className="w-5 h-5 mr-2" />
                        View Departures
                      </Button>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* TAB 2: By Route */}
              <TabsContent value="route">
                <form onSubmit={handleRouteSearch} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">From</Label>
                      <Input
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        list="city-list-from"
                        placeholder="Type or select departure city"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                      <datalist id="city-list-from">
                        {CAMEROON_CITIES.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="relative">
                      <Label className="text-gray-300 mb-2 block">To</Label>
                      <div className="relative">
                        <Input
                          value={toCity}
                          onChange={(e) => setToCity(e.target.value)}
                          list="city-list-to"
                          placeholder="Type or select arrival city"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                        <datalist id="city-list-to">
                          {CAMEROON_CITIES.map(c => <option key={c} value={c} />)}
                        </datalist>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleSwapCities}
                          disabled={!fromCity || !toCity}
                          className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
                          title="Swap cities"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Travel Date</Label>
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTravelDate(getTodayDate())}
                        className="border-white/10"
                      >
                        Today
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTravelDate(getTomorrowDate())}
                        className="border-white/10"
                      >
                        Tomorrow
                      </Button>
                    </div>
                    <Input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      min={getTodayDate()}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={!fromCity || !toCity}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-lg py-6"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search Trips
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Popular Bus Agencies */}
          {operators.length > 0 && !selectedOperator && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Bus className="w-6 h-6 text-blue-400" />
                Popular Bus Agencies ({operators.length} available)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {operators.map((op) => {
                  const rating = getOperatorRating(op.id);
                  return (
                    <button
                      key={op.id}
                      onClick={() => setSelectedOperator(op)}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/[0.08] transition-all text-center group"
                      aria-label={`Select ${op.name}`}
                    >
                      {op.logo_url ? (
                        <img src={op.logo_url} alt={op.name} onError={(e) => { e.target.style.display="none" }} className="w-16 h-16 mx-auto mb-3 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 mx-auto mb-3 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Bus className="w-8 h-8 text-blue-400" />
                        </div>
                      )}
                      <div className="text-white font-semibold text-sm mb-1 group-hover:text-blue-400 transition-colors">{op.name}</div>
                      {rating && (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-400">{rating.avg}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Routes */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Popular Routes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_ROUTES.map((route, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveTab("route");
                    setFromCity(route.from);
                    setToCity(route.to);
                    setTravelDate(getTodayDate());
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/[0.08] transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{route.from}</div>
                      <div className="text-sm text-gray-400">{route.to}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agency Signup CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl text-center">
            <Bus className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold text-white mb-2">Own a Bus Agency?</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Register your agency on CarryMatch to list routes, sell tickets, and manage your drivers and staff — all from one dashboard.
            </p>
            <Link to={createPageUrl("BusOperatorSignup")}>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8">
                Register Your Agency <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}