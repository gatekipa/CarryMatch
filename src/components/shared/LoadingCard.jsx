import React from "react";
import { Card } from "@/components/ui/card";

export default function LoadingCard({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-12 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm text-center">
        <div className="animate-spin w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{message}</h3>
      </Card>
    </div>
  );
}