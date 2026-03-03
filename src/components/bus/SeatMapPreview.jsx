import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Armchair } from "lucide-react";

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

const calculateSeatPrice = (seatLabel, isVip, rowIndex, basePrice, pricingRules) => {
  let price = basePrice;
  
  // Apply VIP multiplier
  if (isVip && pricingRules.vip_multiplier) {
    price = price * pricingRules.vip_multiplier;
  }
  
  // Apply front row premium
  if (rowIndex === 0 && pricingRules.front_row_premium) {
    price += pricingRules.front_row_premium;
  }
  
  return Math.round(price);
};

export default function SeatMapPreview({ layout, pricingRules, basePrice = 5000 }) {
  if (!layout.layout || layout.layout.length === 0) {
    return (
      <Card className="p-12 bg-white/10 border-white/10 text-center">
        <p className="text-gray-400">No layout to preview</p>
      </Card>
    );
  }

  const totalSeats = layout.layout.flat().filter(s => s === 1).length;
  const vipSeats = Object.values(layout.seatClasses || {}).filter(c => c === 'vip').length;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Badge className="bg-blue-500/20 text-blue-400">
          {totalSeats} Total Seats
        </Badge>
        {vipSeats > 0 && (
          <Badge className="bg-purple-500/20 text-purple-400">
            {vipSeats} VIP
          </Badge>
        )}
        <Badge className="bg-green-500/20 text-green-400">
          {totalSeats - vipSeats} Standard
        </Badge>
      </div>

      <Card className="p-6 bg-white/10 border-white/10">
        <div className="mb-4 text-center">
          <div className="inline-block px-4 py-2 bg-gray-700 text-white text-sm rounded-lg">
            Driver
          </div>
        </div>

        <div className="space-y-2">
          {layout.layout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2 justify-center">
              {row.map((cell, colIndex) => {
                if (cell === 0) {
                  return <div key={colIndex} className="w-14 h-14" />;
                }

                const seatLabel = getSeatLabel(rowIndex, colIndex, layout.layout);
                const isVip = layout.seatClasses[seatLabel] === 'vip';
                const price = calculateSeatPrice(seatLabel, isVip, rowIndex, basePrice, pricingRules);

                return (
                  <div
                    key={colIndex}
                    className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                      isVip
                        ? 'bg-purple-500/30 border-2 border-purple-400'
                        : 'bg-green-500/30 border-2 border-green-400'
                    }`}
                  >
                    <Armchair className={`w-4 h-4 ${isVip ? 'text-purple-300' : 'text-green-300'}`} />
                    <span className="text-xs font-bold text-white">{seatLabel}</span>
                    <span className="text-[10px] text-gray-300">{price.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-white/10 border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">Pricing Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Base Price:</span>
            <span className="font-semibold">{basePrice.toLocaleString()} XAF</span>
          </div>
          {pricingRules.vip_multiplier > 1 && (
            <div className="flex justify-between text-purple-300">
              <span>VIP Seats (x{pricingRules.vip_multiplier}):</span>
              <span className="font-semibold">{Math.round(basePrice * pricingRules.vip_multiplier).toLocaleString()} XAF</span>
            </div>
          )}
          {pricingRules.front_row_premium > 0 && (
            <div className="flex justify-between text-blue-300">
              <span>Front Row Premium:</span>
              <span className="font-semibold">+{pricingRules.front_row_premium.toLocaleString()} XAF</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}