import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useBusOperator(userEmail) {
  return useQuery({
    queryKey: ['my-bus-operator', userEmail],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: userEmail });
      return ops[0];
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000
  });
}