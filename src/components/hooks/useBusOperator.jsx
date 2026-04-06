import { useQuery } from "@tanstack/react-query";
import { BusOperator } from "@/api/entities";

export function useBusOperator(userEmail) {
  return useQuery({
    queryKey: ['my-bus-operator', userEmail],
    queryFn: async () => {
      // Future migration seam: this hook should eventually rely only on
      // app-owned repository/entity services behind src/api/entities.js.
      const ops = await BusOperator.filter({ created_by: userEmail });
      return ops[0];
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000
  });
}
