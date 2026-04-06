import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const resolveLegacyCurrentUserFallback = async () => {
  // Legacy Base44 compatibility: keep the direct SDK auth lookup as a
  // temporary fallback until this hook can rely solely on AuthContext.
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
};

export function useCurrentUser() {
  const { user: authUser, isLoadingAuth } = useAuth();
  const [user, setUser] = useState(authUser ?? null);
  const [loading, setLoading] = useState(true);
  const hasResolvedUser = useRef(false);

  useEffect(() => {
    let isActive = true;

    const resolveCurrentUser = async () => {
      if (isLoadingAuth) {
        return;
      }

      if (authUser) {
        hasResolvedUser.current = true;
        setUser(authUser);
        setLoading(false);
        return;
      }

      if (hasResolvedUser.current) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Future migration seam: once all auth ownership lives in AuthContext,
      // this fallback should be removed and the hook can return context state directly.
      const fallbackUser = await resolveLegacyCurrentUserFallback();
      if (!isActive) {
        return;
      }

      hasResolvedUser.current = true;
      setUser(fallbackUser);
      setLoading(false);
    };

    resolveCurrentUser();

    return () => {
      isActive = false;
    };
  }, [authUser, isLoadingAuth]);

  return { user, loading };
}
