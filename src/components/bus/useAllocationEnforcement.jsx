import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Hook to check and enforce seat allocation limits
 */
export function useAllocationEnforcement(tripId, channel, branchId = null) {
  return useQuery({
    queryKey: ['allocation-check', tripId, channel, branchId],
    queryFn: async () => {
      if (!tripId) return null;

      const response = await base44.functions.invoke('checkSeatAllocation', {
        trip_id: tripId,
        seat_codes: [],
        channel: channel,
        branch_id: branchId
      });
      
      return response.data;
    },
    enabled: !!tripId,
    refetchInterval: 5000,
    staleTime: 3000
  });
}