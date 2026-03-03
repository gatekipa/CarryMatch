import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone, Package, MapPin, Clock, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const notificationTypes = [
  { key: 'shipment_received', icon: Package, title: 'Shipment Received', description: 'When your shipment is received at the origin facility', color: 'text-blue-400' },
  { key: 'shipment_in_transit', icon: MapPin, title: 'In Transit', description: 'When your shipment starts its journey', color: 'text-purple-400' },
  { key: 'shipment_arrived', icon: CheckCircle, title: 'Arrived at Destination', description: 'When your shipment reaches the destination facility', color: 'text-green-400' },
  { key: 'shipment_ready_pickup', icon: Bell, title: 'Ready for Pickup', description: 'When your shipment is ready to be collected', color: 'text-yellow-400' },
  { key: 'shipment_delivered', icon: CheckCircle, title: 'Delivered', description: 'When your shipment has been successfully delivered', color: 'text-green-400' },
  { key: 'shipment_delayed', icon: Clock, title: 'Delayed', description: 'When there are delays in your shipment', color: 'text-orange-400' },
  { key: 'shipment_on_hold', icon: AlertTriangle, title: 'On Hold', description: 'When your shipment is placed on hold', color: 'text-red-400' },
  { key: 'location_updates', icon: MapPin, title: 'Location Updates', description: 'Real-time location updates during transit', color: 'text-cyan-400' }
];

const channels = [
  { key: 'email', icon: Mail, label: 'Email' },
  { key: 'sms', icon: MessageSquare, label: 'SMS' },
  { key: 'push', icon: Smartphone, label: 'Push' }
];

export default function NotificationSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      setUser(user);
      const defaults = {};
      notificationTypes.forEach(type => {
        defaults[type.key] = user?.notification_preferences?.[type.key] || { email: true, sms: false, push: true };
      });
      setPreferences(defaults);
    }).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (newPrefs) => {
      await base44.auth.updateMe({ notification_preferences: newPrefs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setHasChanges(false);
    }
  });

  const handleToggle = (notifType, channel) => {
    setPreferences(prev => ({
      ...prev,
      [notifType]: { ...prev[notifType], [channel]: !prev[notifType]?.[channel] }
    }));
    setHasChanges(true);
  };

  const enableAll = () => {
    const allEnabled = {};
    notificationTypes.forEach(type => {
      allEnabled[type.key] = { email: true, sms: true, push: true };
    });
    setPreferences(allEnabled);
    setHasChanges(true);
  };

  const disableAll = () => {
    const allDisabled = {};
    notificationTypes.forEach(type => {
      allDisabled[type.key] = { email: false, sms: false, push: false };
    });
    setPreferences(allDisabled);
    setHasChanges(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("Home"))} className="mb-6 text-gray-300 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
                  <p className="text-sm text-gray-400">Customize how you receive shipment updates</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={enableAll} className="text-xs">Enable All</Button>
                <Button variant="outline" size="sm" onClick={disableAll} className="text-xs">Disable All</Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4">
            {notificationTypes.map((type, index) => {
              const TypeIcon = type.icon;
              return (
                <motion.div key={type.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className={`w-5 h-5 ${type.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">{type.title}</h3>
                          <p className="text-sm text-gray-400 mb-4">{type.description}</p>
                          <div className="flex flex-wrap gap-4">
                            {channels.map(channel => {
                              const ChannelIcon = channel.icon;
                              const isEnabled = preferences[type.key]?.[channel.key] || false;
                              return (
                                <div key={channel.key} className="flex items-center gap-2">
                                  <Switch checked={isEnabled} onCheckedChange={() => handleToggle(type.key, channel.key)} className="data-[state=checked]:bg-[#9EFF00]" />
                                  <Label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <ChannelIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">{channel.label}</span>
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {hasChanges && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sticky bottom-6">
              <Card className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-gray-300">You have unsaved changes</p>
                  </div>
                  <Button onClick={() => saveMutation.mutate(preferences)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold">
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}