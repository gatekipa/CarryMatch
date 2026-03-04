import React, { useState, useRef, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Building2 } from "lucide-react";

/**
 * Address autocomplete using OpenStreetMap Nominatim API.
 * Works for countries with formal addressing AND those without
 * (users can always type free text — suggestions are optional).
 *
 * Props:
 *  - value          current string value
 *  - onChange(str)   called on every keystroke (free text)
 *  - onSelect(obj)   optional — called when a suggestion is picked
 *                    obj = { display_name, house_number, road, city, state, country, postcode, lat, lon, type }
 *  - label           field label
 *  - placeholder
 *  - required
 *  - countryCode     ISO-3166 2-letter code to bias results (e.g. "CM", "US")
 *  - includePOI      if true, also search businesses / landmarks
 *  - className
 *  - disabled
 */
export default function AddressAutocomplete({
  id: externalId,
  value,
  onChange,
  onSelect,
  label,
  placeholder = "Start typing an address...",
  required = false,
  countryCode = null,
  includePOI = true,
  className = "",
  disabled = false,
}) {
  const autoId = useId();
  const inputId = externalId || autoId;
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const abortRef = useRef(null);
  const instanceId = useRef(
    `addr-ac-${Math.random().toString(36).slice(2, 8)}`
  ).current;

  // Sync external value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const searchNominatim = async (q) => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        format: "json",
        addressdetails: "1",
        limit: "6",
      });
      if (countryCode) {
        params.set("countrycodes", countryCode.toLowerCase());
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          signal: controller.signal,
          headers: { "User-Agent": "CarryMatch/1.0" },
        }
      );

      if (!res.ok) throw new Error("Nominatim request failed");
      const data = await res.json();

      return data.map((item) => {
        const addr = item.address || {};
        const isPOI =
          item.type === "restaurant" ||
          item.type === "hotel" ||
          item.type === "shop" ||
          item.class === "amenity" ||
          item.class === "shop" ||
          item.class === "tourism";

        return {
          display_name: item.display_name,
          house_number: addr.house_number || "",
          road: addr.road || addr.pedestrian || addr.street || "",
          city:
            addr.city ||
            addr.town ||
            addr.village ||
            addr.hamlet ||
            addr.municipality ||
            "",
          state: addr.state || addr.region || "",
          country: addr.country || "",
          postcode: addr.postcode || "",
          lat: item.lat,
          lon: item.lon,
          type: item.type,
          isPOI,
          name: isPOI ? (addr[item.type] || item.name || "") : "",
        };
      });
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.error("Address search error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange(newQuery);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (newQuery.trim().length >= 3) {
        const results = await searchNominatim(newQuery.trim());
        // Optionally filter out POIs
        const filtered = includePOI
          ? results
          : results.filter((r) => !r.isPOI);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    // Build a human-readable short address
    const parts = [];
    if (item.name) parts.push(item.name);
    if (item.house_number && item.road) {
      parts.push(`${item.house_number} ${item.road}`);
    } else if (item.road) {
      parts.push(item.road);
    }
    if (item.city) parts.push(item.city);
    if (item.state) parts.push(item.state);
    if (item.postcode) parts.push(item.postcode);

    const shortAddress = parts.length > 0 ? parts.join(", ") : item.display_name;

    setQuery(shortAddress);
    onChange(shortAddress);
    if (onSelect) onSelect(item);
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
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      if (query !== value) onChange(query);
    }, 200);
  };

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(
        `#${instanceId}-${selectedIndex}`
      );
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, instanceId]);

  /** Build the secondary line: city, state, country */
  const formatSecondary = (item) => {
    const parts = [];
    if (item.city) parts.push(item.city);
    if (item.state) parts.push(item.state);
    if (item.country) parts.push(item.country);
    return parts.join(", ");
  };

  /** Primary display line */
  const formatPrimary = (item) => {
    if (item.name) return item.name;
    const parts = [];
    if (item.house_number && item.road) {
      parts.push(`${item.house_number} ${item.road}`);
    } else if (item.road) {
      parts.push(item.road);
    }
    if (parts.length === 0 && item.city) parts.push(item.city);
    if (parts.length === 0) return item.display_name.split(",")[0];
    return parts.join(", ");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <Label htmlFor={inputId} className="text-gray-300 mb-2 block">
          {label} {required && <span className="text-red-400">*</span>}
        </Label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin z-10" />
        )}
        <Input
          id={inputId}
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
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
          style={{ boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)" }}
        >
          {suggestions.map((item, index) => (
            <button
              key={`${item.lat}-${item.lon}-${index}`}
              id={`${instanceId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                index === selectedIndex
                  ? "bg-[#9EFF00]/20 text-white border border-[#9EFF00]/30"
                  : "text-gray-300 hover:bg-white/10 border border-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                {item.isPOI ? (
                  <Building2
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      index === selectedIndex
                        ? "text-[#9EFF00]"
                        : "text-amber-400"
                    }`}
                  />
                ) : (
                  <MapPin
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      index === selectedIndex
                        ? "text-[#9EFF00]"
                        : "text-blue-400"
                    }`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {formatPrimary(item)}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {formatSecondary(item)}
                  </div>
                  {item.postcode && (
                    <div className="text-xs text-gray-500">{item.postcode}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
          <div className="text-[10px] text-gray-600 text-center mt-2 pt-2 border-t border-white/5">
            Powered by OpenStreetMap
          </div>
        </div>
      )}

      {!showSuggestions && query.length > 0 && query.length < 3 && (
        <p className="text-xs text-gray-500 mt-1">
          Type at least 3 characters for suggestions
        </p>
      )}
    </div>
  );
}
