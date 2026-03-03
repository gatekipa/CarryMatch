import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Plane, 
  Package, 
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Loader2,
  Star,
  AlertTriangle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays } from "date-fns";

export default function SmartMatches() {
  const [user, setUser] = useState(null);
  const [matchType, setMatchType] = useState("for-trips");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: myTrips = [] } = useQuery({
    queryKey: ['my-trips', user?.email],
    queryFn: () => base44.entities.Trip.filter({ 
      created_by: user.email, 
      status: "active" 
    }),
    enabled: !!user
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: () => base44.entities.ShipmentRequest.filter({ 
      created_by: user.email, 
      status: "active" 
    }),
    enabled: !!user
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['all-trips'],
    queryFn: () => base44.entities.Trip.filter({ status: "active" }),
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['all-requests'],
    queryFn: () => base44.entities.ShipmentRequest.filter({ status: "active" }),
  });

  // Get user profiles and dispute history for reliability scoring
  // User profile cache (populated on-demand during matching)
  const userProfileCache = React.useRef({});
  
  const getUserProfile = async (email) => {
    if (!email) return null;
    if (userProfileCache.current[email]) return userProfileCache.current[email];
    try {
      const users = await base44.entities.User.filter({ email });
      userProfileCache.current[email] = users[0] || null;
      return users[0] || null;
    } catch { return null; }
  };

  // Enhanced AI matching with sophisticated criteria
  const analyzeMatches = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    try {
      let matches = [];

      if (matchType === "for-trips" && myTrips.length > 0) {
        for (const trip of myTrips) {
          const potentialMatches = allRequests.filter(req => 
            req.created_by !== user.email &&
            req.estimated_weight_kg <= trip.available_weight_kg
          );

          if (potentialMatches.length > 0) {
            // Get user reliability data for requesters
            const enrichedMatches = await Promise.all(
              potentialMatches.slice(0, 10).map(async (req) => {
                const userProfile = await getUserProfile(req.created_by);
                const disputes = await base44.entities.Dispute.filter({
                  respondent_email: req.created_by
                });
                
                return {
                  ...req,
                  user_rating: userProfile?.average_rating || 0,
                  user_reviews: userProfile?.total_reviews || 0,
                  user_disputes: disputes.length,
                  unresolved_disputes: disputes.filter(d => d.status === 'open' || d.status === 'under_review').length,
                  is_verified: userProfile?.is_verified || false
                };
              })
            );

            // Calculate timing flexibility
            const tripDate = new Date(trip.departure_date);
            
            const analysisPrompt = `
You are an advanced AI matching engine for a peer-to-peer shipping platform. Analyze these shipment requests for the following trip with SOPHISTICATED matching criteria:

TRIP DETAILS:
- Route: ${trip.from_city}, ${trip.from_country} → ${trip.to_city}, ${trip.to_country}
- Departure: ${trip.departure_date}
- Available Weight: ${trip.available_weight_kg} kg
- Price: $${trip.price_per_kg}/kg
- Total potential earnings: $${trip.available_weight_kg * trip.price_per_kg}

SHIPMENT REQUESTS TO MATCH:
${enrichedMatches.map((req, i) => `
${i + 1}. Request ID: ${req.id}
   Route: ${req.from_city}, ${req.from_country} → ${req.to_city}, ${req.to_country}
   Needed by: ${req.needed_by_date} (${differenceInDays(new Date(req.needed_by_date), tripDate)} days relative to trip)
   Weight: ${req.estimated_weight_kg} kg
   Offered: $${req.offered_price} (vs trip rate: $${req.estimated_weight_kg * trip.price_per_kg})
   Item: ${req.item_description}
   USER RELIABILITY:
   - Rating: ${req.user_rating.toFixed(1)}/5.0 (${req.user_reviews} reviews)
   - Disputes: ${req.user_disputes} total, ${req.unresolved_disputes} unresolved
   - Verified: ${req.is_verified ? 'Yes' : 'No'}
   - Urgency: ${req.urgency}
`).join('\n')}

ADVANCED SCORING CRITERIA (0-100):

1. ROUTE COMPATIBILITY (30 points):
   - Exact city match: 30 points
   - Same city, different country: 20 points
   - Nearby cities (<100km): 15-25 points
   - Same region/state: 10-15 points
   - Major travel corridors (e.g., London-Paris, NYC-LA): Bonus +5 points

2. TIMING VIABILITY (25 points):
   - Needed date AFTER trip date: 25 points (ideal)
   - Needed date 1-3 days before trip: 20 points (viable with grace period)
   - Needed date 4-7 days before trip: 10 points (tight but possible)
   - High urgency + good timing: Bonus +5 points

3. USER RELIABILITY (20 points):
   - Rating 4.5-5.0: 20 points
   - Rating 4.0-4.5: 15 points
   - Rating 3.5-4.0: 10 points
   - Rating <3.5: 5 points
   - Verified user: Bonus +5 points
   - Unresolved disputes: Penalty -5 points each (max -15)
   - No reviews but verified: 12 points

4. FINANCIAL ATTRACTIVENESS (15 points):
   - Offered price >= trip rate: 15 points
   - Offered price 80-99% of trip rate: 10 points
   - Offered price 60-79% of trip rate: 5 points
   - Price gouging check: If trip rate >150% market rate, penalty -5 points

5. WEIGHT EFFICIENCY (10 points):
   - 80-100% of available weight: 10 points
   - 50-79% of available weight: 7 points
   - 20-49% of available weight: 4 points
   - <20% of available weight: 2 points

PROVIDE ANALYSIS:
Return ONLY the top 5 matches in this JSON format:
{
  "matches": [
    {
      "request_id": "...",
      "score": 85,
      "route_score": 25,
      "timing_score": 20,
      "reliability_score": 18,
      "financial_score": 12,
      "weight_score": 10,
      "reasons": ["Exact route match", "Reliable user (4.8★, verified)", "Good timing flexibility", "Efficient weight usage"],
      "warnings": [],
      "estimated_earnings": 150,
      "recommendation": "Highly recommended - strong match on all criteria"
    }
  ]
}

Important: 
- Consider nearby cities and common routes
- Factor in timing grace periods
- Heavily penalize users with multiple unresolved disputes
- Flag suspicious pricing patterns
- Include specific, actionable reasons
`;

            const result = await base44.integrations.Core.InvokeLLM({
              prompt: analysisPrompt,
              response_json_schema: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        request_id: { type: "string" },
                        score: { type: "number" },
                        route_score: { type: "number" },
                        timing_score: { type: "number" },
                        reliability_score: { type: "number" },
                        financial_score: { type: "number" },
                        weight_score: { type: "number" },
                        reasons: { type: "array", items: { type: "string" } },
                        warnings: { type: "array", items: { type: "string" } },
                        estimated_earnings: { type: "number" },
                        recommendation: { type: "string" }
                      }
                    }
                  }
                }
              }
            });

            if (result.matches) {
              const tripMatches = result.matches.map(m => {
                const request = enrichedMatches.find(r => r.id === m.request_id);
                return {
                  ...m,
                  trip: trip,
                  request: request,
                  type: 'trip-match'
                };
              }).filter(m => m.request);

              matches.push(...tripMatches);
            }
          }
        }
      } else if (matchType === "for-requests" && myRequests.length > 0) {
        for (const request of myRequests) {
          const potentialMatches = allTrips.filter(trip => 
            trip.created_by !== user.email &&
            trip.available_weight_kg >= request.estimated_weight_kg
          );

          if (potentialMatches.length > 0) {
            // Get traveler reliability data
            const enrichedMatches = await Promise.all(
              potentialMatches.slice(0, 10).map(async (trip) => {
                const userProfile = await getUserProfile(trip.created_by);
                const disputes = await base44.entities.Dispute.filter({
                  respondent_email: trip.created_by
                });
                
                return {
                  ...trip,
                  user_rating: userProfile?.average_rating || 0,
                  user_reviews: userProfile?.total_reviews || 0,
                  user_disputes: disputes.length,
                  unresolved_disputes: disputes.filter(d => d.status === 'open' || d.status === 'under_review').length,
                  is_verified: trip.is_verified || false
                };
              })
            );

            const requestDate = new Date(request.needed_by_date);

            const analysisPrompt = `
You are an advanced AI matching engine. Find the best trips for this shipment request with SOPHISTICATED analysis:

SHIPMENT REQUEST:
- Route: ${request.from_city}, ${request.from_country} → ${request.to_city}, ${request.to_country}
- Needed by: ${request.needed_by_date}
- Weight: ${request.estimated_weight_kg} kg
- Budget: $${request.offered_price}
- Item: ${request.item_description}
- Urgency: ${request.urgency}

AVAILABLE TRIPS:
${enrichedMatches.map((trip, i) => `
${i + 1}. Trip ID: ${trip.id}
   Route: ${trip.from_city}, ${trip.from_country} → ${trip.to_city}, ${trip.to_country}
   Departure: ${trip.departure_date} (${differenceInDays(requestDate, new Date(trip.departure_date))} days before needed)
   Available: ${trip.available_weight_kg} kg
   Price: $${trip.price_per_kg}/kg (total: $${trip.price_per_kg * request.estimated_weight_kg})
   TRAVELER RELIABILITY:
   - Rating: ${trip.user_rating.toFixed(1)}/5.0 (${trip.user_reviews} reviews)
   - Disputes: ${trip.user_disputes} total, ${trip.unresolved_disputes} unresolved
   - Verified: ${trip.is_verified ? 'Yes' : 'No'}
`).join('\n')}

ADVANCED SCORING (0-100):

1. ROUTE COMPATIBILITY (30 points): Same as before

2. TIMING VIABILITY (25 points):
   - Departs with 1-7 days buffer before needed date: 25 points
   - Departs 8-14 days before: 20 points (good buffer)
   - Departs 0-1 days before: 15 points (tight but viable)
   - High urgency needs earlier departure: Adjust accordingly

3. TRAVELER RELIABILITY (25 points):
   - Rating 4.5-5.0 + verified: 25 points
   - Rating 4.0-4.5 + verified: 20 points
   - Rating 4.5-5.0 unverified: 18 points
   - Rating 3.5-4.0: 12 points
   - Unresolved disputes: -7 points each
   - Multiple past disputes (>3): Red flag warning

4. PRICE COMPETITIVENESS (15 points):
   - Cost ≤ budget: 15 points
   - Cost 101-110% budget: 10 points
   - Cost 111-125% budget: 5 points
   - Detect price gouging: Compare to market average, warn if >150%

5. CAPACITY & ITEM FIT (5 points):
   - Perfect weight fit: 5 points
   - Adequate space: 3 points

Return top 5 matches as JSON:
{
  "matches": [
    {
      "trip_id": "...",
      "score": 92,
      "route_score": 28,
      "timing_score": 24,
      "reliability_score": 23,
      "financial_score": 13,
      "capacity_score": 4,
      "reasons": ["Exact route", "Highly rated traveler (4.9★)", "Perfect timing", "Within budget"],
      "warnings": ["Price slightly above market average"],
      "estimated_cost": 120,
      "recommendation": "Excellent match - trusted traveler"
    }
  ]
}
`;

            const result = await base44.integrations.Core.InvokeLLM({
              prompt: analysisPrompt,
              response_json_schema: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        trip_id: { type: "string" },
                        score: { type: "number" },
                        route_score: { type: "number" },
                        timing_score: { type: "number" },
                        reliability_score: { type: "number" },
                        financial_score: { type: "number" },
                        capacity_score: { type: "number" },
                        reasons: { type: "array", items: { type: "string" } },
                        warnings: { type: "array", items: { type: "string" } },
                        estimated_cost: { type: "number" },
                        recommendation: { type: "string" }
                      }
                    }
                  }
                }
              }
            });

            if (result.matches) {
              const requestMatches = result.matches.map(m => {
                const trip = enrichedMatches.find(t => t.id === m.trip_id);
                return {
                  ...m,
                  request: request,
                  trip: trip,
                  type: 'request-match'
                };
              }).filter(m => m.trip);

              matches.push(...requestMatches);
            }
          }
        }
      }

      matches.sort((a, b) => b.score - a.score);
      setAiMatches(matches.slice(0, 10));

    } catch (error) {
      console.error("Error analyzing matches:", error);
    }
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (user && (myTrips.length > 0 || myRequests.length > 0)) {
      analyzeMatches();
    }
  }, [matchType, user, myTrips.length, myRequests.length]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">Sign in to see AI-powered matches</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const hasNoListings = myTrips.length === 0 && myRequests.length === 0;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Smart Matches</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Advanced matching considers routes, timing, user reliability, and pricing intelligence
            </p>
          </div>

          {hasNoListings ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No active listings</h3>
              <p className="text-gray-400 mb-6">
                Post a trip or shipment request to see AI-powered matches
              </p>
              <div className="flex gap-4 justify-center">
                <Link to={createPageUrl("PostTrip")}>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <Plane className="w-4 h-4 mr-2" />
                    Post Trip
                  </Button>
                </Link>
                <Link to={createPageUrl("PostRequest")}>
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                    <Package className="w-4 h-4 mr-2" />
                    Post Request
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              <Tabs value={matchType} onValueChange={setMatchType} className="mb-8">
                <TabsList className="bg-white/5 border-white/10">
                  <TabsTrigger 
                    value="for-trips" 
                    disabled={myTrips.length === 0}
                    className="data-[state=active]:bg-blue-500/20"
                  >
                    <Plane className="w-4 h-4 mr-2" />
                    Matches for My Trips ({myTrips.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="for-requests" 
                    disabled={myRequests.length === 0}
                    className="data-[state=active]:bg-purple-500/20"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Matches for My Requests ({myRequests.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {isAnalyzing && (
                <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing matches...</h3>
                  <p className="text-gray-400">AI is evaluating routes, timing, reliability, and pricing</p>
                </Card>
              )}

              {!isAnalyzing && aiMatches.length === 0 && (
                <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-2xl font-bold text-white mb-2">No matches found yet</h3>
                  <p className="text-gray-400">
                    Check back later as new {matchType === "for-trips" ? "requests" : "trips"} are posted
                  </p>
                </Card>
              )}

              {!isAnalyzing && aiMatches.length > 0 && (
                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {aiMatches.map((match, index) => {
                      const isForTrip = match.type === 'trip-match';
                      const primaryItem = isForTrip ? match.trip : match.request;
                      const secondaryItem = isForTrip ? match.request : match.trip;

                      return (
                        <motion.div
                          key={`${match.type}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                          layout
                        >
                          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all">
                            {/* Match Score Header */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                  <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">
                                      {match.score}% Match
                                    </h3>
                                    {match.score >= 85 && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        Excellent
                                      </Badge>
                                    )}
                                    {match.score >= 70 && match.score < 85 && (
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                        Good
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {isForTrip ? `For: ${primaryItem.from_city} → ${primaryItem.to_city}` : `For: ${primaryItem.item_description?.substring(0, 30)}...`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-white">
                                  ${isForTrip ? match.estimated_earnings : match.estimated_cost}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {isForTrip ? "Potential Earnings" : "Estimated Cost"}
                                </div>
                              </div>
                            </div>

                            {/* Detailed Score Breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                              <div className="p-3 rounded-lg bg-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Route</div>
                                <div className="text-lg font-bold text-white">
                                  {match.route_score || 0}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Timing</div>
                                <div className="text-lg font-bold text-white">
                                  {match.timing_score || 0}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Reliability</div>
                                <div className="text-lg font-bold text-white">
                                  {match.reliability_score || 0}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Price</div>
                                <div className="text-lg font-bold text-white">
                                  {match.financial_score || 0}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Capacity</div>
                                <div className="text-lg font-bold text-white">
                                  {match.weight_score || match.capacity_score || 0}
                                </div>
                              </div>
                            </div>

                            {/* Route Comparison */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                  {isForTrip ? <Plane className="w-4 h-4 text-blue-400" /> : <Package className="w-4 h-4 text-purple-400" />}
                                  <span className="text-sm font-semibold text-gray-300">Your {isForTrip ? "Trip" : "Request"}</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{primaryItem.from_city}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-500" />
                                    <span className="text-white font-medium">{primaryItem.to_city}</span>
                                  </div>
                                  <div className="text-gray-400">
                                    {isForTrip 
                                      ? (primaryItem.departure_date ? format(new Date(primaryItem.departure_date), "MMM d") : "No date")
                                      : (primaryItem.needed_by_date ? format(new Date(primaryItem.needed_by_date), "MMM d") : "No date")
                                    }
                                  </div>
                                  <div className="text-gray-400">
                                    {isForTrip ? `${primaryItem.available_weight_kg} kg available` : `${primaryItem.estimated_weight_kg} kg needed`}
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                  {isForTrip ? <Package className="w-4 h-4 text-purple-400" /> : <Plane className="w-4 h-4 text-blue-400" />}
                                  <span className="text-sm font-semibold text-gray-300">Matched {isForTrip ? "Request" : "Trip"}</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{secondaryItem.from_city}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-500" />
                                    <span className="text-white font-medium">{secondaryItem.to_city}</span>
                                  </div>
                                  <div className="text-gray-400">
                                    {isForTrip 
                                      ? (secondaryItem.needed_by_date ? format(new Date(secondaryItem.needed_by_date), "MMM d") : "No date")
                                      : (secondaryItem.departure_date ? format(new Date(secondaryItem.departure_date), "MMM d") : "No date")
                                    }
                                  </div>
                                  <div className="text-gray-400">
                                    {isForTrip ? `${secondaryItem.estimated_weight_kg} kg` : `${secondaryItem.available_weight_kg} kg available`}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* AI Recommendation */}
                            {match.recommendation && (
                              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                                <div className="flex items-start gap-3">
                                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-semibold text-purple-300 mb-1">AI Recommendation</p>
                                    <p className="text-sm text-gray-300">{match.recommendation}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Match Reasons */}
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-300 mb-3">Why this is a good match:</h4>
                              <div className="grid sm:grid-cols-2 gap-2">
                                {match.reasons?.map((reason, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Warnings */}
                            {match.warnings && match.warnings.length > 0 && (
                              <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Important Considerations:
                                </h4>
                                <div className="space-y-1">
                                  {match.warnings.map((warning, i) => (
                                    <p key={i} className="text-sm text-gray-300">• {warning}</p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Button */}
                            <Link 
                              to={createPageUrl(
                                isForTrip ? "RequestDetails" : "TripDetails", 
                                `id=${isForTrip ? secondaryItem.id : secondaryItem.id}`
                              )}
                            >
                              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                                View {isForTrip ? "Request" : "Trip"} Details
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}