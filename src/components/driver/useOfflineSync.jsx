import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending sync from localStorage
    const stored = localStorage.getItem('driver-pending-sync');
    if (stored) {
      setPendingSync(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0 && !isSyncing) {
      const timer = setTimeout(() => syncPendingData(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const addToQueue = (action) => {
    const newQueue = [...pendingSync, { ...action, timestamp: new Date().toISOString() }];
    setPendingSync(newQueue);
    localStorage.setItem('driver-pending-sync', JSON.stringify(newQueue));
  };

  const syncPendingData = async () => {
    if (pendingSync.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const synced = [];

    for (const action of pendingSync) {
      try {
        if (action.type === 'status_update') {
          await base44.entities.Trip.update(action.trip_id, { trip_status: action.status });
          await base44.entities.TripStatusUpdate.create({
            trip_id: action.trip_id,
            update_type: action.status === 'departed' ? 'departed' : 
                         action.status === 'delayed' ? 'delayed' : 
                         action.status === 'completed' ? 'arrived' : 'departed',
            message: action.message,
            updated_by_user: action.user_email,
            notifications_sent: false
          });
        } else if (action.type === 'location_update') {
          await base44.functions.invoke('updateBusLocation', {
            trip_id: action.trip_id,
            latitude: action.latitude,
            longitude: action.longitude,
            speed_kmh: action.speed_kmh || 0,
            heading_degrees: action.heading_degrees || 0,
            update_source: "driver_gps"
          });
        }
        synced.push(action);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    const remaining = pendingSync.filter(item => !synced.includes(item));
    setPendingSync(remaining);
    localStorage.setItem('driver-pending-sync', JSON.stringify(remaining));
    setIsSyncing(false);

    if (synced.length > 0) {
      console.log(`Synced ${synced.length} items`);
    }
  };

  return {
    isOnline,
    pendingSync,
    isSyncing,
    addToQueue,
    syncPendingData
  };
}