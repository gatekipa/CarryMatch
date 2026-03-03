import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Plane, 
  Package, 
  DollarSign, 
  Shield, 
  AlertTriangle,
  Star,
  Calendar,
  Activity,
  Target,
  Gift,
  CheckCircle,
  Clock,
  Award,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { toast } from "sonner";

export default function AdminAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState("30"); // days

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl('Home');
      }
    }).catch(() => {
      window.location.href = createPageUrl('Home');
    });
  }, []);

  // Fetch all data
  const { data: users = [] } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin'
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['analytics-trips'],
    queryFn: () => base44.entities.Trip.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['analytics-requests'],
    queryFn: () => base44.entities.ShipmentRequest.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['analytics-matches'],
    queryFn: () => base44.entities.Match.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['analytics-disputes'],
    queryFn: () => base44.entities.Dispute.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['analytics-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['analytics-referrals'],
    queryFn: () => base44.entities.Referral.list(),
    enabled: user?.role === 'admin'
  });

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const rangeStart = subDays(now, parseInt(dateRange));

    // Filter by date range
    const recentUsers = users.filter(u => new Date(u.created_date) >= rangeStart);
    const recentTrips = trips.filter(t => new Date(t.created_date) >= rangeStart);
    const recentRequests = requests.filter(r => new Date(r.created_date) >= rangeStart);
    const recentMatches = matches.filter(m => new Date(m.created_date) >= rangeStart);

    // Active users (created content or matches in period)
    const activeUserEmails = new Set([
      ...recentTrips.map(t => t.created_by),
      ...recentRequests.map(r => r.created_by),
      ...recentMatches.flatMap(m => [m.traveler_email, m.requester_email])
    ]);

    // Revenue calculations
    const totalRevenue = matches.filter(m => m.match_fee_paid).reduce((sum, m) => sum + (m.platform_fee || 5), 0);
    const recentRevenue = recentMatches.filter(m => m.match_fee_paid).reduce((sum, m) => sum + (m.platform_fee || 5), 0);
    const potentialRevenue = matches.filter(m => !m.match_fee_paid && m.status !== 'cancelled').reduce((sum, m) => sum + (m.platform_fee || 5), 0);

    // Completion rates
    const completedMatches = matches.filter(m => m.status === 'delivered' || m.status === 'confirmed').length;
    const completionRate = matches.length > 0 ? (completedMatches / matches.length * 100).toFixed(1) : "0";

    // Verification stats
    const verifiedUsers = users.filter(u => u.is_verified).length;
    const pendingVerifications = users.filter(u => u.verification_status === 'pending').length;
    const verificationRate = users.length > 0 ? (verifiedUsers / users.length * 100).toFixed(1) : "0";

    // Trust score distribution
    const trustScoreBuckets = {
      'High (75-100)': users.filter(u => (u.trust_score || 50) >= 75).length,
      'Medium (50-74)': users.filter(u => (u.trust_score || 50) >= 50 && (u.trust_score || 50) < 75).length,
      'Low (0-49)': users.filter(u => (u.trust_score || 50) < 50).length
    };

    // Dispute stats
    const disputeRate = matches.length > 0 ? (disputes.length / matches.length * 100).toFixed(1) : "0";
    const avgResolutionTime = disputes
      .filter(d => d.resolved_date)
      .reduce((sum, d) => {
        const start = new Date(d.created_date);
        const end = new Date(d.resolved_date);
        return sum + (end - start) / (1000 * 60 * 60 * 24); // days
      }, 0) / disputes.filter(d => d.resolved_date).length || 0;

    return {
      totalUsers: users.length,
      newUsers: recentUsers.length,
      activeUsers: activeUserEmails.size,
      verifiedUsers,
      pendingVerifications,
      verificationRate,
      totalTrips: trips.length,
      activeTrips: trips.filter(t => t.status === 'active').length,
      completedTrips: trips.filter(t => t.status === 'completed').length,
      totalRequests: requests.length,
      activeRequests: requests.filter(r => r.status === 'active').length,
      completedRequests: requests.filter(r => r.status === 'completed').length,
      totalMatches: matches.length,
      completedMatches,
      completionRate,
      totalRevenue,
      recentRevenue,
      potentialRevenue,
      avgTransactionValue: completedMatches > 0 ? (matches.filter(m => m.agreed_price).reduce((sum, m) => sum + m.agreed_price, 0) / completedMatches).toFixed(2) : 0,
      totalDisputes: disputes.length,
      openDisputes: disputes.filter(d => d.status === 'open' || d.status === 'under_review').length,
      resolvedDisputes: disputes.filter(d => d.status === 'resolved').length,
      disputeRate,
      avgResolutionTime: avgResolutionTime.toFixed(1),
      avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0",
      totalReviews: reviews.length,
      trustScoreBuckets,
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      referralRevenue: referrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.reward_amount || 10), 0)
    };
  };

  const metrics = calculateMetrics();

  // Chart data generators
  const generateUserGrowthData = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      const usersOnDate = users.filter(u => new Date(u.created_date) <= date).length;
      data.push({ date: dateStr, users: usersOnDate });
    }
    
    return data;
  };

  const generateActivityData = () => {
    const days = parseInt(dateRange);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(subDays(new Date(), i));
      const dateStr = format(date, 'MMM dd');
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      
      const tripsOnDate = trips.filter(t => {
        const created = new Date(t.created_date);
        return created >= dateStart && created <= dateEnd;
      }).length;
      
      const requestsOnDate = requests.filter(r => {
        const created = new Date(r.created_date);
        return created >= dateStart && created <= dateEnd;
      }).length;
      
      const matchesOnDate = matches.filter(m => {
        const created = new Date(m.created_date);
        return created >= dateStart && created <= dateEnd;
      }).length;
      
      data.push({ 
        date: dateStr, 
        trips: tripsOnDate, 
        requests: requestsOnDate,
        matches: matchesOnDate 
      });
    }
    
    return data;
  };

  const generateRevenueData = () => {
    const days = parseInt(dateRange);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(subDays(new Date(), i));
      const dateStr = format(date, 'MMM dd');
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      
      const revenueOnDate = matches.filter(m => {
        const created = new Date(m.created_date);
        return m.match_fee_paid && created >= dateStart && created <= dateEnd;
      }).reduce((sum, m) => sum + (m.platform_fee || 5), 0);
      
      data.push({ date: dateStr, revenue: revenueOnDate });
    }
    
    return data;
  };

  const generateRouteData = () => {
    const routeMap = {};
    
    [...trips, ...requests].forEach(item => {
      const route = `${item.from_city} → ${item.to_city}`;
      routeMap[route] = (routeMap[route] || 0) + 1;
    });
    
    return Object.entries(routeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));
  };

  const generateDisputeTypeData = () => {
    const typeMap = {
      'item_damaged': 0,
      'no_show': 0,
      'wrong_item': 0,
      'late_delivery': 0,
      'payment_issue': 0,
      'other': 0
    };
    
    disputes.forEach(d => {
      typeMap[d.dispute_type] = (typeMap[d.dispute_type] || 0) + 1;
    });
    
    return Object.entries(typeMap).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count
    })).filter(d => d.value > 0);
  };

  const COLORS = ['#9EFF00', '#7ACC00', '#5A9900', '#3A6600', '#1A3300', '#FF6B6B'];

  const exportToCSV = () => {
    // Prepare comprehensive data export
    const exportData = [];
    
    // Add users
    users.forEach(user => {
      exportData.push({
        Type: 'User',
        Email: user.email,
        Name: user.full_name || '',
        Role: user.role || 'user',
        Verified: user.is_verified ? 'Yes' : 'No',
        'Trust Score': user.trust_score || 50,
        'Created Date': new Date(user.created_date).toLocaleString(),
        Status: user.is_restricted ? 'Restricted' : 'Active'
      });
    });

    // Add trips
    trips.forEach(trip => {
      exportData.push({
        Type: 'Trip',
        ID: trip.id,
        From: `${trip.from_city}, ${trip.from_country}`,
        To: `${trip.to_city}, ${trip.to_country}`,
        'Departure Date': trip.departure_date,
        'Available Weight (kg)': trip.available_weight_kg,
        'Price per kg': trip.price_per_kg || 'N/A',
        Status: trip.status,
        'Traveler Email': trip.traveler_email || trip.created_by,
        'Created Date': new Date(trip.created_date).toLocaleString()
      });
    });

    // Add requests
    requests.forEach(request => {
      exportData.push({
        Type: 'Request',
        ID: request.id,
        From: `${request.from_city}, ${request.from_country}`,
        To: `${request.to_city}, ${request.to_country}`,
        'Needed By': request.needed_by_date,
        'Item Description': request.item_description,
        'Weight (kg)': request.estimated_weight_kg,
        'Offered Price': request.offered_price || 'N/A',
        Status: request.status,
        'Requester Email': request.requester_email || request.created_by,
        'Created Date': new Date(request.created_date).toLocaleString()
      });
    });

    // Add matches
    matches.forEach(match => {
      exportData.push({
        Type: 'Match',
        ID: match.id,
        'Trip ID': match.trip_id,
        'Request ID': match.request_id,
        'Traveler Email': match.traveler_email,
        'Requester Email': match.requester_email,
        'Agreed Price': match.agreed_price || 'N/A',
        'Platform Fee': match.platform_fee || 5,
        'Fee Paid': match.match_fee_paid ? 'Yes' : 'No',
        Status: match.status,
        'Created Date': new Date(match.created_date).toLocaleString()
      });
    });

    // Convert to CSV
    if (exportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carrymatch-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Data exported successfully');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">Admin privileges required</p>
        </Card>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-gray-400">Platform insights and performance metrics</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="border-[#9EFF00] text-[#9EFF00] hover:bg-[#9EFF00]/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white/5 border-white/10 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="w-8 h-8 text-blue-400" />
                    <Badge className="bg-blue-500/20 text-blue-400">
                      +{metrics.newUsers}
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{metrics.totalUsers}</div>
                  <div className="text-sm text-gray-400">Total Users</div>
                  <div className="text-xs text-blue-400 mt-2">{metrics.activeUsers} active</div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <Plane className="w-8 h-8 text-green-400" />
                    <Badge className="bg-green-500/20 text-green-400">
                      {metrics.activeTrips} active
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{metrics.totalTrips}</div>
                  <div className="text-sm text-gray-400">Total Trips</div>
                  <div className="text-xs text-green-400 mt-2">{metrics.completedTrips} completed</div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <Package className="w-8 h-8 text-purple-400" />
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {metrics.activeRequests} active
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{metrics.totalRequests}</div>
                  <div className="text-sm text-gray-400">Total Requests</div>
                  <div className="text-xs text-purple-400 mt-2">{metrics.completedRequests} completed</div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      +${metrics.recentRevenue}
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">${metrics.totalRevenue}</div>
                  <div className="text-sm text-gray-400">Total Revenue</div>
                  <div className="text-xs text-yellow-400 mt-2">${metrics.potentialRevenue} pending</div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#9EFF00]" />
                    User Growth
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={generateUserGrowthData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="users" stroke="#9EFF00" fill="#9EFF00" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Platform Activity
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={generateActivityData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="trips" stroke="#9EFF00" strokeWidth={2} />
                      <Line type="monotone" dataKey="requests" stroke="#a78bfa" strokeWidth={2} />
                      <Line type="monotone" dataKey="matches" stroke="#60a5fa" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Popular Routes */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Top 10 Popular Routes
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={generateRouteData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis type="number" stroke="#9ca3af" style={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="route" stroke="#9ca3af" style={{ fontSize: 12 }} width={150} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#9EFF00" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-8 h-8 text-green-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{metrics.verifiedUsers}</div>
                      <div className="text-sm text-gray-400">Verified Users</div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${metrics.verificationRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{metrics.verificationRate}% verification rate</div>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-8 h-8 text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{metrics.pendingVerifications}</div>
                      <div className="text-sm text-gray-400">Pending Verifications</div>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 mt-2">
                    Requires admin review
                  </Badge>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-8 h-8 text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{metrics.avgRating}</div>
                      <div className="text-sm text-gray-400">Avg Rating</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{metrics.totalReviews} total reviews</div>
                </Card>
              </div>

              {/* Trust Score Distribution */}
              <Card className="p-6 bg-white/5 border-white/10 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#9EFF00]" />
                  Trust Score Distribution
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {metrics.trustScoreBuckets['High (75-100)']}
                    </div>
                    <div className="text-sm text-gray-300">High Trust (75-100)</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {metrics.totalUsers > 0 ? ((metrics.trustScoreBuckets['High (75-100)'] / metrics.totalUsers) * 100).toFixed(1) : 0}% of users
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      {metrics.trustScoreBuckets['Medium (50-74)']}
                    </div>
                    <div className="text-sm text-gray-300">Medium Trust (50-74)</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {metrics.totalUsers > 0 ? ((metrics.trustScoreBuckets['Medium (50-74)'] / metrics.totalUsers) * 100).toFixed(1) : 0}% of users
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="text-3xl font-bold text-red-400 mb-2">
                      {metrics.trustScoreBuckets['Low (0-49)']}
                    </div>
                    <div className="text-sm text-gray-300">Low Trust (0-49)</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {metrics.totalUsers > 0 ? ((metrics.trustScoreBuckets['Low (0-49)'] / metrics.totalUsers) * 100).toFixed(1) : 0}% of users
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="text-2xl font-bold text-white mb-2">{metrics.totalMatches}</div>
                  <div className="text-sm text-gray-400 mb-2">Total Matches</div>
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {metrics.completedMatches} completed
                  </Badge>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="text-2xl font-bold text-white mb-2">{metrics.completionRate}%</div>
                  <div className="text-sm text-gray-400 mb-2">Completion Rate</div>
                  <Badge className={`${
                    parseFloat(metrics.completionRate) >= 80 ? 'bg-green-500/20 text-green-400' :
                    parseFloat(metrics.completionRate) >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {parseFloat(metrics.completionRate) >= 80 ? 'Excellent' :
                     parseFloat(metrics.completionRate) >= 60 ? 'Good' : 'Needs improvement'}
                  </Badge>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="text-2xl font-bold text-white mb-2">${metrics.avgTransactionValue}</div>
                  <div className="text-sm text-gray-400 mb-2">Avg Transaction Value</div>
                  <div className="text-xs text-gray-500">User-to-user payments</div>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="text-2xl font-bold text-white mb-2">{metrics.disputeRate}%</div>
                  <div className="text-sm text-gray-400 mb-2">Dispute Rate</div>
                  <Badge className={`${
                    parseFloat(metrics.disputeRate) <= 5 ? 'bg-green-500/20 text-green-400' :
                    parseFloat(metrics.disputeRate) <= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {parseFloat(metrics.disputeRate) <= 5 ? 'Low' :
                     parseFloat(metrics.disputeRate) <= 10 ? 'Moderate' : 'High'}
                  </Badge>
                </Card>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-10 h-10 text-green-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">${metrics.totalRevenue}</div>
                      <div className="text-sm text-gray-400">Total Revenue Collected</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-400">
                    Platform fees from {matches.filter(m => m.match_fee_paid).length} paid matches
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-10 h-10 text-yellow-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">${metrics.potentialRevenue}</div>
                      <div className="text-sm text-gray-400">Pending Revenue</div>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-400">
                    From {matches.filter(m => !m.match_fee_paid && m.status !== 'cancelled').length} unpaid matches
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-10 h-10 text-blue-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">${metrics.recentRevenue}</div>
                      <div className="text-sm text-gray-400">Revenue (Period)</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-400">
                    Last {dateRange} days
                  </div>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card className="p-6 bg-white/5 border-white/10 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Revenue Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => `$${value}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Referral Program */}
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  Referral Program Performance
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-3xl font-bold text-white mb-2">{metrics.totalReferrals}</div>
                    <div className="text-sm text-gray-400">Total Referrals</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-3xl font-bold text-green-400 mb-2">{metrics.completedReferrals}</div>
                    <div className="text-sm text-gray-400">Completed Referrals</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {metrics.totalReferrals > 0 ? ((metrics.completedReferrals / metrics.totalReferrals) * 100).toFixed(1) : 0}% conversion rate
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-3xl font-bold text-purple-400 mb-2">${metrics.referralRevenue}</div>
                    <div className="text-sm text-gray-400">Rewards Paid Out</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Dispute Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Disputes</span>
                      <span className="text-white font-bold">{metrics.totalDisputes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Open/Under Review</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        {metrics.openDisputes}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Resolved</span>
                      <Badge className="bg-green-500/20 text-green-400">
                        {metrics.resolvedDisputes}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Dispute Rate</span>
                      <Badge className={`${
                        parseFloat(metrics.disputeRate) <= 5 ? 'bg-green-500/20 text-green-400' :
                        parseFloat(metrics.disputeRate) <= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {metrics.disputeRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Avg Resolution Time</span>
                      <span className="text-white font-bold">{metrics.avgResolutionTime} days</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Dispute Types Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={generateDisputeTypeData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {generateDisputeTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #ffffff20' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Quality Indicators */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-10 h-10 text-yellow-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">{metrics.avgRating}</div>
                      <div className="text-sm text-gray-400">Platform Average Rating</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.round(parseFloat(metrics.avgRating))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">Based on {metrics.totalReviews} reviews</div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">{metrics.completionRate}%</div>
                      <div className="text-sm text-gray-400">Successful Completion Rate</div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                    <div 
                      className="h-3 rounded-full bg-green-500"
                      style={{ width: `${metrics.completionRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    {metrics.completedMatches} of {metrics.totalMatches} matches completed
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}