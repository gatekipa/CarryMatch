import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Armchair, X, Check, Lock } from "lucide-react";

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

export default function OfflineSeatMap({ template, seatInventory, selectedSeats, onSelectSeats, allocationInfo }) {
  const layout = template.layout_json.layout;

  const toggleSeat = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      onSelectSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      // Check allocation limit before adding
      if (allocationInfo && allocationInfo.allocated > 0) {
        const branchSoldCount = seatInventory.filter(s => s.seat_status === 'sold_offline').length;
        const currentSelectionCount = selectedSeats.length;
        if (branchSoldCount + currentSelectionCount >= allocationInfo.allocated) {
          return; // Cannot select more seats
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

  const availableCount = seatInventory.filter(s => s.seat_status === 'available' || s.seat_status === 'released_for_walkin').length;
  const soldCount = seatInventory.filter(s => s.seat_status.includes('sold')).length;

  return (
    <div className="space-y-4">
      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-gray-300">Available ({availableCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-gray-300">Selected ({selectedSeats.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded" />
          <span className="text-gray-300">Sold ({soldCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded" />
          <span className="text-gray-300">VIP</span>
        </div>
      </div>

      {/* Seat Map */}
      <Card className="p-6 bg-white/10 border-white/10">
        <div className="mb-4 text-center">
          <div className="inline-block px-4 py-2 bg-gray-700 text-white text-sm rounded-lg font-bold">
            DRIVER
          </div>
        </div>

        <div className="space-y-2">
          {layout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2 justify-center">
              {row.map((cell, colIndex) => {
                if (cell === 0) {
                  return <div key={colIndex} className="w-16 h-16" />;
                }

                const seatCode = getSeatLabel(rowIndex, colIndex, layout);
                const status = getSeatStatus(seatCode);
                const price = getSeatPrice(seatCode);
                const isVip = getSeatClass(seatCode) === 'vip';
                const isSelected = selectedSeats.includes(seatCode);
                const isAvailable = status === 'available' || status === 'released_for_walkin';
                const isSold = status.includes('sold');
                const isBlocked = status === 'blocked';
                const isReleased = status === 'released_for_walkin';

                return (
                  <button
                    key={colIndex}
                    onClick={() => isAvailable && toggleSeat(seatCode)}
                    disabled={!isAvailable}
                    className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all text-xs relative touch-manipulation ${
                      isSelected
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : isAvailable
                        ? isReleased
                          ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white ring-2 ring-green-400'
                          : isVip
                          ? 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Armchair className="w-5 h-5" />
                    <span className="font-bold">{seatCode}</span>
                    {isAvailable && (
                      <span className="text-[10px]">{(price / 1000).toFixed(0)}k</span>
                    )}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {isSold && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {isBlocked && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <Lock className="w-3 h-3 text-white" />
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