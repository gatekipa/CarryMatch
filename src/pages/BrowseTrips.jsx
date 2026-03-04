import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { useCurrentUser } from "../components/hooks/useCurrentUser";
import QueryErrorFallback from "../components/shared/QueryErrorFallback";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Plane,
  MapPin,
  Calendar,
  Weight,
  DollarSign,
  Plus,
  Search,
  ArrowRight,
  Shield,
  User,
  SlidersHorizontal,
  X,
  Star,
  Bell,
  BellOff,
  Loader2 // Added Loader2 import for mutation loading state
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; // Added toast import

import AirportAutocomplete from "../components/airports/AirportAutocomplete";
import AlternateAirports from "../components/airports/AlternateAirports";
import { getAirportByIATA } from "../components/airports/airportsData";
import VerificationPrompt from "../components/VerificationPrompt"; // Add this import

export default function BrowseTrips() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [weightRange, setWeightRange] = useState([0, 50]);
  const [busType, setBusType] = useState("all");
  const [amenities, setAmenities] = useState({ ac: false, wifi: false, usb: false, restroom: false });
  const [minOperatorRating, setMinOperatorRating] = useState(0);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);

  const { data: trips = [], isLoading, error: tripsError, refetch: refetchTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const allTrips = await base44.entities.Trip.filter({ status: "active" }, "-departure_date");
      // Filter to P2P trips only (exclude bus trips which have operator_id)
      return allTrips.filter(trip => !trip.operator_id).map(trip => ({
        ...trip,
        created_by: trip.created_by || trip.traveler_email
      }));
    },
    retry: 2
  });

  // Fetch only creators of visible trips (not ALL users)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['trip-creators', trips.map(t => t.created_by).sort().join(',')],
    queryFn: async () => {
      const emails = [...new Set(trips.map(t => t.created_by).filter(Boolean))];
      if (emails.length === 0) return [];
      return await base44.entities.User.filter({ email: { $in: emails } });
    },
    enabled: trips.length > 0,
    staleTime: 5 * 60 * 1000
  });

  // Get saved searches for this user
  const { data: savedSearches = [] } = useQuery({
    queryKey: ['saved-searches', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SavedSearch.filter({
        user_email: user.email,
        search_type: "trip"
      });
    },
    enabled: !!user
  });

  const filteredTrips = trips.filter(trip => {
    // IATA-based location filters
    const matchFrom = !searchFrom ||
      (trip.from_iata?.toUpperCase() === searchFrom.toUpperCase()) ||
      trip.from_city?.toLowerCase().includes(searchFrom.toLowerCase()) ||
      trip.from_country?.toLowerCase().includes(searchFrom.toLowerCase());
    const matchTo = !searchTo ||
      (trip.to_iata?.toUpperCase() === searchTo.toUpperCase()) ||
      trip.to_city?.toLowerCase().includes(searchTo.toLowerCase()) ||
      trip.to_country?.toLowerCase().includes(searchTo.toLowerCase());

    // Keyword search
    const matchKeyword = !keyword ||
      trip.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      trip.from_city?.toLowerCase().includes(keyword.toLowerCase()) ||
      trip.to_city?.toLowerCase().includes(keyword.toLowerCase()) ||
      trip.traveler_name?.toLowerCase().includes(keyword.toLowerCase());

    // Verified filter
    const matchVerified = !verifiedOnly || trip.is_verified;

    // Date range filter
    const tripDate = new Date(trip.departure_date);
    const matchDateFrom = !dateFrom || tripDate >= new Date(dateFrom);
    const matchDateTo = !dateTo || tripDate <= new Date(dateTo);

    // Price range filter
    const matchPrice = (trip.price_per_kg || 0) >= priceRange[0] && (trip.price_per_kg || 0) <= priceRange[1];

    // Weight range filter
    const matchWeight = (trip.available_weight_kg || 0) >= weightRange[0] && (trip.available_weight_kg || 0) <= weightRange[1];

    // Bus type filter (for bus trips)
    const matchBusType = busType === "all" || trip.bus_type === busType;

    // Amenities filter (for bus trips)
    const matchAmenities = !Object.values(amenities).some(v => v) || 
      (trip.amenities && Object.entries(amenities).every(([key, required]) => 
        !required || trip.amenities[key]
      ));

    // Operator rating filter (for bus trips)
    const matchOperatorRating = minOperatorRating === 0 || 
      (trip.operator_rating && trip.operator_rating >= minOperatorRating);

    // Check if trip creator is not restricted
    const tripCreator = allUsers.find(u => u.email === trip.created_by);
    const isNotRestricted = !tripCreator?.is_restricted;

    return matchFrom && matchTo && matchKeyword && matchVerified && matchDateFrom && matchDateTo && matchPrice && matchWeight && matchBusType && matchAmenities && matchOperatorRating && isNotRestricted;
  });

  // Sort filtered trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return (a.price_per_kg || 0) - (b.price_per_kg || 0);
      case "price_high":
        return (b.price_per_kg || 0) - (a.price_per_kg || 0);
      case "date":
        return new Date(a.departure_date) - new Date(b.departure_date);
      case "trust_score":
        const userA = allUsers.find(u => u.email === a.created_by);
        const userB = allUsers.find(u => u.email === b.created_by);
        return (userB?.trust_score || 0) - (userA?.trust_score || 0);
      case "rating":
        const ratingA = allUsers.find(u => u.email === a.created_by)?.average_rating || 0;
        const ratingB = allUsers.find(u => u.email === b.created_by)?.average_rating || 0;
        return ratingB - ratingA;
      default:
        return 0;
    }
  });

  // Check if current search is saved
  const isCurrentSearchSaved = savedSearches.some(search =>
    search.from_iata?.toLowerCase() === searchFrom.toLowerCase() &&
    search.to_iata?.toLowerCase() === searchTo.toLowerCase()
  );

  // Save search mutation
  const saveSearchMutation = useMutation({
    mutationFn: async (notifyEnabled) => {
      if (!user) {
        toast.error("Please sign in to save searches");
        navigate(createPageUrl("SignIn"));
        return;
      }

      // Check if search already exists
      const existing = savedSearches.find(search =>
        search.from_iata?.toLowerCase() === searchFrom.toLowerCase() &&
        search.to_iata?.toLowerCase() === searchTo.toLowerCase()
      );

      if (existing) {
        // Update notification setting
        await base44.entities.SavedSearch.update(existing.id, {
          notify_on_match: notifyEnabled,
          is_active: true
        });
        toast.success("Search preferences updated!");
        return existing;
      }

      // Create new saved search
      const searchData = {
        user_email: user.email,
        search_type: "trip",
        from_city: getAirportByIATA(searchFrom)?.city || "",
        from_country: getAirportByIATA(searchFrom)?.country || "",
        from_iata: searchFrom,
        to_city: getAirportByIATA(searchTo)?.city || "",
        to_country: getAirportByIATA(searchTo)?.country || "",
        to_iata: searchTo,
        notify_on_match: notifyEnabled,
        is_active: true
      };

      const newSearch = await base44.entities.SavedSearch.create(searchData);

      // Check for existing matching trips
      const matchingTrips = sortedTrips.slice(0, 5); // Top 5 matches

      if (matchingTrips.length > 0 && notifyEnabled) {
        // Create notifications for existing matches
        // For simplicity, we'll create one notification summarizing the matches
        await base44.entities.Notification.create({
          user_email: user.email,
          type: "match_found",
          title: "🔍 Existing trips found!",
          message: `Found ${matchingTrips.length} active trip(s) matching your saved search: ${searchFrom} → ${searchTo}. Click to view.`,
          link_url: createPageUrl("BrowseTrips", `from=${searchFrom}&to=${searchTo}`), // Link to the current search results
          priority: "normal",
          related_id: newSearch.id, // Relate to the saved search
          related_entity_type: "saved_search"
        });

        toast.success(`Search saved! Found ${matchingTrips.length} existing match(es). You'll also be notified of new ones.`);
      } else {
        toast.success("Search saved! You'll be notified of new matches");
      }

      return newSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowSaveSearchModal(false);
    },
    onError: (error) => {
      console.error("Error saving search:", error);
      toast.error("Failed to save search");
    }
  });

  // Delete saved search mutation
  const deleteSavedSearchMutation = useMutation({
    mutationFn: async () => {
      const existing = savedSearches.find(search =>
        search.from_iata?.toLowerCase() === searchFrom.toLowerCase() &&
        search.to_iata?.toLowerCase() === searchTo.toLowerCase()
      );

      if (existing) {
        await base44.entities.SavedSearch.delete(existing.id);
        toast.success("Search removed from saved searches");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    }
  });

  const clearFilters = () => {
    setSearchFrom("");
    setSearchTo("");
    setKeyword("");
    setVerifiedOnly(false);
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setPriceRange([0, 100]);
    setWeightRange([0, 50]);
    setBusType("all");
    setAmenities({ ac: false, wifi: false, usb: false, restroom: false });
    setMinOperatorRating(0);
  };

  // Calculate active filters count
  const activeFilterCount = [
    searchFrom,
    searchTo,
    keyword,
    verifiedOnly,
    dateFrom,
    dateTo,
    sortBy !== "date",
    priceRange[0] !== 0 || priceRange[1] !== 100,
    weightRange[0] !== 0 || weightRange[1] !== 50,
    busType !== "all",
    Object.values(amenities).some(v => v),
    minOperatorRating > 0
  ].filter(Boolean).length;

  // Calculate availability data for alternates
  const departureAvailability = {};
  const arrivalAvailability = {};
  trips.forEach(trip => {
    if (trip.from_iata) {
      departureAvailability[trip.from_iata] = (departureAvailability[trip.from_iata] || 0) + 1;
    }
    if (trip.to_iata) {
      arrivalAvailability[trip.to_iata] = (arrivalAvailability[trip.to_iata] || 0) + 1;
    }
  });

  return (
    <PullToRefresh onRefresh={() => refetchTrips()} isRefetching={isLoading}>
      <div className="min-h-screen py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Browse Available <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Trips</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Find travelers heading your way and send your items with them
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9EFF00]/10 border border-[#9EFF00]/20">
            <span className="text-[#9EFF00] font-bold text-sm">$5 flat matching fee</span>
            <span className="text-gray-400 text-xs">· You and the traveler negotiate the delivery price</span>
          </div>
        </motion.div>

        {/* Verification Prompt */}
        {user && <VerificationPrompt user={user} />}

        {/* Error State */}
        {tripsError && (
          <QueryErrorFallback error={tripsError} onRetry={refetchTrips} title="Failed to load trips" />
        )}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <Card className="p-4 sm:p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <AirportAutocomplete
                label="From Airport"
                value={searchFrom}
                onChange={setSearchFrom}
                placeholder="IATA code or city"
              />
              <AirportAutocomplete
                label="To Airport"
                value={searchTo}
                onChange={setSearchTo}
                placeholder="IATA code or city"
              />
              <div className="relative">
                <Label className="text-gray-300 mb-2 block">Keywords</Label>
                <Search className="absolute left-3 top-[42px] -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search keywords..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                {/* Save Search Button */}
                {user && searchFrom && searchTo && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isCurrentSearchSaved) {
                        deleteSavedSearchMutation.mutate();
                      } else {
                        setShowSaveSearchModal(true);
                      }
                    }}
                    disabled={deleteSavedSearchMutation.isPending}
                    size="sm"
                    className={`flex-1 ${
                      isCurrentSearchSaved
                        ? 'border-[#9EFF00] text-[#9EFF00] bg-[#9EFF00]/10 hover:bg-[#9EFF00]/20'
                        : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {deleteSavedSearchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentSearchSaved ? (
                      <>
                        <BellOff className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Save</span>
                      </>
                    )}
                  </Button>
                )}
                <Button size="sm" className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] group font-semibold">
                  <Search className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-300 hover:text-white hover:bg-white/5"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Advanced Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-[#9EFF00] text-[#1A1A1A]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-6 mt-4 pt-4 border-t border-white/10">
                    {/* Date Range */}
                    <div>
                      <Label className="text-white mb-3 block font-semibold">Date Range</Label>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 mb-2 block text-sm">Departure From</Label>
                          <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 mb-2 block text-sm">Departure To</Label>
                          <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-white font-semibold">Price Range (per kg)</Label>
                        <span className="text-sm text-[#9EFF00]">
                          ${priceRange[0]} - ${priceRange[1]}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>$0</span>
                        <span>$100</span>
                      </div>
                    </div>

                    {/* Weight Range */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-white font-semibold">Weight Available (kg)</Label>
                        <span className="text-sm text-[#9EFF00]">
                          {weightRange[0]} - {weightRange[1]} kg
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={50}
                        step={1}
                        value={weightRange}
                        onValueChange={setWeightRange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0 kg</span>
                        <span>50 kg</span>
                      </div>
                    </div>

                    {/* Bus Filters */}
                    <div>
                      <Label className="text-white mb-3 block font-semibold">Bus Filters</Label>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 mb-2 block text-sm">Bus Type</Label>
                          <Select value={busType} onValueChange={setBusType}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="luxury">Luxury</SelectItem>
                              <SelectItem value="sleeper">Sleeper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-300 mb-2 block text-sm">Min. Operator Rating</Label>
                          <Select value={minOperatorRating.toString()} onValueChange={(v) => setMinOperatorRating(Number(v))}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Any Rating</SelectItem>
                              <SelectItem value="3">3+ Stars</SelectItem>
                              <SelectItem value="4">4+ Stars</SelectItem>
                              <SelectItem value="4.5">4.5+ Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label className="text-gray-300 mb-2 block text-sm">Amenities</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                            <Checkbox
                              id="ac"
                              checked={amenities.ac}
                              onCheckedChange={(checked) => setAmenities({...amenities, ac: checked})}
                              className="border-white/10"
                            />
                            <Label htmlFor="ac" className="text-gray-300 cursor-pointer text-sm">AC</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                            <Checkbox
                              id="wifi"
                              checked={amenities.wifi}
                              onCheckedChange={(checked) => setAmenities({...amenities, wifi: checked})}
                              className="border-white/10"
                            />
                            <Label htmlFor="wifi" className="text-gray-300 cursor-pointer text-sm">WiFi</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                            <Checkbox
                              id="usb"
                              checked={amenities.usb}
                              onCheckedChange={(checked) => setAmenities({...amenities, usb: checked})}
                              className="border-white/10"
                            />
                            <Label htmlFor="usb" className="text-gray-300 cursor-pointer text-sm">USB</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                            <Checkbox
                              id="restroom"
                              checked={amenities.restroom}
                              onCheckedChange={(checked) => setAmenities({...amenities, restroom: checked})}
                              className="border-white/10"
                            />
                            <Label htmlFor="restroom" className="text-gray-300 cursor-pointer text-sm">Restroom</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sort and Verify */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Departure Date</SelectItem>
                            <SelectItem value="price_low">Price: Low to High</SelectItem>
                            <SelectItem value="price_high">Price: High to Low</SelectItem>
                            <SelectItem value="trust_score">Trust Score</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center space-x-2 p-4 rounded-lg bg-white/5 w-full">
                          <Checkbox
                            id="verified"
                            checked={verifiedOnly}
                            onCheckedChange={setVerifiedOnly}
                            className="border-white/10"
                          />
                          <Label htmlFor="verified" className="text-gray-300 cursor-pointer">
                            <Shield className="w-4 h-4 inline mr-1 text-green-400" />
                            Verified Travelers Only
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Save Search Modal */}
        <AnimatePresence>
          {showSaveSearchModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowSaveSearchModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <Card className="p-6 bg-[#0F1D35] border-white/20 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Save This Search</h3>
                      <p className="text-sm text-gray-400">Get notified of new matches</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Route:</span>
                      <span className="text-white font-semibold">
                        {searchFrom} → {searchTo}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-6">
                    {sortedTrips.length > 0 ? (
                      <>
                        We found <span className="text-[#9EFF00] font-semibold">{sortedTrips.length} active trip(s)</span> matching your search right now.
                        You'll also be notified when new matching trips are posted.
                      </>
                    ) : (
                      <>
                        No active trips found right now, but we'll <span className="text-[#9EFF00] font-semibold">notify you</span> when new matching trips are posted.
                      </>
                    )}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveSearchModal(false)}
                      className="flex-1 border-white/10 text-gray-300 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => saveSearchMutation.mutate(true)}
                      disabled={saveSearchMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold"
                    >
                      {saveSearchMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Save & Notify Me
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alternate Airports for Departure */}
        {searchFrom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlternateAirports
              iata={searchFrom}
              direction="departure"
              matchCount={sortedTrips.filter(t =>
                t.from_iata?.toUpperCase() === searchFrom.toUpperCase()
              ).length}
              minMatches={3}
              availabilityData={departureAvailability}
              onSelectAlternate={(iata) => setSearchFrom(iata)}
            />
          </motion.div>
        )}

        {/* Alternate Airports for Arrival */}
        {searchTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlternateAirports
              iata={searchTo}
              direction="arrival"
              matchCount={sortedTrips.filter(t =>
                t.to_iata?.toUpperCase() === searchTo.toUpperCase()
              ).length}
              minMatches={3}
              availabilityData={arrivalAvailability}
              onSelectAlternate={(iata) => setSearchTo(iata)}
            />
          </motion.div>
        )}

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-400">
            {sortedTrips.length} {sortedTrips.length === 1 ? 'trip' : 'trips'} found
          </p>
          {sortBy !== "date" && (
            <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">
              Sorted by {
                sortBy === "price_low" ? "Price (Low)" :
                sortBy === "price_high" ? "Price (High)" :
                sortBy === "trust_score" ? "Trust Score" :
                "Rating"
              }
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4" />
                <div className="h-4 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded" />
              </Card>
            ))}
          </div>
        ) : sortedTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Plane className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No trips found</h3>
              <p className="text-gray-400 mb-6">
                {(searchFrom || searchTo || keyword || verifiedOnly || dateFrom || dateTo || priceRange[0] !== 0 || priceRange[1] !== 100 || weightRange[0] !== 0 || weightRange[1] !== 50)
                  ? "Try adjusting your filters or search terms"
                  : "Be the first to post a trip for this route or destination"
                }
              </p>
              <Link to={createPageUrl("PostTrip")}>
                <Button className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold">
                  Post a Trip
                </Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {sortedTrips.map((trip, index) => {
                const tripCreator = allUsers.find(u => u.email === trip.created_by);
                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <Link to={createPageUrl("TripDetails", `id=${trip.id}`)}>
                      <Card className="p-4 sm:p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm h-full cursor-pointer group relative overflow-hidden">
                        {/* Verified Ribbon */}
                        {trip.is_verified && (
                          <div className="absolute top-0 right-0">
                            <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg">
                              <Shield className="w-3 h-3" />
                              VERIFIED
                            </div>
                          </div>
                        )}

                        {/* Route */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 mb-1">From</div>
                              <div className="font-bold text-white text-base sm:text-lg truncate">{trip.from_city}</div>
                              <div className="text-xs sm:text-sm text-gray-400 truncate">{trip.from_country}</div>
                            </div>
                            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#9EFF00] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                            <div className="flex-1 text-right min-w-0">
                              <div className="text-xs text-gray-400 mb-1">To</div>
                              <div className="font-bold text-white text-base sm:text-lg truncate">{trip.to_city}</div>
                              <div className="text-xs sm:text-sm text-gray-400 truncate">{trip.to_country}</div>
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-[#9EFF00]" />
                            <span className="text-sm">{format(new Date(trip.departure_date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Weight className="w-4 h-4 text-green-400" />
                            <span className="text-sm">{trip.available_weight_kg} kg available</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-semibold">${trip.price_per_kg}/kg</span>
                          </div>
                          {trip.delivery_services && Array.isArray(trip.delivery_services) && trip.delivery_services.length > 1 && (
                            <div className="flex flex-wrap gap-1">
                              {trip.delivery_services.includes("door-to-door") && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">🏠→🏠</Badge>
                              )}
                              {trip.delivery_services.includes("door-to-airport") && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">🏠→✈️</Badge>
                              )}
                              {trip.delivery_services.includes("airport-to-door") && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">✈️→🏠</Badge>
                              )}
                            </div>
                          )}
                          {tripCreator?.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-300">{tripCreator.average_rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">({tripCreator.total_reviews})</span>
                            </div>
                          )}
                          {tripCreator?.trust_score !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-400">Trust:</div>
                              <div className="flex-1 max-w-[100px] bg-white/10 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    tripCreator.trust_score >= 75 ? 'bg-green-500' :
                                    tripCreator.trust_score >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${tripCreator.trust_score}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{tripCreator.trust_score}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(createPageUrl("UserProfile", `email=${trip.created_by}`));
                            }}
                            className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors group/profile cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative ring-2 ring-transparent group-hover/profile:ring-blue-500/50 transition-all">
                              <User className="w-4 h-4 text-white" />
                              {trip.is_verified && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#1a1a2e]">
                                  <Shield className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-gray-300 group-hover/profile:text-white transition-colors">
                              {trip.traveler_name}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        </div>
      </div>
    </PullToRefresh>
  );
}