import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { checkSavedItemsForUpdates } from "./SavedItemsMonitor";

// Background component that monitors saved items for updates
export default function SavedItemsBackgroundMonitor({ user }) {
  useEffect(() => {
    if (!user) return;

    // Run initial check
    checkSavedItemsForUpdates();

    // Set up periodic checking every 5 minutes
    const interval = setInterval(() => {
      checkSavedItemsForUpdates();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  return null; // This component doesn't render anything
}