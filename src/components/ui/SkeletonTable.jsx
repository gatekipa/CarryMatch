import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTable({ columns = 5, rows = 5 }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 border-b border-slate-200 px-6 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={`r-${row}`} className="flex gap-4 border-b border-slate-100 px-6 py-4">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={`c-${row}-${col}`}
              className={`h-4 rounded ${col === 0 ? "w-28" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-6 shadow-lg">
      <Skeleton className="mb-3 h-5 w-32 rounded" />
      <Skeleton className="mb-2 h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />
    </div>
  );
}
