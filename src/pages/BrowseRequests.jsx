import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider"; // Added Slider import
import {
  Package,
  MapPin,
  Calendar,
  Weight,
  DollarSign,
  Plus,
  Search,
  ArrowRight,
  User,
  AlertCircle,
  SlidersHorizontal,
  X,
  Star,
  Bell,
  BellOff,
  Loader2,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import AirportAutocomplete from "../components/airports/AirportAutocomplete";
import AlternateAirports from "../components/airports/AlternateAirports";
import { getAirportByIATA } from "../components/airports/airportsData";
import { toast } from "sonner"; // Added toast import
import VerificationPrompt from "../components/VerificationPrompt"; // Add this import

export default function BrowseRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 500]); // New state for price range
  const [weightRange, setWeightRange] = useState([0, 30]); // New state for weight range
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false); // New state for save search modal

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['shipment-requests'],
    queryFn: async () => {
      const allRequests = await base44.entities.ShipmentRequest.filter({ status: "active" }, "-needed_by_date");
      return allRequests.map(request => ({
        ...request,
        created_by: request.created_by || request.requester_email
      }));
    },
  });

  // Fetch only creators of visible requests (not ALL users)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['request-creators', requests.map(r => r.created_by).sort().join(',')],
    queryFn: async () => {
      const emails = [...new Set(requests.map(r => r.created_by).filter(Boolean))];
      if (emails.length === 0) return [];
      return await base44.entities.User.filter({ email: { $in: emails } });
    },
    enabled: requests.length > 0
  });

  // Get saved searches for this user
  const { data: savedSearches = [] } = useQuery({
    queryKey: ['saved-searches-requests', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SavedSearch.filter({
        user_email: user.email,
        search_type: "request"
      });
    },
    enabled: !!user
  });

  // Check if current search is saved
  const isCurrentSearchSaved = savedSearches.some(search =>
    search.from_iata?.toLowerCase() === searchFrom.toLowerCase() &&
    search.to_iata?.toLowerCase() === searchTo.toLowerCase()
  );

  const filteredRequests = requests.filter(req => {
    // IATA-based location filters
    const matchFrom = !searchFrom ||
      req.from_iata?.toUpperCase() === searchFrom.toUpperCase() ||
      req.from_city?.toLowerCase().includes(searchFrom.toLowerCase()) ||
      req.from_country?.toLowerCase().includes(searchFrom.toLowerCase());
    const matchTo = !searchTo ||
      req.to_iata?.toUpperCase() === searchTo.toUpperCase() ||
      req.to_city?.toLowerCase().includes(searchTo.toLowerCase()) ||
      req.to_country?.toLowerCase().includes(searchTo.toLowerCase());

    // Keyword search
    const matchKeyword = !keyword ||
      req.item_description?.toLowerCase().includes(keyword.toLowerCase()) ||
      req.from_city?.toLowerCase().includes(keyword.toLowerCase()) ||
      req.to_city?.toLowerCase().includes(keyword.toLowerCase()) ||
      req.requester_name?.toLowerCase().includes(keyword.toLowerCase());

    // Urgency filter
    const matchUrgency = urgencyFilter === "all" || req.urgency === urgencyFilter;

    // Date range filter
    const requestDate = new Date(req.needed_by_date);
    const matchDateFrom = !dateFrom || requestDate >= new Date(dateFrom);
    const matchDateTo = !dateTo || requestDate <= new Date(dateTo);

    // Price range filter
    const matchPrice = (req.offered_price || 0) >= priceRange[0] && (req.offered_price || 0) <= priceRange[1];

    // Weight range filter
    const matchWeight = (req.estimated_weight_kg || 0) >= weightRange[0] && (req.estimated_weight_kg || 0) <= weightRange[1];

    // Check if request creator is not restricted
    const reqCreator = allUsers.find(u => u.email === req.created_by);
    const isNotRestricted = !reqCreator?.is_restricted;

    return matchFrom && matchTo && matchKeyword && matchUrgency && matchDateFrom && matchDateTo && matchPrice && matchWeight && isNotRestricted;
  });

  // Sort filtered requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return (a.offered_price || 0) - (b.offered_price || 0);
      case "price_high":
        return (b.offered_price || 0) - (a.offered_price || 0);
      case "date":
        return new Date(a.needed_by_date) - new Date(b.needed_by_date);
      case "urgency":
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      case "trust_score":
        const userA = allUsers.find(u => u.email === a.created_by);
        const userB = allUsers.find(u => u.email === b.created_by);
        return (userB?.trust_score || 0) - (userA?.trust_score || 0);
      case "rating": // New rating sort case
        const ratingA = allUsers.find(u => u.email === a.created_by)?.average_rating || 0;
        const ratingB = allUsers.find(u => u.email === b.created_by)?.average_rating || 0;
        return ratingB - ratingA;
      default:
        return 0;
    }
  });

  // Save search mutation
  const saveSearchMutation = useMutation({
    mutationFn: async (notifyEnabled) => {
      if (!user) {
        toast.error("Please sign in to save searches");
        return;
      }

      const existing = savedSearches.find(search =>
        search.from_iata?.toLowerCase() === searchFrom.toLowerCase() &&
        search.to_iata?.toLowerCase() === searchTo.toLowerCase()
      );

      if (existing) {
        await base44.entities.SavedSearch.update(existing.id, {
          notify_on_match: notifyEnabled,
          is_active: true
        });
        toast.success("Search preferences updated!");
        return existing;
      }

      const searchData = {
        user_email: user.email,
        search_type: "request",
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

      const matchingRequests = sortedRequests.slice(0, 5); // Limit to 5 for initial notification
      if (matchingRequests.length > 0 && notifyEnabled) {
        // Create a single notification for multiple matches, linking to the browse page
        await base44.entities.Notification.create({
          user_email: user.email,
          type: "match_found",
          title: "🔍 Existing requests found!",
          message: `Found ${matchingRequests.length} active request(s) matching your saved search: ${searchFrom} → ${searchTo}`,
          link_url: createPageUrl("BrowseRequests"), // Link to general browse or saved search page
          priority: "normal",
          related_id: newSearch.id, // Link to the saved search itself
          related_entity_type: "saved_search"
        });

        toast.success(`Search saved! Found ${matchingRequests.length} existing match(es)`);
      } else {
        toast.success("Search saved! You'll be notified of new matches");
      }

      return newSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches-requests']);
      queryClient.invalidateQueries(['notifications']);
      setShowSaveSearchModal(false);
    },
    onError: (error) => {
      console.error("Error saving search:", error);
      toast.error("Failed to save search");
    }
  });

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
      queryClient.invalidateQueries(['saved-searches-requests']);
    }
  });


  const clearFilters = () => {
    setSearchFrom("");
    setSearchTo("");
    setKeyword("");
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setUrgencyFilter("all");
    setPriceRange([0, 500]); // Reset price range
    setWeightRange([0, 30]); // Reset weight range
  };

  // Count active filters
  const activeFilterCount = [
    searchFrom,
    searchTo,
    keyword,
    dateFrom,
    dateTo,
    sortBy !== "date",
    urgencyFilter !== "all",
    priceRange[0] !== 0 || priceRange[1] !== 500,
    weightRange[0] !== 0 || weightRange[1] !== 30
  ].filter(Boolean).length;

  const urgencyColors = {
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30"
  };

  // Calculate availability data for alternates
  const departureAvailability = {};
  const arrivalAvailability = {};
  requests.forEach(req => {
    if (req.from_iata) {
      departureAvailability[req.from_iata] = (departureAvailability[req.from_iata] || 0) + 1;
    }
    if (req.to_iata) {
      arrivalAvailability[req.to_iata] = (arrivalAvailability[req.to_iata] || 0) + 1;
    }
  });

  return (
    <PullToRefresh onRefresh={() => refetch()} isRefetching={isLoading}>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Browse Shipment <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Requests</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Help someone send their items and earn money on your trip
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="text-purple-400 font-bold text-sm">$5 flat matching fee</span>
            <span className="text-gray-400 text-xs">· You and the sender negotiate the delivery price</span>
          </div>
        </motion.div>

        {/* Verification Prompt */}
        {user && <VerificationPrompt user={user} />}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  placeholder="Search items..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-end gap-2">
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
                    className={`flex-1 ${
                      isCurrentSearchSaved
                        ? 'border-[#9EFF00] text-[#9EFF00] bg-[#9EFF00]/10 hover:bg-[#9EFF00]/20'
                        : 'border-white/10 text-gray-300 hover:bg-white/5'
                    } hover:text-white`}
                    disabled={deleteSavedSearchMutation.isPending}
                  >
                    {deleteSavedSearchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentSearchSaved ? (
                      <>
                        <BellOff className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                )}
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white group font-semibold">
                  <Search className="w-4 h-4 mr-2" />
                  Search
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
                  <Badge className="ml-2 bg-purple-500 text-white">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
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
                          <Label className="text-gray-300 mb-2 block text-sm">Needed From</Label>
                          <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 mb-2 block text-sm">Needed To</Label>
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
                        <Label className="text-white font-semibold">Price Offered</Label>
                        <span className="text-sm text-purple-400">
                          ${priceRange[0]} - ${priceRange[1]}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={500}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>$0</span>
                        <span>$500</span>
                      </div>
                    </div>

                    {/* Weight Range */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-white font-semibold">Weight Needed (kg)</Label>
                        <span className="text-sm text-purple-400">
                          {weightRange[0]} - {weightRange[1]} kg
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={30}
                        step={1}
                        value={weightRange}
                        onValueChange={setWeightRange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0 kg</span>
                        <span>30 kg</span>
                      </div>
                    </div>

                    {/* Sort and Urgency */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Needed By Date</SelectItem>
                            <SelectItem value="price_low">Price: Low to High</SelectItem>
                            <SelectItem value="price_high">Price: High to Low</SelectItem>
                            <SelectItem value="urgency">Urgency</SelectItem>
                            <SelectItem value="trust_score">Trust Score</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300 mb-2 block">Urgency</Label>
                        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Urgency</SelectItem>
                            <SelectItem value="high">High Only</SelectItem>
                            <SelectItem value="medium">Medium Only</SelectItem>
                            <SelectItem value="low">Low Only</SelectItem>
                          </SelectContent>
                        </Select>
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
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
                    {sortedRequests.length > 0 ? (
                      <>
                        We found <span className="text-[#9EFF00] font-semibold">{sortedRequests.length} active request(s)</span> matching your search right now.
                        You'll also be notified when new matching requests are posted.
                      </>
                    ) : (
                      <>
                        No active requests found right now, but we'll <span className="text-[#9EFF00] font-semibold">notify you</span> when new matching requests are posted.
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
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold"
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

        {/* Alternate Airports for Pickup */}
        {searchFrom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlternateAirports
              iata={searchFrom}
              direction="departure"
              matchCount={sortedRequests.filter(r =>
                r.from_iata?.toUpperCase() === searchFrom.toUpperCase()
              ).length}
              minMatches={3}
              availabilityData={departureAvailability}
              onSelectAlternate={(iata) => setSearchFrom(iata)}
            />
          </motion.div>
        )}

        {/* Alternate Airports for Delivery */}
        {searchTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlternateAirports
              iata={searchTo}
              direction="arrival"
              matchCount={sortedRequests.filter(r =>
                r.to_iata?.toUpperCase() === searchTo.toUpperCase()
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
            {sortedRequests.length} {sortedRequests.length === 1 ? 'request' : 'requests'} found
          </p>
          {sortBy !== "date" && (
            <Badge className="bg-purple-500/20 text-purple-400">
              Sorted by {
                sortBy === "price_low" ? "Price (Low)" :
                sortBy === "price_high" ? "Price (High)" :
                sortBy === "urgency" ? "Urgency" :
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
        ) : sortedRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No requests found</h3>
              <p className="text-gray-400 mb-6">
                {(searchFrom || searchTo || keyword || dateFrom || dateTo || urgencyFilter !== "all" || priceRange[0] !== 0 || priceRange[1] !== 500 || weightRange[0] !== 0 || weightRange[1] !== 30)
                  ? "Try adjusting your filters or search terms"
                  : "Check back later or post your own request"
                }
              </p>
              <Link to={createPageUrl("PostRequest")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold">
                  Post a Request
                </Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedRequests.map((request, index) => {
                const reqCreator = allUsers.find(u => u.email === request.created_by);
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <Link to={createPageUrl("RequestDetails", `id=${request.id}`)}>
                      <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm h-full cursor-pointer group">
                        {/* Route */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1">
                              <div className="text-xs text-gray-400 mb-1">From</div>
                              <div className="font-bold text-white text-lg">{request.from_city}</div>
                              <div className="text-sm text-gray-400">{request.from_country}</div>
                            </div>
                            <ArrowRight className="w-6 h-6 text-purple-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                            <div className="flex-1 text-right">
                              <div className="text-xs text-gray-400 mb-1">To</div>
                              <div className="font-bold text-white text-lg">{request.to_city}</div>
                              <div className="text-sm text-gray-400">{request.to_country}</div>
                            </div>
                          </div>
                        </div>

                        {/* Item Description */}
                        <div className="mb-4">
                          <div className="text-sm text-gray-400 mb-1">Item</div>
                          <div className="text-white font-medium line-clamp-2">{request.item_description}</div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span className="text-sm">Needed by {request.needed_by_date ? format(new Date(request.needed_by_date), "MMM d, yyyy") : "No date"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Weight className="w-4 h-4 text-green-400" />
                            <span className="text-sm">~{request.estimated_weight_kg} kg</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-semibold">${request.offered_price} offered</span>
                          </div>
                          {request.delivery_type && request.delivery_type !== "airport-to-airport" && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">
                              {request.delivery_type === "door-to-airport" && "🏠→✈️ Door Pickup"}
                              {request.delivery_type === "airport-to-door" && "✈️→🏠 Door Delivery"}
                              {request.delivery_type === "door-to-door" && "🏠→🏠 Full Service"}
                            </Badge>
                          )}
                          {request.destination_flexibility && request.destination_flexibility !== "specific" && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">
                              📍 Flexible destination
                            </Badge>
                          )}
                          {reqCreator?.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-300">{reqCreator.average_rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500">({reqCreator.total_reviews})</span>
                            </div>
                          )}
                          {reqCreator?.trust_score !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-400">Trust:</div>
                              <div className="flex-1 max-w-[100px] bg-white/10 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    reqCreator.trust_score >= 75 ? 'bg-green-500' :
                                    reqCreator.trust_score >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${reqCreator.trust_score}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">{reqCreator.trust_score}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(createPageUrl("UserProfile", `email=${request.created_by}`));
                            }}
                            className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors group/profile cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center ring-2 ring-transparent group-hover/profile:ring-purple-500/50 transition-all">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-gray-300 group-hover/profile:text-white transition-colors">
                              {request.requester_name}
                            </span>
                          </div>
                          <Badge className={urgencyColors[request.urgency]}>
                            {request.urgency === 'high' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {request.urgency}
                          </Badge>
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