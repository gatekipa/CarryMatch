import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, ArrowLeft, Upload, Loader2, AlertCircle, Trash2, X, Plus, Phone, MapPin, Calendar, Languages, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import CityAutocomplete from "@/components/cities/CityAutocomplete";
import { formatPhone, stripPhone, PHONE_FORMATS } from "@/utils/formatPhone";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;
const BIO_MAX_LENGTH = 500;

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸", format: "### ### ####" },
  { code: "+237", country: "CM", flag: "🇨🇲", format: "## ## ## ##" },
  { code: "+234", country: "NG", flag: "🇳🇬", format: "### ### ####" },
  { code: "+233", country: "GH", flag: "🇬🇭", format: "## ### ####" },
  { code: "+254", country: "KE", flag: "🇰🇪", format: "### ######" },
  { code: "+27", country: "ZA", flag: "🇿🇦", format: "## ### ####" },
  { code: "+33", country: "FR", flag: "🇫🇷", format: "# ## ## ## ##" },
  { code: "+44", country: "GB", flag: "🇬🇧", format: "#### ######" },
  { code: "+49", country: "DE", flag: "🇩🇪", format: "### #######" },
  { code: "+39", country: "IT", flag: "🇮🇹", format: "### ### ####" },
  { code: "+34", country: "ES", flag: "🇪🇸", format: "### ## ## ##" },
  { code: "+86", country: "CN", flag: "🇨🇳", format: "### #### ####" },
  { code: "+91", country: "IN", flag: "🇮🇳", format: "##### #####" },
  { code: "+81", country: "JP", flag: "🇯🇵", format: "## #### ####" },
  { code: "+55", country: "BR", flag: "🇧🇷", format: "## #####-####" },
  { code: "+52", country: "MX", flag: "🇲🇽", format: "## #### ####" },
  { code: "+971", country: "AE", flag: "🇦🇪", format: "## ### ####" },
  { code: "+966", country: "SA", flag: "🇸🇦", format: "## ### ####" },
  { code: "+221", country: "SN", flag: "🇸🇳", format: "## ### ## ##" },
  { code: "+225", country: "CI", flag: "🇨🇮", format: "## ## ## ## ##" },
  { code: "+250", country: "RW", flag: "🇷🇼", format: "### ### ###" },
  { code: "+256", country: "UG", flag: "🇺🇬", format: "### ######" },
  { code: "+255", country: "TZ", flag: "🇹🇿", format: "### ### ###" },
  { code: "+251", country: "ET", flag: "🇪🇹", format: "## ### ####" },
  { code: "other", country: "Other", flag: "🌍", format: "" },
];

const COUNTRIES = [
  "United States", "Canada", "Cameroon", "Nigeria", "Ghana", "Kenya", "South Africa",
  "France", "United Kingdom", "Germany", "Italy", "Spain", "China", "India", "Japan",
  "Brazil", "Mexico", "UAE", "Saudi Arabia", "Senegal", "Ivory Coast", "Rwanda",
  "Uganda", "Tanzania", "Ethiopia", "Morocco", "Egypt", "DR Congo", "Gabon",
  "Republic of Congo", "Chad", "CAR", "Equatorial Guinea", "Belgium", "Switzerland",
  "Netherlands", "Australia", "South Korea", "Turkey", "Other"
];

const LANGUAGES_LIST = [
  { code: "en", name: "English" }, { code: "fr", name: "French" },
  { code: "es", name: "Spanish" }, { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" }, { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" }, { code: "ja", name: "Japanese" },
  { code: "hi", name: "Hindi" }, { code: "sw", name: "Swahili" },
  { code: "yo", name: "Yoruba" }, { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" }, { code: "am", name: "Amharic" },
  { code: "wo", name: "Wolof" }, { code: "pcm", name: "Pidgin English" },
  { code: "it", name: "Italian" }, { code: "nl", name: "Dutch" },
  { code: "ko", name: "Korean" }, { code: "tr", name: "Turkish" },
];

const PROFICIENCY_LEVELS = ["Basic", "Conversational", "Fluent", "Native"];

const TRAVEL_PREFERENCES = [
  "Flexible schedule", "Weekend travel only", "Carry documents/small items",
  "Carry medium packages", "Carry large items", "Food items OK",
  "Electronics OK", "Fragile items OK", "Same-day delivery",
  "Airport-to-airport only", "Door-to-door available", "International routes",
  "Domestic routes", "Frequent traveler"
];

function parsePhone(phone) {
  if (!phone) return { countryCode: "+1", number: "" };
  for (const cc of COUNTRY_CODES) {
    if (cc.code !== "other" && phone.startsWith(cc.code)) {
      return { countryCode: cc.code, number: phone.slice(cc.code.length).trim() };
    }
  }
  // If no known code matched, check if it starts with +
  if (phone.startsWith("+")) {
    const match = phone.match(/^(\+\d{1,4})\s*(.*)/);
    if (match) return { countryCode: "other", number: match[0] };
  }
  return { countryCode: "+1", number: phone.replace(/^\+/, "") };
}

/** Use shared formatPhone from @/utils/formatPhone instead of local copy */

function parseLanguages(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(l => typeof l === "string"
      ? { code: l.toLowerCase().slice(0, 3), name: l, proficiency: "Conversational" }
      : l
    );
  }
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({ first_name: "", last_name: "", bio: "", profile_picture_url: "" });
  const [phoneCode, setPhoneCode] = useState("+1");
  const [customCode, setCustomCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [customCountryName, setCustomCountryName] = useState("");
  const [city, setCity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [languages, setLanguages] = useState([]);
  const [newLangCode, setNewLangCode] = useState("");
  const [newLangProficiency, setNewLangProficiency] = useState("Conversational");
  const [travelPrefs, setTravelPrefs] = useState([]);
  const initialDataRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (userData) => {
      setUser(userData);
      let extUser = null;
      try { const users = await base44.entities.User.filter({ email: userData.email }); extUser = users[0]; } catch {}

      const parsed = parsePhone(userData.phone || extUser?.phone);
      setPhoneCode(parsed.countryCode);
      setPhoneNumber(parsed.number);

      const loc = userData.location || extUser?.location || "";
      if (loc.includes(",")) {
        const parts = loc.split(",").map(s => s.trim());
        setCity(parts[0] || "");
        setCountry(parts[1] || "");
      } else { setCity(loc); }

      setDateOfBirth(extUser?.date_of_birth || "");
      setLanguages(parseLanguages(userData.languages_spoken || extUser?.languages_spoken));
      setTravelPrefs(Array.isArray(userData.travel_preferences || extUser?.travel_preferences) ? (userData.travel_preferences || extUser?.travel_preferences) : []);

      const fd = { first_name: "", last_name: "", bio: userData.bio || extUser?.bio || "", profile_picture_url: userData.profile_picture_url || "" };
      const fullName = userData.full_name || "";
      // Don't auto-fill name if it looks like an email prefix (BG-011)
      const looksLikeEmail = fullName.includes("@") || (userData.email && fullName === userData.email.split("@")[0]);
      const cleanName = looksLikeEmail ? "" : fullName;
      const nameParts = cleanName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        fd.first_name = nameParts[0];
        fd.last_name = nameParts.slice(1).join(" ");
      } else {
        fd.first_name = cleanName;
      }
      setFormData(fd);

      setTimeout(() => {
        initialDataRef.current = JSON.stringify({ fd, phoneCode: parsed.countryCode, phoneNumber: parsed.number, country: loc.includes(",") ? loc.split(",").map(s => s.trim())[1] || "" : "", city: loc.includes(",") ? loc.split(",").map(s => s.trim())[0] || "" : loc, dateOfBirth: extUser?.date_of_birth || "", languages: parseLanguages(userData.languages_spoken || extUser?.languages_spoken), travelPrefs: Array.isArray(userData.travel_preferences || extUser?.travel_preferences) ? (userData.travel_preferences || extUser?.travel_preferences) : [] });
      }, 100);
    }).catch(() => navigate(createPageUrl("Home")));
  }, []);

  useEffect(() => {
    if (!initialDataRef.current) return;
    const current = JSON.stringify({ fd: formData, phoneCode, phoneNumber, country, city, dateOfBirth, languages, travelPrefs });
    setIsDirty(current !== initialDataRef.current);
  }, [formData, phoneCode, phoneNumber, country, city, dateOfBirth, languages, travelPrefs]);

  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error("Only JPG, PNG, and WEBP images are allowed"); e.target.value = ""; return; }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`); e.target.value = ""; return; }
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload image. Please try again.");
    }
    setIsUploading(false);
  };

  const dobError = (() => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (dob > new Date()) return "Date of birth cannot be in the future";
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) return "You must be at least 18 years old";
    return null;
  })();

  const addLanguage = () => {
    if (!newLangCode) return;
    if (languages.find(l => l.code === newLangCode)) { toast.error("Language already added"); return; }
    const langDef = LANGUAGES_LIST.find(l => l.code === newLangCode);
    setLanguages(prev => [...prev, { code: newLangCode, name: langDef?.name || newLangCode, proficiency: newLangProficiency }]);
    setNewLangCode(""); setNewLangProficiency("Conversational");
  };

  const removeLanguage = (code) => setLanguages(prev => prev.filter(l => l.code !== code));
  const updateLanguageProficiency = (code, prof) => setLanguages(prev => prev.map(l => l.code === code ? { ...l, proficiency: prof } : l));
  const togglePref = (pref) => setTravelPrefs(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mandatory field validation
    if (!formData.first_name.trim()) { toast.error("First name is required"); return; }
    if (/\d/.test(formData.first_name)) { toast.error("First name cannot contain numbers"); return; }
    if (!formData.last_name.trim()) { toast.error("Last name is required"); return; }
    if (/\d/.test(formData.last_name)) { toast.error("Last name cannot contain numbers"); return; }
    if (!formData.profile_picture_url) { toast.error("Profile picture is required"); return; }
    if (!phoneNumber.trim()) { toast.error("Phone number is required"); return; }
    if (phoneCode === "other" && !customCode.trim()) { toast.error("Enter your country code"); return; }
    if (!dateOfBirth) { toast.error("Date of birth is required"); return; }
    if (dobError) { toast.error(dobError); return; }
    if (!country) { toast.error("Country is required"); return; }
    if (!city.trim()) { toast.error("City is required"); return; }
    setIsSaving(true);
    try {
      const resolvedCode = phoneCode === "other" ? (customCode.startsWith("+") ? customCode : `+${customCode}`) : phoneCode;
      const rawDigits = phoneNumber.replace(/\D/g, "");
      const fullPhone = rawDigits ? `${resolvedCode}${rawDigits}` : "";
      const full_name = `${formData.first_name.trim()} ${formData.last_name.trim()}`;
      const location = [city, country].filter(Boolean).join(", ");
      // Serialize languages as simple name strings for auth.updateMe
      const languageNames = languages.map(l => typeof l === 'string' ? l : l.name);
      await base44.auth.updateMe({ full_name, bio: formData.bio, profile_picture_url: formData.profile_picture_url, phone: fullPhone, location, languages_spoken: languageNames, travel_preferences: travelPrefs });
      try {
        const users = await base44.entities.User.filter({ email: user.email });
        if (users[0]) {
          const updateData = { bio: formData.bio, phone: fullPhone, location, languages_spoken: JSON.stringify(languages), travel_preferences: travelPrefs };
          if (dateOfBirth) updateData.date_of_birth = dateOfBirth;
          await base44.entities.User.update(users[0].id, updateData);
        }
      } catch (entityError) {
        console.warn("Entity update failed (non-critical):", entityError);
      }
      toast.success("Profile updated successfully");
      setIsDirty(false);
      navigate(createPageUrl("UserProfile", `email=${user.email}`));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const e = user.email;
      const del = async (entity, filters) => { for (const f of filters) { const items = await entity.filter(f); await Promise.all(items.map(i => entity.delete(i.id))); } };
      await del(base44.entities.Trip, [{ created_by: e }]);
      await del(base44.entities.ShipmentRequest, [{ created_by: e }]);
      await del(base44.entities.Match, [{ traveler_email: e }, { requester_email: e }]);
      await del(base44.entities.Message, [{ sender_email: e }, { receiver_email: e }]);
      await del(base44.entities.Conversation, [{ participant_1_email: e }, { participant_2_email: e }]);
      await del(base44.entities.Review, [{ reviewer_email: e }, { reviewee_email: e }]);
      await del(base44.entities.Dispute, [{ complainant_email: e }, { respondent_email: e }]);
      await del(base44.entities.Notification, [{ user_email: e }]);
      await del(base44.entities.SavedItem, [{ user_email: e }]);
      await del(base44.entities.SavedSearch, [{ user_email: e }]);
      await del(base44.entities.Referral, [{ referrer_email: e }, { referee_email: e }]);
      await base44.entities.User.delete(user.id);
      toast.success("Account deleted. Logging out...");
      setTimeout(() => base44.auth.logout(createPageUrl("Home")), 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account: " + error.message);
    }
    setIsDeletingAccount(false);
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#9EFF00]" /></div>;

  const ic = "bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#9EFF00]/50 focus:ring-[#9EFF00]/20";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => { if (isDirty && !window.confirm("You have unsaved changes. Leave anyway?")) return; navigate(-1); }} className="mb-6 text-gray-300 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <Card className="p-6 sm:p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Profile</h1>
                <p className="text-gray-400 text-sm">Update your personal information</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Picture */}
              <section>
                <Label className="text-gray-300 flex items-center gap-2 mb-3"><Upload className="w-4 h-4" /> Profile Picture <span className="text-red-400">*</span></Label>
                <div className="flex items-center gap-4">
                  {formData.profile_picture_url ? (
                    <img src={formData.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-xl object-cover ring-2 ring-white/10" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-[#9EFF00]/20 to-[#7ACC00]/20 rounded-xl flex items-center justify-center border border-white/10">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <input type="file" id="profile-pic" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('profile-pic').click()} disabled={isUploading} className="border-white/10 text-gray-300 hover:text-white">
                      {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Upload Photo</>}
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG, or WEBP · Max {MAX_IMAGE_SIZE_MB}MB</p>
                  </div>
                </div>
              </section>

              {/* Name */}
              <section>
                <Label className="text-gray-300 mb-2 block">Name *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">First Name</Label>
                    <Input value={formData.first_name} onChange={(e) => { const v = e.target.value.replace(/[0-9]/g, ""); setFormData(prev => ({ ...prev, first_name: v })); }} placeholder="First name" className={ic} required />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Last Name</Label>
                    <Input value={formData.last_name} onChange={(e) => { const v = e.target.value.replace(/[0-9]/g, ""); setFormData(prev => ({ ...prev, last_name: v })); }} placeholder="Last name" className={ic} required />
                  </div>
                </div>
              </section>

              {/* Bio */}
              <section>
                <Label className="text-gray-300 mb-2 block">Bio</Label>
                <Textarea value={formData.bio} onChange={(e) => { if (e.target.value.length <= BIO_MAX_LENGTH) setFormData(prev => ({ ...prev, bio: e.target.value })); }} placeholder="Tell others about your travel habits or what you typically carry." rows={4} className={ic} />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">Help others trust you by sharing your travel experience</p>
                  <p className={`text-xs ${formData.bio.length > BIO_MAX_LENGTH * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}>{formData.bio.length}/{BIO_MAX_LENGTH}</p>
                </div>
              </section>

              {/* Phone Number */}
              <section>
                <Label className="text-gray-300 flex items-center gap-2 mb-2"><Phone className="w-4 h-4" /> Phone Number *</Label>
                <div className="flex gap-2">
                  <Select value={phoneCode} onValueChange={(v) => { setPhoneCode(v); setPhoneNumber(""); }}>
                    <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-white/10 max-h-60">
                      {COUNTRY_CODES.map(cc => <SelectItem key={cc.code} value={cc.code} className="text-white hover:bg-white/10">{cc.flag} {cc.code === "other" ? "Other" : cc.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {phoneCode === "other" && (
                    <Input 
                      value={customCode} 
                      onChange={(e) => setCustomCode(e.target.value.replace(/[^0-9+]/g, ""))} 
                      placeholder="+XX" 
                      className={`w-[80px] ${ic}`} 
                    />
                  )}
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setPhoneNumber(formatPhone(raw, phoneCode));
                    }}
                    placeholder={(() => { const fmt = PHONE_FORMATS[phoneCode]; return fmt ? fmt.replace(/#/g, "0") : "Enter number"; })()}
                    className={`flex-1 ${ic}`}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {phoneCode === "other" ? "Enter your country code and phone number" : `Format: ${phoneCode} ${PHONE_FORMATS[phoneCode]?.replace(/#/g, "0") || ""}`}
                </p>
              </section>

              {/* Location */}
              <section>
                <Label className="text-gray-300 flex items-center gap-2 mb-2"><MapPin className="w-4 h-4" /> Location *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Country</Label>
                    <Select value={COUNTRIES.includes(country) ? country : "Other"} onValueChange={(v) => { setCountry(v === "Other" ? "" : v); setCustomCountryName(""); }}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent className="bg-[#1A1A2E] border-white/10 max-h-60">
                        {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-white hover:bg-white/10">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(!COUNTRIES.includes(country) || country === "Other" || country === "") && (
                      <Input
                        value={customCountryName || (country && country !== "Other" ? country : "")}
                        onChange={(e) => { setCustomCountryName(e.target.value); setCountry(e.target.value); }}
                        placeholder="Type your country name"
                        className={`mt-2 ${ic}`}
                      />
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">City</Label>
                    <CityAutocomplete
                      value={city}
                      onChange={setCity}
                      placeholder="e.g. Douala, Washington D.C."
                      filterCountry={country || null}
                    />
                  </div>
                </div>
              </section>

              {/* Date of Birth */}
              <section>
                <Label className="text-gray-300 flex items-center gap-2 mb-2"><Calendar className="w-4 h-4" /> Date of Birth *</Label>
                <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split("T")[0]; })()} className={`${ic} ${dobError ? 'border-red-500/50' : ''}`} required />
                {dobError && <p className="text-xs text-red-400 mt-1">{dobError}</p>}
                <p className="text-xs text-gray-500 mt-1">Must be 18+ to use CarryMatch</p>
              </section>

              {/* Languages */}
              <section>
                <Label className="text-gray-300 flex items-center gap-2 mb-2"><Languages className="w-4 h-4" /> Languages</Label>
                <p className="text-xs text-gray-500 mb-3">Languages you can communicate in during trips or deliveries</p>
                {languages.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {languages.map(lang => (
                      <div key={lang.code} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-white text-sm flex-1">{lang.name}</span>
                        <Select value={lang.proficiency} onValueChange={(val) => updateLanguageProficiency(lang.code, val)}>
                          <SelectTrigger className="w-[150px] h-8 text-xs bg-white/5 border-white/10 text-gray-300"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1A1A2E] border-white/10">
                            {PROFICIENCY_LEVELS.map(p => <SelectItem key={p} value={p} className="text-white text-xs hover:bg-white/10">{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLanguage(lang.code)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Select value={newLangCode} onValueChange={setNewLangCode}>
                    <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white"><SelectValue placeholder="Add a language..." /></SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-white/10 max-h-60">
                      {LANGUAGES_LIST.filter(l => !languages.find(ll => ll.code === l.code)).map(l => <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10">{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={newLangProficiency} onValueChange={setNewLangProficiency}>
                    <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-gray-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1A1A2E] border-white/10">
                      {PROFICIENCY_LEVELS.map(p => <SelectItem key={p} value={p} className="text-white hover:bg-white/10">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addLanguage} disabled={!newLangCode} className="border-white/10 text-gray-300 hover:text-white"><Plus className="w-4 h-4" /></Button>
                </div>
              </section>

              {/* Travel Preferences */}
              <section>
                <Label className="text-gray-300 flex items-center gap-2 mb-2"><Heart className="w-4 h-4" /> Travel Preferences</Label>
                <p className="text-xs text-gray-500 mb-3">Select what describes your travel and delivery style</p>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_PREFERENCES.map(pref => (
                    <button key={pref} type="button" onClick={() => togglePref(pref)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${travelPrefs.includes(pref) ? 'bg-[#9EFF00]/20 border-[#9EFF00]/50 text-[#9EFF00]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'}`}>
                      {pref}
                    </button>
                  ))}
                </div>
                {travelPrefs.length > 0 && <p className="text-xs text-[#9EFF00]/70 mt-2">{travelPrefs.length} selected</p>}
              </section>

              {/* Submit */}
              <div className="flex gap-4 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={() => { if (isDirty && !window.confirm("Discard changes?")) return; navigate(-1); }} className="flex-1 border-white/10 text-gray-300 hover:text-white">Cancel</Button>
                <Button type="submit" disabled={isSaving || !isDirty || !!dobError} className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold disabled:opacity-50">
                  {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t border-red-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-400" /></div>
                <h3 className="text-xl font-bold text-white">Danger Zone</h3>
              </div>
              <Card className="p-4 bg-red-500/5 border-red-500/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-white text-sm">Delete My Account</h4>
                    <p className="text-xs text-gray-400">Permanently delete your account and all data. Cannot be undone.</p>
                  </div>
                  <Button onClick={() => setShowDeleteDialog(true)} size="sm" className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                </div>
              </Card>
            </div>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#0F1D35] border-red-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-400 flex items-center gap-3"><AlertCircle className="w-6 h-6" /> Delete Account?</DialogTitle>
            <DialogDescription className="text-gray-400 mt-4">
              <p>This action <strong>cannot be undone</strong>. We will permanently delete your account, trips, requests, messages, reviews, and all associated data.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button onClick={() => setShowDeleteDialog(false)} disabled={isDeletingAccount} variant="outline" className="flex-1 border-white/10 text-gray-300 hover:text-white">Keep Account</Button>
            <Button onClick={handleDeleteAccount} disabled={isDeletingAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isDeletingAccount ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4 mr-2" /> Delete Permanently</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
