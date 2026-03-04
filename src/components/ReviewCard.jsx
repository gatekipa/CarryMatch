import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ReviewCard({ review, currentUser, onUpdate }) {
  const queryClient = useQueryClient();
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState(review.response || "");

  const isReviewee = currentUser?.email === review.reviewee_email;
  const hasVoted = review.voted_by?.includes(currentUser?.email);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (voteType) => {
      if (hasVoted) {
        toast.error("You've already voted on this review");
        return;
      }

      const updates = {
        voted_by: [...(review.voted_by || []), currentUser.email]
      };

      if (voteType === 'helpful') {
        updates.helpful_count = (review.helpful_count || 0) + 1;
      } else {
        updates.unhelpful_count = (review.unhelpful_count || 0) + 1;
      }

      await base44.entities.Review.update(review.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      toast.success("Thank you for your feedback!");
    }
  });

  // Response mutation
  const responseMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Review.update(review.id, {
        response: responseText,
        response_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews'] });
      setShowResponse(false);
      toast.success("Response posted successfully!");
      if (onUpdate) onUpdate();
    }
  });

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            {review.is_verified && (
              <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Verified Purchase
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-400">
            by {review.reviewer_name} • {format(new Date(review.created_date), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Review Text */}
      {review.review_text && (
        <p className="text-gray-300 leading-relaxed mb-4">{review.review_text}</p>
      )}

      {/* Category Ratings */}
      {review.category_ratings && (
        <div className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-lg bg-white/5">
          {Object.entries(review.category_ratings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Photos */}
      {review.photo_urls && review.photo_urls.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {review.photo_urls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Review photo ${index + 1}`}
              className="w-24 h-24 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* Helpful Votes */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
        <span className="text-sm text-gray-400">Was this helpful?</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => voteMutation.mutate('helpful')}
          disabled={hasVoted || voteMutation.isPending || !currentUser}
          className={`border-white/10 ${
            hasVoted ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          {review.helpful_count || 0}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => voteMutation.mutate('unhelpful')}
          disabled={hasVoted || voteMutation.isPending || !currentUser}
          className={`border-white/10 ${
            hasVoted ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ThumbsDown className="w-4 h-4 mr-1" />
          {review.unhelpful_count || 0}
        </Button>
      </div>

      {/* Response Section */}
      {review.response && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">Response from {review.reviewee_name}</span>
            <span className="text-xs text-gray-500">
              • {format(new Date(review.response_date), "MMM d, yyyy")}
            </span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{review.response}</p>
        </div>
      )}

      {/* Response Form */}
      {isReviewee && !review.response && currentUser && (
        <div>
          {!showResponse ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResponse(true)}
              className="border-white/10 text-gray-300 hover:text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Respond to this review
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => responseMutation.mutate()}
                    disabled={!responseText.trim() || responseMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Post Response
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResponse(false)}
                    className="border-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </Card>
  );
}