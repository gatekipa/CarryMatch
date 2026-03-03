import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Clock, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ETAMonitorDashboard() {
  const queryClient = useQueryClient();

  const { data: departedTrips = [] } = useQuery({
    queryKey: ['departed-trips-monitor'],
    queryFn: () => base44.entities.Trip.filter({ 
      trip_status: 'departed' 
    }),
    refetchInterval: 60000
  });

  const { data: recentUpdates = [] } = useQuery({
    queryKey: ['recent-eta-updates'],
    queryFn: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      return await base44.entities.TripStatusUpdate.filter({
        update_type: 'delayed',
        created_date: { $gte: oneHourAgo }
      }, '-created_date');
    },
    refetchInterval: 60000
  });

  const runMonitorMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('autoETAMonitor', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['departed-trips-monitor']);
      queryClient.invalidateQueries(['recent-eta-updates']);
      toast.success(`Checked ${data.trips_checked} trips - Updated ${data.etas_updated} ETAs`);
    },
    onError: (error) => {
      toast.error("Monitor failed: " + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">ETA Monitoring</h2>
            <p className="text-sm text-gray-400">Auto-updates ETAs every 15 minutes for departed trips</p>
          </div>
          <Button
            onClick={() => runMonitorMutation.mutate()}
            disabled={runMonitorMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${runMonitorMutation.isPending ? 'animate-spin' : ''}`} />
            Run Check Now
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-blue-500/10 border-blue-500/30 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{departedTrips.length}</div>
            <div className="text-xs text-gray-400">Active Trips</div>
          </Card>
          <Card className="p-4 bg-orange-500/10 border-orange-500/30 text-center">
            <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{recentUpdates.length}</div>
            <div className="text-xs text-gray-400">ETA Updates (1h)</div>
          </Card>
          <Card className="p-4 bg-green-500/10 border-green-500/30 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {recentUpdates.filter(u => u.notifications_sent).length}
            </div>
            <div className="text-xs text-gray-400">Notifications Sent</div>
          </Card>
        </div>

        {/* Recent Updates */}
        <div>
          <h3 className="font-semibold text-white mb-3">Recent ETA Updates</h3>
          {recentUpdates.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No recent updates</p>
          ) : (
            <div className="space-y-2">
              {recentUpdates.slice(0, 10).map((update) => (
                <Card key={update.id} className="p-3 bg-white/5 border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{update.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(update.created_date), "MMM d, HH:mm")} • 
                        {update.delay_minutes ? ` +${update.delay_minutes} min` : ''}
                      </p>
                    </div>
                    {update.notifications_sent && (
                      <Badge className="bg-green-500/20 text-green-400 ml-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Notified
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}