import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const STATUS_TO_TEMPLATE = {
  'RECEIVED': 'shipment_received',
  'IN_TRANSIT': 'in_transit',
  'SHIPPED': 'in_transit',
  'OUT_FOR_DELIVERY': 'out_for_delivery',
  'DELIVERED': 'delivered',
  'DELAYED': 'delayed',
  'ON_HOLD': 'on_hold',
  'CUSTOMS': 'customs_clearance',
  'READY_PICKUP': 'ready_pickup'
};

/**
 * Hook to automatically send notifications when shipment status changes
 * Usage: useAutoNotifications(shipment, previousStatus)
 */
export function useAutoNotifications(shipment, previousStatus) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!shipment || !previousStatus || hasTriggered.current) return;
    
    // Only trigger if status actually changed
    if (shipment.status === previousStatus) return;

    const templateType = STATUS_TO_TEMPLATE[shipment.status];
    if (!templateType) return;

    hasTriggered.current = true;

    // Send notification in background
    base44.functions.invoke('sendShipmentNotification', {
      shipment_id: shipment.id,
      template_type: templateType,
      manual_trigger: false
    })
    .then(() => {
      console.log(`Auto-notification sent for ${shipment.tracking_code}: ${templateType}`);
    })
    .catch(error => {
      console.error('Auto-notification failed:', error);
    });

  }, [shipment?.status, previousStatus, shipment?.id]);
}