import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    bootstrapAuthState();
  }, []);

  const clearAuthenticatedUser = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const setAuthenticatedUser = (currentUser) => {
    setUser(currentUser);
    setIsAuthenticated(true);
  };

  const setUserNotRegisteredError = () => {
    setAuthError({
      type: 'user_not_registered',
      message: 'User not registered for this app'
    });
  };

  const checkCurrentUserSession = async () => {
    // Legacy Base44 auth compatibility: current session resolution still
    // comes from the Base44 SDK until auth ownership moves to Supabase.
    const authPromise = base44.auth.me();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth check timed out')), 10000)
    );

    return Promise.race([authPromise, timeoutPromise]);
  };

  const handleCurrentUserError = (error) => {
    console.warn('User auth check failed (user not logged in):', error?.message);
    clearAuthenticatedUser();

    // DON'T set authError for auth_required - just means user isn't logged in
    // Only block for user_not_registered
    if (error?.status === 403 && error?.data?.extra_data?.reason === 'user_not_registered') {
      setUserNotRegisteredError();
    }
  };

  const checkAppState = async () => {
    try {
      setAuthError(null);
      setIsLoadingAuth(true);

      if (appParams.token) {
        try {
          const currentUser = await checkCurrentUserSession();
          setAuthenticatedUser(currentUser);
        } catch (error) {
          handleCurrentUserError(error);
        }
      } else {
        // No token - user is simply not logged in. That's fine.
        clearAuthenticatedUser();
      }
    } catch (error) {
      console.error('Unexpected auth error:', error);
      clearAuthenticatedUser();
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const bootstrapAuthState = () => {
    // Future migration seam: make this provider the single auth owner
    // backed by Supabase session state instead of Base44 bootstrap params.
    checkAppState();
  };

  const clearCachedUserData = () => {
    // Preserve current logout cache-clearing behavior exactly.
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('carrymatch-') ||
          key.startsWith('offline-') ||
          key.startsWith('pending-sync') ||
          key.startsWith('driver-')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      // localStorage may be unavailable
    }
  };

  const logout = (shouldRedirect = true) => {
    clearAuthenticatedUser();
    clearCachedUserData();

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Legacy Base44 auth compatibility: callers still rely on the SDK login redirect.
    base44.auth.redirectToLogin(window.location.href);
  };

  const authContextValue = {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
