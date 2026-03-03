import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plane,
  Loader2,
  Route,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AITripPlanner() {
  const [user, setUser] = useState(null);
  const [plannerType, setPlannerType] = useState("route");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  // Route Optimizer Form
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [routePreference, setRoutePreference] = useState("balanced");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Travel Time Estimator Form
  const [estimateFrom, setEstimateFrom] = useState("");
  const [estimateTo, setEstimateTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [transportMode, setTransportMode] = useState("flight");

  // Packing Assistant Form
  const [destination, setDestination] = useState("");
  const [tripDuration, setTripDuration] = useState("");
  const [tripPurpose, setTripPurpose] = useState("leisure");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const analyzeRoute = async () => {
    if (!routeFrom || !routeTo) {
      toast.error("Please enter both origin and destination");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
You are an AI travel route optimizer for a peer-to-peer shipping platform.

USER REQUEST:
- From: ${routeFrom}
- To: ${routeTo}
- Preference: ${routePreference}
- Verified travelers only: ${verifiedOnly}

OPTIMIZATION CRITERIA:
${routePreference === 'speed' ? '- Prioritize fastest routes and direct connections' : ''}
${routePreference === 'cost' ? '- Prioritize most economical routes and budget options' : ''}
${routePreference === 'balanced' ? '- Balance speed and cost for optimal value' : ''}

Provide:
1. Recommended route with layovers (if any)
2. Alternative routes
3. Estimated travel time
4. Cost range
5. Best times to travel
6. Tips for this specific route
7. Common shipping items on this route

Return JSON format:
{
  "primary_route": {
    "path": "City A → City B → City C",
    "travel_time": "12 hours",
    "cost_range": "$300-$500",
    "pros": ["Direct connection", "Frequent flights"],
    "cons": ["Busy season pricing"]
  },
  "alternative_routes": [
    {
      "path": "City A → City D → City C",
      "travel_time": "15 hours",
      "cost_range": "$250-$400",
      "pros": ["Lower cost"],
      "cons": ["Longer layover"]
    }
  ],
  "best_travel_times": ["Morning flights for connections", "Weekday departures cheaper"],
  "route_tips": ["Book 3 weeks in advance", "Avoid holiday weekends"],
  "popular_items": ["Electronics", "Documents", "Small packages"]
}
`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            primary_route: {
              type: "object",
              properties: {
                path: { type: "string" },
                travel_time: { type: "string" },
                cost_range: { type: "string" },
                pros: { type: "array", items: { type: "string" } },
                cons: { type: "array", items: { type: "string" } }
              }
            },
            alternative_routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  travel_time: { type: "string" },
                  cost_range: { type: "string" },
                  pros: { type: "array", items: { type: "string" } },
                  cons: { type: "array", items: { type: "string" } }
                }
              }
            },
            best_travel_times: { type: "array", items: { type: "string" } },
            route_tips: { type: "array", items: { type: "string" } },
            popular_items: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiSuggestions({ type: "route", data: result });
    } catch (error) {
      console.error("Error analyzing route:", error);
      toast.error("Failed to analyze route");
    }
    setIsAnalyzing(false);
  };

  const estimateTravelTime = async () => {
    if (!estimateFrom || !estimateTo || !departureDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
You are an AI travel time estimator with real-time data access.

TRAVEL DETAILS:
- From: ${estimateFrom}
- To: ${estimateTo}
- Departure Date: ${departureDate}
- Transport Mode: ${transportMode}

Provide accurate estimation including:
1. Travel time breakdown
2. Potential delays/issues
3. Best departure times
4. Customs/border crossing times (if international)
5. Connection times
6. Weather considerations

Return JSON format:
{
  "estimated_time": {
    "minimum": "8 hours",
    "typical": "10 hours",
    "maximum": "14 hours"
  },
  "breakdown": [
    { "segment": "Origin to Hub", "duration": "3 hours" },
    { "segment": "Layover", "duration": "2 hours" },
    { "segment": "Hub to Destination", "duration": "5 hours" }
  ],
  "potential_delays": [
    { "factor": "Weather", "likelihood": "medium", "impact": "1-2 hours" },
    { "factor": "Customs", "likelihood": "low", "impact": "30 mins" }
  ],
  "best_departure_times": ["Morning (6-9 AM)", "Evening (6-8 PM)"],
  "tips": ["Allow 3-hour buffer for international connections", "Check visa requirements"]
}
`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_time: {
              type: "object",
              properties: {
                minimum: { type: "string" },
                typical: { type: "string" },
                maximum: { type: "string" }
              }
            },
            breakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  segment: { type: "string" },
                  duration: { type: "string" }
                }
              }
            },
            potential_delays: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  likelihood: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            best_departure_times: { type: "array", items: { type: "string" } },
            tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiSuggestions({ type: "estimate", data: result });
    } catch (error) {
      console.error("Error estimating travel time:", error);
      toast.error("Failed to estimate travel time");
    }
    setIsAnalyzing(false);
  };

  const getPackingSuggestions = async () => {
    if (!destination || !tripDuration) {
      toast.error("Please fill in destination and trip duration");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
You are an AI packing assistant for travelers who carry items for others.

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${tripDuration} days
- Purpose: ${tripPurpose}

Provide comprehensive packing guidance:
1. Essential items for this destination/season
2. Weather-appropriate clothing
3. Luggage space optimization
4. Items to avoid
5. Local customs/restrictions
6. Suggested luggage type/size
7. Weight distribution tips

Return JSON format:
{
  "luggage_recommendation": {
    "type": "Medium checked bag + carry-on",
    "total_capacity": "40-50 kg",
    "available_for_shipping": "10-15 kg"
  },
  "essential_items": [
    { "category": "Clothing", "items": ["3 shirts", "2 pants", "1 jacket"] },
    { "category": "Documents", "items": ["Passport", "Travel insurance"] }
  ],
  "weather_considerations": ["Pack light rain jacket", "Temperatures 15-25°C"],
  "space_optimization_tips": [
    "Roll clothes to save space",
    "Use packing cubes",
    "Wear bulkiest items during travel"
  ],
  "items_to_avoid": ["Liquids over 100ml in carry-on", "Prohibited items: aerosols"],
  "local_restrictions": ["Certain electronics require declaration", "Food restrictions"],
  "shipping_opportunities": {
    "popular_items": ["Electronics", "Documents", "Clothing"],
    "restricted_items": ["Batteries", "Liquids", "Perishables"],
    "tips": "Leave 20% luggage space for flexibility"
  }
}
`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            luggage_recommendation: {
              type: "object",
              properties: {
                type: { type: "string" },
                total_capacity: { type: "string" },
                available_for_shipping: { type: "string" }
              }
            },
            essential_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  items: { type: "array", items: { type: "string" } }
                }
              }
            },
            weather_considerations: { type: "array", items: { type: "string" } },
            space_optimization_tips: { type: "array", items: { type: "string" } },
            items_to_avoid: { type: "array", items: { type: "string" } },
            local_restrictions: { type: "array", items: { type: "string" } },
            shipping_opportunities: {
              type: "object",
              properties: {
                popular_items: { type: "array", items: { type: "string" } },
                restricted_items: { type: "array", items: { type: "string" } },
                tips: { type: "string" }
              }
            }
          }
        }
      });

      setAiSuggestions({ type: "packing", data: result });
    } catch (error) {
      console.error("Error getting packing suggestions:", error);
      toast.error("Failed to get packing suggestions");
    }
    setIsAnalyzing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">Sign in to access AI trip planning tools</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              AI Trip <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Planner</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get AI-powered recommendations for routes, travel times, and packing
            </p>
          </div>

          <Tabs value={plannerType} onValueChange={setPlannerType} className="mb-8">
            <TabsList className="bg-white/5 border-white/10 grid w-full grid-cols-3">
              <TabsTrigger value="route" className="data-[state=active]:bg-blue-500/20">
                <Route className="w-4 h-4 mr-2" />
                Route Optimizer
              </TabsTrigger>
              <TabsTrigger value="estimate" className="data-[state=active]:bg-purple-500/20">
                <Clock className="w-4 h-4 mr-2" />
                Travel Time
              </TabsTrigger>
              <TabsTrigger value="packing" className="data-[state=active]:bg-green-500/20">
                <Briefcase className="w-4 h-4 mr-2" />
                Packing Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="route" className="mt-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Optimize Your Route</h3>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">From</Label>
                      <Input
                        value={routeFrom}
                        onChange={(e) => setRouteFrom(e.target.value)}
                        placeholder="City, Country"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">To</Label>
                      <Input
                        value={routeTo}
                        onChange={(e) => setRouteTo(e.target.value)}
                        placeholder="City, Country"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Optimization Preference</Label>
                    <Select value={routePreference} onValueChange={setRoutePreference}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="speed">Speed (Fastest route)</SelectItem>
                        <SelectItem value="cost">Cost (Most economical)</SelectItem>
                        <SelectItem value="balanced">Balanced (Best value)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={analyzeRoute}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Optimize Route
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="estimate" className="mt-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Estimate Travel Time</h3>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">From</Label>
                      <Input
                        value={estimateFrom}
                        onChange={(e) => setEstimateFrom(e.target.value)}
                        placeholder="City, Country"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">To</Label>
                      <Input
                        value={estimateTo}
                        onChange={(e) => setEstimateTo(e.target.value)}
                        placeholder="City, Country"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Departure Date</Label>
                      <Input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Transport Mode</Label>
                      <Select value={transportMode} onValueChange={setTransportMode}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flight">Flight</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="bus">Bus</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={estimateTravelTime}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Estimate Time
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="packing" className="mt-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Smart Packing Guide</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Destination</Label>
                    <Input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="City, Country"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Trip Duration (days)</Label>
                      <Input
                        type="number"
                        value={tripDuration}
                        onChange={(e) => setTripDuration(e.target.value)}
                        placeholder="7"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Trip Purpose</Label>
                      <Select value={tripPurpose} onValueChange={setTripPurpose}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leisure">Leisure</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="family">Family Visit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={getPackingSuggestions}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Get Packing List
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* AI Suggestions Display */}
          {aiSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  AI Recommendations
                </h3>

                {/* Route Results */}
                {aiSuggestions.type === "route" && (
                  <div className="space-y-6">
                    {/* Primary Route */}
                    <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Recommended Route
                        </Badge>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">{aiSuggestions.data.primary_route.path}</h4>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-400">Travel Time</div>
                          <div className="text-white font-medium">{aiSuggestions.data.primary_route.travel_time}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Cost Range</div>
                          <div className="text-white font-medium">{aiSuggestions.data.primary_route.cost_range}</div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold text-green-400 mb-2">Pros:</div>
                          {aiSuggestions.data.primary_route.pros.map((pro, i) => (
                            <div key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              {pro}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-yellow-400 mb-2">Cons:</div>
                          {aiSuggestions.data.primary_route.cons.map((con, i) => (
                            <div key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <AlertCircle className="w-3 h-3 text-yellow-400" />
                              {con}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>

                    {/* Alternative Routes */}
                    {aiSuggestions.data.alternative_routes.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Alternative Routes</h4>
                        <div className="space-y-3">
                          {aiSuggestions.data.alternative_routes.map((route, i) => (
                            <Card key={i} className="p-4 bg-white/5 border-white/10">
                              <h5 className="font-semibold text-white mb-2">{route.path}</h5>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-400">Time:</span>
                                  <span className="text-white ml-2">{route.travel_time}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Cost:</span>
                                  <span className="text-white ml-2">{route.cost_range}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips and Best Times */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          Best Travel Times
                        </h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.best_travel_times.map((time, i) => (
                            <li key={i} className="text-sm text-gray-300">• {time}</li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          Route Tips
                        </h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.route_tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-300">• {tip}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Popular Items */}
                    <Card className="p-4 bg-white/5 border-white/10">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        Popular Shipping Items on This Route
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.data.popular_items.map((item, i) => (
                          <Badge key={i} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Travel Time Estimate Results */}
                {aiSuggestions.type === "estimate" && (
                  <div className="space-y-6">
                    {/* Time Estimates */}
                    <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                      <h4 className="text-lg font-bold text-white mb-4">Estimated Travel Time</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-400">{aiSuggestions.data.estimated_time.minimum}</div>
                          <div className="text-sm text-gray-400">Best Case</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{aiSuggestions.data.estimated_time.typical}</div>
                          <div className="text-sm text-gray-400">Typical</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-400">{aiSuggestions.data.estimated_time.maximum}</div>
                          <div className="text-sm text-gray-400">Worst Case</div>
                        </div>
                      </div>
                    </Card>

                    {/* Journey Breakdown */}
                    <Card className="p-4 bg-white/5 border-white/10">
                      <h4 className="font-semibold text-white mb-3">Journey Breakdown</h4>
                      <div className="space-y-2">
                        {aiSuggestions.data.breakdown.map((segment, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5">
                            <span className="text-gray-300">{segment.segment}</span>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {segment.duration}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Potential Delays */}
                    <Card className="p-4 bg-white/5 border-white/10">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        Potential Delays
                      </h4>
                      <div className="space-y-2">
                        {aiSuggestions.data.potential_delays.map((delay, i) => (
                          <div key={i} className="p-3 rounded bg-white/5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{delay.factor}</span>
                              <Badge className={
                                delay.likelihood === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                delay.likelihood === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-green-500/20 text-green-400 border-green-500/30'
                              }>
                                {delay.likelihood} likelihood
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-400">Impact: {delay.impact}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Best Departure Times & Tips */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="font-semibold text-white mb-3">Best Departure Times</h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.best_departure_times.map((time, i) => (
                            <li key={i} className="text-sm text-gray-300">• {time}</li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="font-semibold text-white mb-3">Travel Tips</h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-300">• {tip}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Packing Suggestions Results */}
                {aiSuggestions.type === "packing" && (
                  <div className="space-y-6">
                    {/* Luggage Recommendation */}
                    <Card className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                      <h4 className="text-lg font-bold text-white mb-4">Luggage Recommendation</h4>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400">Type</div>
                          <div className="text-white font-medium">{aiSuggestions.data.luggage_recommendation.type}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Total Capacity</div>
                          <div className="text-white font-medium">{aiSuggestions.data.luggage_recommendation.total_capacity}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Available for Shipping</div>
                          <div className="text-green-400 font-medium">{aiSuggestions.data.luggage_recommendation.available_for_shipping}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Essential Items */}
                    <Card className="p-4 bg-white/5 border-white/10">
                      <h4 className="font-semibold text-white mb-4">Essential Items by Category</h4>
                      <div className="space-y-4">
                        {aiSuggestions.data.essential_items.map((category, i) => (
                          <div key={i}>
                            <h5 className="font-medium text-blue-400 mb-2">{category.category}</h5>
                            <div className="flex flex-wrap gap-2">
                              {category.items.map((item, j) => (
                                <Badge key={j} className="bg-white/10 text-gray-300">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Weather & Optimization */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="font-semibold text-white mb-3">Weather Considerations</h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.weather_considerations.map((item, i) => (
                            <li key={i} className="text-sm text-gray-300">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="p-4 bg-white/5 border-white/10">
                        <h4 className="font-semibold text-white mb-3">Space Optimization</h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.space_optimization_tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-300">• {tip}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Items to Avoid & Restrictions */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card className="p-4 bg-red-500/10 border-red-500/30">
                        <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Items to Avoid
                        </h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.items_to_avoid.map((item, i) => (
                            <li key={i} className="text-sm text-gray-300">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                      <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                        <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Local Restrictions
                        </h4>
                        <ul className="space-y-2">
                          {aiSuggestions.data.local_restrictions.map((item, i) => (
                            <li key={i} className="text-sm text-gray-300">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Shipping Opportunities */}
                    <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-400" />
                        Shipping Opportunities
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-green-400 mb-2">Popular Items to Carry:</div>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.data.shipping_opportunities.popular_items.map((item, i) => (
                              <Badge key={i} className="bg-green-500/20 text-green-400 border-green-500/30">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-red-400 mb-2">Restricted Items:</div>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.data.shipping_opportunities.restricted_items.map((item, i) => (
                              <Badge key={i} className="bg-red-500/20 text-red-400 border-red-500/30">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 rounded bg-white/5">
                          <p className="text-sm text-gray-300">
                            💡 {aiSuggestions.data.shipping_opportunities.tips}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}