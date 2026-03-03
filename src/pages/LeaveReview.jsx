
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LeaveReview() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("matchId");
  const revieweeEmail = urlParams.get("revieweeEmail");
  const reviewType = urlParams.get("type"); // 'traveler' or 'requester'

  const [user, setUser] = useState(null);
  const [match, setMatch] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryRatings, setCategoryRatings] = useState({
    communication: 0,
    punctuality: 0,
    professionalism: 0,
    item_condition: 0
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (matchId) {
      base44.entities.Match.filter({ id: matchId }).then(matches => {
        if (matches.length > 0) {
          setMatch(matches[0]);
        }
      });
    }
  }, [matchId]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.file_url);
      setPhotoUrls([...photoUrls, ...newUrls]);
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    }
    setIsUploading(false);
  };

  const removePhoto = (index) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select an overall rating");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }

    setIsSubmitting(true);
    try {
      // Duplicate review check
      const existingReviews = await base44.entities.Review.filter({
        match_id: matchId,
        reviewer_email: user.email
      });
      if (existingReviews.length > 0) {
        toast.error("You have already reviewed this match");
        setIsSubmitting(false);
        return;
      }

      // Get reviewee name
      const users = await base44.entities.User.filter({ email: revieweeEmail });
      const revieweeName = users[0]?.full_name || revieweeEmail;

      // Create review with category ratings
      await base44.entities.Review.create({
        match_id: matchId,
        trip_id: match?.trip_id || "",
        request_id: match?.shipment_request_id || "",
        reviewer_email: user.email,
        reviewer_name: user.full_name || user.email,
        reviewee_email: revieweeEmail,
        reviewee_name: revieweeName,
        rating: rating,
        review_text: reviewText,
        review_type: reviewType,
        is_verified: true,
        photo_urls: photoUrls,
        category_ratings: categoryRatings
      });

      // Update reviewee's average rating AND trust_score
      const allReviews = await base44.entities.Review.filter({ 
        reviewee_email: revieweeEmail,
        is_hidden: false
      });
      
      // allReviews now includes the just-created review
      const reviewCount = allReviews.length;
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

      // Calculate trust_score: weighted combo of rating, review count, verification
      const reviewee = users[0];
      const verifiedBonus = reviewee?.is_verified ? 15 : 0;
      const deliveryCountBonus = Math.min((reviewee?.verified_deliveries_count || 0) * 2, 20);
      const ratingScore = Math.round((avgRating / 5) * 50);
      const volumeScore = Math.min(reviewCount * 3, 15);
      const trustScore = Math.min(ratingScore + volumeScore + verifiedBonus + deliveryCountBonus, 100);

      // Determine trust level
      let trustLevel = "new";
      if (trustScore >= 80) trustLevel = "excellent";
      else if (trustScore >= 60) trustLevel = "good";
      else if (trustScore >= 40) trustLevel = "average";
      else if (trustScore >= 20) trustLevel = "building";

      await base44.entities.User.filter({ email: revieweeEmail }).then(async users => {
        if (users.length > 0) {
          await base44.entities.User.update(users[0].id, {
            average_rating: Math.round(avgRating * 10) / 10,
            total_reviews: reviewCount,
            trust_score: trustScore,
            trust_level: trustLevel
          });
        }
      });

      // Create notification
      await base44.entities.Notification.create({
        user_email: revieweeEmail,
        type: "review",
        title: "⭐ New Review Received",
        message: `${user.full_name || user.email} left you a ${rating}-star review`,
        link_url: createPageUrl("UserProfile", `email=${revieweeEmail}`),
        priority: "normal"
      });

      toast.success("Review submitted successfully!");
      navigate(createPageUrl("MyMatches"));
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Leave a Review</h1>
              <p className="text-gray-400">
                Share your experience with {revieweeEmail}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Overall Star Rating */}
              <div className="text-center">
                <Label className="text-gray-300 block mb-4 text-lg">
                  How was your overall experience?
                </Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-12 h-12 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="mt-3 text-gray-300">
                    {rating === 5 && "Excellent! 🎉"}
                    {rating === 4 && "Great! 👍"}
                    {rating === 3 && "Good 👌"}
                    {rating === 2 && "Fair 😐"}
                    {rating === 1 && "Poor 😞"}
                  </p>
                )}
              </div>

              {/* Category Ratings */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <Label className="text-white mb-4 block text-lg font-semibold">
                  Rate Specific Aspects
                </Label>
                <div className="space-y-4">
                  {[
                    { key: 'communication', label: 'Communication', icon: '💬' },
                    { key: 'punctuality', label: 'Punctuality', icon: '⏰' },
                    { key: 'professionalism', label: 'Professionalism', icon: '👔' },
                    { key: 'item_condition', label: 'Item Condition', icon: '📦' }
                  ].map(({ key, label, icon }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">
                          {icon} {label}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCategoryRatings(prev => ({...prev, [key]: star}))}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= categoryRatings[key]
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Tell us more about your experience *
                </Label>
                <Textarea
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about communication, punctuality, professionalism, and overall experience..."
                  rows={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <p className="text-sm text-gray-400 mt-2">
                  {reviewText.length}/500 characters
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Add Photos (Optional)
                </Label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Review photo ${index + 1}`}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {photoUrls.length < 5 && (
                    <>
                      <input
                        type="file"
                        id="review-photos"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('review-photos').click()}
                        disabled={isUploading}
                        className="border-white/10 text-gray-300 hover:text-white"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Add Photos
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  <p className="text-sm text-gray-400">
                    You can upload up to 5 photos
                  </p>
                </div>
              </div>

              {/* Guidelines */}
              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <p className="text-sm text-gray-300 leading-relaxed">
                  💡 <strong>Review Guidelines:</strong> Be honest and constructive. 
                  Focus on the transaction experience. Avoid personal attacks or inappropriate content. 
                  Reviews help build trust in our community.
                </p>
              </Card>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 border-white/10 text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="flex-1 bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
