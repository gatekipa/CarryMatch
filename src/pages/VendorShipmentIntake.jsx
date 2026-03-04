import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Package,
  DollarSign,
  Shield,
  CheckCircle,
  X,
  Search,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShipmentLabel from "@/components/vendor/ShipmentLabel";
import { logAudit } from "@/components/vendor/AuditLogger";
import { toast } from "sonner";
import { formatPhone } from "@/utils/formatPhone";

export default function VendorShipmentIntake() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [branch, setBranch] = useState(null);
  const [senderSuggestions, setSenderSuggestions] = useState([]);
  const [recipientSuggestions, setRecipientSuggestions] = useState([]);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    tracking_code: "",
    sender_phone: "",
    sender_name: "",
    sender_email: "",
    sender_country: "",
    sender_city: "",
    recipient_phone: "",
    recipient_name: "",
    recipient_email: "",
    recipient_country: "",
    recipient_city: "",
    description: "",
    photos: [],
    weight_kg: "",
    base_price: "",
    currency: "USD",
    line_items: [],
    insurance_enabled: false,
    declared_value: "",
    insurance_premium: 0,
    total_amount: 0,
    payment_status: "PENDING"
  });

  const [searchPhone, setSearchPhone] = useState("");
  const [newLineItem, setNewLineItem] = useState({ label: "", amount: "" });
  const [createdShipment, setCreatedShipment] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return Promise.all([
              base44.entities.Vendor.filter({ id: staff[0].vendor_id }),
              base44.entities.Branch.filter({ vendor_id: staff[0].vendor_id })
            ]);
          }
          return [null, null];
        })
        .then(([vendors, branches]) => {
          if (vendors) {
            const v = vendors?.[0];
            setVendor(v);
            setFormData(prev => ({ ...prev, currency: v?.base_currency || "USD" }));
          }
          if (branches && branches[0]) {
            setBranch(branches[0]);
          }
        });
    }
  }, [user]);

  // Load vendor contacts for phone lookup
  const { data: contacts = [] } = useQuery({
    queryKey: ['vendor-contacts', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      return await base44.entities.VendorContact.filter({ vendor_id: vendor.id }, "-last_used");
    },
    enabled: !!vendor
  });

  // Phone lookup helper — filter contacts by partial phone match
  const lookupByPhone = (phone, excludeType) => {
    if (!phone || phone.length < 3) return [];
    const query = phone.replace(/\D/g, '');
    return contacts.filter(c => {
      const cPhone = (c.phone || '').replace(/\D/g, '');
      return cPhone.includes(query) || (c.name || '').toLowerCase().includes(phone.toLowerCase());
    }).slice(0, 5);
  };

  // Save or update contact after shipment creation
  const saveContact = async (phone, name, email, country, city, type) => {
    if (!vendor || !phone || !name) return;
    try {
      const existing = await base44.entities.VendorContact.filter({ vendor_id: vendor.id, phone });
      if (existing.length > 0) {
        await base44.entities.VendorContact.update(existing[0].id, {
          name, email: email || existing[0].email, country, city,
          last_used: new Date().toISOString(),
          times_used: (existing[0].times_used || 0) + 1
        });
      } else {
        await base44.entities.VendorContact.create({
          vendor_id: vendor.id, phone, name, email, country, city,
          contact_type: type, last_used: new Date().toISOString(), times_used: 1
        });
      }
    } catch (e) { console.warn("Contact save failed:", e); }
  };

  useEffect(() => {
    if (vendor && !formData.tracking_code) {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const ts = Date.now().toString().slice(-6);
      const code = `${vendor.display_name.substring(0, 3).toUpperCase()}-${ts}${rand}`;
      setFormData(prev => ({ ...prev, tracking_code: code }));
    }
  }, [vendor, formData.tracking_code]);

  // Memoized calculations for performance
  const totalAmount = useMemo(() => {
    const basePrice = parseFloat(formData.base_price) || 0;
    const lineItemsTotal = formData.line_items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const insuranceTotal = formData.insurance_premium || 0;
    return basePrice + lineItemsTotal + insuranceTotal;
  }, [formData.base_price, formData.line_items, formData.insurance_premium]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, total_amount: totalAmount }));
  }, [totalAmount]);

  useEffect(() => {
    if (formData.insurance_enabled && formData.declared_value) {
      const rate = vendor?.insurance_default_rate_pct || 2;
      const minPremium = vendor?.insurance_min_premium || 5;
      const calculatedPremium = Math.max(
        (parseFloat(formData.declared_value) * rate) / 100,
        minPremium
      );
      setFormData(prev => ({ ...prev, insurance_premium: calculatedPremium }));
    } else {
      setFormData(prev => ({ ...prev, insurance_premium: 0 }));
    }
  }, [formData.insurance_enabled, formData.declared_value, vendor]);

  const createShipmentMutation = useMutation({
    mutationFn: async (data) => {
      const shipment = await base44.entities.Shipment.create(data);
      
      // Log audit
      await logAudit({
        entity_type: "SHIPMENT",
        entity_id: shipment.id,
        action: "CREATE",
        vendor_id: vendor.id,
        branch_id: branch.id,
        new_values: data,
        metadata: { created_via: "quick_intake" }
      });
      
      return shipment;
    },
    onSuccess: (shipment) => {
      setCreatedShipment(shipment);
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts'] });
      // Increment shipment counter on vendor
      if (vendor?.id) {
        base44.entities.Vendor.update(vendor.id, { 
          shipments_this_period: (vendor.shipments_this_period || 0) + 1 
        }).catch(() => {});
      }
      // Save sender & recipient contacts for future phone lookup
      saveContact(formData.sender_phone, formData.sender_name, formData.sender_email, formData.sender_country, formData.sender_city, "SENDER");
      saveContact(formData.recipient_phone, formData.recipient_name, formData.recipient_email, formData.recipient_country, formData.recipient_city, "RECIPIENT");
      // Auto-send notification to sender/recipient with tracking link
      try {
        base44.functions.invoke('sendShipmentNotification', {
          shipment_id: shipment.id,
          template_type: 'shipment_received',
          manual_trigger: false
        }).catch(() => {});
      } catch {}
    }
  });

  const handleSubmit = async () => {
    // Plan limit check
    if (vendor) {
      try {
        const planName = vendor.current_plan || "STARTER";
        let plans = await base44.entities.SubscriptionPlan.filter({ name: planName });
        const plan = plans[0] || { STARTER: { included_shipments: 50 }, GROWTH: { included_shipments: 500 }, PRO: { included_shipments: 2000 }, ENTERPRISE: { included_shipments: 999999 } }[planName];
        if (plan && (vendor.shipments_this_period || 0) >= (plan.included_shipments || 50)) {
          toast.error(`Shipment limit reached (${plan.included_shipments}/mo on ${planName} plan). Upgrade your plan or wait for the next billing period.`);
          return;
        }
      } catch {}
    }

    // Full validation before submit
    if (!formData.tracking_code) {
      toast.error("Tracking code is required");
      return;
    }
    if (!formData.sender_name || !formData.sender_phone || !formData.sender_country || !formData.sender_city) {
      toast.error("Sender name, phone, country and city are required");
      return;
    }
    if (!formData.recipient_name || !formData.recipient_phone || !formData.recipient_country || !formData.recipient_city) {
      toast.error("Recipient name, phone, country and city are required");
      return;
    }
    if (!formData.description) {
      toast.error("Item description is required");
      return;
    }
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      toast.error("A valid base price is required");
      return;
    }

    const shipmentData = {
      vendor_id: vendor.id,
      branch_id: branch.id,
      tracking_code: formData.tracking_code,
      sender_name: formData.sender_name,
      sender_phone: formData.sender_phone,
      sender_email: formData.sender_email || undefined,
      sender_country: formData.sender_country,
      sender_city: formData.sender_city,
      recipient_name: formData.recipient_name,
      recipient_phone: formData.recipient_phone,
      recipient_email: formData.recipient_email || undefined,
      recipient_country: formData.recipient_country,
      recipient_city: formData.recipient_city,
      description: formData.description,
      photos: formData.photos,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
      base_price: parseFloat(formData.base_price),
      currency: formData.currency,
      line_items: formData.line_items,
      insurance_enabled: formData.insurance_enabled,
      declared_value: formData.declared_value ? parseFloat(formData.declared_value) : undefined,
      insurance_premium: formData.insurance_premium,
      total_amount: formData.total_amount,
      payment_status: formData.payment_status,
      status: "RECEIVED",
      created_by_staff_id: vendorStaff?.id
    };

    createShipmentMutation.mutate(shipmentData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.tracking_code;
      case 2:
        return formData.sender_name && formData.sender_phone && formData.sender_country && formData.sender_city;
      case 3:
        return formData.recipient_name && formData.recipient_phone && formData.recipient_country && formData.recipient_city;
      case 4:
        return formData.description;
      case 5:
        return formData.base_price;
      default:
        return true;
    }
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <Package className="w-14 h-14 mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to create shipments.</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6">
            Sign In to Your Vendor Account
          </Button>
        </Card>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading vendor data...</p>
        </Card>
      </div>
    );
  }

  if (createdShipment) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 bg-white/5 border-white/10 text-center mb-6">
              <CheckCircle className="w-20 h-20 mx-auto mb-4 text-[#9EFF00]" />
              <h2 className="text-3xl font-bold text-white mb-2">Shipment Created!</h2>
              <p className="text-gray-400 mb-4">Tracking: {createdShipment.tracking_code}</p>
            </Card>

            <ShipmentLabel
              shipment={createdShipment}
              vendor={vendor}
              branch={branch}
            />

            <div className="flex gap-4 mt-6">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Shipment
              </Button>
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1 border-white/10 text-gray-300"
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Compact Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-white">Quick Intake</h1>
            <span className="text-sm text-gray-400">{currentStep}/6</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="h-1.5 bg-[#9EFF00] rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Render only current step for performance */}
        {currentStep === 1 && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Tracking Code
            </h2>
            <Input
              value={formData.tracking_code}
              onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
              placeholder="Auto-generated"
              className="bg-white/5 border-white/10 text-white font-mono"
            />
            <p className="text-xs text-gray-400 mt-2">Unique tracking identifier for this shipment</p>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Sender
            </h2>
            <div className="space-y-3 relative">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3 z-10" />
                  <Input
                    placeholder="Phone (type to search contacts)"
                    type="tel"
                    value={formData.sender_phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const formatted = formatPhone(raw, "+237");
                      setFormData({ ...formData, sender_phone: formatted });
                      const matches = lookupByPhone(formatted);
                      setSenderSuggestions(matches);
                      setShowSenderDropdown(matches.length > 0);
                    }}
                    onFocus={() => {
                      if (senderSuggestions.length > 0) setShowSenderDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSenderDropdown(false), 200)}
                    className="bg-white/5 border-white/10 text-white pl-9"
                  />
                </div>
                {showSenderDropdown && senderSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {senderSuggestions.map(c => (
                      <button key={c.id} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            sender_phone: c.phone,
                            sender_name: c.name || prev.sender_name,
                            sender_email: c.email || prev.sender_email,
                            sender_country: c.country || prev.sender_country,
                            sender_city: c.city || prev.sender_city
                          }));
                          setShowSenderDropdown(false);
                          toast.success(`Contact loaded: ${c.name}`);
                        }}>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone} · {c.city}, {c.country}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input
                placeholder="Name *"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="Email (optional)"
                value={formData.sender_email}
                onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Country *"
                  value={formData.sender_country}
                  onChange={(e) => setFormData({ ...formData, sender_country: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  placeholder="City *"
                  value={formData.sender_city}
                  onChange={(e) => setFormData({ ...formData, sender_city: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Recipient
            </h2>
            <div className="space-y-3 relative">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3 z-10" />
                  <Input
                    placeholder="Phone (type to search contacts)"
                    type="tel"
                    value={formData.recipient_phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const formatted = formatPhone(raw, "+237");
                      setFormData({ ...formData, recipient_phone: formatted });
                      const matches = lookupByPhone(formatted);
                      setRecipientSuggestions(matches);
                      setShowRecipientDropdown(matches.length > 0);
                    }}
                    onFocus={() => {
                      if (recipientSuggestions.length > 0) setShowRecipientDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowRecipientDropdown(false), 200)}
                    className="bg-white/5 border-white/10 text-white pl-9"
                  />
                </div>
                {showRecipientDropdown && recipientSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1a1a2e] border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {recipientSuggestions.map(c => (
                      <button key={c.id} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            recipient_phone: c.phone,
                            recipient_name: c.name || prev.recipient_name,
                            recipient_email: c.email || prev.recipient_email,
                            recipient_country: c.country || prev.recipient_country,
                            recipient_city: c.city || prev.recipient_city
                          }));
                          setShowRecipientDropdown(false);
                          toast.success(`Contact loaded: ${c.name}`);
                        }}>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone} · {c.city}, {c.country}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input
                placeholder="Name *"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="Email (optional)"
                value={formData.recipient_email}
                onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Country *"
                  value={formData.recipient_country}
                  onChange={(e) => setFormData({ ...formData, recipient_country: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  placeholder="City *"
                  value={formData.recipient_city}
                  onChange={(e) => setFormData({ ...formData, recipient_city: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </Card>
        )}

        {currentStep === 4 && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" />
              Parcel Details
            </h2>
            <Textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </Card>
        )}

        {currentStep === 5 && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Pricing & Insurance
            </h2>
            <div className="space-y-4">
              {/* Base Price */}
              <div>
                <Label className="text-gray-400 text-xs mb-1">Base Price ({formData.currency}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-lg"
                />
              </div>

              {/* Line Items */}
              <div>
                <Label className="text-gray-400 text-xs mb-1">Additional Fees / Discounts</Label>
                {formData.line_items.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {formData.line_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-sm text-white">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${parseFloat(item.amount) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {parseFloat(item.amount) >= 0 ? '+' : ''}{formData.currency} {item.amount}
                          </span>
                          <button onClick={() => {
                            const updated = formData.line_items.filter((_, i) => i !== idx);
                            setFormData({ ...formData, line_items: updated });
                          }} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Label (e.g. Packing fee)"
                    value={newLineItem.label}
                    onChange={(e) => setNewLineItem({ ...newLineItem, label: e.target.value })}
                    className="bg-white/5 border-white/10 text-white flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={newLineItem.amount}
                    onChange={(e) => setNewLineItem({ ...newLineItem, amount: e.target.value })}
                    className="bg-white/5 border-white/10 text-white w-28"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newLineItem.label && newLineItem.amount) {
                        setFormData({ ...formData, line_items: [...formData.line_items, { ...newLineItem }] });
                        setNewLineItem({ label: "", amount: "" });
                      }
                    }}
                    disabled={!newLineItem.label || !newLineItem.amount}
                    size="icon"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use negative amounts for discounts</p>
              </div>

              {/* Insurance Toggle */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <Label className="text-white font-medium">Insurance</Label>
                  </div>
                  <Switch
                    checked={formData.insurance_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, insurance_enabled: checked, declared_value: checked ? formData.declared_value : "", insurance_premium: 0 })}
                  />
                </div>
                {formData.insurance_enabled && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-400 text-xs">Declared Value ({formData.currency}) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Value of contents"
                        value={formData.declared_value}
                        onChange={(e) => setFormData({ ...formData, declared_value: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-white/5 rounded">
                        <p className="text-gray-400 text-xs">Rate</p>
                        <p className="text-white font-medium">{vendor?.insurance_default_rate_pct || 2}%</p>
                      </div>
                      <div className="p-2 bg-white/5 rounded">
                        <p className="text-gray-400 text-xs">Premium</p>
                        <p className="text-[#9EFF00] font-bold">{formData.currency} {formData.insurance_premium.toFixed(2)}</p>
                      </div>
                    </div>
                    {vendor?.insurance_min_premium > 0 && (
                      <p className="text-xs text-gray-500">Min premium: {formData.currency} {vendor.insurance_min_premium}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Total Breakdown */}
              <div className="p-3 bg-[#9EFF00]/10 border border-[#9EFF00]/30 rounded-lg space-y-1">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Base price</span>
                  <span>{formData.currency} {(parseFloat(formData.base_price) || 0).toFixed(2)}</span>
                </div>
                {formData.line_items.length > 0 && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Fees/Adjustments ({formData.line_items.length})</span>
                    <span>{formData.currency} {formData.line_items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0).toFixed(2)}</span>
                  </div>
                )}
                {formData.insurance_premium > 0 && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Insurance premium</span>
                    <span>{formData.currency} {formData.insurance_premium.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#9EFF00]/20 pt-1 mt-1 flex justify-between text-white font-bold">
                  <span>TOTAL:</span>
                  <span>{formData.currency} {formData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 6 && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#9EFF00]" />
              Confirm
            </h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Tracking:</span>
                <span className="text-white font-mono">{formData.tracking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Route:</span>
                <span className="text-white">{formData.sender_city} → {formData.recipient_city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">{formData.currency} {formData.total_amount.toFixed(2)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setFormData({ ...formData, payment_status: "PAID" })}
                variant={formData.payment_status === "PAID" ? "default" : "outline"}
                className={formData.payment_status === "PAID" ? "bg-[#9EFF00] text-[#1A1A1A]" : "border-white/10"}
              >
                Paid Now
              </Button>
              <Button
                onClick={() => setFormData({ ...formData, payment_status: "PENDING" })}
                variant={formData.payment_status === "PENDING" ? "default" : "outline"}
                className={formData.payment_status === "PENDING" ? "bg-[#9EFF00] text-[#1A1A1A]" : "border-white/10"}
              >
                Pay Later
              </Button>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {currentStep > 1 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="outline"
              className="border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {currentStep < 6 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex-1 bg-[#9EFF00] text-[#1A1A1A] font-bold"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createShipmentMutation.isPending}
              className="flex-1 bg-[#9EFF00] text-[#1A1A1A] font-bold"
            >
              {createShipmentMutation.isPending ? "Creating..." : "Create Shipment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}