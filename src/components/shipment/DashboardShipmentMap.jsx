import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DashboardShipmentMap({ shipments = [], branches = [] }) {
  const shipmentMarkers = useMemo(() => {
    return shipments
      .filter(s => s.current_location?.latitude && s.current_location?.longitude)
      .map(shipment => ({
        position: [shipment.current_location.latitude, shipment.current_location.longitude],
        shipment
      }));
  }, [shipments]);

  const branchMarkers = useMemo(() => {
    return branches
      .filter(b => b.latitude && b.longitude)
      .map(branch => ({
        position: [branch.latitude, branch.longitude],
        branch
      }));
  }, [branches]);

  const center = useMemo(() => {
    if (shipmentMarkers.length > 0) {
      return shipmentMarkers[0].position;
    }
    if (branchMarkers.length > 0) {
      return branchMarkers[0].position;
    }
    return [20, 0]; // Default center
  }, [shipmentMarkers, branchMarkers]);

  const getStatusColor = (status) => {
    const colors = {
      RECEIVED: '#3b82f6',
      IN_TRANSIT: '#f59e0b',
      DELIVERED: '#22c55e',
      DELAYED: '#ef4444',
      ON_HOLD: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const createShipmentIcon = (status) => {
    const color = getStatusColor(status);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  };

  const branchIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background: #8b5cf6; width: 20px; height: 20px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20]
  });

  if (shipmentMarkers.length === 0 && branchMarkers.length === 0) {
    return (
      <Card className="p-6 bg-white/5 border-white/10 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">No active shipments with location data</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white/5 border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Active Shipments Map</h3>
        </div>
        <Badge className="bg-blue-500/20 text-blue-300">
          {shipmentMarkers.length} tracked
        </Badge>
      </div>

      <div style={{ height: '400px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Branch Markers */}
          {branchMarkers.map((item, idx) => (
            <Marker key={`branch-${idx}`} position={item.position} icon={branchIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold mb-1">🏢 {item.branch.name}</p>
                  <p className="text-xs text-gray-600">{item.branch.city}, {item.branch.country}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Shipment Markers */}
          {shipmentMarkers.map((item, idx) => (
            <Marker
              key={`shipment-${idx}`}
              position={item.position}
              icon={createShipmentIcon(item.shipment.status)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold mb-1">📦 {item.shipment.tracking_code}</p>
                  <p className="text-xs mb-1">{item.shipment.sender_city} → {item.shipment.recipient_city}</p>
                  <Badge className="text-xs mb-2" style={{ background: getStatusColor(item.shipment.status) }}>
                    {item.shipment.status.replace(/_/g, ' ')}
                  </Badge>
                  <Link to={createPageUrl("ShipmentDetails", `id=${item.shipment.id}`)}>
                    <button className="text-xs text-blue-500 hover:underline">View Details</button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-400">Branches</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-400">Received</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-400">In Transit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Delivered</span>
          </div>
        </div>
      </div>
    </Card>
  );
}