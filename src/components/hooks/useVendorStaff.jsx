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
    staleTime: 30 * 1000,           // 30s — don't serve stale null after signup
    refetchOnMount: 'always',       // always re-check when dashboard mounts
    retry: 2,                       // retry on network errors
    retryDelay: 1000
  });
}