import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Settings, Shield, DollarSign, Globe, MessageSquare,
  Save, Truck, Clock, Hash, Languages, Plus, X, MapPin
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

const CURRENCIES = ["USD", "XAF", "EUR", "GBP", "CAD", "NGN", "GHS", "KES"];
const LANGUAGES = ["EN", "FR", "ES", "DE"];
const MODES = ["AIR", "SEA", "TRUCK", "BUS", "RAIL"];
const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Africa/Douala", "Africa/Lagos", "Africa/Nairobi", "Europe/London", "Europe/Paris"
];

export default function VendorSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    // Insurance defaults
    insurance_default_rate_pct: 2,
    insurance_min_premium: 5,
    max_insured_value: 10000,
    // Communications
    whatsapp_number: "",
    sms_sender_id: "",
    // Locale
    base_currency: "USD",
    supported_currencies: [],
    default_language: "EN",
    time_zone: "America/New_York",
    // Operations
    main_routes: [],
    primary_modes: [],
    operating_countries: [],
  });

  const [newRoute, setNewRoute] = useState("");
  const [newCountry, setNewCountry] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("PartnerLogin")));
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return base44.entities.Vendor.filter({ id: staff[0].vendor_id });
          }
        })
        .then(vendors => {
          if (vendors?.[0]) {
            const v = vendors[0];
            setVendor(v);
            setForm({
              insurance_default_rate_pct: v.insurance_default_rate_pct || 2,
              insurance_min_premium: v.insurance_min_premium || 5,
              max_insured_value: v.max_insured_value || 10000,
              whatsapp_number: v.whatsapp_number || "",
              sms_sender_id: v.sms_sender_id || "",
              base_currency: v.base_currency || "USD",
              supported_currencies: v.supported_currencies || [],
              default_language: v.default_language || "EN",
              time_zone: v.time_zone || "America/New_York",
              main_routes: v.main_routes || [],
              primary_modes: v.primary_modes || [],
              operating_countries: v.operating_countries || [],
            });
          }
          setLoading(false);
        });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Vendor.update(vendor.id, form);
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
    onError: () => toast.error("Failed to save settings")
  });

  const isOwner = vendorStaff?.role === "OWNER";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#9EFF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-bold text-white mb-2">Owner Access Required</h2>
          <p className="text-gray-400">Only vendor owners can modify settings.</p>
        </Card>
      </div>
    );
  }

  const addToArray = (field, value) => {
    if (value && !form[field].includes(value)) {
      setForm({ ...form, [field]: [...form[field], value] });
    }
  };

  const removeFromArray = (field, value) => {
    setForm({ ...form, [field]: form[field].filter(v => v !== value) });
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("VendorDashboard"))} className="text-gray-300 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-[#9EFF00]" />
              Vendor Settings
            </h1>
            <p className="text-gray-400 mt-1">{vendor?.display_name || vendor?.legal_name}</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Insurance Defaults */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Insurance Defaults
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Default Rate %</Label>
                  <Input type="number" step="0.1" min="0" max="100"
                    value={form.insurance_default_rate_pct}
                    onChange={(e) => setForm({ ...form, insurance_default_rate_pct: parseFloat(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-white" />
                  <p className="text-xs text-gray-500 mt-1">Applied to declared value</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Min Premium ({form.base_currency})</Label>
                  <Input type="number" step="0.01" min="0"
                    value={form.insurance_min_premium}
                    onChange={(e) => setForm({ ...form, insurance_min_premium: parseFloat(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Max Insured Value ({form.base_currency})</Label>
                  <Input type="number" step="1" min="0"
                    value={form.max_insured_value}
                    onChange={(e) => setForm({ ...form, max_insured_value: parseFloat(e.target.value) || 0 })}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Communications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                Communications
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">WhatsApp Business Number</Label>
                  <Input placeholder="+1234567890"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" />
                  <p className="text-xs text-gray-500 mt-1">Used for customer notifications</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">SMS Sender ID</Label>
                  <Input placeholder="YourBrand"
                    value={form.sms_sender_id}
                    onChange={(e) => setForm({ ...form, sms_sender_id: e.target.value })}
                    className="bg-white/5 border-white/10 text-white" />
                  <p className="text-xs text-gray-500 mt-1">Max 11 chars, alphanumeric</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Locale & Currency */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                Locale & Currency
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Home Currency</Label>
                  <Select value={form.base_currency} onValueChange={(v) => setForm({ ...form, base_currency: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Default Language</Label>
                  <Select value={form.default_language} onValueChange={(v) => setForm({ ...form, default_language: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l === "EN" ? "English" : l === "FR" ? "Français" : l === "ES" ? "Español" : "Deutsch"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Time Zone</Label>
                  <Select value={form.time_zone} onValueChange={(v) => setForm({ ...form, time_zone: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-gray-400 text-sm mb-2 block">Additional Currencies</Label>
                <div className="flex flex-wrap gap-2">
                  {form.supported_currencies.map(c => (
                    <Badge key={c} className="bg-white/10 text-white cursor-pointer hover:bg-red-500/20" onClick={() => removeFromArray('supported_currencies', c)}>
                      {c} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                  <Select onValueChange={(v) => addToArray('supported_currencies', v)}>
                    <SelectTrigger className="w-24 h-7 bg-white/5 border-white/10 text-xs text-gray-400"><SelectValue placeholder="+ Add" /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => c !== form.base_currency && !form.supported_currencies.includes(c))
                        .map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Routes & Operations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-400" />
                Routes & Operations
              </h2>

              {/* Main Routes */}
              <div className="mb-4">
                <Label className="text-gray-400 text-sm mb-2 block">Main Routes</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.main_routes.map(r => (
                    <Badge key={r} className="bg-blue-500/20 text-blue-300 cursor-pointer hover:bg-red-500/20" onClick={() => removeFromArray('main_routes', r)}>
                      {r} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="e.g. USA → Cameroon" value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && newRoute) { addToArray('main_routes', newRoute); setNewRoute(""); } }}
                    className="bg-white/5 border-white/10 text-white" />
                  <Button size="icon" onClick={() => { if (newRoute) { addToArray('main_routes', newRoute); setNewRoute(""); } }}
                    className="bg-white/10"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {/* Transport Modes */}
              <div className="mb-4">
                <Label className="text-gray-400 text-sm mb-2 block">Transport Modes</Label>
                <div className="flex flex-wrap gap-2">
                  {MODES.map(mode => (
                    <Badge key={mode}
                      className={`cursor-pointer ${form.primary_modes.includes(mode) ? 'bg-[#9EFF00]/20 text-[#9EFF00] border border-[#9EFF00]/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                      onClick={() => form.primary_modes.includes(mode) ? removeFromArray('primary_modes', mode) : addToArray('primary_modes', mode)}>
                      {mode}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Operating Countries */}
              <div>
                <Label className="text-gray-400 text-sm mb-2 block">Operating Countries</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.operating_countries.map(c => (
                    <Badge key={c} className="bg-purple-500/20 text-purple-300 cursor-pointer hover:bg-red-500/20" onClick={() => removeFromArray('operating_countries', c)}>
                      <MapPin className="w-3 h-3 mr-1" />{c} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="e.g. USA, Cameroon" value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && newCountry) { addToArray('operating_countries', newCountry); setNewCountry(""); } }}
                    className="bg-white/5 border-white/10 text-white" />
                  <Button size="icon" onClick={() => { if (newCountry) { addToArray('operating_countries', newCountry); setNewCountry(""); } }}
                    className="bg-white/10"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Floating Save */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
