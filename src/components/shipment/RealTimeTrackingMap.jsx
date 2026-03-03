import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip as LeafletTooltip } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Navigation, Package, Zap, AlertTriangle, Clock, History, Route as RouteIcon, Timer, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createPulsingIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div class="pulse-ring" style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: ${color}; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; opacity: 0.5; transform: translate(-50%, -50%); top: 15px; left: 15px;"></div>
        <div style="background: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative; z-index: 10;">${emoji}</div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

function MapUpdater({ center, positions }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.current) {
      map.setView(positions.current, map.getZoom());
    } else if (positions.origin && positions.destination) {
      const bounds = L.latLngBounds([positions.origin, positions.destination]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  
  return null;
}

export default function RealTimeTrackingMap({ shipment, branch, destinationBranch, history = [], compact = false }) {
  const [autoFollow, setAutoFollow] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const positions = useMemo(() => {
    const result = { origin: null, destination: null, current: null };
    if (branch?.latitude && branch?.longitude) {
      result.origin = [branch.latitude, branch.longitude];
    }
    if (destinationBranch?.latitude && destinationBranch?.longitude) {
      result.destination = [destinationBranch.latitude, destinationBranch.longitude];
    }
    if (shipment.current_location?.latitude && shipment.current_location?.longitude) {
      result.current = [shipment.current_location.latitude, shipment.current_location.longitude];
    }
    return result;
  }, [shipment, branch, destinationBranch]);

  const center = useMemo(() => {
    if (autoFollow && positions.current) return positions.current;
    if (positions.origin && positions.destination) {
      return [(positions.origin[0] + positions.destination[0]) / 2, (positions.origin[1] + positions.destination[1]) / 2];
    }
    if (positions.origin) return positions.origin;
    if (positions.destination) return positions.destination;
    return [0, 0];
  }, [positions, autoFollow]);

  const routePath = useMemo(() => {
    const path = [];
    if (positions.origin) path.push(positions.origin);
    if (positions.current) path.push(positions.current);
    if (positions.destination) path.push(positions.destination);
    return path;
  }, [positions]);

  const progress = useMemo(() => {
    if (!positions.current || !positions.origin || !positions.destination) return 0;
    const totalDistance = Math.sqrt(Math.pow(positions.destination[0] - positions.origin[0], 2) + Math.pow(positions.destination[1] - positions.origin[1], 2));
    const currentDistance = Math.sqrt(Math.pow(positions.current[0] - positions.origin[0], 2) + Math.pow(positions.current[1] - positions.origin[1], 2));
    return Math.min(Math.round((currentDistance / totalDistance) * 100), 100);
  }, [positions]);

  const eta = useMemo(() => {
    if (!shipment.estimated_delivery_date) return null;
    const etaDate = new Date(shipment.estimated_delivery_date);
    return {
      date: format(etaDate, "MMM d, yyyy"),
      time: format(etaDate, "h:mm a"),
      relative: formatDistanceToNow(etaDate, { addSuffix: true })
    };
  }, [shipment.estimated_delivery_date]);

  const routeHistory = useMemo(() => {
    return history.map(h => ({
      ...h,
      location: h.location_data ? [h.location_data.latitude, h.location_data.longitude] : null
    })).filter(h => h.location);
  }, [history]);

  const getStatusInfo = () => {
    switch (shipment.status) {
      case 'IN_TRANSIT': return { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', text: 'In Transit' };
      case 'DELAYED': return { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20', text: 'Delayed' };
      case 'DELIVERED': return { icon: Package, color: 'text-green-400', bg: 'bg-green-500/20', text: 'Delivered' };
      default: return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', text: shipment.status.replace(/_/g, ' ') };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (!positions.origin && !positions.destination && !positions.current) {
    return (
      <Card className="p-6 bg-white/5 border-white/10 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">No location data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes pulse { 
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; } 
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } 
        }
      `}</style>

      {/* Status Header */}
      <Card className="p-4 bg-white/5 border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${statusInfo.bg} flex items-center justify-center`}>
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Live Tracking</h3>
              <p className="text-sm text-gray-400">Last updated: {lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusInfo.bg}>
              <StatusIcon className={`w-3 h-3 mr-1 ${statusInfo.color}`} />
              {statusInfo.text}
            </Badge>
            {eta && (
              <Badge className="bg-blue-500/20 text-blue-300">
                <Timer className="w-3 h-3 mr-1" />
                ETA: {eta.relative}
              </Badge>
            )}
          </div>
        </div>

        {positions.current && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Journey Progress</span>
              <span className="text-xs font-bold text-white">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500" 
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }} 
                transition={{ duration: 0.5 }} 
              />
            </div>
          </div>
        )}

        {eta && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Estimated Delivery</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{eta.date}</p>
                <p className="text-xs text-blue-300">{eta.time}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabbed Interface */}
      <Card className="p-4 bg-white/5 border-white/10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/10">
            <TabsTrigger value="map" className="data-[state=active]:bg-[#9EFF00] data-[state=active]:text-[#1A1A1A]">
              <MapPin className="w-4 h-4 mr-2" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#9EFF00] data-[state=active]:text-[#1A1A1A]">
              <History className="w-4 h-4 mr-2" />
              Route History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Route Map</h3>
              </div>
              <Button 
                size="sm" 
                variant={autoFollow ? "default" : "outline"} 
                onClick={() => setAutoFollow(!autoFollow)} 
                className={autoFollow ? "bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]" : "border-white/10 text-gray-300"}
              >
                {autoFollow ? '📍 Following' : '📍 Follow'}
              </Button>
            </div>

            <div style={{ height: compact ? '300px' : '500px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <TileLayer 
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                />
                <MapUpdater center={center} positions={positions} />
                
                {/* Route Path */}
                {routePath.length > 1 && (
                  <>
                    <Polyline 
                      positions={routePath} 
                      pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '10, 10' }} 
                    />
                    <Polyline 
                      positions={routePath} 
                      pathOptions={{ color: '#60a5fa', weight: 2, opacity: 0.5 }} 
                    />
                  </>
                )}

                {/* Historical Route Points */}
                {routeHistory.map((point, index) => (
                  <Marker 
                    key={index} 
                    position={point.location} 
                    icon={L.divIcon({
                      className: 'history-marker',
                      html: `<div style="width: 8px; height: 8px; background: #9EFF00; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6]
                    })}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{point.status?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-600">{format(new Date(point.created_date), "MMM d, h:mm a")}</p>
                        {point.notes && <p className="text-xs mt-1">{point.notes}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Origin Marker */}
                {positions.origin && (
                  <Marker position={positions.origin} icon={createPulsingIcon('#3b82f6', '🏢')}>
                    <LeafletTooltip permanent direction="top" offset={[0, -20]} className="bg-blue-500 text-white font-bold">
                      Origin
                    </LeafletTooltip>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold mb-1">📍 Origin</p>
                        <p>{branch?.name || 'Origin Branch'}</p>
                        <p className="text-xs text-gray-600">{branch?.city}, {branch?.country}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Destination Marker */}
                {positions.destination && (
                  <Marker position={positions.destination} icon={createPulsingIcon('#22c55e', '🎯')}>
                    <LeafletTooltip permanent direction="top" offset={[0, -20]} className="bg-green-500 text-white font-bold">
                      Destination {eta && `(${eta.relative})`}
                    </LeafletTooltip>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold mb-1">🎯 Destination</p>
                        <p>{destinationBranch?.name || 'Destination Branch'}</p>
                        <p className="text-xs text-gray-600">{destinationBranch?.city}, {destinationBranch?.country}</p>
                        {eta && (
                          <p className="text-xs text-blue-600 font-bold mt-2">ETA: {eta.date} at {eta.time}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Current Location Marker */}
                {positions.current && (
                  <Marker position={positions.current} icon={createPulsingIcon('#f59e0b', '📦')}>
                    <LeafletTooltip permanent direction="top" offset={[0, -20]} className="bg-orange-500 text-white font-bold">
                      {progress}% Complete
                    </LeafletTooltip>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold mb-1">📦 Current Location</p>
                        <p className="text-xs text-gray-600">{shipment.current_location?.address || 'In Transit'}</p>
                        <p className="text-xs text-gray-500 mt-1">Tracking: {shipment.tracking_code}</p>
                        <p className="text-xs font-bold text-blue-600 mt-1">{progress}% Complete</p>
                        {eta && <p className="text-xs text-green-600 mt-1">ETA: {eta.relative}</p>}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-400">Origin</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                  <span className="text-gray-400">Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-400">Destination</span>
                </div>
              </div>
              <p className="text-gray-500">{shipment.sender_city} → {shipment.recipient_city}</p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="flex items-center gap-2 mb-4">
              <RouteIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Journey History</h3>
            </div>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {history.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-6 pb-4 border-l-2 border-white/10 last:border-l-0 last:pb-0"
                  >
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-[#9EFF00] border-2 border-[#1A1A1A]" />
                    <div className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                            {event.status?.replace(/_/g, ' ')}
                          </Badge>
                          {event.location_data && (
                            <MapPin className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(event.created_date), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-gray-300 mb-2">{event.notes}</p>
                      )}
                      {event.location_data && (
                        <p className="text-xs text-gray-400">
                          📍 {event.location_data.address || `Lat: ${event.location_data.latitude}, Lng: ${event.location_data.longitude}`}
                        </p>
                      )}
                      {event.updated_by_user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Updated by: {event.updated_by_user}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No tracking history available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}