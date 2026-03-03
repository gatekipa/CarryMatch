import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

/**
 * Pull-to-refresh gesture handler for mobile
 * Triggers on scroll from top (touchmove) and calls refetch callback
 */
export default function PullToRefresh({ children, onRefresh, isRefetching = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    setPullDistance(Math.min(distance, 120));

    if (distance > 80 && !isRefreshing && !isRefetching) {
      setIsRefreshing(true);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing && !isRefetching) {
      await onRefresh();
    }
    setPullDistance(0);
    setIsRefreshing(false);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-y-auto"
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <motion.div
          className="sticky top-0 left-0 right-0 flex justify-center items-center h-16 pointer-events-none z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: isRefetching || isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.6, repeat: isRefetching || isRefreshing ? Infinity : 0 }}
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? "text-[#9EFF00]" : "text-gray-400"}`} />
          </motion.div>
        </motion.div>
      )}

      {/* Content with transform for pull effect */}
      <motion.div
        animate={{ y: Math.min(pullDistance * 0.5, 60) }}
        transition={{ type: "tween", duration: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}