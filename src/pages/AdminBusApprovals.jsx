import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, CheckCircle, X, Shield } from "lucide-react";
import { format } from "date-fns";

export default function AdminBusApprovals() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: pendingOperators = [] } = useQuery({
    queryKey: ['pending-bus-operators'],
    queryFn: async () => {
      return await base44.entities.BusOperator.filter({ status: "pending" }, "-created_date");
    },
    enabled: !!user && user.role === 'admin'
  });

  const approveMutation = useMutation({
    mutationFn: async (operatorId) => {
      return await base44.entities.BusOperator.update(operatorId, {
        status: "active",
        approval_date: new Date().toISOString(),
        approved_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-bus-operators'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (operatorId) => {
      return await base44.entities.BusOperator.update(operatorId, {
        status: "suspended"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-bus-operators'] });
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-2xl font-bold text-white">Admin Only</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Bus Operator Approvals</h1>

        {pendingOperators.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Pending Applications</h3>
            <p className="text-gray-400">All bus operator applications have been reviewed</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingOperators.map((op) => (
              <Card key={op.id} className="p-6 bg-white/5 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {op.logo_url ? (
                      <img src={op.logo_url} alt={op.name} onError={(e) => { e.target.style.display="none" }} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Bus className="w-8 h-8 text-blue-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">{op.name}</h3>
                      {op.legal_name && <p className="text-sm text-gray-400">{op.legal_name}</p>}
                      <div className="flex gap-4 mt-2 text-sm text-gray-300">
                        <span>📞 {op.phone}</span>
                        <span>📧 {op.email}</span>
                        {op.hq_city && <span>📍 {op.hq_city}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Applied {format(new Date(op.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveMutation.mutate(op.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(op.id)}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}