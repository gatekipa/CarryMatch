import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Armchair, X } from "lucide-react";

const getSeatLabel = (rowIndex, colIndex, layout) => {
  const rowLabel = String.fromCharCode(65 + rowIndex); // A, B, C, ...
  let seatNumber = 1;
  for (let c = 0; c <= colIndex; c++) {
    if (layout[rowIndex][c] === 1) {
      if (c === colIndex) return `${rowLabel}${seatNumber}`;
      seatNumber++;
    }
  }
  return "";
};

export default function SeatMapEditor({ layout, onChange }) {
  const [rows, setRows] = useState(layout.rows || 8);
  const [columns, setColumns] = useState(layout.columns || 4);
  const [seatLayout, setSeatLayout] = useState(layout.layout || []);
  const [seatClasses, setSeatClasses] = useState(layout.seatClasses || {});

  useEffect(() => {
    if (!layout.layout || layout.layout.length === 0) {
      generateDefaultLayout();
    }
  }, []);

  const generateDefaultLayout = () => {
    const newLayout = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < columns + 1; c++) {
        if (c === Math.floor((columns + 1) / 2)) {
          row.push(0); // Aisle
        } else {
          row.push(1); // Seat
        }
      }
      newLayout.push(row);
    }
    setSeatLayout(newLayout);
    onChange({ rows, columns, layout: newLayout, seatClasses: {} });
  };

  const updateLayout = () => {
    const newLayout = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < columns + 1; c++) {
        if (c === Math.floor((columns + 1) / 2)) {
          row.push(0); // Aisle
        } else {
          row.push(1); // Seat
        }
      }
      newLayout.push(row);
    }
    setSeatLayout(newLayout);
    setSeatClasses({});
    onChange({ rows, columns, layout: newLayout, seatClasses: {} });
  };

  const toggleSeat = (rowIndex, colIndex) => {
    const newLayout = [...seatLayout];
    newLayout[rowIndex][colIndex] = newLayout[rowIndex][colIndex] === 1 ? 0 : 1;
    setSeatLayout(newLayout);
    onChange({ rows, columns, layout: newLayout, seatClasses });
  };

  const toggleSeatClass = (rowIndex, colIndex) => {
    const seatLabel = getSeatLabel(rowIndex, colIndex, seatLayout);
    const newClasses = { ...seatClasses };
    if (newClasses[seatLabel] === 'vip') {
      delete newClasses[seatLabel];
    } else {
      newClasses[seatLabel] = 'vip';
    }
    setSeatClasses(newClasses);
    onChange({ rows, columns, layout: seatLayout, seatClasses: newClasses });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Layout Dimensions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Rows</Label>
            <Input
              type="number"
              min="4"
              max="15"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
          <div>
            <Label className="text-gray-300">Seats Per Row</Label>
            <Input
              type="number"
              min="2"
              max="6"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
              className="bg-white/5 border-white/10 text-white mt-2"
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={updateLayout}
          variant="outline"
          className="mt-3 border-white/10"
        >
          Apply Dimensions
        </Button>
      </div>

      {seatLayout.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Seat Map Builder</h3>
          <Card className="p-4 bg-white/10 border-white/10">
            <div className="mb-4">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Click seat to remove</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span>Right-click to mark as VIP</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {seatLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 justify-center">
                  {row.map((cell, colIndex) => {
                    const seatLabel = cell === 1 ? getSeatLabel(rowIndex, colIndex, seatLayout) : "";
                    const isVip = seatClasses[seatLabel] === 'vip';
                    
                    return cell === 0 ? (
                      <div key={colIndex} className="w-12 h-12" />
                    ) : (
                      <button
                        key={colIndex}
                        onClick={() => toggleSeat(rowIndex, colIndex)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleSeatClass(rowIndex, colIndex);
                        }}
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all ${
                          isVip
                            ? 'bg-purple-500 hover:bg-purple-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Armchair className="w-4 h-4" />
                        <span className="text-xs font-bold">{seatLabel}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-sm text-gray-400">
                Total Seats: {seatLayout.flat().filter(s => s === 1).length} | 
                VIP: {Object.values(seatClasses).filter(c => c === 'vip').length} | 
                Standard: {seatLayout.flat().filter(s => s === 1).length - Object.values(seatClasses).filter(c => c === 'vip').length}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}