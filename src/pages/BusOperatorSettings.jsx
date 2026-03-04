import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function BusOperatorSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['settings-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: settings } = useQuery({
    queryKey: ['operator-settings', operator?.id],
    queryFn: async () => {
      const sets = await base44.entities.OperatorSettings.filter({ operator_id: operator.id });
      return sets[0] || {
        operator_id: operator.id,
        online_sales_open_days_ahead: 60,
        offline_sales_open_days_ahead: 90,
        sales_close_minutes_before_departure: 30,
        allow_same_day_sales: true,
        allow_last_minute_online: false,
        boarding_opens_minutes_before_departure: 45,
        no_show_cutoff_minutes: 10,
        release_requires_admin: true,
        rebalance_minutes_before_departure: 60,
        enable_auto_rebalance: true,
        reminder_schedule_minutes_before: [180, 60, 30],
        reminder_channel_preference: "whatsapp_only",
        send_reminders_to: "not_checked_in_only"
      };
    },
    enabled: !!operator
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateOperatorMutation = useMutation({
    mutationFn: (data) => base44.entities.BusOperator.update(operator.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-operator'] });
      toast.success("Operator info updated!");
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.OperatorSettings.update(settings.id, data);
      } else {
        return await base44.entities.OperatorSettings.create({
          ...data,
          operator_id: operator.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator-settings'] });
      toast.success("Settings saved!");
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateOperatorMutation.mutateAsync({ logo_url: file_url });
      toast.success("Logo updated!");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !operator || !formData.operator_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Settings className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your bus operator preferences</p>
        </div>

        <div className="space-y-6">
          {/* Company Info */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Company Name</Label>
                <Input
                  value={operator.name}
                  onChange={(e) => updateOperatorMutation.mutate({ name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  {operator.logo_url && (
                    <img src={operator.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" className="border-white/10" disabled={uploading} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload Logo"}
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Sales Settings */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Sales Settings</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Online Sales Open (Days Ahead)</Label>
                  <Input
                    type="number"
                    value={formData.online_sales_open_days_ahead}
                    onChange={(e) => setFormData({...formData, online_sales_open_days_ahead: parseInt(e.target.value)})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Sales Close (Minutes Before)</Label>
                  <Input
                    type="number"
                    value={formData.sales_close_minutes_before_departure}
                    onChange={(e) => setFormData({...formData, sales_close_minutes_before_departure: parseInt(e.target.value)})}
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Allow Same-Day Sales</Label>
                <Switch
                  checked={formData.allow_same_day_sales}
                  onCheckedChange={(checked) => setFormData({...formData, allow_same_day_sales: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Enable Auto-Rebalance</Label>
                <Switch
                  checked={formData.enable_auto_rebalance}
                  onCheckedChange={(checked) => setFormData({...formData, enable_auto_rebalance: checked})}
                />
              </div>

              <Button
                onClick={() => updateSettingsMutation.mutate(formData)}
                disabled={updateSettingsMutation.isPending}
                className="w-full bg-blue-500"
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}