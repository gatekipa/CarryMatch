import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveCmlAccessState } from "@/lib/cmlAccessState";
import {
  isNonFatalOnboardingError,
  loadOnboardingSnapshot,
} from "@/features/cml-core/api/cmlOnboarding";
import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

const NON_FATAL_PROFILE_ERROR_CODES = new Set(["PGRST116", "42P01", "42501"]);

const normalizeSupabaseErrorMessage = (fallbackMessage, error) =>
  error?.message || error?.error_description || fallbackMessage;

const isNonFatalProfileError = (error) =>
  NON_FATAL_PROFILE_ERROR_CODES.has(error?.code) ||
  error?.status === 401 ||
  error?.status === 403;

async function loadUserProfile(sessionUser) {
  if (!supabase || !sessionUser) {
    return { profile: null, warning: null };
  }

  const profileQueries = [
    () =>
      supabase
        .from("user_profiles")
        .select("*")
        .eq("supabase_auth_user_id", sessionUser.id)
        .maybeSingle(),
    () =>
      sessionUser.email
        ? supabase.from("user_profiles").select("*").eq("email", sessionUser.email).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ];

  for (const executeQuery of profileQueries) {
    const result = await executeQuery();
    if (result.error) {
      if (isNonFatalProfileError(result.error)) {
        return { profile: null, warning: result.error };
      }

      throw result.error;
    }

    if (result.data) {
      return { profile: result.data, warning: null };
    }
  }

  return { profile: null, warning: null };
}

async function resolveAppOwnedState(sessionUser) {
  const onboardingSnapshot = await loadOnboardingSnapshot(sessionUser);
  let nextProfile = null;
  let nextWarning = onboardingSnapshot.warning ?? null;

  if (nextWarning) {
    try {
      const profileResult = await loadUserProfile(sessionUser);
      nextProfile = profileResult.profile;
      nextWarning = profileResult.warning ?? nextWarning;
    } catch (profileError) {
      if (isNonFatalOnboardingError(profileError)) {
        nextWarning = nextWarning ?? profileError;
      } else {
        throw profileError;
      }
    }
  }

  return {
    profile: nextProfile,
    application: onboardingSnapshot.application,
    vendor: onboardingSnapshot.vendor,
    vendorStaff: onboardingSnapshot.vendorStaff,
    vendorBranches: onboardingSnapshot.vendorBranches ?? [],
    warning: nextWarning,
    accessState: resolveCmlAccessState({
      sessionUser,
      profile: nextProfile,
      application: onboardingSnapshot.application,
      vendor: onboardingSnapshot.vendor,
    }),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendorBranches, setVendorBranches] = useState([]);
  const [accessState, setAccessState] = useState("public");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(
    supabaseConfigError ? { type: "config", message: supabaseConfigError } : null,
  );
  const [profileWarning, setProfileWarning] = useState(null);

  const syncSessionState = async (nextSession) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setProfile(null);
    setApplication(null);
    setVendor(null);
    setVendorStaff(null);
    setVendorBranches([]);
    setProfileWarning(null);

    if (!nextSession?.user) {
      setAccessState("public");
      setIsLoadingAuth(false);
      return;
    }

    try {
      const nextState = await resolveAppOwnedState(nextSession.user);
      setProfile(nextState.profile);
      setApplication(nextState.application);
      setVendor(nextState.vendor);
      setVendorStaff(nextState.vendorStaff);
      setVendorBranches(nextState.vendorBranches);
      setProfileWarning(nextState.warning);
      setAccessState(nextState.accessState);
    } catch (error) {
      setProfileWarning(error);
      setAccessState(
        resolveCmlAccessState({
          sessionUser: nextSession.user,
          profile: null,
          application: null,
          vendor: null,
        }),
      );
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoadingAuth(false);
      return undefined;
    }

    let isMounted = true;

    const bootstrap = async () => {
      setIsLoadingAuth(true);
      setAuthError(null);

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (isMounted) {
          await syncSessionState(data.session);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAuthError({
          type: "session",
          message: normalizeSupabaseErrorMessage("Unable to load auth session.", error),
        });
        setSession(null);
        setUser(null);
        setProfile(null);
        setApplication(null);
        setVendor(null);
        setVendorStaff(null);
        setVendorBranches([]);
        setAccessState("public");
        setIsLoadingAuth(false);
      }
    };

    bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setAuthError(null);
      setIsLoadingAuth(true);
      void syncSessionState(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, options }) => {
    if (!supabase) {
      throw new Error(supabaseConfigError);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const signIn = async ({ email, password }) => {
    if (!supabase) {
      throw new Error(supabaseConfigError);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    return data;
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error(supabaseConfigError);
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const refreshAccessState = async () => {
    if (!supabase) {
      return;
    }

    setIsLoadingAuth(true);
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setAuthError({
        type: "session",
        message: normalizeSupabaseErrorMessage("Unable to refresh auth session.", error),
      });
      setIsLoadingAuth(false);
      return;
    }

    await syncSessionState(data.session);
  };

  const refreshOnboardingData = async () => {
    if (!user) {
      return;
    }

    try {
      const nextState = await resolveAppOwnedState(user);
      setProfile(nextState.profile);
      setApplication(nextState.application);
      setVendor(nextState.vendor);
      setVendorStaff(nextState.vendorStaff);
      setVendorBranches(nextState.vendorBranches);
      setProfileWarning(nextState.warning);
      setAccessState(nextState.accessState);
    } catch (error) {
      setProfileWarning(error);
    }
  };

  const contextValue = useMemo(
    () => ({
      session,
      user,
      profile,
      application,
      vendor,
      vendorStaff,
      vendorBranches,
      accessState,
      isAuthenticated: Boolean(session?.user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      profileWarning,
      appPublicSettings: null,
      signUp,
      signIn,
      signOut,
      refreshAccessState,
      refreshOnboardingData,
      checkAppState: refreshAccessState,
    }),
    [
      session,
      user,
      profile,
      application,
      vendor,
      vendorStaff,
      vendorBranches,
      accessState,
      isLoadingAuth,
      authError,
      profileWarning,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
