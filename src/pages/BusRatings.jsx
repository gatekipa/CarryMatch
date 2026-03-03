import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, ThumbsUp, Clock, Sparkles, Users, Route as RouteIcon } from "lucide-react";
import { format } from "date-fns";
import { Line } from "recharts";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function BusRatings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['ratings-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['all-ratings', operator?.id],
    queryFn: () => base44.entities.TripRating.filter({ operator_id: operator.id }, "-created_date"),
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['rating-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['rating-trips', operator?.id],
    queryFn: () => base44.entities.Trip.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  // Calculate metrics
  const averageRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  const tagCounts = ratings.reduce((acc, r) => {
    if (r.tags_json) {
      Object.entries(r.tags_json).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = { total: 0, sum: 0, count: 0 };
        acc[key].sum += value;
        acc[key].count += 1;
        acc[key].total += value;
      });
    }
    return acc;
  }, {});

  const tagAverages = Object.entries(tagCounts).map(([key, data]) => ({
    tag: key,
    average: (data.sum / data.count).toFixed(1),
    count: data.count
  })).sort((a, b) => b.average - a.average);

  // Rating trends (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  const trendData = last30Days.map(date => {
    const dayRatings = ratings.filter(r => {
      const ratingDate = new Date(r.created_date);
      return ratingDate.toDateString() === date.toDateString();
    });
    
    return {
      date: format(date, "MMM d"),
      rating: dayRatings.length > 0 
        ? (dayRatings.reduce((sum, r) => sum + r.rating, 0) / dayRatings.length).toFixed(1)
        : null,
      count: dayRatings.length
    };
  }).filter(d => d.count > 0);

  // Route-level insights
  const routeRatings = routes.map(route => {
    const routeTrips = trips.filter(t => t.route_id === route.id);
    const routeTripIds = routeTrips.map(t => t.id);
    const routeRatingsList = ratings.filter(r => routeTripIds.includes(r.trip_id));
    
    return {
      route,
      avgRating: routeRatingsList.length > 0
        ? (routeRatingsList.reduce((sum, r) => sum + r.rating, 0) / routeRatingsList.length).toFixed(1)
        : 0,
      count: routeRatingsList.length
    };
  }).filter(r => r.count > 0).sort((a, b) => b.avgRating - a.avgRating);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Ratings & Feedback</h1>
          <p className="text-gray-400">Customer satisfaction insights</p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Average Rating</span>
            </div>
            <div className="text-4xl font-bold text-white">{averageRating}</div>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Reviews</span>
            </div>
            <div className="text-4xl font-bold text-white">{ratings.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <ThumbsUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">5-Star Ratings</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {ratings.filter(r => r.rating === 5).length}
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">This Month</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {ratings.filter(r => {
                const ratingDate = new Date(r.created_date);
                const now = new Date();
                return ratingDate.getMonth() === now.getMonth() && ratingDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </Card>
        </div>

        {/* Rating Trend Chart */}
        {trendData.length > 0 && (
          <Card className="p-6 bg-white/5 border-white/10 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Rating Trend (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis domain={[0, 5]} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="rating" stroke="#FBBF24" strokeWidth={2} name="Average Rating" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tag Performance */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Service Quality Tags</h3>
            <div className="space-y-4">
              {tagAverages.map(({ tag, average, count }) => (
                <div key={tag}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 capitalize">{tag}</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">{count} reviews</Badge>
                      <span className="text-white font-bold">{average}/5</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(average / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Route Performance */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Top Rated Routes</h3>
            <div className="space-y-4">
              {routeRatings.slice(0, 5).map(({ route, avgRating, count }) => (
                <Card key={route.id} className="p-4 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <RouteIcon className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white">{route.origin_city} → {route.destination_city}</h4>
                        <p className="text-xs text-gray-400">{count} ratings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-bold">{avgRating}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Comments */}
        <Card className="p-6 bg-white/5 border-white/10 mt-8">
          <h3 className="text-xl font-bold text-white mb-6">Recent Feedback</h3>
          <div className="space-y-4">
            {ratings.filter(r => r.comment).slice(0, 10).map(rating => {
              const trip = trips.find(t => t.id === rating.trip_id);
              const route = trip ? routes.find(r => r.id === trip.route_id) : null;
              
              return (
                <Card key={rating.id} className="p-4 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-3 h-3 ${i <= rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                      {route && (
                        <p className="text-sm text-gray-400">{route.origin_city} → {route.destination_city}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{format(new Date(rating.created_date), "MMM d, yyyy")}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{rating.comment}</p>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}