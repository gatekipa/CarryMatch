import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, CheckCircle, XCircle, Clock, FileText, Key, Copy,
  ArrowLeft, TrendingUp, Users, AlertTriangle, Search, Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import ReviewPaymentDialog from "@/components/admin/ReviewPaymentDialog";

export default function CarryMatchAdminBilling() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== "admin") navigate(createPageUrl("Home"));
      setUser(user);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: allPayments = [] } = useQuery({
    queryKey: ['admin-all-payments'],
    queryFn: async () => await base44.entities.SubscriptionPayment.list("-created_date", 200),
    enabled: !!user
  });

  const { data: redemptionCodes = [] } = useQuery({
    queryKey: ['admin-redemption-codes'],
    queryFn: async () => await base44.entities.RedemptionCode.list("-created_date", 200),
    enabled: !!user
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin-vendors-lookup'],
    queryFn: async () => await base44.entities.Vendor.list("-created_date", 500),
    enabled: !!user
  });

  const vendorMap = useMemo(() => {
    const map = {};
    vendors.forEach(v => { map[v.id] = v.display_name || v.legal_name || v.id; });
    return map;
  }, [vendors]);

  const getVendorName = (vendorId) => vendorMap[vendorId] || vendorId;

  const pendingPayments = allPayments.filter(p => p.status === "AWAITING_VERIFICATION");
  const approvedPayments = allPayments.filter(p => p.status === "APPROVED");
  const rejectedPayments = allPayments.filter(p => p.status === "REJECTED");

  const stats = useMemo(() => {
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeCodes = redemptionCodes.filter(c => c.status === "ACTIVATED");
    const pendingCodes = redemptionCodes.filter(c => c.status === "SENT");
    const expiredCodes = redemptionCodes.filter(c => {
      if (c.status === "SENT" && c.expires_at) return new Date(c.expires_at) < new Date();
      return c.status === "EXPIRED";
    });
    const activeVendors = new Set(activeCodes.map(c => c.vendor_id)).size;
    return { totalRevenue, activeCodes: activeCodes.length, pendingCodes: pendingCodes.length, expiredCodes: expiredCodes.length, activeVendors };
  }, [approvedPayments, redemptionCodes]);

  const filterBySearch = (items) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      const vendorName = getVendorName(item.vendor_id).toLowerCase();
      return vendorName.includes(q) || (item.plan_name || '').toLowerCase().includes(q) ||
        (item.vendor_id || '').toLowerCase().includes(q) || (item.code || '').toLowerCase().includes(q) ||
        (item.payment_reference || '').toLowerCase().includes(q);
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Copied: ${text}`));
  };

  if (!user) return null;

  const StatCard = ({ label, value, icon: Icon, color, alert }) => (
    <Card className={`p-4 bg-white/5 border-white/10 ${alert ? 'border-yellow-500/50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  );

  const PaymentCard = ({ payment, borderColor }) => (
    <Card className={`p-5 bg-white/5 border-white/10 border-l-4 ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-white">{getVendorName(payment.vendor_id)}</h3>
            <Badge className="bg-white/10 text-white">{payment.plan_name}</Badge>
            <Badge className={
              payment.status === "AWAITING_VERIFICATION" ? "bg-yellow-500/20 text-yellow-300" :
              payment.status === "APPROVED" ? "bg-green-500/20 text-green-300" :
              "bg-red-500/20 text-red-300"
            }>{payment.status === "AWAITING_VERIFICATION" ? "Awaiting Review" : payment.status}</Badge>
          </div>
          <div className="grid md:grid-cols-4 gap-2 text-sm text-gray-400">
            <p>Amount: <span className="text-white font-medium">${payment.amount}</span></p>
            <p>Period: <span className="text-white">{payment.billing_period}</span></p>
            <p>Method: <span className="text-white">{(payment.payment_method || '').replace(/_/g, ' ')}</span></p>
            <p>Submitted: <span className="text-white">{format(new Date(payment.created_date), "MMM d, yyyy")}</span></p>
          </div>
          {payment.rejection_reason && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
              Reason: {payment.rejection_reason}
            </div>
          )}
          {payment.reviewed_by && (
            <p className="text-xs text-gray-500 mt-1">Reviewed by {payment.reviewed_by} on {payment.reviewed_at ? format(new Date(payment.reviewed_at), "MMM d") : "N/A"}</p>
          )}
        </div>
        {payment.status === "AWAITING_VERIFICATION" && (
          <div className="flex gap-2 ml-4">
            {payment.proof_url && (
              <Button onClick={() => window.open(payment.proof_url, "_blank")} size="sm" variant="outline" className="border-white/10 text-gray-300">
                <FileText className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={() => setSelectedPayment(payment)} size="sm" className="bg-[#9EFF00] text-[#1A1A1A] font-bold">Review</Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))} className="text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Billing & Subscriptions</h1>
              <p className="text-gray-400 mt-1">Manage vendor payments, redemption codes, and plan activations</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(createPageUrl("CarryMatchAdminSystemConfig"))} className="border-white/10 text-gray-300">
            <Settings className="w-4 h-4 mr-2" /> System Config
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="from-green-500 to-emerald-600" />
          <StatCard label="Active Subscriptions" value={stats.activeCodes} icon={CheckCircle} color="from-blue-500 to-cyan-600" />
          <StatCard label="Pending Review" value={pendingPayments.length} icon={Clock} color="from-yellow-500 to-orange-500" alert={pendingPayments.length > 0} />
          <StatCard label="Active Vendors" value={stats.activeVendors} icon={Users} color="from-purple-500 to-pink-500" />
          <StatCard label="Expired Codes" value={stats.expiredCodes} icon={AlertTriangle} color="from-red-500 to-pink-600" />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <Input placeholder="Search by vendor name, plan, reference, or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white pl-10" />
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-2" />Pending ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="approved"><CheckCircle className="w-4 h-4 mr-2" />Approved ({approvedPayments.length})</TabsTrigger>
            <TabsTrigger value="rejected"><XCircle className="w-4 h-4 mr-2" />Rejected ({rejectedPayments.length})</TabsTrigger>
            <TabsTrigger value="codes"><Key className="w-4 h-4 mr-2" />Codes ({redemptionCodes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {filterBySearch(pendingPayments).length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No pending payments to review</p>
              </Card>
            ) : (
              <div className="space-y-3">{filterBySearch(pendingPayments).map(p => <PaymentCard key={p.id} payment={p} borderColor="border-l-yellow-500" />)}</div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {filterBySearch(approvedPayments).length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center"><p className="text-gray-400">No approved payments yet</p></Card>
            ) : (
              <div className="space-y-3">{filterBySearch(approvedPayments).map(p => <PaymentCard key={p.id} payment={p} borderColor="border-l-green-500" />)}</div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {filterBySearch(rejectedPayments).length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center"><p className="text-gray-400">No rejected payments</p></Card>
            ) : (
              <div className="space-y-3">{filterBySearch(rejectedPayments).map(p => <PaymentCard key={p.id} payment={p} borderColor="border-l-red-500" />)}</div>
            )}
          </TabsContent>

          <TabsContent value="codes">
            {filterBySearch(redemptionCodes).length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <Key className="w-16 h-16 mx-auto mb-4 text-gray-500" /><p className="text-gray-400">No codes generated yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filterBySearch(redemptionCodes).map((code, idx) => {
                  const isExpiringSoon = code.status === "SENT" && code.expires_at && differenceInDays(new Date(code.expires_at), new Date()) <= 3 && new Date(code.expires_at) > new Date();
                  const isExpired = code.status === "SENT" && code.expires_at && new Date(code.expires_at) < new Date();
                  return (
                    <Card key={code.id} className={`p-5 bg-white/5 border-white/10 border-l-4 ${isExpired ? 'border-l-red-500 opacity-60' : isExpiringSoon ? 'border-l-yellow-500' : code.status === "ACTIVATED" ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white font-mono tracking-wider">{code.code}</h3>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(code.code)} className="text-gray-400 hover:text-white h-7 px-2">
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Badge className={
                              code.status === "ACTIVATED" ? "bg-green-500/20 text-green-300" :
                              isExpired ? "bg-red-500/20 text-red-300" :
                              isExpiringSoon ? "bg-yellow-500/20 text-yellow-300" :
                              "bg-blue-500/20 text-blue-300"
                            }>{isExpired ? "EXPIRED" : isExpiringSoon ? "EXPIRING SOON" : code.status}</Badge>
                            <Badge className="bg-white/10 text-white text-xs">{code.plan_name}</Badge>
                          </div>
                          <div className="grid md:grid-cols-4 gap-2 text-sm text-gray-400">
                            <p>Vendor: <span className="text-white">{getVendorName(code.vendor_id)}</span></p>
                            <p>Period: <span className="text-white">{code.billing_period}</span></p>
                            <p>Generated: <span className="text-white">{code.generated_at ? format(new Date(code.generated_at), "MMM d, yyyy") : "N/A"}</span></p>
                            {code.activated_at ? (
                              <p>Activated: <span className="text-green-400">{format(new Date(code.activated_at), "MMM d, yyyy")}</span> by {code.activated_by}</p>
                            ) : code.expires_at ? (
                              <p>Expires: <span className={isExpired ? "text-red-400" : isExpiringSoon ? "text-yellow-400" : "text-white"}>
                                {format(new Date(code.expires_at), "MMM d, yyyy")}
                                {isExpiringSoon && ` (${differenceInDays(new Date(code.expires_at), new Date())}d left)`}
                              </span></p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedPayment && (
        <ReviewPaymentDialog
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-all-payments'] });
            queryClient.invalidateQueries({ queryKey: ['admin-redemption-codes'] });
          }}
        />
      )}
    </div>
  );
}
