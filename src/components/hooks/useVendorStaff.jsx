import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useVendorStaff(userEmail) {
  return useQuery({
    queryKey: ['vendor-staff-me', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const staff = await base44.entities.VendorStaff.filter({
        email: userEmail,
        status: "ACTIVE"
      });
      return staff[0] || null;
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000
  });
}