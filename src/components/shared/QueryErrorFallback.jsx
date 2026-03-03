import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function QueryErrorFallback({ 
  error, 
  onRetry, 
  title = "Failed to load data",
  className = ""
}) {
  return (
    <Card className={`p-8 bg-white/5 border-white/10 text-center ${className}`}>
      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">
        {error?.message || "An error occurred while fetching data"}
      </p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" className="border-white/10">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </Card>
  );
}