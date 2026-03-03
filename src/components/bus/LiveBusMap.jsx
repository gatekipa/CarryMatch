import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Navigation, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const busIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxOCIgZmlsbD0iIzM4NzhGRiIvPjxwYXRoIGQ9Ik0xMiAxNmg4djhoLTh6IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0yMCAxNmg4djhoLTh6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

export default function LiveBusMap({ trip, route, operator }) {
  const [mapCenter, setMapCenter] = useState([3.8480, 11.5021]); // Cameroon center
  const [mapZoom, setMapZoom] = useState(6);

  const { data: locations = [], refetch } = useQuery({
    queryKey: ['bus-locations', trip.id],
    queryFn: () => base44.entities.BusLocationUpdate.filter({ trip_id: trip.id }, "-created_date", 100),
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const { data: statusUpdates = [] } = useQuery({
    queryKey: ['trip-status-updates', trip.id],
    queryFn: () => base44.entities.TripStatusUpdate.filter({ trip_id: trip.id }, "-created_date", 10),
    refetchInterval: 15000
  });

  const latestLocation = locations[0];
  const latestStatus = statusUpdates[0];

  useEffect(() => {
    if (latestLocation) {
      setMapCenter([latestLocation.latitude, latestLocation.longitude]);
      setMapZoom(12);
    }
  }, [latestLocation]);

  // Create route line if we have multiple points
  const routePath = locations.length > 1 
    ? locations.slice(0, 20).reverse().map(loc => [loc.latitude, loc.longitude])
    : [];

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {latestStatus && (
        <Card className={`p-4 ${
          latestStatus.update_type === 'delayed' ? 'bg-orange-500/10 border-orange-500/30' :
          latestStatus.update_type === 'arrived' ? 'bg-green-500/10 border-green-500/30' :
          'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <Bus className={`w-5 h-5 flex-shrink-0 ${
              latestStatus.update_type === 'delayed' ? 'text-orange-400' :
              latestStatus.update_type === 'arrived' ? 'text-green-400' :
              'text-blue-400'
            }`} />
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">
                {latestStatus.update_type.replace(/_/g, ' ').toUpperCase()}
              </p>
              <p className="text-sm text-gray-300">{latestStatus.message}</p>
              {latestStatus.new_eta && (
                <p className="text-xs text-gray-400 mt-2">
                  New arrival: {format(new Date(latestStatus.new_eta), "HH:mm")}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Live Location Info */}
      {latestLocation && (
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <Navigation className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-gray-400">Speed</p>
              <p className="text-white font-semibold">{latestLocation.speed_kmh || 0} km/h</p>
            </div>
            <div className="text-center">
              <Clock className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-gray-400">Last Update</p>
              <p className="text-white font-semibold">
                {format(new Date(latestLocation.created_date), "HH:mm")}
              </p>
            </div>
            <div className="text-center">
              <MapPin className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p className="text-gray-400">Status</p>
              <p className="text-white font-semibold">
                {trip.trip_status === 'departed' ? 'En Route' : trip.trip_status}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Map */}
      <Card className="p-0 bg-white/5 border-white/10 overflow-hidden">
        <div style={{ height: '400px', width: '100%' }}>
          {latestLocation ? (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Bus current position */}
              <Marker position={[latestLocation.latitude, latestLocation.longitude]} icon={busIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-gray-900">{operator.name}</p>
                    <p className="text-gray-700">{route.origin_city} → {route.destination_city}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Speed: {latestLocation.speed_kmh} km/h
                    </p>
                    <p className="text-xs text-gray-600">
                      Updated: {format(new Date(latestLocation.created_date), "HH:mm:ss")}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Route path */}
              {routePath.length > 1 && (
                <Polyline positions={routePath} color="#3B82F6" weight={3} opacity={0.6} />
              )}
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <Bus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No location data yet</p>
                <p className="text-sm text-gray-500">Driver will update location during trip</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Location History */}
      {locations.length > 0 && (
        <Card className="p-4 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3">Recent Updates</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {locations.slice(0, 5).map((loc, idx) => (
              <div key={loc.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {format(new Date(loc.created_date), "HH:mm:ss")}
                </span>
                <span className="text-gray-300">{loc.speed_kmh} km/h</span>
                <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                  {loc.update_source === 'driver_gps' ? 'GPS' : 'Manual'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}