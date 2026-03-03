import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  TrendingUp, 
  Plane,
  Info,
  Navigation
} from "lucide-react";
import { 
  getAirportByIATA,
  getMetroClusterAirports,
  getRegionAirports,
  getAirportsWithinRadius,
  getCountryAirports,
  calculateDistance
} from "./airportsData";

export default function AlternateAirports({ 
  iata, 
  direction, // "departure" or "arrival"
  matchCount,
  minMatches = 3,
  availabilityData = {}, // { IATA: count } for that direction
  onSelectAlternate
}) {
  const [radius, setRadius] = useState(100);
  const [filterType, setFilterType] = useState("all");
  const [alternates, setAlternates] = useState([]);

  useEffect(() => {
    if (!iata) {
      setAlternates([]);
      return;
    }

    calculateAlternates();
  }, [iata, radius, filterType, availabilityData]);

  const calculateAlternates = () => {
    const baseAirport = getAirportByIATA(iata);
    if (!baseAirport) {
      setAlternates([]);
      return;
    }

    let candidates = [];

    // 1. Metro cluster (highest priority)
    const metroAirports = getMetroClusterAirports(iata).map(a => ({
      ...a,
      distance: calculateDistance(baseAirport.lat, baseAirport.lon, a.lat, a.lon),
      scoreBoost: 50,
      reason: "Same metro area"
    }));

    // 2. Same region/state
    const regionAirports = getRegionAirports(iata).map(a => ({
      ...a,
      distance: calculateDistance(baseAirport.lat, baseAirport.lon, a.lat, a.lon),
      scoreBoost: 30,
      reason: "Same state/region"
    }));

    // 3. Within radius
    const radiusAirports = getAirportsWithinRadius(iata, radius).map(a => ({
      ...a,
      scoreBoost: 20,
      reason: `Within ${radius} mi`
    }));

    // 4. Same country
    const countryAirports = getCountryAirports(iata).map(a => ({
      ...a,
      distance: calculateDistance(baseAirport.lat, baseAirport.lon, a.lat, a.lon),
      scoreBoost: 10,
      reason: "Same country"
    }));

    // Combine and deduplicate
    const allAirports = [...metroAirports, ...regionAirports, ...radiusAirports, ...countryAirports];
    const unique = allAirports.reduce((acc, airport) => {
      if (!acc.find(a => a.iata === airport.iata)) {
        acc.push(airport);
      }
      return acc;
    }, []);

    // Calculate scores
    const scored = unique.map(airport => {
      const availability = availabilityData[airport.iata] || 0;
      const distancePenalty = airport.distance / 10; // Reduce score by distance/10
      const sizeBoost = airport.size === "large" ? 15 : airport.size === "medium" ? 8 : 0;
      const availabilityBoost = availability * 5; // 5 points per match

      const score = 
        airport.scoreBoost + 
        sizeBoost + 
        availabilityBoost - 
        distancePenalty;

      return {
        ...airport,
        availability,
        score: Math.round(score)
      };
    });

    // Filter by type
    let filtered = scored;
    if (filterType === "metro") {
      filtered = scored.filter(a => metroAirports.find(m => m.iata === a.iata));
    } else if (filterType === "region") {
      filtered = scored.filter(a => regionAirports.find(r => r.iata === a.iata));
    } else if (filterType === "radius") {
      filtered = scored.filter(a => a.distance <= radius);
    } else if (filterType === "country") {
      filtered = scored.filter(a => a.country === baseAirport.country);
    }

    // Sort by score and take top 6
    filtered.sort((a, b) => b.score - a.score);
    setAlternates(filtered.slice(0, 6));
  };

  // Don't show if we have enough matches
  if (matchCount >= minMatches) {
    return null;
  }

  if (!iata || alternates.length === 0) {
    return null;
  }

  const baseAirport = getAirportByIATA(iata);
  const directionText = direction === "departure" ? "departing from" : "arriving at";

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 backdrop-blur-sm">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {matchCount === 0 ? "No trips found" : "Limited options"} {directionText} {iata}
          </h3>
          <p className="text-sm text-gray-300">
            Try these nearby alternatives with more availability:
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          variant={filterType === "all" ? "default" : "outline"}
          onClick={() => setFilterType("all")}
          className={filterType === "all" 
            ? "bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]" 
            : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filterType === "metro" ? "default" : "outline"}
          onClick={() => setFilterType("metro")}
          className={filterType === "metro" 
            ? "bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]" 
            : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"}
        >
          Same Metro
        </Button>
        <Button
          size="sm"
          variant={filterType === "region" ? "default" : "outline"}
          onClick={() => setFilterType("region")}
          className={filterType === "region" 
            ? "bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]" 
            : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"}
        >
          In State
        </Button>
        <Button
          size="sm"
          variant={filterType === "radius" ? "default" : "outline"}
          onClick={() => setFilterType("radius")}
          className={filterType === "radius" 
            ? "bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]" 
            : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"}
        >
          Within {radius} mi
        </Button>
        <Button
          size="sm"
          variant={filterType === "country" ? "default" : "outline"}
          onClick={() => setFilterType("country")}
          className={filterType === "country" 
            ? "bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]" 
            : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"}
        >
          Whole Country
        </Button>
      </div>

      {/* Radius Slider (only show when radius filter is active) */}
      {(filterType === "radius" || filterType === "all") && (
        <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <Label className="text-gray-300 mb-3 block flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Search Radius: {radius} miles
          </Label>
          <Slider
            value={[radius]}
            onValueChange={(value) => setRadius(value[0])}
            min={25}
            max={500}
            step={25}
            className="w-full"
          />
        </div>
      )}

      {/* Alternate Airport Chips */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {alternates.map((airport) => (
          <button
            key={airport.iata}
            onClick={() => onSelectAlternate(airport.iata)}
            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#9EFF00]/50 transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-[#9EFF00]" />
                <span className="font-bold text-white text-lg">{airport.iata}</span>
              </div>
              {airport.availability > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  {airport.availability} {direction === "departure" ? "trips" : "requests"}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-300 mb-2 line-clamp-1">
              {airport.name}
            </div>
            
            <div className="text-xs text-gray-400 mb-2">
              {airport.city}, {airport.country}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{Math.round(airport.distance)} mi</span>
              <div className="flex items-center gap-1 text-[#9EFF00]">
                <TrendingUp className="w-3 h-3" />
                <span>{airport.score} score</span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-gray-500">{airport.reason}</span>
            </div>
          </button>
        ))}
      </div>

      {alternates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">
            No alternatives found with current filters. Try adjusting the radius or filter type.
          </p>
        </div>
      )}
    </Card>
  );
}