import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MapPin, Plane } from "lucide-react";
import { searchAirports } from "./airportsData";

export default function AirportAutocomplete({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter IATA code or city",
  required = false 
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const airport = searchAirports(value).find(a => a.iata === value);
      setQuery(airport ? `${airport.iata} - ${airport.city}, ${airport.country}` : value);
    } else {
      setQuery("");
    }
  }, [value]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.length >= 2) {
      const results = searchAirports(newQuery);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (airport) => {
    setQuery(`${airport.iata} - ${airport.city}, ${airport.country}`);
    onChange(airport.iata);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <Label className="text-gray-300 mb-2 block">
          {label} {required && <span className="text-red-400">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          required={required}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls="airport-suggestions"
          aria-activedescendant={selectedIndex >= 0 ? `airport-${selectedIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={listRef}
          id="airport-suggestions"
          role="listbox"
          className="absolute z-[100] w-full mt-2 p-2 bg-[#0F1D35] border border-white/20 rounded-lg shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl"
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {suggestions.map((airport, index) => (
            <button
              key={airport.iata}
              id={`airport-${index}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(airport)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-[#9EFF00]/20 text-white border border-[#9EFF00]/30'
                  : 'text-gray-300 hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <Plane className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  index === selectedIndex ? 'text-[#9EFF00]' : 'text-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${
                      index === selectedIndex ? 'text-[#9EFF00]' : 'text-[#9EFF00]'
                    }`}>
                      {airport.iata}
                    </span>
                    <span className="text-sm text-gray-500">·</span>
                    <span className="font-medium truncate text-white">{airport.name}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {airport.city}, {airport.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}