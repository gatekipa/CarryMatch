import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardWidget({ widget, isCustomizing, onRemove, delay = 0 }) {
  const Icon = widget.icon;
  
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    green: 'text-green-400',
    red: 'text-red-400'
  };

  const badgeColors = {
    blue: 'bg-blue-500/20 text-blue-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    orange: 'bg-orange-500/20 text-orange-300',
    red: 'bg-red-500/20 text-red-300',
    green: 'bg-green-500/20 text-green-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <Card className={`p-6 bg-white/5 border-white/10 ${isCustomizing ? 'ring-2 ring-white/20' : ''}`}>
        {isCustomizing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-gray-400">{widget.title}</h3>
          <Icon className={`w-5 h-5 ${colorClasses[widget.color]}`} />
        </div>
        
        <p className="text-3xl font-bold text-white mb-2">{widget.value}</p>
        
        {widget.subtitle && (
          <p className="text-xs text-gray-500">{widget.subtitle}</p>
        )}
        
        {widget.trend && (
          <p className={`text-xs ${colorClasses[widget.color]} mt-2 flex items-center gap-1`}>
            <TrendingUp className="w-3 h-3" />
            {widget.trend} {widget.trendLabel}
          </p>
        )}
        
        {widget.badges && (
          <div className="flex gap-2 mt-2">
            {widget.badges.map((badge, idx) => (
              <Badge key={idx} className={`${badgeColors[badge.color]} text-xs`}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}