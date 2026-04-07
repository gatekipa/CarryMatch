import { useAuth } from "@/lib/AuthContext";

export function useSubscriptionGate() {
  const { vendor } = useAuth();

  const planTier = vendor?.plan_tier || "free";
  const subscriptionExpiresAt = vendor?.subscription_expires_at;
  const isExpired = subscriptionExpiresAt
    ? new Date(subscriptionExpiresAt) < new Date()
    : false;

  const effectiveTier = isExpired ? "free" : planTier;
  const isProActive = effectiveTier === "pro";

  return {
    planTier: effectiveTier,
    isProActive,
    maxShipmentsPerMonth: isProActive ? Infinity : 50,
    maxBranches: isProActive ? Infinity : 1,
    canUseLabels: isProActive,
    canUseBatchPrint: isProActive,
    canUsePhotoUpload: isProActive,
    canUseAdvancedReports: isProActive,
    canImportCustomers: isProActive,
  };
}
