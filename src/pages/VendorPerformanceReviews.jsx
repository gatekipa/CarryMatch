import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Star, TrendingUp, Award, AlertCircle, Plus, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function VendorPerformanceReviews() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    vendor_id: "",
    period_start: "",
    period_end: "",
    overall_rating: 5,
    feedback: "",
    strengths: [],
    improvements: []
  });

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== "admin") navigate(createPageUrl("Home"));
      setUser(user);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.filter({ status: "ACTIVE" }),
    enabled: !!user
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => base44.entities.VendorPerformanceReview.list("-created_date"),
    enabled: !!user
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['all-shipments'],
    queryFn: () => base44.entities.Shipment.list(),
    enabled: !!user
  });

  const calculateKPIs = (vendorId, startDate, endDate) => {
    const vendorShipments = shipments.filter(s => 
      s.vendor_id === vendorId &&
      new Date(s.created_date) >= new Date(startDate) &&
      new Date(s.created_date) <= new Date(endDate)
    );

    const delivered = vendorShipments.filter(s => s.status === 'DELIVERED');
    const delayed = vendorShipments.filter(s => s.status === 'DELAYED');
    
    const onTimeDeliveries = delivered.filter(s => {
      if (!s.estimated_delivery_date || !s.delivered_at) return false;
      return new Date(s.delivered_at) <= new Date(s.estimated_delivery_date);
    });

    const transitTimes = delivered.filter(s => s.created_date && s.delivered_at).map(s => {
      const created = new Date(s.created_date);
      const delivered = new Date(s.delivered_at);
      return (delivered - created) / (1000 * 60 * 60 * 24);
    });

    const avgTransitTime = transitTimes.length > 0 ? transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length : 0;
    const onTimeRate = delivered.length > 0 ? (onTimeDeliveries.length / delivered.length) * 100 : 0;
    const revenue = vendorShipments.reduce((sum, s) => sum + (s.total_amount || 0), 0);

    return {
      total_shipments: vendorShipments.length,
      on_time_delivery_rate: parseFloat(onTimeRate.toFixed(2)),
      average_transit_time: parseFloat(avgTransitTime.toFixed(2)),
      delayed_shipments: delayed.length,
      customer_satisfaction_score: 4.5,
      lost_damaged_rate: 0,
      response_time_hours: 2,
      revenue_generated: parseFloat(revenue.toFixed(2))
    };
  };

  const createReviewMutation = useMutation({
    mutationFn: async (data) => {
      const kpis = calculateKPIs(data.vendor_id, data.review_period_start, data.review_period_end);
      
      return await base44.entities.VendorPerformanceReview.create({
        vendor_id: data.vendor_id,
        review_period_start: data.review_period_start,
        review_period_end: data.review_period_end,
        kpis,
        overall_rating: data.overall_rating,
        strengths: data.strengths.filter(s => s.trim()),
        areas_for_improvement: data.improvements.filter(i => i.trim()),
        feedback: data.feedback,
        action_items: [],
        reviewed_by: user.email,
        vendor_acknowledged: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      setCreateDialogOpen(false);
      toast.success("Performance review created!");
    }
  });

  const acknowledgeReviewMutation = useMutation({
    mutationFn: async ({ reviewId, response }) => {
      return await base44.entities.VendorPerformanceReview.update(reviewId, {
        vendor_acknowledged: true,
        vendor_response: response
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
    }
  });

  const handleCreateReview = () => {
    if (!reviewFormData.vendor_id || !reviewFormData.period_start || !reviewFormData.period_end) {
      toast.error("Please fill in all required fields");
      return;
    }
    createReviewMutation.mutate(reviewFormData);
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.display_name || "Unknown Vendor";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Award className="w-8 h-8 text-[#9EFF00]" />
                Vendor Performance Reviews
              </h1>
              <p className="text-gray-400">Evaluate and track vendor performance with configurable KPIs</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A]">
                <Plus className="w-4 h-4 mr-2" />
                Create Review
              </Button>
              <Button variant="outline" onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))} className="border-white/10 text-gray-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No performance reviews yet</p>
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#9EFF00] text-[#1A1A1A]">
                Create First Review
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {reviews.map(review => (
                <Card key={review.id} className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.07] transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{getVendorName(review.vendor_id)}</h3>
                      <p className="text-sm text-gray-400">
                        {format(new Date(review.review_period_start), "MMM d, yyyy")} - {format(new Date(review.review_period_end), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < review.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-white">{review.overall_rating}/5</span>
                    </div>
                  </div>

                  {/* KPIs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Total Shipments</p>
                      <p className="text-xl font-bold text-white">{review.kpis?.total_shipments || 0}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">On-Time Rate</p>
                      <p className="text-xl font-bold text-green-400">{review.kpis?.on_time_delivery_rate || 0}%</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Avg Transit Time</p>
                      <p className="text-xl font-bold text-blue-400">{review.kpis?.average_transit_time || 0}d</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Revenue</p>
                      <p className="text-xl font-bold text-[#9EFF00]">${review.kpis?.revenue_generated || 0}</p>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {review.strengths?.length > 0 && (
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {review.strengths.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.areas_for_improvement?.length > 0 && (
                      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <h4 className="font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Areas for Improvement
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {review.areas_for_improvement.map((a, i) => (
                            <li key={i}>• {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {review.feedback && (
                    <div className="p-4 bg-white/5 rounded-lg mb-4">
                      <p className="text-sm text-gray-300">{review.feedback}</p>
                    </div>
                  )}

                  {/* Vendor Response */}
                  {review.vendor_acknowledged && review.vendor_response && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <h4 className="font-semibold text-blue-300 mb-2">Vendor Response</h4>
                      <p className="text-sm text-gray-300">{review.vendor_response}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-gray-500">
                      Reviewed by {review.reviewed_by} on {format(new Date(review.created_date), "MMM d, yyyy")}
                    </div>
                    {review.vendor_acknowledged ? (
                      <Badge className="bg-green-500/20 text-green-300">Acknowledged</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-300">Pending Acknowledgment</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Review Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Create Performance Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Vendor *</Label>
              <select value={reviewFormData.vendor_id} onChange={(e) => setReviewFormData({...reviewFormData, vendor_id: e.target.value})} className="w-full mt-2 p-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="">Select vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.display_name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Period Start *</Label>
                <Input type="date" value={reviewFormData.period_start} onChange={(e) => setReviewFormData({...reviewFormData, period_start: e.target.value})} className="bg-white/5 border-white/10 text-white mt-2" />
              </div>
              <div>
                <Label className="text-gray-300">Period End *</Label>
                <Input type="date" value={reviewFormData.period_end} onChange={(e) => setReviewFormData({...reviewFormData, period_end: e.target.value})} className="bg-white/5 border-white/10 text-white mt-2" />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Overall Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button key={rating} type="button" onClick={() => setReviewFormData({...reviewFormData, overall_rating: rating})} className="p-2">
                    <Star className={`w-8 h-8 ${rating <= reviewFormData.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Strengths (comma-separated)</Label>
              <Input placeholder="Fast delivery, excellent communication, ..." onChange={(e) => setReviewFormData({...reviewFormData, strengths: e.target.value.split(',')})} className="bg-white/5 border-white/10 text-white mt-2" />
            </div>

            <div>
              <Label className="text-gray-300">Areas for Improvement (comma-separated)</Label>
              <Input placeholder="Documentation, response time, ..." onChange={(e) => setReviewFormData({...reviewFormData, improvements: e.target.value.split(',')})} className="bg-white/5 border-white/10 text-white mt-2" />
            </div>

            <div>
              <Label className="text-gray-300">Feedback</Label>
              <Textarea value={reviewFormData.feedback} onChange={(e) => setReviewFormData({...reviewFormData, feedback: e.target.value})} placeholder="Detailed feedback..." rows={4} className="bg-white/5 border-white/10 text-white mt-2" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-white/10">
                Cancel
              </Button>
              <Button onClick={handleCreateReview} className="bg-[#9EFF00] text-[#1A1A1A]">
                Create Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}