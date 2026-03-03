import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Plus, Edit, Trash2, MessageSquare, Mail, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TEMPLATE_TYPES = [
  { value: "shipment_received", label: "Shipment Received", icon: "📦" },
  { value: "in_transit", label: "In Transit", icon: "🚚" },
  { value: "out_for_delivery", label: "Out for Delivery", icon: "🏃" },
  { value: "delivered", label: "Delivered", icon: "✅" },
  { value: "delayed", label: "Delayed", icon: "⏰" },
  { value: "on_hold", label: "On Hold", icon: "⚠️" },
  { value: "customs_clearance", label: "Customs Clearance", icon: "🛂" },
  { value: "ready_pickup", label: "Ready for Pickup", icon: "📍" }
];

export default function VendorNotificationTemplates() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    template_type: "shipment_received",
    language: "EN",
    recipient_type: "recipient",
    content_text: "",
    enabled_channels: ["sms"],
    auto_send: true,
    is_active: true
  });

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: vendorStaff } = useQuery({
    queryKey: ['vendor-staff-me', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const staff = await base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" });
      return staff[0] || null;
    },
    enabled: !!user
  });

  const { data: vendor } = useQuery({
    queryKey: ['vendor', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return null;
      const vendors = await base44.entities.Vendor.filter({ id: vendorStaff.vendor_id });
      return vendors[0] || null;
    },
    enabled: !!vendorStaff
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['notification-templates', vendor?.id],
    queryFn: () => base44.entities.ShipmentNotificationTemplate.filter({ vendor_id: vendor.id }, "-created_date"),
    enabled: !!vendor
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        return await base44.entities.ShipmentNotificationTemplate.update(editingTemplate.id, data);
      }
      return await base44.entities.ShipmentNotificationTemplate.create({
        ...data,
        vendor_id: vendor.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-templates']);
      toast.success(editingTemplate ? "Template updated!" : "Template created!");
      resetForm();
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ShipmentNotificationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-templates']);
      toast.success("Template deleted");
    }
  });

  const resetForm = () => {
    setFormData({
      template_type: "shipment_received",
      language: "EN",
      recipient_type: "recipient",
      content_text: "",
      enabled_channels: ["sms"],
      auto_send: true,
      is_active: true
    });
    setEditingTemplate(null);
    setShowDialog(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowDialog(true);
  };

  const toggleChannel = (channel) => {
    const channels = formData.enabled_channels.includes(channel)
      ? formData.enabled_channels.filter(c => c !== channel)
      : [...formData.enabled_channels, channel];
    setFormData({ ...formData, enabled_channels: channels });
  };

  const insertPlaceholder = (placeholder) => {
    setFormData({
      ...formData,
      content_text: formData.content_text + `{${placeholder}}`
    });
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  const groupedTemplates = TEMPLATE_TYPES.map(type => ({
    ...type,
    template: templates.find(t => t.template_type === type.value)
  }));

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notification Templates</h1>
            <p className="text-gray-400">Configure automated customer notifications</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Template Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {groupedTemplates.map(({ value, label, icon, template }) => (
            <Card key={value} className={`p-6 bg-white/5 border-white/10 ${!template && 'opacity-60'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{label}</h3>
                    {template ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {template.auto_send && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">Auto-send</Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 mt-1 text-xs">Not configured</Badge>
                    )}
                  </div>
                </div>
                {template && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(template)} className="border-white/10">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                      className="border-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {template && (
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Sends to:</p>
                    <Badge className="bg-purple-500/20 text-purple-400 capitalize">
                      {template.recipient_type}
                    </Badge>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Channels:</p>
                    <div className="flex gap-2">
                      {template.enabled_channels.map(ch => (
                        <Badge key={ch} className="bg-blue-500/20 text-blue-400 text-xs">
                          {ch === 'sms' && '💬'}
                          {ch === 'email' && '📧'}
                          {ch === 'whatsapp' && '📱'}
                          {' '}{ch.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Preview:</p>
                    <p className="text-xs text-gray-300 line-clamp-2">{template.content_text}</p>
                  </div>
                </div>
              )}

              {!template && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      template_type: value
                    });
                    setShowDialog(true);
                  }}
                  className="w-full border-white/10 text-gray-300"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Create Template
                </Button>
              )}
            </Card>
          ))}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={() => resetForm()}>
          <DialogContent className="bg-[#0F1D35] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">{editingTemplate ? "Edit Template" : "Create Notification Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-gray-300">Event Type *</Label>
                <Select value={formData.template_type} onValueChange={(value) => setFormData({...formData, template_type: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="FR">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Send To</Label>
                  <Select value={formData.recipient_type} onValueChange={(value) => setFormData({...formData, recipient_type: value})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sender">Sender Only</SelectItem>
                      <SelectItem value="recipient">Recipient Only</SelectItem>
                      <SelectItem value="both">Both Parties</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Notification Channels</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleChannel('sms')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.enabled_channels.includes('sms')
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChannel('email')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.enabled_channels.includes('email')
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChannel('whatsapp')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.enabled_channels.includes('whatsapp')
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Message Template *</Label>
                <Textarea
                  value={formData.content_text}
                  onChange={(e) => setFormData({...formData, content_text: e.target.value})}
                  placeholder="Enter your message template..."
                  className="bg-white/5 border-white/10 text-white"
                  rows={6}
                />
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-gray-300 mb-2">Available placeholders:</p>
                  <div className="flex flex-wrap gap-2">
                    {['tracking_code', 'vendor_name', 'sender_name', 'recipient_name', 'sender_city', 'recipient_city', 'status', 'eta', 'current_location'].map(ph => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => insertPlaceholder(ph)}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30 transition-all"
                      >
                        {`{${ph}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <Label className="text-gray-300">Auto-send on Status Change</Label>
                  <p className="text-xs text-gray-500 mt-1">Automatically notify customers when status updates</p>
                </div>
                <Switch
                  checked={formData.auto_send}
                  onCheckedChange={(checked) => setFormData({...formData, auto_send: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <Label className="text-gray-300">Template Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
              </div>

              <Button
                onClick={() => createTemplateMutation.mutate(formData)}
                disabled={!formData.content_text || formData.enabled_channels.length === 0 || createTemplateMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                {createTemplateMutation.isPending ? "Saving..." : (editingTemplate ? "Update Template" : "Create Template")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}