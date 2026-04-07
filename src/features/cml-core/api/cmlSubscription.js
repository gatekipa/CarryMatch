import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

export async function loadSubscriptionStatus(vendorId) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { data, error } = await supabase
    .from("vendors")
    .select("plan_tier, subscription_expires_at, subscription_source")
    .eq("id", vendorId)
    .single();

  if (error) throw error;

  const isExpired = data.subscription_expires_at
    ? new Date(data.subscription_expires_at) < new Date()
    : false;

  return {
    planTier: isExpired ? "free" : (data.plan_tier || "free"),
    subscriptionExpiresAt: data.subscription_expires_at,
    subscriptionSource: data.subscription_source,
    isExpired,
  };
}

export async function activateCouponCode(vendorId, code) {
  if (!supabase) throw new Error(supabaseConfigError);

  // 1. Find the coupon
  const { data: coupon, error: findError } = await supabase
    .from("coupon_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("status", "unused")
    .maybeSingle();

  if (findError) throw findError;
  if (!coupon) throw new Error("Invalid or already used coupon code.");

  // 2. Calculate expiry
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + coupon.duration_months);

  // 3. Activate the coupon
  const { error: couponError } = await supabase
    .from("coupon_codes")
    .update({
      status: "active",
      vendor_id: vendorId,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", coupon.id)
    .eq("status", "unused");

  if (couponError) throw couponError;

  // 4. Update vendor plan
  const { error: vendorError } = await supabase
    .from("vendors")
    .update({
      plan_tier: coupon.plan_tier,
      subscription_expires_at: expiresAt.toISOString(),
      subscription_source: "coupon",
    })
    .eq("id", vendorId);

  if (vendorError) throw vendorError;

  return { planTier: coupon.plan_tier, expiresAt: expiresAt.toISOString() };
}
