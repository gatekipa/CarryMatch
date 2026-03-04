import React, { useState, useRef, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { searchCities } from "./citiesData";

export default function CityAutocomplete({
  id: externalId,
  label,
  value,
  onChange,
  placeholder = "Search for a city...",
  required = false,
  filterCountry = null,
  className = "",
  disabled = false,
}) {
  const autoId = useId();
  const inputId = externalId || autoId;
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const instanceId = useRef(
    `city-ac-${Math.random().toString(36).slice(2, 8)}`
  ).current;

  // Sync external value changes (e.g. swap cities, form reset)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange(newQuery);

    // Debounce the suggestion search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const minChars = filterCountry ? 1 : 2;
      if (newQuery.trim().length >= minChars) {
        const results = searchCities(newQuery, filterCountry);
        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleSelect = (city) => {
    setQuery(city.name);
    onChange(city.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
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
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      // Allow free text — pass whatever the user typed
      if (query !== value) {
        onChange(query);
      }
    }, 200);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(
        `#${instanceId}-${selectedIndex}`
      );
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, instanceId]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <Label htmlFor={inputId} className="text-gray-300 mb-2 block">
          {label} {required && <span className="text-red-400">*</span>}
        </Label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <Input
          id={inputId}
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
          disabled={disabled}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={`${instanceId}-list`}
          aria-activedescendant={
            selectedIndex >= 0 ? `${instanceId}-${selectedIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={listRef}
          id={`${instanceId}-list`}
          role="listbox"
          className="absolute z-[100] w-full mt-2 p-2 bg-[#0F1D35] border border-white/20 rounded-lg shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl"
          style={{
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.country}-${index}`}
              id={`${instanceId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(city)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                index === selectedIndex
                  ? "bg-[#9EFF00]/20 text-white border border-[#9EFF00]/30"
                  : "text-gray-300 hover:bg-white/10 border border-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    index === selectedIndex
                      ? "text-[#9EFF00]"
                      : "text-blue-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#9EFF00]">
                      {city.name}
                    </span>
                    {city.region && (
                      <>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm text-gray-400 truncate">
                          {city.region}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{city.country}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
