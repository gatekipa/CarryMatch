import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  // Trip statuses
  scheduled: 'bg-blue-500/20 text-blue-400',
  boarding: 'bg-green-500/20 text-green-400',
  departed: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-gray-500/20 text-gray-400',
  canceled: 'bg-red-500/20 text-red-400',
  delayed: 'bg-orange-500/20 text-orange-400',
  
  // Shipment statuses
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  RECEIVED: 'bg-blue-500/20 text-blue-400',
  PACKED: 'bg-indigo-500/20 text-indigo-400',
  MANIFESTED: 'bg-purple-500/20 text-purple-400',
  SHIPPED: 'bg-cyan-500/20 text-cyan-400',
  IN_TRANSIT: 'bg-orange-500/20 text-orange-400',
  ARRIVED: 'bg-green-500/20 text-green-400',
  CUSTOMS: 'bg-yellow-500/20 text-yellow-400',
  READY_PICKUP: 'bg-emerald-500/20 text-emerald-400',
  OUT_FOR_DELIVERY: 'bg-blue-500/20 text-blue-400',
  DELIVERED: 'bg-green-500/20 text-green-400',
  ON_HOLD: 'bg-red-500/20 text-red-400',
  DELAYED: 'bg-orange-500/20 text-orange-400',
  RETURNED: 'bg-gray-500/20 text-gray-400',
  LOST: 'bg-red-500/20 text-red-400',
  DAMAGED: 'bg-red-500/20 text-red-400',
  
  // Payment statuses
  PAID: 'bg-green-500/20 text-green-400',
  PARTIAL: 'bg-yellow-500/20 text-yellow-400',
  
  // Order statuses
  reserved: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  refunded: 'bg-gray-500/20 text-gray-400',
  expired: 'bg-red-500/20 text-red-400',
  
  // Batch statuses
  OPEN: 'bg-blue-500/20 text-blue-400',
  LOCKED: 'bg-yellow-500/20 text-yellow-400',
  
  // Operator statuses
  pending: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  suspended: 'bg-red-500/20 text-red-400'
};

export default function StatusBadge({ status, className = "" }) {
  return (
    <Badge className={`${STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400'} ${className}`}>
      {status}
    </Badge>
  );
}