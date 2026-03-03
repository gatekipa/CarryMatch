import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings, ArrowLeft, DollarSign, Shield, Bell, Globe, Save, RefreshCw, MessageSquare, Edit2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DEFAULT_TEMPLATES = [
  { template_type: "shipment_received", label: "Shipment Received", default_text: "Hi {{recipient_name}}, parcel {{tracking_code}} registered with {{vendor_name}}. Est. ship: {{etd}}. Track: {{tracking_link}}" },
  { template_type: "in_transit", label: "In Transit / Shipped", default_text: "Update: {{tracking_code}} has left {{origin}}. ETA: {{eta}}. Track: {{tracking_link}}" },
  { template_type: "arrived", label: "Arrived at Destination", default_text: "{{tracking_code}} has arrived at {{destination_hub}}. You'll be notified when ready for pickup." },
  { template_type: "customs_clearance", label: "Customs Clearance", default_text: "{{tracking_code}} is clearing customs at {{destination}}. We'll notify you once it's through." },
  { template_type: "ready_pickup", label: "Ready for Pickup", default_text: "Hi {{recipient_name}}, {{tracking_code}} is ready! Your OTP: {{otp_code}}. Deadline: {{pickup_deadline}}." },
  { template_type: "out_for_delivery", label: "Out for Delivery", default_text: "{{tracking_code}} is out for delivery. Contact driver: {{driver_phone}}." },
  { template_type: "delivered", label: "Delivered", default_text: "{{tracking_code}} has been delivered! Thank you for using {{vendor_name}}." },
  { template_type: "delayed", label: "Delayed", default_text: "Update: {{tracking_code}} has been delayed. New ETA: {{eta}}. We apologize for the inconvenience." },
  { template_type: "on_hold", label: "On Hold", default_text: "{{tracking_code}} is temporarily on hold. Reason: {{hold_reason}}. Contact {{vendor_name}} for details." }
];

const TEMPLATE_VARS = [
  "{{sender_name}}", "{{recipient_name}}", "{{tracking_code}}", "{{tracking_link}}",
  "{{vendor_name}}", "{{origin}}", "{{destination}}", "{{hub}}", "{{etd}}", "{{eta}}",
  "{{otp_code}}", "{{pickup_deadline}}", "{{batch_code}}", "{{driver_phone}}", "{{hold_reason}}"
];

// System defaults — in production these would be stored in a SystemConfig entity
const DEFAULT_CONFIG = {
  // Exchange Rates
  fx_usd_xaf: 605,
  fx_usd_eur: 0.92,
  fx_usd_gbp: 0.79,
  fx_usd_ngn: 1550,
  fx_usd_cad: 1.36,
  fx_last_updated: new Date().toISOString(),
  // Insurance Global Limits
  insurance_global_max_value: 50000,
  insurance_global_min_premium: 2,
  insurance_global_max_rate_pct: 25,
  insurance_claim_deadline_days: 30,
  // Notifications
  notification_sms_enabled: true,
  notification_whatsapp_enabled: true,
  notification_email_enabled: true,
  notification_provider_markup_pct: 10,
  messaging_wallet_min_topup: 10,
  // Platform
  default_language: "EN",
  supported_languages: ["EN", "FR"],
  platform_fee_pct: 5,
  otp_length: 4,
  otp_expiry_minutes: 30,
  receipt_languages: ["EN", "FR"],
  // Vendor Limits
  max_free_trial_days: 90,
  max_staff_starter: 2,
  max_staff_growth: 5,
  max_staff_pro: 15
};

export default function CarryMatchAdminSystemConfig() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ content_text: "", language: "EN" });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== "admin") navigate(createPageUrl("Home"));
      setUser(u);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  // Load saved config from OperatorSettings or local defaults
  useEffect(() => {
    base44.entities.OperatorSettings.list("-created_date", 1)
      .then(settings => {
        if (settings[0]?.config_json) {
          try {
            const saved = JSON.parse(settings[0].config_json);
            setConfig(prev => ({ ...prev, ...saved }));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Load system notification templates
  const { data: systemTemplates = [] } = useQuery({
    queryKey: ['system-notification-templates'],
    queryFn: async () => await base44.entities.ShipmentNotificationTemplate.filter({ vendor_id: "SYSTEM" }),
    enabled: !!user
  });

  const mergedTemplates = DEFAULT_TEMPLATES.map(dt => {
    const existing = systemTemplates.find(t => t.template_type === dt.template_type);
    return existing ? { ...dt, ...existing, _fromDB: true } : { ...dt, _fromDB: false };
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ templateType, data }) => {
      const existing = systemTemplates.find(t => t.template_type === templateType);
      if (existing) {
        await base44.entities.ShipmentNotificationTemplate.update(existing.id, data);
      } else {
        await base44.entities.ShipmentNotificationTemplate.create({
          vendor_id: "SYSTEM", template_type: templateType, ...data, is_active: true, recipient_type: "both", auto_send: true
        });
      }
    },
    onSuccess: () => {
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ['system-notification-templates'] });
      setEditingTemplate(null);
    },
    onError: () => toast.error("Failed to save template")
  });

  const updateField = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const settings = await base44.entities.OperatorSettings.list("-created_date", 1);
      const configData = {
        config_json: JSON.stringify(config),
        updated_by: user.email,
        updated_at: new Date().toISOString()
      };
      if (settings[0]) {
        await base44.entities.OperatorSettings.update(settings[0].id, configData);
      } else {
        await base44.entities.OperatorSettings.create({
          ...configData,
          operator_id: "CML_SYSTEM",
          setting_type: "SYSTEM_CONFIG"
        });
      }
    },
    onSuccess: () => {
      toast.success("System configuration saved");
      setIsDirty(false);
    },
    onError: () => toast.error("Failed to save configuration")
  });

  if (!user) return null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))} className="text-gray-300 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Admin Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-[#9EFF00]" />
              System Configuration
            </h1>
            <p className="text-gray-400 mt-1">Global settings for exchange rates, insurance, notifications, and platform</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Config"}
          </Button>
        </div>

        <Tabs defaultValue="fx" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="fx"><DollarSign className="w-4 h-4 mr-1" />Exchange Rates</TabsTrigger>
            <TabsTrigger value="insurance"><Shield className="w-4 h-4 mr-1" />Insurance</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Notifications</TabsTrigger>
            <TabsTrigger value="templates"><MessageSquare className="w-4 h-4 mr-1" />Templates</TabsTrigger>
            <TabsTrigger value="platform"><Globe className="w-4 h-4 mr-1" />Platform</TabsTrigger>
          </TabsList>

          {/* Exchange Rates */}
          <TabsContent value="fx">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Manual FX Rates (per 1 USD)
                  </h2>
                  <p className="text-xs text-gray-500">Last updated: {new Date(config.fx_last_updated).toLocaleDateString()}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { key: "fx_usd_xaf", label: "USD → XAF", placeholder: "605" },
                    { key: "fx_usd_eur", label: "USD → EUR", placeholder: "0.92" },
                    { key: "fx_usd_gbp", label: "USD → GBP", placeholder: "0.79" },
                    { key: "fx_usd_ngn", label: "USD → NGN", placeholder: "1550" },
                    { key: "fx_usd_cad", label: "USD → CAD", placeholder: "1.36" },
                  ].map(fx => (
                    <div key={fx.key}>
                      <Label className="text-gray-400 text-sm">{fx.label}</Label>
                      <Input type="number" step="0.01" value={config[fx.key]}
                        onChange={(e) => updateField(fx.key, parseFloat(e.target.value) || 0)}
                        placeholder={fx.placeholder}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">These rates are used for multi-currency display. Actual transactions use vendor-configured currencies.</p>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Insurance Limits */}
          <TabsContent value="insurance">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Global Insurance Limits
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm">Max Insured Value (USD)</Label>
                    <Input type="number" value={config.insurance_global_max_value}
                      onChange={(e) => updateField("insurance_global_max_value", parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white" />
                    <p className="text-xs text-gray-500 mt-1">Vendors cannot insure above this value</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Min Premium (USD)</Label>
                    <Input type="number" value={config.insurance_global_min_premium}
                      onChange={(e) => updateField("insurance_global_min_premium", parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Max Rate %</Label>
                    <Input type="number" step="0.1" value={config.insurance_global_max_rate_pct}
                      onChange={(e) => updateField("insurance_global_max_rate_pct", parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white" />
                    <p className="text-xs text-gray-500 mt-1">Vendors cannot set rate higher than this</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Claim Filing Deadline (days)</Label>
                    <Input type="number" value={config.insurance_claim_deadline_days}
                      onChange={(e) => updateField("insurance_claim_deadline_days", parseInt(e.target.value) || 30)}
                      className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-400" />
                  Notification Channels & Messaging
                </h2>
                <div className="space-y-4">
                  {[
                    { key: "notification_sms_enabled", label: "SMS Notifications" },
                    { key: "notification_whatsapp_enabled", label: "WhatsApp Notifications" },
                    { key: "notification_email_enabled", label: "Email Notifications" },
                  ].map(ch => (
                    <div key={ch.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white">{ch.label}</span>
                      <Switch checked={config[ch.key]}
                        onCheckedChange={(v) => updateField(ch.key, v)} />
                    </div>
                  ))}
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-gray-400 text-sm">Provider Markup %</Label>
                      <Input type="number" step="1" value={config.notification_provider_markup_pct}
                        onChange={(e) => updateField("notification_provider_markup_pct", parseInt(e.target.value) || 10)}
                        className="bg-white/5 border-white/10 text-white" />
                      <p className="text-xs text-gray-500 mt-1">Applied on top of provider SMS/WhatsApp cost</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Min Wallet Top-up ($)</Label>
                      <Input type="number" step="5" value={config.messaging_wallet_min_topup}
                        onChange={(e) => updateField("messaging_wallet_min_topup", parseInt(e.target.value) || 10)}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Message Templates */}
          <TabsContent value="templates">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10 mb-4">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  System Default Templates
                </h2>
                <p className="text-xs text-gray-500 mb-3">Default notification text for all status changes. Vendors can override these per-template.</p>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARS.map(v => (
                    <Badge key={v} className="bg-white/5 text-gray-400 text-xs font-mono">{v}</Badge>
                  ))}
                </div>
              </Card>
              <div className="space-y-3">
                {mergedTemplates.map((tmpl, idx) => (
                  <Card key={tmpl.template_type} className="p-4 bg-white/5 border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-white">{tmpl.label}</h3>
                          <Badge className="text-xs bg-white/5 text-gray-400 font-mono">{tmpl.template_type}</Badge>
                          {tmpl._fromDB ? (
                            <Badge className="text-xs bg-green-500/20 text-green-300">Customized</Badge>
                          ) : (
                            <Badge className="text-xs bg-white/10 text-gray-500">Default</Badge>
                          )}
                        </div>
                        {editingTemplate === tmpl.template_type ? (
                          <div className="space-y-3 mt-3">
                            <Textarea
                              value={templateForm.content_text}
                              onChange={(e) => setTemplateForm({ ...templateForm, content_text: e.target.value })}
                              className="bg-white/5 border-white/10 text-white min-h-[80px]"
                              rows={3}
                            />
                            <div className="flex gap-2 items-center">
                              <Select value={templateForm.language} onValueChange={(v) => setTemplateForm({ ...templateForm, language: v })}>
                                <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EN">EN</SelectItem>
                                  <SelectItem value="FR">FR</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => saveTemplateMutation.mutate({
                                templateType: tmpl.template_type,
                                data: { content_text: templateForm.content_text, language: templateForm.language }
                              })} disabled={saveTemplateMutation.isPending}
                                className="bg-[#9EFF00] text-black font-bold">
                                <Save className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(null)} className="text-gray-400">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 mt-1 font-mono leading-relaxed">{tmpl.content_text || tmpl.default_text}</p>
                        )}
                      </div>
                      {editingTemplate !== tmpl.template_type && (
                        <Button size="sm" variant="ghost"
                          onClick={() => {
                            setEditingTemplate(tmpl.template_type);
                            setTemplateForm({
                              content_text: tmpl.content_text || tmpl.default_text,
                              language: tmpl.language || "EN"
                            });
                          }}
                          className="text-gray-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Platform */}
          <TabsContent value="platform">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  Platform Settings
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm">Default Language</Label>
                    <Select value={config.default_language} onValueChange={(v) => updateField("default_language", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="FR">Français</SelectItem>
                        <SelectItem value="ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Platform Service Fee %</Label>
                    <Input type="number" step="0.5" value={config.platform_fee_pct}
                      onChange={(e) => updateField("platform_fee_pct", parseFloat(e.target.value) || 5)}
                      className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">OTP Length</Label>
                    <Select value={String(config.otp_length)} onValueChange={(v) => updateField("otp_length", parseInt(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 digits</SelectItem>
                        <SelectItem value="6">6 digits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">OTP Expiry (minutes)</Label>
                    <Input type="number" value={config.otp_expiry_minutes}
                      onChange={(e) => updateField("otp_expiry_minutes", parseInt(e.target.value) || 30)}
                      className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Max Free Trial Days</Label>
                    <Input type="number" value={config.max_free_trial_days}
                      onChange={(e) => updateField("max_free_trial_days", parseInt(e.target.value) || 90)}
                      className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold px-8">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
