import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Calendar, Weight, DollarSign, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function MyRequests() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ['my-requests', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Fetch only user's requests by email
      const byCreator = await base44.entities.ShipmentRequest.filter({ 
        created_by: user.email 
      }, "-created_date");
      const byRequester = await base44.entities.ShipmentRequest.filter({ 
        requester_email: user.email 
      }, "-created_date");
      // Merge and deduplicate
      const seen = new Set();
      return [...byCreator, ...byRequester].filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    },
    enabled: !!user
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading...</h3>
            <p className="text-gray-400">Fetching your requests</p>
          </Card>
        </div>
      </div>
    );
  }

  const activeRequests = myRequests.filter(r => r.status === "active");
  const completedRequests = myRequests.filter(r => r.status === "completed");
  const otherRequests = myRequests.filter(r => r.status !== "active" && r.status !== "completed");

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Requests</span>
              </h1>
              <p className="text-gray-400">Track your shipment requests</p>
            </div>
            <Link to={createPageUrl("PostRequest")}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Send an Item
              </Button>
            </Link>
          </div>

          {myRequests.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">You have not posted any send requests yet</h3>
              <p className="text-gray-400 mb-6">Find travelers to deliver your items worldwide</p>
              <Link to={createPageUrl("PostRequest")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Send Your First Item
                </Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Active Requests */}
              {activeRequests.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active Requests ({activeRequests.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {activeRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          layout
                        >
                          <Link to={createPageUrl("RequestDetails", `id=${request.id}`)}>
                            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm cursor-pointer">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-white font-semibold">{request.from_city}</span>
                                    <ArrowRight className="w-4 h-4 text-purple-400" />
                                    <span className="text-white font-semibold">{request.to_city}</span>
                                  </div>
                                  <p className="text-sm text-gray-400">{request.from_country} → {request.to_country}</p>
                                </div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {request.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-300 mb-3 line-clamp-2">{request.item_description}</p>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                  <Calendar className="w-4 h-4 text-purple-400" />
                                  Needed by: {request.needed_by_date ? format(new Date(request.needed_by_date), "MMM d, yyyy") : "No date"}
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                  <Weight className="w-4 h-4 text-green-400" />
                                  Weight: {request.estimated_weight_kg} kg
                                </div>
                                {request.offered_price && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <DollarSign className="w-4 h-4 text-yellow-400" />
                                    Offered: ${request.offered_price}
                                  </div>
                                )}
                                {request.urgency && (
                                  <Badge className={
                                    request.urgency === "high" ? "bg-red-500/20 text-red-400" :
                                    request.urgency === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-blue-500/20 text-blue-400"
                                  }>
                                    {request.urgency} urgency
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Completed Requests */}
              {completedRequests.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Completed Requests ({completedRequests.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {completedRequests.map((request) => (
                      <Link key={request.id} to={createPageUrl("RequestDetails", `id=${request.id}`)}>
                        <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm cursor-pointer opacity-75">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-semibold">{request.from_city}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="text-white font-semibold">{request.to_city}</span>
                              </div>
                              <p className="text-sm text-gray-400">{request.from_country} → {request.to_country}</p>
                            </div>
                            <Badge className="bg-gray-500/20 text-gray-400">
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">{request.item_description}</p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Requests */}
              {otherRequests.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Other Requests ({otherRequests.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {otherRequests.map((request) => (
                      <Link key={request.id} to={createPageUrl("RequestDetails", `id=${request.id}`)}>
                        <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm cursor-pointer">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-semibold">{request.from_city}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="text-white font-semibold">{request.to_city}</span>
                              </div>
                              <p className="text-sm text-gray-400">{request.from_country} → {request.to_country}</p>
                            </div>
                            <Badge className={
                              request.status === "matched" ? "bg-yellow-500/20 text-yellow-400" :
                              request.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                              "bg-gray-500/20 text-gray-400"
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">{request.item_description}</p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}