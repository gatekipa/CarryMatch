import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Zap, 
  Moon, 
  Sun, 
  MessageCircle, 
  ThumbsUp, 
  Flame, 
  Award,
  Crown,
  Star,
  Trophy
} from "lucide-react";

// Badge definitions with unlock criteria and icons
export const BADGE_DEFINITIONS = {
  quick_responder: {
    id: "quick_responder",
    name: "Quick Responder",
    description: "Average response time under 30 minutes",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    unlockCriteria: (user) => user.avg_response_time_minutes < 30 && user.total_messages_sent >= 20
  },
  night_owl: {
    id: "night_owl",
    name: "Night Owl",
    description: "Frequently responds after 10 PM",
    icon: Moon,
    color: "from-indigo-500 to-purple-600",
    unlockCriteria: (user) => false // Tracked separately
  },
  early_bird: {
    id: "early_bird",
    name: "Early Bird",
    description: "Frequently responds before 8 AM",
    icon: Sun,
    color: "from-orange-400 to-yellow-500",
    unlockCriteria: (user) => false // Tracked separately
  },
  conversation_starter: {
    id: "conversation_starter",
    name: "Conversation Starter",
    description: "Started 10+ conversations",
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
    unlockCriteria: (user) => user.conversations_initiated >= 10
  },
  helpful_communicator: {
    id: "helpful_communicator",
    name: "Helpful Communicator",
    description: "50+ messages marked as helpful",
    icon: ThumbsUp,
    color: "from-green-500 to-emerald-600",
    unlockCriteria: (user) => user.helpful_message_count >= 50
  },
  week_warrior: {
    id: "week_warrior",
    name: "Week Warrior",
    description: "7-day message response streak",
    icon: Flame,
    color: "from-red-500 to-orange-600",
    unlockCriteria: (user) => user.message_streak_longest >= 7
  },
  month_master: {
    id: "month_master",
    name: "Month Master",
    description: "30-day message response streak",
    icon: Trophy,
    color: "from-purple-500 to-pink-600",
    unlockCriteria: (user) => user.message_streak_longest >= 30
  },
  super_communicator: {
    id: "super_communicator",
    name: "Super Communicator",
    description: "Sent 100+ messages",
    icon: Award,
    color: "from-cyan-500 to-blue-600",
    unlockCriteria: (user) => user.total_messages_sent >= 100
  },
  elite_responder: {
    id: "elite_responder",
    name: "Elite Responder",
    description: "Platinum tier messenger",
    icon: Crown,
    color: "from-yellow-400 to-yellow-600",
    unlockCriteria: (user) => user.messaging_tier === "platinum"
  }
};

// Get tier info
export const TIER_INFO = {
  bronze: {
    name: "Bronze",
    color: "from-orange-700 to-orange-900",
    textColor: "text-orange-400",
    minPoints: 0,
    benefits: ["Basic messaging"]
  },
  silver: {
    name: "Silver",
    color: "from-gray-400 to-gray-600",
    textColor: "text-gray-300",
    minPoints: 100,
    benefits: ["Priority notifications", "Message reactions"]
  },
  gold: {
    name: "Gold",
    color: "from-yellow-500 to-yellow-700",
    textColor: "text-yellow-400",
    minPoints: 500,
    benefits: ["Priority inbox", "Custom status", "Stickers"]
  },
  platinum: {
    name: "Platinum",
    color: "from-cyan-400 to-blue-600",
    textColor: "text-cyan-400",
    minPoints: 1000,
    benefits: ["All features", "Elite badge", "Priority support"]
  }
};

export default function MessagingBadges({ user, compact = false }) {
  if (!user) return null;

  const earnedBadges = Object.values(BADGE_DEFINITIONS).filter(badge => 
    user.badges_earned?.includes(badge.id)
  );

  const currentTier = TIER_INFO[user.messaging_tier || "bronze"];

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tier Badge */}
        <Badge className={`bg-gradient-to-r ${currentTier.color} text-white border-0`}>
          <Crown className="w-3 h-3 mr-1" />
          {currentTier.name}
        </Badge>

        {/* Show first 3 badges */}
        {earnedBadges.slice(0, 3).map((badge) => {
          const Icon = badge.icon;
          return (
            <Badge 
              key={badge.id}
              className={`bg-gradient-to-r ${badge.color} text-white border-0`}
              title={badge.description}
            >
              <Icon className="w-3 h-3" />
            </Badge>
          );
        })}

        {earnedBadges.length > 3 && (
          <Badge variant="outline" className="border-white/20 text-gray-400 text-xs">
            +{earnedBadges.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tier Display */}
      <Card className="p-4 bg-white/5 border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className={`w-5 h-5 ${currentTier.textColor}`} />
              <span className={`font-bold text-lg ${currentTier.textColor}`}>
                {currentTier.name} Tier
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {user.messaging_points} points
            </p>
          </div>
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
        </div>

        {/* Progress to next tier */}
        {user.messaging_tier !== "platinum" && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Next: {TIER_INFO[getNextTier(user.messaging_tier)].name}</span>
              <span>{TIER_INFO[getNextTier(user.messaging_tier)].minPoints - user.messaging_points} pts</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div 
                className={`h-2 rounded-full bg-gradient-to-r ${currentTier.color}`}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((user.messaging_points % TIER_INFO[getNextTier(user.messaging_tier)].minPoints) / TIER_INFO[getNextTier(user.messaging_tier)].minPoints) * 100}%` 
                }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-3 flex flex-wrap gap-2">
          {currentTier.benefits.map((benefit, i) => (
            <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
              ✓ {benefit}
            </span>
          ))}
        </div>
      </Card>

      {/* Badges Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          Badges Earned ({earnedBadges.length}/{Object.keys(BADGE_DEFINITIONS).length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(BADGE_DEFINITIONS).map((badge) => {
            const Icon = badge.icon;
            const isEarned = user.badges_earned?.includes(badge.id);

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: isEarned ? 1.05 : 1 }}
              >
                <Card className={`p-3 ${
                  isEarned 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/5 border-white/5 opacity-50'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-2 ${
                      !isEarned && 'grayscale'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xs font-semibold text-white mb-1">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getNextTier(currentTier) {
  const tiers = ["bronze", "silver", "gold", "platinum"];
  const currentIndex = tiers.indexOf(currentTier);
  return tiers[currentIndex + 1] || "platinum";
}

export function BadgeIcon({ badgeId, className = "w-4 h-4" }) {
  const badge = BADGE_DEFINITIONS[badgeId];
  if (!badge) return null;
  
  const Icon = badge.icon;
  return <Icon className={className} />;
}