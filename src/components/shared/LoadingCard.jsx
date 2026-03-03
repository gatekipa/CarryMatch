import React from "react";
import { Card } from "@/components/ui/card";

export default function LoadingCard({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-12 bg-white/5 border-white/10 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">{message}</h3>
      </Card>
    </div>
  );
}