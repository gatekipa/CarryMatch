import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Full-page loading spinner for initial page loads
 */
export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

/**
 * Error display for failed queries with retry button
 */
export function QueryError({ error, onRetry, message }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-xl font-bold text-white mb-2">Failed to load</h3>
        <p className="text-gray-400 mb-4 text-sm">
          {message || error?.message || "Something went wrong. Please try again."}
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </Card>
    </div>
  );
}

/**
 * Inline loading indicator for sections within a page
 */
export function SectionLoader({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-gray-500 text-xs">{message}</p>
      </div>
    </div>
  );
}
