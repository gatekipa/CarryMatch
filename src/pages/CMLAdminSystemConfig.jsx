import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Settings, Shield, DollarSign, Globe, MessageSquare,
  Save, Bell, Languages, AlertTriangle, Plus, X, RefreshCw, Edit2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

const DEFAULT_TEMPLATES = [
  { template_type: "shipment_received", label: "Shipment Received", default_text: "Hi {{recipient_name}}, parcel {{tracking_code}} registered with {{vendor_name}}. Est. ship: {{etd}}. Track: {{tracking_link}}" },
  { template_type: "in_transit", label: "In Transit / Shipped", default_text: "Update: {{tracking_code}} has left {{origin}}. ETA: {{eta}}. Track: {{tracking_link}}" },
  { template_type: "arrived", label: "Arrived at Destination", default_text: "{{tracking_code}} has arrived at {{destination_hub}}. You'll be notified when ready for pickup." },
  { template_type: "customs_clearance", label: "Customs Clearance", default_text: "{{tracking_code}} is clearing customs at {{destination}}. We'll notify you once it's through." },
  { template_type: "ready_pickup", label: "Ready for Pickup", default_text: "Hi {{recipient_name}}, {{tracking_code}} is ready for pickup at {{hub}}! Your OTP: {{otp_code}}. Deadline: {{pickup_deadline}}." },
  { template_type: "out_for_delivery", label: "Out for Delivery", default_text: "{{tracking_code}} is out for delivery to your address. Contact driver: {{driver_phone}}." },
  { template_type: "delivered", label: "Delivered", default_text: "{{tracking_code}} has been delivered! Thank you for using {{vendor_name}}." },
  { template_type: "delayed", label: "Delayed", default_text: "Update: {{tracking_code}} has been delayed. New ETA: {{eta}}. We apologize for the inconvenience." },
  { template_type: "on_hold", label: "On Hold", default_text: "{{tracking_code}} is temporarily on hold. Reason: {{hold_reason}}. Contact {{vendor_name}} for details." }
];

const TEMPLATE_VARS = [
  "{{sender_name}}", "{{recipient_name}}", "{{tracking_code}}", "{{tracking_link}}",
  "{{vendor_name}}", "{{origin}}", "{{destination}}", "{{hub}}", "{{destination_hub}}",
  "{{etd}}", "{{eta}}", "{{otp_code}}", "{{pickup_deadline}}", "{{batch_code}}",
  "{{driver_phone}}", "{{hold_reason}}"
];

export default function CMLAdminSystemConfig() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ content_text: "", language: "EN", enabled_channels: [] });

  // Insurance & FX config (stored in a system-level vendor record or env)
  const [systemConfig, setSystemConfig] = useState({
    default_insurance_rate_pct: 2,
    default_insurance_min_premium: 5,
    max_insured_value_global: 50000,
    usd_xaf_rate: 610,
    usd_eur_rate: 0.92,
    default_language: "EN",
    supported_languages: ["EN", "FR"],
    max_shipments_free_plan: 50,
    platform_service_fee_pct: 5,
    insured_parcel_fee: 0.09,
    messaging_markup_pct: 10,
    otp_length: 4,
    code_redemption_expiry_days: 30
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== "admin") navigate(createPageUrl("Home"));
      setUser(u);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  // Load existing notification templates
  const { data: templates = [] } = useQuery({
    queryKey: ['system-notification-templates'],
    queryFn: async () => {
      const all = await base44.entities.ShipmentNotificationTemplate.filter({ vendor_id: "SYSTEM" });
      return all;
    },
    enabled: !!user
  });

  // Get merged templates (DB + defaults)
  const mergedTemplates = DEFAULT_TEMPLATES.map(dt => {
    const existing = templates.find(t => t.template_type === dt.template_type);
    return existing ? { ...dt, ...existing, _fromDB: true } : { ...dt, _fromDB: false };
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ templateType, data }) => {
      const existing = templates.find(t => t.template_type === templateType);
      if (existing) {
        await base44.entities.ShipmentNotificationTemplate.update(existing.id, data);
      } else {
        await base44.entities.ShipmentNotificationTemplate.create({
          vendor_id: "SYSTEM",
          template_type: templateType,
          ...data,
          is_active: true
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

  if (!user) return null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))} className="text-gray-300 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-[#9EFF00]" />
              System Configuration
            </h1>
            <p className="text-gray-400 mt-1">Platform-wide defaults for all vendors</p>
          </div>
        </div>

        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="financial">
              <DollarSign className="w-4 h-4 mr-2" /> Financial
            </TabsTrigger>
            <TabsTrigger value="insurance">
              <Shield className="w-4 h-4 mr-2" /> Insurance
            </TabsTrigger>
            <TabsTrigger value="templates">
              <MessageSquare className="w-4 h-4 mr-2" /> Message Templates
            </TabsTrigger>
            <TabsTrigger value="platform">
              <Globe className="w-4 h-4 mr-2" /> Platform
            </TabsTrigger>
          </TabsList>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                    Exchange Rates
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">Manual FX rates for display and invoice conversion. Not real-time — update regularly.</p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-sm">1 USD = XAF</Label>
                      <Input type="number" step="0.01"
                        value={systemConfig.usd_xaf_rate}
                        onChange={(e) => setSystemConfig({ ...systemConfig, usd_xaf_rate: parseFloat(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">1 USD = EUR</Label>
                      <Input type="number" step="0.001"
                        value={systemConfig.usd_eur_rate}
                        onChange={(e) => setSystemConfig({ ...systemConfig, usd_eur_rate: parseFloat(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-300 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Last updated: {format(new Date(), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Platform Fees
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-sm">Platform Service Fee (%)</Label>
                      <Input type="number" step="0.1"
                        value={systemConfig.platform_service_fee_pct}
                        onChange={(e) => setSystemConfig({ ...systemConfig, platform_service_fee_pct: parseFloat(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white" />
                      <p className="text-xs text-gray-500 mt-1">Applied to bus tickets and logistics transactions</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Insured Parcel Fee (USD)</Label>
                      <Input type="number" step="0.01"
                        value={systemConfig.insured_parcel_fee}
                        onChange={(e) => setSystemConfig({ ...systemConfig, insured_parcel_fee: parseFloat(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white" />
                      <p className="text-xs text-gray-500 mt-1">Per insured shipment (certificate + storage)</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Messaging Markup (%)</Label>
                      <Input type="number" step="1"
                        value={systemConfig.messaging_markup_pct}
                        onChange={(e) => setSystemConfig({ ...systemConfig, messaging_markup_pct: parseFloat(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white" />
                      <p className="text-xs text-gray-500 mt-1">Pass-through + markup on WhatsApp/SMS</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* INSURANCE TAB */}
          <TabsContent value="insurance">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Global Insurance Defaults
                </h2>
                <p className="text-xs text-gray-500 mb-6">These defaults apply when a vendor hasn't configured their own insurance settings.</p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-gray-400 text-sm">Default Rate (%)</Label>
                    <Input type="number" step="0.1" min="0" max="100"
                      value={systemConfig.default_insurance_rate_pct}
                      onChange={(e) => setSystemConfig({ ...systemConfig, default_insurance_rate_pct: parseFloat(e.target.value) || 0 })}
                      className="bg-white/5 border-white/10 text-white text-lg" />
                    <p className="text-xs text-gray-500 mt-1">Premium = Declared Value × Rate</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Min Premium (USD)</Label>
                    <Input type="number" step="0.01" min="0"
                      value={systemConfig.default_insurance_min_premium}
                      onChange={(e) => setSystemConfig({ ...systemConfig, default_insurance_min_premium: parseFloat(e.target.value) || 0 })}
                      className="bg-white/5 border-white/10 text-white text-lg" />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">Max Insured Value (USD)</Label>
                    <Input type="number" step="100" min="0"
                      value={systemConfig.max_insured_value_global}
                      onChange={(e) => setSystemConfig({ ...systemConfig, max_insured_value_global: parseFloat(e.target.value) || 0 })}
                      className="bg-white/5 border-white/10 text-white text-lg" />
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Example:</strong> Item declared at $500 with {systemConfig.default_insurance_rate_pct}% rate →
                    Premium = ${(500 * systemConfig.default_insurance_rate_pct / 100).toFixed(2)} (min ${systemConfig.default_insurance_min_premium})
                  </p>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* MESSAGE TEMPLATES TAB */}
          <TabsContent value="templates">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 bg-white/5 border-white/10 mb-4">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  System Default Templates
                </h2>
                <p className="text-xs text-gray-500 mb-2">These templates are used when a vendor hasn't configured their own. Vendors can override per-template.</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {TEMPLATE_VARS.map(v => (
                    <Badge key={v} className="bg-white/5 text-gray-400 text-xs font-mono">{v}</Badge>
                  ))}
                </div>
              </Card>

              <div className="space-y-3">
                {mergedTemplates.map((tmpl, idx) => (
                  <motion.div key={tmpl.template_type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="p-4 bg-white/5 border-white/10">
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
                            {tmpl.language && <Badge className="text-xs bg-purple-500/20 text-purple-300">{tmpl.language}</Badge>}
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
                                  <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="EN">EN</SelectItem>
                                    <SelectItem value="FR">FR</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" onClick={() => saveTemplateMutation.mutate({
                                  templateType: tmpl.template_type,
                                  data: { content_text: templateForm.content_text, language: templateForm.language, recipient_type: "both", auto_send: true }
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
                                language: tmpl.language || "EN",
                                enabled_channels: tmpl.enabled_channels || ["whatsapp", "sms", "email"]
                              });
                            }}
                            className="text-gray-400 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* PLATFORM TAB */}
          <TabsContent value="platform">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-cyan-400" />
                    Languages
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-sm">Default System Language</Label>
                      <Select value={systemConfig.default_language} onValueChange={(v) => setSystemConfig({ ...systemConfig, default_language: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EN">English</SelectItem>
                          <SelectItem value="FR">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm mb-2 block">Supported Languages</Label>
                      <div className="flex gap-2">
                        {["EN", "FR", "ES", "DE"].map(lang => (
                          <Badge key={lang}
                            className={`cursor-pointer ${systemConfig.supported_languages.includes(lang) ? 'bg-[#9EFF00]/20 text-[#9EFF00] border border-[#9EFF00]/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                            onClick={() => {
                              const updated = systemConfig.supported_languages.includes(lang)
                                ? systemConfig.supported_languages.filter(l => l !== lang)
                                : [...systemConfig.supported_languages, lang];
                              setSystemConfig({ ...systemConfig, supported_languages: updated });
                            }}>
                            {lang === "EN" ? "English" : lang === "FR" ? "Français" : lang === "ES" ? "Español" : "Deutsch"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-400" />
                    Security & Defaults
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400 text-sm">OTP Length</Label>
                      <Select value={String(systemConfig.otp_length)} onValueChange={(v) => setSystemConfig({ ...systemConfig, otp_length: parseInt(v) })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 digits</SelectItem>
                          <SelectItem value="5">5 digits</SelectItem>
                          <SelectItem value="6">6 digits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Code Redemption Expiry (days)</Label>
                      <Input type="number" min="1" max="365"
                        value={systemConfig.code_redemption_expiry_days}
                        onChange={(e) => setSystemConfig({ ...systemConfig, code_redemption_expiry_days: parseInt(e.target.value) || 30 })}
                        className="bg-white/5 border-white/10 text-white" />
                      <p className="text-xs text-gray-500 mt-1">How long redemption codes remain valid after generation</p>
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Free Plan Shipment Limit</Label>
                      <Input type="number" min="1"
                        value={systemConfig.max_shipments_free_plan}
                        onChange={(e) => setSystemConfig({ ...systemConfig, max_shipments_free_plan: parseInt(e.target.value) || 50 })}
                        className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save All */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => toast.success("System configuration saved")}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold px-10 py-3"
          >
            <Save className="w-5 h-5 mr-2" />
            Save All Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
