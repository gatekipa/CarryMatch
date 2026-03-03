import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PromoAnalytics() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['promo-codes', operator?.id],
    queryFn: () => base44.entities.PromoCode.filter({ operator_id: operator.id }, '-created_date'),
    enabled: !!operator
  });

  const { data: promoUsageLogs = [] } = useQuery({
    queryKey: ['promo-usage', operator?.id],
    queryFn: async () => {
      return await base44.entities.AuditLog.filter({
        operator_id: operator.id,
        action_type: "promo_code_used"
      }, '-created_date');
    },
    enabled: !!operator
  });

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

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  // Calculate analytics
  const promoStats = promoCodes.map(promo => {
    const usage = promoUsageLogs.filter(log => log.entity_id === promo.id);
    const totalDiscount = usage.reduce((sum, log) => sum + (log.payload_json?.discount_xaf || 0), 0);
    
    return {
      ...promo,
      redemptions: usage.length,
      totalDiscount,
      lastUsed: usage.length > 0 ? usage[0].created_date : null
    };
  });

  const totalRedemptions = promoStats.reduce((sum, p) => sum + p.redemptions, 0);
  const totalDiscountGiven = promoStats.reduce((sum, p) => sum + p.totalDiscount, 0);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Promo Code Analytics</h1>
          <p className="text-gray-400">Track redemptions and revenue impact</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Active Codes</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {promoCodes.filter(p => p.is_active).length}
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Redemptions</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalRedemptions}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Total Discount Given</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {totalDiscountGiven.toLocaleString()} XAF
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Avg Discount</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {totalRedemptions > 0 ? Math.round(totalDiscountGiven / totalRedemptions).toLocaleString() : 0} XAF
            </div>
          </Card>
        </div>

        {/* Promo Code Performance Table */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">Promo Code Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Code</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Discount</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Redemptions</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Given</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Used</th>
                </tr>
              </thead>
              <tbody>
                {promoStats.map((promo) => (
                  <tr key={promo.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className="text-white font-semibold">{promo.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={promo.discount_type === 'percentage' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}>
                        {promo.discount_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-white">
                      {promo.discount_type === 'percentage' 
                        ? `${promo.discount_value}%` 
                        : `${promo.discount_value.toLocaleString()} XAF`}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {promo.redemptions}
                      {promo.max_uses && (
                        <span className="text-gray-400 text-xs ml-1">/ {promo.max_uses}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {promo.totalDiscount.toLocaleString()} XAF
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={promo.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {promo.lastUsed ? format(new Date(promo.lastUsed), "MMM d, h:mm a") : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {promoStats.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No promo codes yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}