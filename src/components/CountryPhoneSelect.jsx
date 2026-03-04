import React, { useState, useRef, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Search, Check, Globe } from "lucide-react";
import { countries } from "@/components/data/countries";

/**
 * Searchable country selector with phone code display.
 * Shows a dropdown with search filtering — much better than a plain <Select> for 200+ countries.
 *
 * Props:
 *  - value             selected country name
 *  - onChange({ name, code, phoneCode })  called when country is selected
 *  - label             field label
 *  - required
 *  - className
 *  - disabled
 */
export default function CountryPhoneSelect({
  id: externalId,
  value,
  onChange,
  label,
  required = false,
  className = "",
  disabled = false,
}) {
  const autoId = useId();
  const inputId = externalId || autoId;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filter countries by search
  const filtered = search.trim()
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.phoneCode.includes(search)
      )
    : countries;

  // Selected country object
  const selected = countries.find((c) => c.name === value) || null;

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!open) {
      setSearch("");
      setSelectedIndex(-1);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex];
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = (country) => {
    onChange({ name: country.name, code: country.code, phoneCode: country.phoneCode });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filtered.length) {
          handleSelect(filtered[selectedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <Label htmlFor={inputId} className="text-gray-300 mb-2 block">
          {label} {required && <span className="text-red-400">*</span>}
        </Label>
      )}

      {/* Trigger button */}
      <button
        id={inputId}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`flex items-center justify-between w-full h-10 px-3 rounded-md border text-sm transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-white/10"
        } bg-white/5 border-white/10 text-white`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selected ? (
            <>
              <span>{selected.name}</span>
              <span className="text-gray-400 text-xs">({selected.phoneCode})</span>
            </>
          ) : (
            <span className="text-gray-500">Select country</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-[100] w-full mt-2 bg-[#0F1D35] border border-white/20 rounded-lg shadow-2xl backdrop-blur-xl overflow-hidden"
          style={{ boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)" }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#9EFF00]/50"
              />
            </div>
          </div>

          {/* Country list */}
          <div ref={listRef} className="max-h-56 overflow-y-auto p-1" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No countries found
              </div>
            ) : (
              filtered.map((country, index) => (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  aria-selected={country.name === value}
                  onClick={() => handleSelect(country)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center justify-between gap-2 ${
                    index === selectedIndex
                      ? "bg-[#9EFF00]/20 text-white"
                      : country.name === value
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="font-medium">{country.name}</span>
                    <span className="text-xs text-gray-500">{country.code}</span>
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-mono">{country.phoneCode}</span>
                    {country.name === value && (
                      <Check className="w-4 h-4 text-[#9EFF00]" />
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
