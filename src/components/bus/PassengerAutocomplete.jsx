import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { User, Phone } from "lucide-react";

export default function PassengerAutocomplete({ operatorId, value, onSelect, placeholder = "Phone number" }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['passenger-suggestions', operatorId, inputValue],
    queryFn: async () => {
      if (!inputValue || inputValue.length < 3) return [];
      return await base44.entities.PassengerProfile.filter({
        operator_id: operatorId,
        $or: [
          { phone: { $regex: inputValue, $options: 'i' } },
          { name: { $regex: inputValue, $options: 'i' } }
        ]
      }, '-updated_date', 5);
    },
    enabled: !!operatorId && !!inputValue && inputValue.length >= 3
  });

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(val.length >= 3);
    if (onSelect) {
      onSelect(null, val);
    }
  };

  const handleSelectSuggestion = (passenger) => {
    setInputValue(passenger.phone);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(passenger, passenger.phone);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
        placeholder={placeholder}
        className="bg-white/5 border-white/10 text-white"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 p-2 bg-[#0F1D35] border-white/10 max-h-64 overflow-y-auto">
          {suggestions.map((passenger) => (
            <button
              key={passenger.id}
              onClick={() => handleSelectSuggestion(passenger)}
              className="w-full p-3 text-left hover:bg-white/10 rounded-lg transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{passenger.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Phone className="w-3 h-3" />
                  <span>{passenger.phone}</span>
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}