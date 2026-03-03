import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, FileText, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function MyDisputes() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['my-disputes', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const myDisputes = await base44.entities.Dispute.filter({
        complainant_email: user.email
      }, "-created_date");
      return myDisputes;
    },
    enabled: !!user
  });

  const statusColors = {
    open: "bg-red-500/20 text-red-400 border-red-500/30",
    under_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    resolved: "bg-green-500/20 text-green-400 border-green-500/30",
    closed: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };

  const disputeTypeLabels = {
    item_damaged: "Item Damaged",
    no_show: "No Show",
    wrong_item: "Wrong Item",
    late_delivery: "Late Delivery",
    payment_issue: "Payment Issue",
    other: "Other"
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">You need to be signed in to view disputes</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Disputes</h1>
              <p className="text-gray-400">Track and manage your dispute cases</p>
            </div>
            <Link to={createPageUrl("SubmitDispute")}>
              <Button className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                New Dispute
              </Button>
            </Link>
          </div>

          {/* Disputes List */}
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                  <div className="h-6 bg-white/10 rounded mb-3" />
                  <div className="h-4 bg-white/10 rounded" />
                </Card>
              ))}
            </div>
          ) : disputes.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No disputes</h3>
              <p className="text-gray-400 mb-6">
                You haven't filed any disputes yet. We hope you never need to!
              </p>
              <Link to={createPageUrl("SubmitDispute")}>
                <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                  Submit a Dispute
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute, index) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {disputeTypeLabels[dispute.dispute_type]}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Against: {dispute.respondent_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge className={statusColors[dispute.status]}>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                        {dispute.priority === 'high' && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            High Priority
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 line-clamp-2">{dispute.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Filed {format(new Date(dispute.created_date), "MMM d, yyyy")}</span>
                      </div>
                      {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                        <Badge variant="outline" className="border-white/10 text-gray-400">
                          {dispute.evidence_urls.length} evidence file(s)
                        </Badge>
                      )}
                    </div>

                    {dispute.resolution && (
                      <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm font-semibold text-green-400 mb-1">Resolution:</p>
                        <p className="text-sm text-gray-300">{dispute.resolution}</p>
                      </div>
                    )}

                    {dispute.status === 'open' && (
                      <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-400">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Waiting for admin review. You'll be contacted within 24-48 hours.
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}