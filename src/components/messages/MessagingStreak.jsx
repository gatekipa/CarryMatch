import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, TrendingUp } from "lucide-react";

export default function MessagingStreak({ user }) {
  if (!user) return null;

  const streakDays = user.message_streak_days || 0;
  const longestStreak = user.message_streak_longest || 0;

  const getStreakColor = (days) => {
    if (days >= 30) return "from-purple-500 to-pink-600";
    if (days >= 14) return "from-orange-500 to-red-600";
    if (days >= 7) return "from-yellow-500 to-orange-500";
    if (days >= 3) return "from-green-500 to-emerald-600";
    return "from-gray-500 to-gray-600";
  };

  const getStreakMessage = (days) => {
    if (days === 0) return "Start your streak today!";
    if (days === 1) return "Great start! Keep it going!";
    if (days < 7) return "You're on a roll!";
    if (days < 14) return "Amazing streak!";
    if (days < 30) return "Incredible consistency!";
    return "Legendary streak!";
  };

  return (
    <Card className="p-4 bg-white/5 border-white/10">
      <div className="flex items-start gap-4">
        {/* Flame Icon with Animation */}
        <motion.div
          animate={streakDays > 0 ? {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getStreakColor(streakDays)} flex items-center justify-center flex-shrink-0`}
        >
          <Flame className="w-8 h-8 text-white" />
        </motion.div>

        {/* Streak Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">
              {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
            </h3>
            {streakDays > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-yellow-400"
              >
                🔥
              </motion.span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-3">{getStreakMessage(streakDays)}</p>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-gray-400">
              <Trophy className="w-3 h-3" />
              <span>Best: {longestStreak} days</span>
            </div>
            {user.avg_response_time_minutes > 0 && (
              <div className="flex items-center gap-1 text-gray-400">
                <TrendingUp className="w-3 h-3" />
                <span>Avg: {formatResponseTime(user.avg_response_time_minutes)}</span>
              </div>
            )}
          </div>

          {/* Milestone Progress */}
          {streakDays > 0 && streakDays < 30 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Next milestone</span>
                <span>{getNextMilestone(streakDays)} days</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div 
                  className={`h-1.5 rounded-full bg-gradient-to-r ${getStreakColor(streakDays)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(streakDays / getNextMilestone(streakDays)) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatResponseTime(minutes) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function getNextMilestone(current) {
  const milestones = [3, 7, 14, 21, 30];
  return milestones.find(m => m > current) || 30;
}