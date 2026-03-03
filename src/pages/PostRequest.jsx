import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ArrowLeft, CheckCircle2, AlertCircle, MapPin, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { notifyMatchFound } from "../components/NotificationCreator";
import { checkForNewMatches } from "../components/SavedItemsMonitor";
import AirportAutocomplete from "../components/airports/AirportAutocomplete";
import { useQueryClient } from "@tanstack/react-query";
import { getAirportByIATA } from "../components/airports/airportsData";
import { getMetroGroupByAirport, getAirportsInMetro, metroAirportGroups } from "../components/airports/MetroAirportGroups";
import { toast } from "sonner";

export default function PostRequest() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [destinationFlexibility, setDestinationFlexibility] = useState("specific");
  const [selectedMetro, setSelectedMetro] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [deliveryType, setDeliveryType] = useState("airport-to-airport");
  const [showPreferredTravelers, setShowPreferredTravelers] = useState(false);
  const [preferredTravelerInput, setPreferredTravelerInput] = useState("");
  const [preferredTravelers, setPreferredTravelers] = useState([]);

  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  useEffect(() => {
    base44.auth.me()
      .then((currentUser) => {
        setUser(currentUser);

        // Check profile completeness
        const missing = [];
        if (!currentUser.full_name?.trim()) missing.push("Full name");
        if (!currentUser.phone?.trim()) missing.push("Phone number");
        if (!currentUser.profile_picture_url) missing.push("Profile picture");
        if (!currentUser.location?.trim()) missing.push("Location (city & country)");

        if (missing.length > 0 && !editId) {
          setMissingFields(missing);
          setProfileIncomplete(true);
        }

        // Auto-fill name/phone from profile for new requests
        if (!editId) {
          setFormData(prev => ({
            ...prev,
            requester_name: prev.requester_name || currentUser.full_name || "",
            requester_phone: prev.requester_phone || currentUser.phone || ""
          }));
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsAuthLoading(false));
  }, []);

  const [formData, setFormData] = useState({
    from_city: "",
    from_country: "",
    from_iata: "",
    to_city: "",
    to_country: "",
    to_iata: "",
    needed_by_date: "",
    item_description: "",
    estimated_weight_kg: "",
    offered_price: "",
    urgency: "medium",
    requester_name: "",
    requester_phone: "",
    requester_email: "",
    destination_flexibility: "specific",
    alternate_destination_airports: [],
    destination_state: "",
    destination_country: "",
    delivery_type: "airport-to-airport",
    pickup_address: "",
    delivery_address: "",
  });

  useEffect(() => {
    if (editId) {
      const fetchRequest = async () => {
        try {
          const requests = await base44.entities.ShipmentRequest.filter({ id: editId });
          if (requests.length > 0) {
            const req = requests[0];
            setFormData({
              from_city: req.from_city || "",
              from_country: req.from_country || "",
              from_iata: req.from_iata || "",
              to_city: req.to_city || "",
              to_country: req.to_country || "",
              to_iata: req.to_iata || "",
              needed_by_date: req.needed_by_date || "",
              item_description: req.item_description || "",
              estimated_weight_kg: req.estimated_weight_kg ? req.estimated_weight_kg.toString() : "",
              offered_price: req.offered_price ? req.offered_price.toString() : "",
              urgency: req.urgency || "medium",
              requester_name: req.requester_name || "",
              requester_phone: req.requester_phone || "",
              requester_email: req.requester_email || "",
              destination_flexibility: req.destination_flexibility || "specific",
              alternate_destination_airports: req.alternate_destination_airports || [],
              destination_state: req.destination_state || "",
              destination_country: req.destination_country || "",
              delivery_type: req.delivery_type || "airport-to-airport",
              pickup_address: req.pickup_address || "",
              delivery_address: req.delivery_address || "",
              });
              setDestinationFlexibility(req.destination_flexibility || "specific");
              setDeliveryType(req.delivery_type || "airport-to-airport");
              setPreferredTravelers(req.preferred_traveler_emails || []);
              if (req.destination_state) setSelectedState(req.destination_state);
              if (req.destination_country) setSelectedCountry(req.destination_country);
              setAgreedToTerms(true); // Pre-check terms for editing
          } else {
            toast.error("Request not found");
            navigate(createPageUrl("MyRequests"));
          }
        } catch (error) {
          console.error("Error fetching request:", error);
          toast.error("Failed to load request details");
        } finally {
          setIsLoading(false);
        }
      };
      fetchRequest();
    }
  }, [editId, navigate]);

  const handleIATAChange = (field, iata) => {
    const airport = getAirportByIATA(iata);
    if (airport) {
      if (field === "from") {
        setFormData({
          ...formData,
          from_iata: airport.iata,
          from_city: airport.city,
          from_country: airport.country
        });
      } else {
        // Reset flexibility options when changing destination
        setDestinationFlexibility("specific");
        
        setFormData({
          ...formData,
          to_iata: airport.iata,
          to_city: airport.city,
          to_country: airport.country,
          destination_flexibility: "specific",
          alternate_destination_airports: [],
          destination_state: "",
          destination_country: ""
        });
        
        // Auto-detect metro group
        const metroGroup = getMetroGroupByAirport(iata);
        setSelectedMetro(metroGroup || null);
        
        // Set state and country for flexibility
        setSelectedState(airport.state || "");
        setSelectedCountry(airport.country || "");
      }
    }
  };

  const handleFlexibilityChange = (value) => {
    setDestinationFlexibility(value);
    
    // Update form data based on flexibility level
    const updates = { destination_flexibility: value };
    
    if (value === "metro" && selectedMetro) {
      updates.alternate_destination_airports = selectedMetro.airports;
    } else if (value === "state") {
      updates.destination_state = selectedState;
      updates.alternate_destination_airports = [];
    } else if (value === "national") {
      updates.destination_country = selectedCountry;
      updates.alternate_destination_airports = [];
      updates.destination_state = "";
    } else {
      // specific
      updates.alternate_destination_airports = [];
      updates.destination_state = "";
      updates.destination_country = "";
    }
    
    setFormData({ ...formData, ...updates });
  };

  // Helper function to sanitize weight input - removes "kg", "KG", spaces, etc.
  const sanitizeWeight = (value) => {
    if (!value) return "";
    // Remove "kg", "KG", "Kg", extra spaces, and keep only numbers and decimal point
    return value.toString().toLowerCase().replace(/kg/g, '').replace(/\s/g, '').trim();
  };

  // Helper function to sanitize price input - removes "$", "USD", spaces, etc.
  const sanitizePrice = (value) => {
    if (!value) return "";
    // Remove "$", "USD", "usd", extra spaces, and keep only numbers and decimal point
    return value.toString().toLowerCase().replace(/usd/g, '').replace(/\$/g, '').replace(/\s/g, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      toast.error("Please sign in to post a request");
      base44.auth.redirectToLogin();
      return;
    }

    if (user.role === 'guest') {
      toast.error("Guest accounts cannot post requests. Please complete your account setup.");
      return;
    }
    
    if (!agreedToTerms) {
      toast.error("Please confirm item compliance");
      return;
    }

    // Validate and sanitize inputs
    if (!formData.from_city || !formData.from_country) {
      toast.error("Please select a valid pickup airport");
      return;
    }

    if (!formData.to_city || !formData.to_country) {
      toast.error("Please select a valid delivery airport");
      return;
    }

    if (!formData.needed_by_date) {
      toast.error("Please select a delivery date");
      return;
    }

    if (!formData.item_description || formData.item_description.trim().length < 3) {
      toast.error("Please provide a detailed item description (at least 3 characters)");
      return;
    }

    // Sanitize weight and price
    const cleanWeight = sanitizeWeight(formData.estimated_weight_kg);
    const cleanPrice = formData.offered_price ? sanitizePrice(formData.offered_price) : null;

    // Validate weight (required)
    const weightNum = parseFloat(cleanWeight);
    if (!cleanWeight || isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid weight (numbers only, e.g., 5 or 10.5)");
      return;
    }

    // Validate price (optional, but if provided must be valid)
    let priceNum = null;
    if (cleanPrice) {
      priceNum = parseFloat(cleanPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error("Please enter a valid price (numbers only, e.g., 50 or 75.50)");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Build request data with only defined, non-empty values to avoid API rejection
      const requestData = {
        from_city: formData.from_city,
        from_country: formData.from_country,
        to_city: formData.to_city,
        to_country: formData.to_country,
        needed_by_date: formData.needed_by_date,
        item_description: formData.item_description.trim(),
        estimated_weight_kg: weightNum,
        urgency: formData.urgency || "medium",
        requester_email: (editId && formData.requester_email) ? formData.requester_email : user.email,
      };

      // Add optional IATA codes only if they have values
      if (formData.from_iata) requestData.from_iata = formData.from_iata;
      if (formData.to_iata) requestData.to_iata = formData.to_iata;

      if (!editId) {
        requestData.status = "active";
      }

      // Add optional fields only if they have values
      if (priceNum !== null) {
        requestData.offered_price = priceNum;
      }
      if (formData.requester_name && formData.requester_name.trim()) {
        requestData.requester_name = formData.requester_name.trim();
      }
      if (formData.requester_phone && formData.requester_phone.trim()) {
        requestData.requester_phone = formData.requester_phone.trim();
      }

      // Add destination flexibility data
      requestData.destination_flexibility = destinationFlexibility;
      
      if (destinationFlexibility === "metro" && formData.alternate_destination_airports?.length > 0) {
        requestData.alternate_destination_airports = formData.alternate_destination_airports;
      }
      
      if (destinationFlexibility === "state" && formData.destination_state) {
        requestData.destination_state = formData.destination_state;
      }
      
      if (destinationFlexibility === "national" && formData.destination_country) {
        requestData.destination_country = formData.destination_country;
      }

      // Add delivery type and addresses
      requestData.delivery_type = deliveryType;
      if (deliveryType !== "airport-to-airport") {
        if (deliveryType === "door-to-airport" || deliveryType === "door-to-door") {
          if (formData.pickup_address?.trim()) {
            requestData.pickup_address = formData.pickup_address.trim();
          }
        }
        if (deliveryType === "airport-to-door" || deliveryType === "door-to-door") {
          if (formData.delivery_address?.trim()) {
            requestData.delivery_address = formData.delivery_address.trim();
          }
        }
      }

      // Add preferred travelers
      if (preferredTravelers.length > 0) {
        requestData.preferred_traveler_emails = preferredTravelers;
      }

      
      let resultRequest;
      
      if (editId) {
        await base44.entities.ShipmentRequest.update(editId, requestData);
        resultRequest = { ...requestData, id: editId };
        toast.success("Request updated successfully!");
        // Invalidate query to force refetch
        queryClient.invalidateQueries({ queryKey: ['shipment-request'] });
        navigate(createPageUrl("RequestDetails", `id=${editId}`));
        return;
      } else {
        resultRequest = await base44.entities.ShipmentRequest.create(requestData);
        
        // Show success state only for new creation
        setCreatedRequest(resultRequest);
        setShowSuccess(true);

        // Call intelligent matching algorithm (non-blocking)
        try {
          const matchResult = await base44.functions.invoke('intelligentMatcher', {
            newItemType: 'request',
            newItemId: resultRequest.id
          });
          
        } catch (matchError) {
          console.error('Error in intelligent matching:', matchError);
          // Continue - matching is optional
        }
      }
    } catch (error) {
      console.error("❌ ERROR POSTING REQUEST:", error);
      
      let errorMessage = "Failed to post request. ";
      
      if (error.message?.includes("unauthorized") || error.message?.includes("permission")) {
        errorMessage += "You don't have permission to post requests. Please sign in.";
      } else if (error.message?.includes("required")) {
        errorMessage += "Please fill in all required fields.";
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again or contact support.";
      }
      
      toast.error(errorMessage, {
        description: "Your request was not posted. Please check the form and try again.",
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success confirmation screen
  if (showSuccess && createdRequest) {
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
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Your request from <span className="text-[#9EFF00] font-semibold">{createdRequest.from_city}</span> to <span className="text-[#9EFF00] font-semibold">{createdRequest.to_city}</span> is now live and visible to travelers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl("MyRequests")}>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                    <Package className="w-4 h-4 mr-2" />
                    View My Requests
                  </Button>
                </Link>
                <Link to={createPageUrl("BrowseTrips")}>
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
                    Browse Trips
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

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading...</h3>
          </Card>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 backdrop-blur-sm text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
            <p className="text-gray-400 mb-6">You need to be signed in to post a shipment request</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
              Sign In
            </Button>
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
              Before posting a shipment request, please complete your profile so travelers can trust and contact you.
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
              <Button onClick={() => navigate(createPageUrl("EditProfile"))} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                Complete Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{editId ? "Edit Shipment Request" : "Post Shipment Request"}</h1>
                <p className="text-gray-400">{editId ? "Update your request details" : "Find travelers to deliver your items"}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Route Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <AirportAutocomplete
                    label="From Airport"
                    value={formData.from_iata}
                    onChange={(iata) => handleIATAChange("from", iata)}
                    placeholder="Enter IATA or city"
                    required
                  />
                  <AirportAutocomplete
                    label="To Airport"
                    value={formData.to_iata}
                    onChange={(iata) => handleIATAChange("to", iata)}
                    placeholder="Enter IATA or city"
                    required
                  />
                </div>
                
                {formData.from_city && formData.to_city && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-semibold text-green-300">Route Confirmed</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{formData.from_iata}</span> {formData.from_city}, {formData.from_country} 
                      <span className="mx-2">→</span>
                      <span className="font-semibold text-white">{formData.to_iata}</span> {formData.to_city}, {formData.to_country}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Destination Flexibility */}
              {formData.to_iata && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Destination Flexibility</h2>
                    <Badge className="bg-blue-500/20 text-blue-300">Optional</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Increase your chances of finding a match by accepting deliveries to nearby airports or broader areas
                  </p>

                  <RadioGroup value={destinationFlexibility} onValueChange={handleFlexibilityChange} className="space-y-3">
                    {/* Specific Airport */}
                    <label
                      htmlFor="flex-specific"
                      className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        destinationFlexibility === "specific"
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="specific" id="flex-specific" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <span className="font-semibold text-white">Specific Airport Only</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Only {formData.to_iata} - {formData.to_city}
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Metro Area - Only show if destination is in a metro group */}
                    {selectedMetro && selectedMetro.airports && selectedMetro.airports.length > 1 && (
                      <label
                        htmlFor="flex-metro"
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          destinationFlexibility === "metro"
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="metro" id="flex-metro" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-blue-400" />
                              <span className="font-semibold text-white">Metro Area</span>
                              <Badge className="bg-blue-500/20 text-blue-300 text-xs">Recommended</Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {selectedMetro.name}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {selectedMetro.airports.map(airport => (
                                <Badge key={airport} variant="outline" className="border-white/20 text-gray-300 text-xs">
                                  {airport}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </label>
                    )}

                    {/* State-wide - Only show if state info is available */}
                    {selectedState && selectedState.trim() !== "" && (
                      <label
                        htmlFor="flex-state"
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          destinationFlexibility === "state"
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="state" id="flex-state" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-green-400" />
                              <span className="font-semibold text-white">State/Region Wide</span>
                            </div>
                            <p className="text-sm text-gray-400">
                              Any airport in {selectedState}
                            </p>
                          </div>
                        </div>
                      </label>
                    )}

                    {/* Nation-wide - Always available */}
                    {selectedCountry && (
                      <label
                        htmlFor="flex-national"
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          destinationFlexibility === "national"
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="national" id="flex-national" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4 text-orange-400" />
                              <span className="font-semibold text-white">Nationwide</span>
                            </div>
                            <p className="text-sm text-gray-400">
                              Any airport in {selectedCountry}
                            </p>
                          </div>
                        </div>
                      </label>
                    )}
                  </RadioGroup>

                  {destinationFlexibility !== "specific" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                    >
                      <p className="text-sm text-green-300">
                        ✓ Flexible destinations significantly increase your matching opportunities
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Delivery Details */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Delivery Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Needed By Date *</Label>
                    <Input
                      type="date"
                      required
                      value={formData.needed_by_date}
                      onChange={(e) => setFormData({...formData, needed_by_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Urgency</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => setFormData({...formData, urgency: value})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low — Flexible timing (matches flexible travelers)</SelectItem>
                        <SelectItem value="medium">Medium — Within needed-by date</SelectItem>
                        <SelectItem value="high">High — Urgent, exact date required</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.urgency === "low" ? "Matches more travelers, including those with flexible schedules." :
                       formData.urgency === "high" ? "Only travelers departing on or before your needed-by date." :
                       "Travelers departing within a few days of your needed-by date."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Type Selection */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Delivery Type</h2>
                <p className="text-sm text-gray-400 mb-4">How would you like to handle pickup and delivery?</p>
                
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType} className="space-y-3">
                  <label
                    htmlFor="delivery-airport"
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      deliveryType === "airport-to-airport"
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="airport-to-airport" id="delivery-airport" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">✈️</span>
                          <span className="font-semibold text-white">Airport to Airport</span>
                          <Badge className="bg-green-500/20 text-green-300 text-xs">Most Common</Badge>
                        </div>
                        <p className="text-sm text-gray-400">Meet at origin airport, deliver at destination airport</p>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="delivery-door-airport"
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      deliveryType === "door-to-airport"
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="door-to-airport" id="delivery-door-airport" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🏠→✈️</span>
                          <span className="font-semibold text-white">Door to Airport</span>
                        </div>
                        <p className="text-sm text-gray-400">Traveler picks up from your address, deliver at destination airport</p>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="delivery-airport-door"
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      deliveryType === "airport-to-door"
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="airport-to-door" id="delivery-airport-door" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">✈️→🏠</span>
                          <span className="font-semibold text-white">Airport to Door</span>
                        </div>
                        <p className="text-sm text-gray-400">Meet at origin airport, traveler delivers to recipient's address</p>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="delivery-door-door"
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      deliveryType === "door-to-door"
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="door-to-door" id="delivery-door-door" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🏠→🏠</span>
                          <span className="font-semibold text-white">Door to Door</span>
                          <Badge className="bg-blue-500/20 text-blue-300 text-xs">Premium</Badge>
                        </div>
                        <p className="text-sm text-gray-400">Full service: Pickup and delivery at addresses</p>
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                {/* Address Fields - Conditional */}
                <AnimatePresence mode="wait">
                  {(deliveryType === "door-to-airport" || deliveryType === "door-to-door") && (
                    <motion.div
                      key="pickup-address"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <Label className="text-gray-300">Pickup Address</Label>
                      <Input
                        value={formData.pickup_address}
                        onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                        placeholder="Enter full pickup address (street, city, postal code)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-2"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence mode="wait">
                  {(deliveryType === "airport-to-door" || deliveryType === "door-to-door") && (
                    <motion.div
                      key="delivery-address"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <Label className="text-gray-300">Delivery Address</Label>
                      <Input
                        value={formData.delivery_address}
                        onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                        placeholder="Enter full delivery address (street, city, postal code)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-2"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Item Details */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Item Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Item Description *</Label>
                    <Textarea
                      required
                      value={formData.item_description}
                      onChange={(e) => setFormData({...formData, item_description: e.target.value})}
                      placeholder="Describe the item(s) you need delivered in detail..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Be specific: size, type, fragility, etc.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Estimated Weight *</Label>
                      <div className="relative mt-2">
                        <Input
                          type="text"
                          required
                          value={formData.estimated_weight_kg}
                          onChange={(e) => setFormData({...formData, estimated_weight_kg: e.target.value})}
                          placeholder="e.g. 5 or 5 kg"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          kg
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Enter numbers only (e.g., 5 or 10.5)</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Offered Price (optional)</Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          $
                        </span>
                        <Input
                          type="text"
                          value={formData.offered_price}
                          onChange={(e) => setFormData({...formData, offered_price: e.target.value})}
                          placeholder="e.g. 50 or 50 USD"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-8 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                          USD
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Leave blank to negotiate later</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferred Travelers */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Preferred Travelers</h2>
                  <Badge variant="outline" className="border-white/20 text-gray-400">Optional</Badge>
                </div>
                
                <p className="text-sm text-gray-400 mb-3">
                  Add travelers you've worked with before to get priority matching with them
                </p>

                {preferredTravelers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {preferredTravelers.map((email, idx) => (
                      <Badge key={idx} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {email}
                        <button
                          type="button"
                          onClick={() => setPreferredTravelers(preferredTravelers.filter((_, i) => i !== idx))}
                          className="ml-2 hover:text-white"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={preferredTravelerInput}
                    onChange={(e) => setPreferredTravelerInput(e.target.value)}
                    placeholder="Enter traveler email address"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (preferredTravelerInput && !preferredTravelers.includes(preferredTravelerInput)) {
                          setPreferredTravelers([...preferredTravelers, preferredTravelerInput]);
                          setPreferredTravelerInput("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (preferredTravelerInput && !preferredTravelers.includes(preferredTravelerInput)) {
                        setPreferredTravelers([...preferredTravelers, preferredTravelerInput]);
                        setPreferredTravelerInput("");
                      }
                    }}
                    variant="outline"
                    className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Press Enter or click Add to include multiple travelers</p>
              </div>

              {/* Contact Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                  <Badge variant="outline" className="border-purple-400/30 text-purple-400">From Profile</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Your Name</Label>
                    <Input
                      value={formData.requester_name}
                      readOnly
                      className="bg-white/5 border-white/10 text-white/70 mt-2 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Phone Number</Label>
                    <Input
                      value={formData.requester_phone}
                      readOnly
                      className="bg-white/5 border-white/10 text-white/70 mt-2 cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Pulled from your profile. <button type="button" onClick={() => navigate(createPageUrl("EditProfile"))} className="text-purple-400 hover:underline">Edit in profile</button></p>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-1 border-purple-400 data-[state=checked]:bg-purple-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
                  I confirm this item is legal and complies with all shipping regulations. I will not request shipment of prohibited items including firearms, drugs, explosives, or other illegal goods.
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    editId ? "Updating..." : "Posting..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {editId ? "Update Request" : "Post Request"}
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