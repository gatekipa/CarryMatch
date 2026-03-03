import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "blue",
  badges = []
}) {
  const colorClasses = {
    blue: "text-blue-500 dark:text-blue-400 bg-blue-500/10",
    green: "text-green-600 dark:text-green-400 bg-green-500/10",
    purple: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
    yellow: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
    orange: "text-orange-500 dark:text-orange-400 bg-orange-500/10",
    red: "text-red-500 dark:text-red-400 bg-red-500/10"
  };

  const badgeColors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    green: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    red: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
  };

  return (
    <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-[18px] h-[18px]" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}
      {badges.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {badges.map((badge, idx) => (
            <Badge key={idx} className={`${badgeColors[badge.color] || badgeColors.blue} text-xs font-medium`}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
