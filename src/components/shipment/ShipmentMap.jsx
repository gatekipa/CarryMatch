import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Package } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const originIcon = createCustomIcon('#3b82f6');
const destinationIcon = createCustomIcon('#22c55e');
const currentIcon = createCustomIcon('#f59e0b');

export default function ShipmentMap({ shipment, branch, destinationBranch, compact = false, optimizedRoute }) {
  const positions = useMemo(() => {
    const result = {
      origin: null,
      destination: null,
      current: null
    };

    // Origin coordinates
    if (branch?.latitude && branch?.longitude) {
      result.origin = [branch.latitude, branch.longitude];
    }

    // Destination coordinates
    if (destinationBranch?.latitude && destinationBranch?.longitude) {
      result.destination = [destinationBranch.latitude, destinationBranch.longitude];
    }

    // Current location
    if (shipment.current_location?.latitude && shipment.current_location?.longitude) {
      result.current = [shipment.current_location.latitude, shipment.current_location.longitude];
    }

    return result;
  }, [shipment, branch, destinationBranch]);

  const center = useMemo(() => {
    if (positions.current) return positions.current;
    if (positions.origin && positions.destination) {
      return [
        (positions.origin[0] + positions.destination[0]) / 2,
        (positions.origin[1] + positions.destination[1]) / 2
      ];
    }
    if (positions.origin) return positions.origin;
    if (positions.destination) return positions.destination;
    return [0, 0];
  }, [positions]);

  const routePath = useMemo(() => {
    const path = [];
    if (positions.origin) path.push(positions.origin);
    
    // Add waypoints from optimized route if available
    if (optimizedRoute?.matched && optimizedRoute.route.waypoints) {
      optimizedRoute.route.waypoints
        .sort((a, b) => a.sequence - b.sequence)
        .forEach(wp => {
          // Note: In production, you'd geocode these cities to get coordinates
          // For now, this is a placeholder
        });
    }
    
    if (positions.current) path.push(positions.current);
    if (positions.destination) path.push(positions.destination);
    return path;
  }, [positions, optimizedRoute]);

  if (!positions.origin && !positions.destination && !positions.current) {
    return (
      <Card className="p-6 bg-white/5 border-white/10 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">No location data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white/5 border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Shipment Tracking Map</h3>
        </div>
        {shipment.status && (
          <Badge className="bg-blue-500/20 text-blue-300">
            {shipment.status.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      <div style={{ height: compact ? '300px' : '500px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route Path */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath}
              pathOptions={{
                color: optimizedRoute?.matched ? '#22c55e' : '#3b82f6',
                weight: optimizedRoute?.matched ? 4 : 3,
                opacity: 0.7,
                dashArray: optimizedRoute?.matched ? 'none' : '10, 10'
              }}
            />
          )}

          {/* Origin Marker */}
          {positions.origin && (
            <Marker position={positions.origin} icon={originIcon}>
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
            <Marker position={positions.destination} icon={destinationIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold mb-1">🎯 Destination</p>
                  <p>{destinationBranch?.name || 'Destination Branch'}</p>
                  <p className="text-xs text-gray-600">{destinationBranch?.city}, {destinationBranch?.country}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Current Location Marker */}
          {positions.current && (
            <Marker position={positions.current} icon={currentIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold mb-1">📦 Current Location</p>
                  <p className="text-xs text-gray-600">{shipment.current_location?.address || 'In Transit'}</p>
                  <p className="text-xs text-gray-500 mt-1">Tracking: {shipment.tracking_code}</p>
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
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-400">Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Destination</span>
          </div>
        </div>
        <p className="text-gray-500">
          {shipment.sender_city} → {shipment.recipient_city}
        </p>
      </div>
    </Card>
  );
}