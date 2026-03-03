import React from "react";
import { Card } from "@/components/ui/card";
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

export default function SeatSelector({ template, selectedSeats, onSelectSeats }) {
  const layout = template.layout_json.layout;

  const toggleSeat = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      onSelectSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      onSelectSeats([...selectedSeats, seatCode]);
    }
  };

  return (
    <Card className="p-6 bg-white/10 border-white/10">
      <p className="text-sm text-gray-400 mb-4">
        Click seats to mark them as available for online booking. Unselected seats will be offline-only.
      </p>
      
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
                return <div key={colIndex} className="w-12 h-12" />;
              }

              const seatCode = getSeatLabel(rowIndex, colIndex, layout);
              const isSelected = selectedSeats.includes(seatCode);

              return (
                <button
                  key={colIndex}
                  onClick={() => toggleSeat(seatCode)}
                  className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  }`}
                >
                  <Armchair className="w-4 h-4" />
                  <span className="text-xs font-bold">{seatCode}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        {selectedSeats.length} seats selected for online booking
      </div>
    </Card>
  );
}