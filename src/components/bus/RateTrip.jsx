import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

const TAG_CATEGORIES = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "punctuality", label: "Punctuality" },
  { key: "comfort", label: "Comfort" },
  { key: "staff", label: "Staff" }
];

export default function RateTrip({ trip, operator, route, order, onComplete }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState({ cleanliness: 0, punctuality: 0, comfort: 0, staff: 0 });
  const [comment, setComment] = useState("");

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TripRating.create({
        operator_id: operator.id,
        trip_id: trip.id,
        user_id: order.user_id,
        rating: rating,
        tags_json: tags,
        comment: comment || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-rating'] });
      toast.success("Thank you for your feedback!");
      onComplete();
    }
  });

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">How was your trip?</h3>
        <p className="text-sm text-gray-400">{route.origin_city} → {route.destination_city}</p>
      </div>

      {/* Overall Rating */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Tag Ratings */}
      {rating > 0 && (
        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-300 font-semibold">Rate specific aspects:</p>
          {TAG_CATEGORIES.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{label}</span>
                <span className="text-xs text-gray-500">{tags[key] || 0}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setTags({ ...tags, [key]: val })}
                    className="flex-1 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: val <= tags[key] ? '#3B82F6' : '#374151'
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment */}
      {rating > 0 && (
        <div className="mb-6">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={3}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      )}

      <Button
        onClick={() => submitRatingMutation.mutate()}
        disabled={rating === 0 || submitRatingMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-600"
      >
        {submitRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
      </Button>
    </Card>
  );
}