import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Armchair, X, Check, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const getSeatLabel = (rowIndex, colIndex, layout) => {
  const rowLabel = String.fromCharCode(65 + rowIndex);
  let seatNumber = 1;
  for (let c = 0; c <= colIndex; c++) {
    if (layout[rowIndex][c] === 1) {
      if (c === colIndex) return `${rowLabel}${seatNumber}`;
      seatNumber++;
    }
  }
  return "";
};

export default function SeatMapSelector({ template, seatInventory, selectedSeats, onSelectSeats, tripId }) {
  const layout = template.layout_json.layout;

  // Check online allocation in real-time
  const { data: allocationInfo } = useQuery({
    queryKey: ['online-allocation-check', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const response = await base44.functions.invoke('checkSeatAllocation', {
        trip_id: tripId,
        seat_codes: [],
        channel: 'online',
        branch_id: null
      });
      return response.data;
    },
    enabled: !!tripId,
    refetchInterval: 5000
  });

  const toggleSeat = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      onSelectSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      // Check allocation limit before adding
      if (allocationInfo && allocationInfo.allocated > 0) {
        const onlineSoldCount = seatInventory.filter(s => 
          s.seat_status === 'sold_online' || s.seat_status === 'held'
        ).length;
        const currentSelectionCount = selectedSeats.length;
        if (onlineSoldCount + currentSelectionCount >= allocationInfo.allocated) {
          return; // Cannot select more seats - allocation exhausted
        }
      }
      onSelectSeats([...selectedSeats, seatCode]);
    }
  };

  const getSeatStatus = (seatCode) => {
    const seat = seatInventory.find(s => s.seat_code === seatCode);
    return seat?.seat_status || 'available';
  };

  const getSeatPrice = (seatCode) => {
    const seat = seatInventory.find(s => s.seat_code === seatCode);
    return seat?.price_xaf || 0;
  };

  const getSeatClass = (seatCode) => {
    const seat = seatInventory.find(s => s.seat_code === seatCode);
    return seat?.seat_class || 'standard';
  };

  return (
    <div className="space-y-6">
      {/* Allocation Info */}
      {allocationInfo && allocationInfo.allocated > 0 && allocationInfo.source !== 'default' && (
        <Card className="p-3 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300">Online Allocation:</span>
            <span className="text-white font-semibold">
              {allocationInfo.available} / {allocationInfo.allocated} available
            </span>
          </div>
        </Card>
      )}

      {allocationInfo && !allocationInfo.allowed && (
        <Card className="p-3 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{allocationInfo.reason}</span>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-gray-300">Your Selection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded" />
          <span className="text-gray-300">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded" />
          <span className="text-gray-300">VIP Seat</span>
        </div>
      </div>

      {/* Seat Map */}
      <Card className="p-6 bg-white/10 border-white/10">
        <div className="mb-4 text-center">
          <div className="inline-block px-4 py-2 bg-gray-700 text-white text-sm rounded-lg">
            Driver
          </div>
        </div>

        <div className="space-y-2">
          {layout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2 justify-center">
              {row.map((cell, colIndex) => {
                if (cell === 0) {
                  return <div key={colIndex} className="w-14 h-14" />;
                }

                const seatCode = getSeatLabel(rowIndex, colIndex, layout);
                const status = getSeatStatus(seatCode);
                const price = getSeatPrice(seatCode);
                const isVip = getSeatClass(seatCode) === 'vip';
                const isSelected = selectedSeats.includes(seatCode);
                const isAvailable = status === 'available';
                const isTaken = ['sold_online', 'sold_offline', 'held'].includes(status);
                const isBlocked = status === 'blocked';
                
                // Don't show blocked seats to consumers
                if (isBlocked) {
                  return <div key={colIndex} className="w-14 h-14" />;
                }

                return (
                  <button
                    key={colIndex}
                    onClick={() => isAvailable && toggleSeat(seatCode)}
                    disabled={!isAvailable}
                    className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : isAvailable
                        ? isVip
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        : isTaken
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Armchair className="w-4 h-4" />
                    <span className="text-xs font-bold">{seatCode}</span>
                    {price > 0 && isAvailable && (
                      <span className="text-[10px]">{(price / 1000).toFixed(0)}k</span>
                    )}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isTaken && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}