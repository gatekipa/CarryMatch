import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  actionLink
}) {
  return (
    <Card className="p-12 bg-white/5 border-white/10 text-center">
      {Icon && <Icon className="w-16 h-16 mx-auto mb-4 text-gray-500" />}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      {description && <p className="text-gray-400 mb-6">{description}</p>}
      {(actionLabel && (onAction || actionLink)) && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-blue-500 to-indigo-600"
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}