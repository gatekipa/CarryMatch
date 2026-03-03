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
    <Card className="p-12 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 border-dashed text-center">
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>}
      {(actionLabel && (onAction || actionLink)) && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm"
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}