import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, QrCode, TrendingUp, Users, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { createPageUrl } from "@/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function BusMarketingTools() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [posterType, setPosterType] = useState("operator");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");

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

  const { data: routeTemplates = [] } = useQuery({
    queryKey: ['route-templates-marketing', operator?.id],
    queryFn: () => base44.entities.RouteTemplate.filter({ operator_id: operator.id, is_active: true }),
    enabled: !!operator
  });

  const { data: upcomingTrips = [] } = useQuery({
    queryKey: ['upcoming-trips-marketing', operator?.id],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({
        operator_id: operator.id,
        trip_status: { $in: ["scheduled", "boarding"] }
      }, "departure_datetime", 50);
      return trips.filter(t => new Date(t.departure_datetime) >= new Date());
    },
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-marketing', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator && upcomingTrips.length > 0
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-marketing', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: scanEvents = [] } = useQuery({
    queryKey: ['qr-scans', operator?.id],
    queryFn: async () => {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      return await base44.entities.QRScanEvent.filter({
        operator_id: operator.id,
        scanned_at: { $gte: last30Days.toISOString() }
      }, '-scanned_at');
    },
    enabled: !!operator
  });

  const { data: onlineOrders = [] } = useQuery({
    queryKey: ['online-orders-conversion', operator?.id],
    queryFn: async () => {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      return await base44.entities.Order.filter({
        operator_id: operator.id,
        channel: "online",
        created_date: { $gte: last30Days.toISOString() }
      }, '-created_date');
    },
    enabled: !!operator
  });

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
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  const primaryBranch = branches.find(b => b.is_primary) || branches[0];

  const generateQRUrl = () => {
    const baseUrl = window.location.origin;
    if (posterType === "operator") {
      return `${baseUrl}${createPageUrl("BusOperatorPage", `slug=${operator.public_slug}`)}`;
    } else if (posterType === "route" && selectedRoute) {
      return `${baseUrl}${createPageUrl("BusSearch", `operator=${operator.public_slug}&route=${selectedRoute}`)}`;
    } else if (posterType === "trip" && selectedTrip) {
      return `${baseUrl}${createPageUrl("BusTripDetails", `id=${selectedTrip}`)}`;
    }
    return "";
  };

  const qrUrl = generateQRUrl();
  const qrCodeImageUrl = qrUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}` : '';

  const printPoster = () => {
    const template = routeTemplates.find(t => t.id === selectedRoute);
    const trip = upcomingTrips.find(t => t.id === selectedTrip);
    const route = trip ? routes.find(r => r.id === trip.route_id) : null;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${operator.name} - Book Your Ticket</title>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
          }
          .container { max-width: 800px; margin: 0 auto; }
          .logo { max-height: 80px; margin: 20px auto; }
          h1 { font-size: 56px; margin: 30px 0; font-weight: bold; }
          .route { font-size: 42px; margin: 20px 0; font-weight: bold; }
          .info { font-size: 24px; margin: 15px 0; opacity: 0.9; }
          .qr-container { background: white; border-radius: 20px; padding: 40px; margin: 40px auto; max-width: 500px; }
          .qr { margin: 20px auto; }
          .cta { font-size: 36px; margin: 20px 0; font-weight: bold; color: #333; }
          .url { font-size: 18px; color: #666; word-wrap: break-word; margin-top: 20px; }
          .contact { font-size: 20px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          ${operator.logo_url ? `<img class="logo" src="${operator.logo_url}" alt="${operator.name}" />` : ''}
          <h1>${operator.name}</h1>
          
          ${posterType === 'route' && template ? `
            <div class="route">${template.origin_city} → ${template.destination_city}</div>
            ${template.default_duration_minutes ? `<div class="info">Duration: ${Math.floor(template.default_duration_minutes / 60)}h ${template.default_duration_minutes % 60}m</div>` : ''}
          ` : ''}
          
          ${posterType === 'trip' && trip && route ? `
            <div class="route">${route.origin_city} → ${route.destination_city}</div>
            <div class="info">${format(new Date(trip.departure_datetime), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            <div class="info">From ${trip.base_price_xaf.toLocaleString()} XAF</div>
          ` : ''}
          
          <div class="qr-container">
            <div class="cta">📱 Scan to Book Your Ticket</div>
            <img class="qr" src="${qrCodeImageUrl}" width="400" height="400" alt="QR Code" />
            <div class="url">${qrUrl}</div>
          </div>
          
          ${primaryBranch ? `
            <div class="contact">
              📍 ${primaryBranch.branch_name}, ${primaryBranch.city}<br/>
              ${primaryBranch.address_text || ''}<br/>
              📞 ${operator.phone || ''} | 📧 ${operator.email || ''}
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeImageUrl;
    link.download = `${operator.public_slug}-qr-code.png`;
    link.click();
  };

  // Analytics: Scans per day
  const scansByDay = scanEvents.reduce((acc, scan) => {
    const day = format(new Date(scan.scanned_at), 'MMM d');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const scanChartData = Object.entries(scansByDay).map(([day, count]) => ({
    day,
    scans: count
  })).slice(-14);

  // Conversion metric: orders within 24h of scan
  const estimatedConversions = scanEvents.filter(scan => {
    const scanTime = new Date(scan.scanned_at);
    const within24h = onlineOrders.filter(order => {
      const orderTime = new Date(order.created_date);
      const timeDiff = orderTime - scanTime;
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
    });
    return within24h.length > 0;
  }).length;

  const conversionRate = scanEvents.length > 0 ? ((estimatedConversions / scanEvents.length) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketing Tools</h1>
          <p className="text-gray-400">Generate QR codes, posters, and track conversions</p>
        </div>

        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border-white/10">
            <TabsTrigger value="generator">QR & Poster Generator</TabsTrigger>
            <TabsTrigger value="analytics">Scan Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Configuration */}
              <div className="space-y-6">
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Poster Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Poster Type</Label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setPosterType("operator")}
                          className={`w-full p-4 rounded-lg text-left transition-all ${
                            posterType === "operator" ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/5 border-2 border-white/10'
                          }`}
                        >
                          <p className="text-white font-semibold">General Operator Poster</p>
                          <p className="text-xs text-gray-400">Links to your operator page with all routes</p>
                        </button>
                        
                        <button
                          onClick={() => setPosterType("route")}
                          className={`w-full p-4 rounded-lg text-left transition-all ${
                            posterType === "route" ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/5 border-2 border-white/10'
                          }`}
                        >
                          <p className="text-white font-semibold">Specific Route Poster</p>
                          <p className="text-xs text-gray-400">Links to route search for a specific route</p>
                        </button>
                        
                        <button
                          onClick={() => setPosterType("trip")}
                          className={`w-full p-4 rounded-lg text-left transition-all ${
                            posterType === "trip" ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-white/5 border-2 border-white/10'
                          }`}
                        >
                          <p className="text-white font-semibold">Specific Trip Poster</p>
                          <p className="text-xs text-gray-400">Links to a specific scheduled trip</p>
                        </button>
                      </div>
                    </div>

                    {posterType === "route" && (
                      <div>
                        <Label className="text-gray-300">Select Route Template</Label>
                        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                            <SelectValue placeholder="Choose route" />
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
                    )}

                    {posterType === "trip" && (
                      <div>
                        <Label className="text-gray-300">Select Trip</Label>
                        <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                            <SelectValue placeholder="Choose trip" />
                          </SelectTrigger>
                          <SelectContent>
                            {upcomingTrips.map(trip => {
                              const route = routes.find(r => r.id === trip.route_id);
                              return (
                                <SelectItem key={trip.id} value={trip.id}>
                                  {route?.origin_city} → {route?.destination_city} • {format(new Date(trip.departure_datetime), "MMM d, h:mm a")}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={printPoster} disabled={!qrUrl} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Poster
                    </Button>
                    <Button onClick={downloadQR} disabled={!qrCodeImageUrl} variant="outline" className="border-white/10">
                      <Download className="w-4 h-4 mr-2" />
                      Download QR
                    </Button>
                  </div>
                </Card>

                {/* Tracking URL */}
                {qrUrl && (
                  <Card className="p-6 bg-white/5 border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">Tracking URL</h3>
                    <div className="bg-white/10 rounded-lg p-3 break-all">
                      <p className="text-sm text-gray-300">{qrUrl}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      All scans are automatically tracked for analytics
                    </p>
                  </Card>
                )}
              </div>

              {/* Right: Preview */}
              <div>
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Preview</h3>
                  
                  {qrCodeImageUrl ? (
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-8 text-center">
                      {operator.logo_url && (
                        <img src={operator.logo_url} alt={operator.name} className="h-16 mx-auto mb-4" />
                      )}
                      
                      <h2 className="text-3xl font-bold text-white mb-4">{operator.name}</h2>
                      
                      {posterType === 'route' && routeTemplates.find(t => t.id === selectedRoute) && (
                        <>
                          <p className="text-2xl font-bold text-white mb-2">
                            {routeTemplates.find(t => t.id === selectedRoute).origin_city} → {routeTemplates.find(t => t.id === selectedRoute).destination_city}
                          </p>
                        </>
                      )}

                      {posterType === 'trip' && upcomingTrips.find(t => t.id === selectedTrip) && (
                        <>
                          <p className="text-2xl font-bold text-white mb-2">
                            {routes.find(r => r.id === upcomingTrips.find(t => t.id === selectedTrip).route_id)?.origin_city} → {routes.find(r => r.id === upcomingTrips.find(t => t.id === selectedTrip).route_id)?.destination_city}
                          </p>
                          <p className="text-lg text-white/80 mb-2">
                            {format(new Date(upcomingTrips.find(t => t.id === selectedTrip).departure_datetime), "EEEE, MMMM d 'at' h:mm a")}
                          </p>
                        </>
                      )}

                      <div className="bg-white rounded-xl p-6 my-6">
                        <p className="text-2xl font-bold text-gray-900 mb-4">📱 Scan to Book Online</p>
                        <img src={qrCodeImageUrl} alt="QR Code" className="mx-auto" width="300" height="300" />
                        <p className="text-sm text-gray-600 mt-4 break-all">{qrUrl}</p>
                      </div>

                      {primaryBranch && (
                        <div className="text-white/90 text-lg">
                          <p className="font-semibold">📍 {primaryBranch.branch_name}</p>
                          <p>{primaryBranch.city}</p>
                          {primaryBranch.address_text && <p className="text-sm">{primaryBranch.address_text}</p>}
                          <p className="mt-3">📞 {operator.phone || ''} | 📧 {operator.email || ''}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-400">
                      <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      <p>Select poster type to preview</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <QrCode className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Total Scans (30d)</span>
                </div>
                <div className="text-3xl font-bold text-white">{scanEvents.length}</div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Est. Conversions</span>
                </div>
                <div className="text-3xl font-bold text-white">{estimatedConversions}</div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Conversion Rate</span>
                </div>
                <div className="text-3xl font-bold text-white">{conversionRate}%</div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Avg Scans/Day</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {scanChartData.length > 0 ? Math.round(scanEvents.length / scanChartData.length) : 0}
                </div>
              </Card>
            </div>

            {/* Scans Chart */}
            <Card className="p-6 bg-white/5 border-white/10 mb-8">
              <h3 className="text-xl font-bold text-white mb-6">QR Scans Over Time (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scanChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)' }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Bar dataKey="scans" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Scan Details Table */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-white mb-6">Recent Scans</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Target</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Scanned At</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanEvents.slice(0, 20).map((scan) => (
                      <tr key={scan.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <Badge className={
                            scan.qr_type === 'operator' ? 'bg-purple-500/20 text-purple-400' :
                            scan.qr_type === 'route' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-400'
                          }>
                            {scan.qr_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-white text-sm">
                          {scan.target_id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {format(new Date(scan.scanned_at), "MMM d, h:mm a")}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {scan.referrer ? new URL(scan.referrer).hostname : 'Direct'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {scanEvents.length === 0 && (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No scans tracked yet</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}