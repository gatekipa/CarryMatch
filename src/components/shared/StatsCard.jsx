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
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
    red: "text-red-400"
  };

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className={`w-5 h-5 ${colorClasses[color]}`} />}
        <span className="text-gray-400">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
      {badges.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {badges.map((badge, idx) => (
            <Badge key={idx} className={`bg-${badge.color}-500/20 text-${badge.color}-400 text-xs`}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}