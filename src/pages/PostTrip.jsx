import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Plane, ArrowLeft, CheckCircle2, Info, AlertCircle, Calendar as CalendarIcon, DollarSign, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AirportAutocomplete from "../components/airports/AirportAutocomplete";
import { getAirportByIATA } from "../components/airports/airportsData";
import { toast } from "sonner";

export default function PostTrip() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFlexibleDates, setHasFlexibleDates] = useState(false);
  const [flexibilityDays, setFlexibilityDays] = useState("3");
  const [weightPreset, setWeightPreset] = useState("custom");
  const [pricePreset, setPricePreset] = useState("custom");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTrip, setCreatedTrip] = useState(null);
  const [selectedDeliveryServices, setSelectedDeliveryServices] = useState(["airport-to-airport"]);

  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check profile completeness — require name, phone, photo, location
        const missing = [];
        if (!currentUser.full_name?.trim()) missing.push("Full name");
        if (!currentUser.phone?.trim()) missing.push("Phone number");
        if (!currentUser.profile_picture_url) missing.push("Profile picture");
        if (!currentUser.location?.trim()) missing.push("Location (city & country)");

        if (missing.length > 0 && !editId) {
          setMissingFields(missing);
          setProfileIncomplete(true);
        }

        // Auto-fill name/phone from profile for new trips
        if (!editId) {
          setFormData(prev => ({
            ...prev,
            traveler_name: prev.traveler_name || currentUser.full_name || "",
            traveler_phone: prev.traveler_phone || currentUser.phone || ""
          }));
        }
      } catch (error) {
        console.error("❌ Authentication failed:", error);
        setUser(null);
      } finally {
        if (!editId) setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [editId]);

  const [formData, setFormData] = useState({
    from_city: "",
    from_country: "",
    from_iata: "",
    to_city: "",
    to_country: "",
    to_iata: "",
    departure_date: "",
    arrival_date: "",
    available_weight_kg: "",
    price_per_kg: "",
    description: "",
    traveler_name: "",
    traveler_phone: "",
    traveler_email: "",
    flexible_dates: false,
    flexibility_days: 3,
  });

  useEffect(() => {
    if (editId) {
      const fetchTrip = async () => {
        try {
          const trips = await base44.entities.Trip.filter({ id: editId });
          if (trips.length > 0) {
            const trip = trips[0];
            setFormData({
              from_city: trip.from_city || "",
              from_country: trip.from_country || "",
              from_iata: trip.from_iata || "",
              to_city: trip.to_city || "",
              to_country: trip.to_country || "",
              to_iata: trip.to_iata || "",
              departure_date: trip.departure_date || "",
              arrival_date: trip.arrival_date || "",
              available_weight_kg: trip.available_weight_kg ? trip.available_weight_kg.toString() : "",
              price_per_kg: trip.price_per_kg ? trip.price_per_kg.toString() : "",
              description: trip.description || "",
              traveler_name: trip.traveler_name || "",
              traveler_phone: trip.traveler_phone || "",
              traveler_email: trip.traveler_email || "",
              flexible_dates: trip.flexible_dates || false,
              flexibility_days: trip.flexibility_days || 3,
            });
            setHasFlexibleDates(trip.flexible_dates || false);
            setFlexibilityDays((trip.flexibility_days || 3).toString());
            setSelectedDeliveryServices(trip.delivery_services || ["airport-to-airport"]);
            setAgreedToTerms(true); // Pre-check terms for editing
          } else {
            toast.error("Trip not found");
            navigate(createPageUrl("MyTrips"));
          }
        } catch (error) {
          console.error("Error fetching trip:", error);
          toast.error("Failed to load trip details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTrip();
    }
  }, [editId, navigate]);

  const handleIATAChange = (field, iata) => {
    const airport = getAirportByIATA(iata);
    if (airport) {
      if (field === "from") {
        setFormData((prevData) => ({
          ...prevData,
          from_iata: airport.iata,
          from_city: airport.city,
          from_country: airport.country
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          to_iata: airport.iata,
          to_city: airport.city,
          to_country: airport.country
        }));
      }
    } else {
      if (field === "from") {
        setFormData((prevData) => ({
          ...prevData,
          from_iata: iata,
          from_city: "",
          from_country: ""
        }));
      } else {
        setFormData((prevData) => ({
          ...prevData,
          to_iata: iata,
          to_city: "",
          to_country: ""
        }));
      }
    }
  };

  const weightPresets = [
    { value: "5", label: "Small (5 kg)", description: "Small items, documents" },
    { value: "10", label: "Medium (10 kg)", description: "Clothing, electronics" },
    { value: "15", label: "Large (15 kg)", description: "Full luggage space" },
    { value: "20", label: "Extra Large (20+ kg)", description: "Maximum capacity" },
  ];

  const handleWeightPreset = (value) => {
    setWeightPreset(value);
    if (value !== "custom") {
      setFormData({ ...formData, available_weight_kg: value });
    }
  };

  const pricePresets = [
    { value: "5", label: "$5/kg", description: "Budget-friendly" },
    { value: "10", label: "$10/kg", description: "Standard rate" },
    { value: "15", label: "$15/kg", description: "Premium service" },
  ];

  const handlePricePreset = (value) => {
    setPricePreset(value);
    if (value !== "custom") {
      setFormData({ ...formData, price_per_kg: value });
    }
  };

  // Helper function to sanitize weight input
  const sanitizeWeight = (value) => {
    if (!value) return "";
    return value.toString().toLowerCase().replace(/kg/g, '').replace(/\s/g, '').trim();
  };

  // Helper function to sanitize price input
  const sanitizePrice = (value) => {
    if (!value) return "";
    return value.toString().replace(/\$/g, '').replace(/\s/g, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to post a trip");
      base44.auth.redirectToLogin();
      return;
    }
    
    if (user.role === 'guest') {
      toast.error("Guest accounts cannot post trips. Please complete your account setup.");
      return;
    }
    
    if (!agreedToTerms) {
      toast.error("Please confirm you won't carry prohibited items");
      return;
    }

    if (!formData.from_city || !formData.from_country) {
      toast.error("Please select a valid departure airport");
      return;
    }

    if (!formData.to_city || !formData.to_country) {
      toast.error("Please select a valid arrival airport");
      return;
    }

    if (!formData.departure_date) {
      toast.error("Please select a departure date");
      return;
    }

    const cleanWeight = sanitizeWeight(formData.available_weight_kg);
    const weightNum = parseFloat(cleanWeight);
    
    if (!cleanWeight || isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid weight (numbers only, e.g., 5 or 10.5)");
      return;
    }

    if (weightNum > 50) {
      toast.error("Maximum weight is 50 kg");
      return;
    }

    let priceNum = null;
    if (formData.price_per_kg) {
      const cleanPrice = sanitizePrice(formData.price_per_kg);
      priceNum = parseFloat(cleanPrice);
      
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error("Please enter a valid price (numbers only, e.g., 5 or 10)");
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const tripData = {
        from_city: formData.from_city,
        from_country: formData.from_country,
        from_iata: formData.from_iata || "",
        to_city: formData.to_city,
        to_country: formData.to_country,
        to_iata: formData.to_iata || "",
        departure_date: formData.departure_date,
        available_weight_kg: weightNum,
        is_verified: user?.is_verified || false,
        traveler_email: (editId && formData.traveler_email) ? formData.traveler_email : user.email, // Preserve owner on edit
      };

      if (!editId) {
        tripData.status = "active";
      }

      if (formData.arrival_date) {
        tripData.arrival_date = formData.arrival_date;
      }
      
      if (priceNum !== null) {
        tripData.price_per_kg = priceNum;
      }

      if (formData.description) {
        tripData.description = formData.description;
      }

      // Store flexible dates info in separate fields
      tripData.flexible_dates = hasFlexibleDates;
      if (hasFlexibleDates) {
        tripData.flexibility_days = parseInt(flexibilityDays) || 3;
      }

      // Store delivery services
      tripData.delivery_services = selectedDeliveryServices;
      tripData.can_pickup_from_address = selectedDeliveryServices.includes("door-to-airport") || selectedDeliveryServices.includes("door-to-door");
      tripData.can_deliver_to_address = selectedDeliveryServices.includes("airport-to-door") || selectedDeliveryServices.includes("door-to-door");

      if (formData.traveler_name && formData.traveler_name.trim()) {
        tripData.traveler_name = formData.traveler_name.trim();
      }
      
      if (formData.traveler_phone && formData.traveler_phone.trim()) {
        tripData.traveler_phone = formData.traveler_phone.trim();
      }

      let resultTrip;

      if (editId) {
        await base44.entities.Trip.update(editId, tripData);
        resultTrip = { ...tripData, id: editId };
        toast.success("Trip updated successfully!");
        navigate(createPageUrl("TripDetails", `id=${editId}`));
        return;
      } else {
        resultTrip = await base44.entities.Trip.create(tripData);
        
        // Show success state only for new creation
        setCreatedTrip(resultTrip);
        setShowSuccess(true);

        // Call intelligent matching algorithm (non-blocking)
        try {
          await base44.functions.invoke('intelligentMatcher', {
            newItemType: 'trip',
            newItemId: resultTrip.id
          });
        } catch (matchError) {
          console.error('⚠️ Error in intelligent matching (non-critical):', matchError);
        }
      }
      
    } catch (error) {
      console.error("❌ ERROR POSTING TRIP:", error);
      
      let errorMessage = "Failed to post trip. ";
      
      if (error.message?.includes("Permission denied") || error.message?.includes("not authorized")) {
        errorMessage += "You don't have permission to post trips. Please sign in.";
      } else if (error.message?.includes("required")) {
        errorMessage += "Please fill in all required fields.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again or contact support.";
      }
      
      toast.error(errorMessage, {
        description: "Your trip was not posted. Please check the form and try again.",
        duration: 8000,
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedEarnings = formData.available_weight_kg && formData.price_per_kg
    ? (parseFloat(sanitizeWeight(formData.available_weight_kg)) * parseFloat(sanitizePrice(formData.price_per_kg))).toFixed(2)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#9EFF00] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
            <p className="text-gray-400 mb-6">You need to be signed in to post a trip</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A]">
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === 'guest') {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Account Setup Required</h3>
            <p className="text-gray-400 mb-6">
              Guest accounts cannot post trips. Please complete your account setup to start posting trips and earning money.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline" className="border-white/10 text-gray-300">
                Go Back
              </Button>
              <Button onClick={() => navigate(createPageUrl("UserProfile", `email=${user.email}`))} className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A]">
                Complete Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (profileIncomplete) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Complete Your Profile First</h3>
            <p className="text-gray-400 mb-4">
              Before posting a trip, please complete your profile so other users can trust and contact you.
            </p>
            <div className="mb-6 space-y-2">
              {missingFields.map((field, i) => (
                <div key={i} className="flex items-center gap-2 justify-center text-yellow-300 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{field} is required</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline" className="border-white/10 text-gray-300">
                Go Back
              </Button>
              <Button onClick={() => navigate(createPageUrl("EditProfile"))} className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A]">
                Complete Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Success confirmation screen
  if (showSuccess && createdTrip) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                ✅ Your trip has been successfully listed!
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Your trip from <span className="text-[#9EFF00] font-semibold">{createdTrip.from_city}</span> to <span className="text-[#9EFF00] font-semibold">{createdTrip.to_city}</span> is now live and visible to requesters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl("MyTrips")}>
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    <Plane className="w-4 h-4 mr-2" />
                    View My Trips
                  </Button>
                </Link>
                <Link to={createPageUrl("BrowseRequests")}>
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
                    Browse Requests
                  </Button>
                </Link>
                <Link to={createPageUrl("Home")}>
                  <Button variant="ghost" className="text-gray-400 hover:text-white">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-6 sm:p-8 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{editId ? "Edit Your Trip" : "Post Your Trip"}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{editId ? "Update your travel details" : "Share your travel details and earn money"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-8 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
              <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Complete all fields to maximize your matches. Estimated time: 3 minutes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Route Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Route Information</h2>
                  <Badge className="bg-green-100 text-green-700 dark:bg-[#9EFF00]/20 dark:text-[#9EFF00] text-xs">Step 1</Badge>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <AirportAutocomplete
                    label="Departure Airport"
                    value={formData.from_iata}
                    onChange={(iata) => handleIATAChange("from", iata)}
                    placeholder="e.g., JFK, LOS, LHR"
                    required
                  />
                  <AirportAutocomplete
                    label="Arrival Airport"
                    value={formData.to_iata}
                    onChange={(iata) => handleIATAChange("to", iata)}
                    placeholder="e.g., LAX, ACC, CDG"
                    required
                  />
                </div>
                
                <AnimatePresence>
                  {(formData.from_city && formData.to_city) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-sm font-semibold text-green-300">Route Confirmed</p>
                      </div>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-white">{formData.from_iata}</span> {formData.from_city}, {formData.from_country} 
                        <span className="mx-2">→</span>
                        <span className="font-semibold text-white">{formData.to_iata}</span> {formData.to_city}, {formData.to_country}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ... keep all other existing form sections ... */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Travel Dates</h2>
                  <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">Step 2</Badge>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Checkbox
                      id="flexible-dates"
                      checked={hasFlexibleDates}
                      onCheckedChange={setHasFlexibleDates}
                      className="mt-1 border-white/20 data-[state=checked]:bg-[#9EFF00] data-[state=checked]:border-[#9EFF00]"
                    />
                    <div className="flex-1">
                      <label htmlFor="flexible-dates" className="text-sm font-medium text-white cursor-pointer">
                        My dates are flexible
                      </label>
                      <p className="text-xs text-gray-400">I can adjust my travel dates to match more requests</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {hasFlexibleDates && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-7 mt-3 space-y-3"
                      >
                        <Label className="text-gray-300 text-xs">How many days can you adjust?</Label>
                        <RadioGroup value={flexibilityDays} onValueChange={setFlexibilityDays} className="space-y-2">
                          {[
                            { value: "2", label: "±2 days" },
                            { value: "3", label: "±3 days" },
                            { value: "5", label: "±5 days" },
                            { value: "7", label: "±7 days" }
                          ].map(opt => {
                            const d = formData.departure_date ? new Date(formData.departure_date + "T12:00:00") : null;
                            let example = "";
                            if (d && !isNaN(d)) {
                              const fmt = (dt) => dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                              const from = new Date(d); from.setDate(from.getDate() - parseInt(opt.value));
                              const to = new Date(d); to.setDate(to.getDate() + parseInt(opt.value));
                              example = ` (e.g., ${fmt(from)}–${fmt(to)} instead of ${fmt(d)})`;
                            }
                            return (
                              <div key={opt.value} className="flex items-center gap-2 p-2 rounded bg-white/5">
                                <RadioGroupItem value={opt.value} id={`flex-${opt.value}`} />
                                <label htmlFor={`flex-${opt.value}`} className="text-sm text-white cursor-pointer flex-1">
                                  {opt.label}{example || " — select a departure date to see range"}
                                </label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="text-xs text-blue-300">
                            ✓ Flexible dates increase your chances of getting matched with package requests
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Departure Date *
                    </Label>
                    <Input
                      type="date"
                      required
                      value={formData.departure_date}
                      onChange={(e) => setFormData({...formData, departure_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Arrival Date (optional)
                    </Label>
                    <Input
                      type="date"
                      value={formData.arrival_date}
                      onChange={(e) => setFormData({...formData, arrival_date: e.target.value})}
                      min={formData.departure_date || new Date().toISOString().split('T')[0]}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Available Luggage Space</h2>
                  <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">Step 3</Badge>
                </div>

                <Label className="text-gray-300 mb-3 block">Choose your available capacity</Label>
                <RadioGroup value={weightPreset} onValueChange={handleWeightPreset} className="space-y-3 mb-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {weightPresets.map((preset) => (
                      <div key={preset.value}>
                        <div
                          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            weightPreset === preset.value
                              ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                          onClick={() => handleWeightPreset(preset.value)}
                        >
                          <RadioGroupItem value={preset.value} className="mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{preset.label}</div>
                            <div className="text-xs text-gray-400">{preset.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      weightPreset === "custom"
                        ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    onClick={() => setWeightPreset("custom")}
                  >
                    <RadioGroupItem value="custom" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-2">Custom Weight</div>
                      <div className="relative">
                        <Input
                          type="text"
                          required
                          value={formData.available_weight_kg}
                          onChange={(e) => {
                            setFormData({...formData, available_weight_kg: e.target.value});
                            setWeightPreset("custom");
                          }}
                          placeholder="e.g. 10 or 10 kg (max 50)"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          kg
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enter numbers only (e.g., 5 or 10.5)</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Set Your Price</h2>
                  <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">Step 4</Badge>
                </div>

                <Label className="text-gray-300 mb-3 block">Price per kilogram (optional)</Label>
                <RadioGroup value={pricePreset} onValueChange={handlePricePreset} className="space-y-3 mb-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    {pricePresets.map((preset) => (
                      <div key={preset.value}>
                        <div
                          className={`flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            pricePreset === preset.value
                              ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                          onClick={() => handlePricePreset(preset.value)}
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={preset.value} />
                            <span className="font-bold text-white text-lg">{preset.label}</span>
                          </div>
                          <span className="text-xs text-gray-400 ml-6">{preset.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      pricePreset === "custom"
                        ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    onClick={() => setPricePreset("custom")}
                  >
                    <RadioGroupItem value="custom" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-2">Custom Price</div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          $
                        </span>
                        <Input
                          type="text"
                          value={formData.price_per_kg}
                          onChange={(e) => {
                            setFormData({...formData, price_per_kg: e.target.value});
                            setPricePreset("custom");
                          }}
                          placeholder="e.g. 10 or $10"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enter numbers only (e.g., 5 or 10)</p>
                    </div>
                  </div>
                </RadioGroup>

                {estimatedEarnings > 0 && !isNaN(estimatedEarnings) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-300">Potential earnings:</span>
                      </div>
                      <span className="text-2xl font-bold text-green-400">${estimatedEarnings}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Based on {sanitizeWeight(formData.available_weight_kg)}kg @ ${sanitizePrice(formData.price_per_kg)}/kg
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Delivery Services */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Delivery Services Offered</h2>
                  <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">Step 5</Badge>
                </div>
                
                <p className="text-sm text-gray-400 mb-4">Select all delivery options you're willing to provide</p>
                
                <div className="space-y-3">
                  {[
                    { value: "airport-to-airport", label: "Airport to Airport", desc: "Standard luggage exchange at airports", icon: "✈️" },
                    { value: "door-to-airport", label: "Door to Airport", desc: "Pick up from sender's address, deliver at destination airport", icon: "🏠→✈️" },
                    { value: "airport-to-door", label: "Airport to Door", desc: "Pick up at origin airport, deliver to recipient's address", icon: "✈️→🏠" },
                    { value: "door-to-door", label: "Door to Door", desc: "Full service: Pick up and deliver at addresses", icon: "🏠→🏠" }
                  ].map((service) => (
                    <div
                      key={service.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDeliveryServices.includes(service.value)
                          ? 'border-[#9EFF00] bg-[#9EFF00]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                      onClick={() => {
                        if (selectedDeliveryServices.includes(service.value)) {
                          if (selectedDeliveryServices.length > 1) {
                            setSelectedDeliveryServices(selectedDeliveryServices.filter(s => s !== service.value));
                          }
                        } else {
                          setSelectedDeliveryServices([...selectedDeliveryServices, service.value]);
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedDeliveryServices.includes(service.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDeliveryServices([...selectedDeliveryServices, service.value]);
                          } else {
                            if (selectedDeliveryServices.length > 1) {
                              setSelectedDeliveryServices(selectedDeliveryServices.filter(s => s !== service.value));
                            }
                          }
                        }}
                        className="mt-0.5 border-white/20 data-[state=checked]:bg-[#9EFF00] data-[state=checked]:border-[#9EFF00]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{service.icon}</span>
                          <span className="font-semibold text-white">{service.label}</span>
                        </div>
                        <p className="text-sm text-gray-400">{service.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-300">
                    💡 Offering more delivery options increases your matching opportunities and potential earnings
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Additional Information</h2>
                  <Badge variant="outline" className="border-white/20 text-gray-400">Optional</Badge>
                </div>
                <Label className="text-gray-300">Special notes or preferences</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g., 'Prefer fragile items', 'Can deliver to city center', 'Speak English and French'..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-2"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                  <Badge variant="outline" className="border-[#9EFF00]/30 text-[#9EFF00]">From Profile</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Your Full Name</Label>
                    <Input
                      value={formData.traveler_name}
                      readOnly
                      className="bg-white/5 border-white/10 text-white/70 mt-2 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone Number</Label>
                    <Input
                      value={formData.traveler_phone}
                      readOnly
                      className="bg-white/5 border-white/10 text-white/70 mt-2 cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Pulled from your profile. <button type="button" onClick={() => navigate(createPageUrl("EditProfile"))} className="text-[#9EFF00] hover:underline">Edit in profile</button></p>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-300 mb-2">Prohibited Items</h3>
                    <p className="text-sm text-gray-300 mb-2">You must NOT carry:</p>
                    <ul className="text-sm text-gray-400 space-y-1 ml-4 list-disc">
                      <li>Firearms, ammunition, explosives</li>
                      <li>Narcotics or illegal drugs</li>
                      <li>Counterfeit goods</li>
                      <li>Hazardous chemicals</li>
                      <li>Endangered wildlife products</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-1 border-white/20 data-[state=checked]:bg-[#9EFF00] data-[state=checked]:border-[#9EFF00]"
                />
                <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed cursor-pointer flex-1">
                  I confirm that I have read and understand the prohibited items list. I will not carry any illegal or dangerous items, and I will comply with all airline regulations and customs laws. I understand that violations may result in legal consequences and permanent ban from the platform.
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 border-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                      {editId ? "Updating..." : "Publishing..."}
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {editId ? "Update Trip" : "Publish Trip"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}