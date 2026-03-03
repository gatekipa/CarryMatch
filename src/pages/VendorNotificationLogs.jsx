import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Phone, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function VendorNotificationLogs() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
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
          if (vendors) {
            setVendor(vendors?.[0]);
          }
        });
    }
  }, [user]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['vendor-notification-logs', vendor?.id, filterType, filterChannel],
    queryFn: async () => {
      if (!vendor) return [];
      let query = { vendor_id: vendor.id };
      if (filterType !== "all") query.notification_type = filterType;
      if (filterChannel !== "all") query.channel = filterChannel;
      return await base44.entities.ShipmentNotification.filter(query, "-created_date", 100);
    },
    enabled: !!vendor
  });

  const getChannelIcon = (channel) => {
    switch (channel) {
      case "EMAIL": return Mail;
      case "SMS": return Phone;
      case "WHATSAPP": return MessageSquare;
      default: return Mail;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SENT": return "bg-green-500/20 text-green-300";
      case "READ": return "bg-blue-500/20 text-blue-300";
      case "FAILED": return "bg-red-500/20 text-red-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
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
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notification Logs</h1>
              <p className="text-gray-400">Track customer notifications</p>
            </div>
            <div className="flex gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="READY_PICKUP">Ready Pickup</SelectItem>
                  <SelectItem value="DELAYED">Delayed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading notifications...</p>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No notifications found</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notif, index) => {
                const ChannelIcon = getChannelIcon(notif.channel);
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="p-4 bg-white/5 border-white/10 hover:bg-white/[0.07] transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <ChannelIcon className="w-4 h-4 text-blue-400" />
                            <h3 className="text-white font-bold font-mono text-sm">{notif.tracking_code}</h3>
                            <Badge className="bg-white/10 text-gray-300 text-xs">
                              {notif.notification_type}
                            </Badge>
                            <Badge className={`${getStatusColor(notif.status)} text-xs`}>
                              {notif.status === "SENT" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {notif.status === "FAILED" && <XCircle className="w-3 h-3 mr-1" />}
                              {notif.status === "READ" && <Eye className="w-3 h-3 mr-1" />}
                              {notif.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                              {notif.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <p>To: {notif.recipient_name} ({notif.recipient_email || notif.recipient_phone})</p>
                            <p>Subject: {notif.message_subject}</p>
                            {notif.sent_at && (
                              <p className="text-xs">Sent: {format(new Date(notif.sent_at), "MMM d, yyyy 'at' h:mm a")}</p>
                            )}
                            {notif.read_at && (
                              <p className="text-xs text-blue-400">Read: {format(new Date(notif.read_at), "MMM d, yyyy 'at' h:mm a")}</p>
                            )}
                            {notif.failure_reason && (
                              <p className="text-xs text-red-400">Error: {notif.failure_reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}