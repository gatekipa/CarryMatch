import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Truck, Building, Mail, Phone, Upload, FileText, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CityAutocomplete from "@/components/cities/CityAutocomplete";
import CountryPhoneSelect from "@/components/CountryPhoneSelect";
import AddressAutocomplete from "@/components/address/AddressAutocomplete";
import { countries } from "@/components/data/countries";
import { formatPhone, stripPhone } from "@/utils/formatPhone";

export default function PartnerSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "",
    contactName: "",
    email: "",
    country: "",
    countryCode: "",
    phoneCode: "",
    phone: "",
    city: "",
    address: "",
    description: "",
    businessRegistrationDoc: "",
    licenseDocs: [],
    taxIdDoc: "",
    insuranceDoc: ""
  });

  // Check auth state early so we can show login prompt before submission
  useEffect(() => {
    base44.auth.me()
      .then((u) => { setUser(u); setAuthChecked(true); })
      .catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      e.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit");
      e.target.value = '';
      return;
    }

    setUploadingDoc(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (field === "licenseDocs") {
        setFormData(prev => ({...prev, licenseDocs: [...prev.licenseDocs, file_url]}));
        toast.success("License uploaded successfully");
      } else {
        setFormData(prev => ({...prev, [field]: file_url}));
        toast.success("Document uploaded successfully");
      }
      e.target.value = '';
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
      e.target.value = '';
    } finally {
      setUploadingDoc(null);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.companyName || !formData.businessType) {
        toast.error("Please fill in all required fields");
        return false;
      }
    } else if (step === 2) {
      if (!formData.contactName || !formData.email || !formData.country || !formData.phoneCode || !formData.phone) {
        toast.error("Please fill in all contact fields");
        return false;
      }
      if (/\d/.test(formData.contactName)) {
        toast.error("Contact name cannot contain numbers");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (!/^\d{6,15}$/.test(phoneDigits)) {
        toast.error("Phone number must contain 6-15 digits");
        return false;
      }
    } else if (step === 3) {
      if (!formData.country || !formData.city) {
        toast.error("Please fill in country and city");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    if (step < 4) {
      setStep(step + 1);
    } else {
      if (uploadingDoc) {
        toast.error("Please wait for file uploads to complete");
        return;
      }

      // Check auth before submitting — avoids the "Authentication required" console error
      if (!user) {
        toast.error("Please sign in to submit your application");
        return;
      }

      setIsSubmitting(true);
      try {
        // Create Vendor first so we have the vendor_id
        const vendorData = {
          legal_name: formData.companyName,
          display_name: formData.companyName,
          vendor_type: formData.businessType.toUpperCase(),
          description: formData.description || "",
          primary_contact_name: formData.contactName,
          primary_contact_email: formData.email.toLowerCase(),
          primary_contact_phone: `${formData.phoneCode}${stripPhone(formData.phone)}`,
          hq_country: formData.country,
          hq_city: formData.city,
          address: formData.address || "",
          status: "PENDING_REVIEW",
        };
        if (formData.businessRegistrationDoc) {
          vendorData.license_documents = [formData.businessRegistrationDoc, ...formData.licenseDocs];
        } else if (formData.licenseDocs.length > 0) {
          vendorData.license_documents = formData.licenseDocs;
        }
        const vendor = await base44.entities.Vendor.create(vendorData);

        let createdApplication;
        try {
          // Create VendorApplication for admin review (includes vendor_id at creation time
          // since non-admin users cannot update VendorApplication after creation)
          createdApplication = await base44.entities.VendorApplication.create({
            legal_name: formData.companyName,
            display_name: formData.companyName,
            vendor_type: formData.businessType.toUpperCase(),
            description: formData.description || "",
            contact_name: formData.contactName,
            contact_email: formData.email.toLowerCase(),
            contact_phone: `${formData.phoneCode}${stripPhone(formData.phone)}`,
            hq_country: formData.country,
            hq_city: formData.city,
            address: formData.address || "",
            license_docs: formData.licenseDocs.length > 0 ? formData.licenseDocs : undefined,
            business_registration_doc: formData.businessRegistrationDoc || undefined,
            tax_id_doc: formData.taxIdDoc || undefined,
            insurance_doc: formData.insuranceDoc || undefined,
            status: "PENDING",
            vendor_id: vendor.id
          });

          // Create the first staff member as OWNER — user is guaranteed to exist (checked above)
          await base44.entities.VendorStaff.create({
            vendor_id: vendor.id,
            email: user.email,
            full_name: formData.contactName,
            role: "OWNER",
            status: "ACTIVE",
            invitation_sent_at: new Date().toISOString()
          });
        } catch (innerError) {
          // Rollback: delete already-created resources
          try { await base44.entities.Vendor.delete(vendor.id); } catch (_) {}
          if (createdApplication) {
            try { await base44.entities.VendorApplication.delete(createdApplication.id); } catch (_) {}
          }
          throw innerError;
        }

        toast.success("Application submitted! Redirecting to your dashboard...");
        setTimeout(() => navigate(createPageUrl("VendorDashboard")), 2000);
      } catch (error) {
        console.error("Application error:", error);
        const errorMsg = error?.message || "Failed to submit application. Please check all required fields.";
        toast.error(errorMsg);
        setIsSubmitting(false);
      }
    }
  };

  // Find the selected country's ISO code for Nominatim
  const selectedCountryObj = countries.find(c => c.name === formData.country);
  const countryISOCode = selectedCountryObj?.code || formData.countryCode || null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : navigate(createPageUrl("LogisticsPartners"))} className="mb-6 text-gray-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step > 1 ? "Previous" : "Back"}
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Become a CarryMatch Partner</h1>
            <p className="text-gray-400 mb-4">Step {step} of 4: {step === 1 ? 'Company Info' : step === 2 ? 'Contact Details' : step === 3 ? 'Location' : 'Documents'}</p>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-2 flex-1 rounded-full transition-all ${s <= step ? 'bg-[#9EFF00]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          {/* Auth warning banner — shown if user isn't logged in */}
          {authChecked && !user && (
            <Card className="p-4 mb-6 bg-amber-500/10 border-amber-500/30">
              <div className="flex items-center gap-3">
                <LogIn className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-200 font-medium">Sign in required</p>
                  <p className="text-xs text-amber-300/70">You can fill out the form, but you'll need to sign in before submitting.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                >
                  Sign In
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-8 bg-white/5 border-white/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="company-name" className="text-gray-300 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Company Name *
                    </Label>
                    <Input
                      id="company-name"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({...prev, companyName: e.target.value}))}
                      placeholder="ABC Logistics"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Business Type *
                    </Label>
                    <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bus_agency">Bus Agency</SelectItem>
                        <SelectItem value="parcel_forwarder">Parcel Forwarder</SelectItem>
                        <SelectItem value="container_shipper">Container Shipper</SelectItem>
                        <SelectItem value="courier_company">Courier</SelectItem>
                        <SelectItem value="freight_forwarder">Freight Forwarder</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-gray-300 mb-2">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                      placeholder="Describe your business..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label htmlFor="contact-name" className="text-gray-300 mb-2">Contact Name *</Label>
                    <Input
                      id="contact-name"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({...prev, contactName: e.target.value}))}
                      placeholder="John Doe"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="john@company.com"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  {/* Searchable country selector with phone code */}
                  <CountryPhoneSelect
                    id="country"
                    label="Country *"
                    value={formData.country}
                    onChange={({ name, code, phoneCode }) => {
                      setFormData(prev => ({
                        ...prev,
                        country: name,
                        countryCode: code,
                        phoneCode: phoneCode || ""
                      }));
                    }}
                    required
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="phone-code" className="text-gray-300 mb-2 text-sm">Code *</Label>
                      <Input
                        id="phone-code"
                        disabled
                        value={formData.phoneCode}
                        placeholder="+1"
                        className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 disabled:opacity-70"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="phone" className="text-gray-300 mb-2 flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        Number *
                      </Label>
                      <Input
                        id="phone"
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          setFormData(prev => ({...prev, phone: formatPhone(raw, prev.phoneCode)}));
                        }}
                        placeholder="123-456-7890"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <Label className="text-gray-300 mb-2">Selected Country: <span className="text-[#9EFF00]">{formData.country || 'N/A'}</span></Label>
                  </div>
                  <div>
                    <CityAutocomplete
                      id="city"
                      label="City *"
                      value={formData.city}
                      onChange={(city) => setFormData(prev => ({...prev, city}))}
                      placeholder="e.g. Douala, New York"
                      required
                      filterCountry={formData.country || null}
                    />
                  </div>
                  <div>
                    <AddressAutocomplete
                      id="address"
                      label="Address"
                      value={formData.address}
                      onChange={(address) => setFormData(prev => ({...prev, address}))}
                      onSelect={(item) => {
                        // If user picks a suggestion and city is empty, auto-fill city
                        if (item.city && !formData.city) {
                          setFormData(prev => ({...prev, city: item.city}));
                        }
                      }}
                      placeholder="Street address, landmark, or describe location"
                      countryCode={countryISOCode}
                      includePOI
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Type to search or enter a description — landmarks, businesses, or nearby references are fine
                    </p>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <p className="text-sm text-gray-400 mb-4">Upload documents for verification (optional)</p>

                  <div>
                    <Label className="text-gray-300 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Business Registration
                    </Label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-300">{uploadingDoc === "businessRegistrationDoc" ? "Uploading..." : formData.businessRegistrationDoc ? "✓ Uploaded" : "Click to upload"}</span>
                      <input type="file" onChange={(e) => handleFileUpload(e, "businessRegistrationDoc")} className="hidden" accept=".pdf,.jpg,.png" />
                    </label>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2">Business Licenses</Label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-300">{uploadingDoc === "licenseDocs" ? "Uploading..." : formData.licenseDocs.length > 0 ? `✓ ${formData.licenseDocs.length} file(s)` : "Click to upload"}</span>
                      <input type="file" onChange={(e) => handleFileUpload(e, "licenseDocs")} className="hidden" accept=".pdf,.jpg,.png" />
                    </label>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2">Tax ID Document</Label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-300">{uploadingDoc === "taxIdDoc" ? "Uploading..." : formData.taxIdDoc ? "✓ Uploaded" : "Click to upload"}</span>
                      <input type="file" onChange={(e) => handleFileUpload(e, "taxIdDoc")} className="hidden" accept=".pdf,.jpg,.png" />
                    </label>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2">Insurance Certificate</Label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-300">{uploadingDoc === "insuranceDoc" ? "Uploading..." : formData.insuranceDoc ? "✓ Uploaded" : "Click to upload"}</span>
                      <input type="file" onChange={(e) => handleFileUpload(e, "insuranceDoc")} className="hidden" accept=".pdf,.jpg,.png" />
                    </label>
                  </div>
                </>
              )}

              <Button type="submit" disabled={isSubmitting || uploadingDoc} className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold">
                {isSubmitting ? "Submitting..." : step === 4 ? "Submit Application" : "Next"}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
