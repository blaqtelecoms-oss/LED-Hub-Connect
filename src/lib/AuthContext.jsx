import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { backend } from '@/api/backendClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await backend.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Supabase auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error.message || 'Failed to load user session' });
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      if (active) await checkUserAuth();
    };
    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      if (event !== 'INITIAL_SESSION') {
        window.setTimeout(() => {
          if (active) void checkUserAuth();
        }, 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [checkUserAuth]);

  const logout = useCallback((shouldRedirect = true) => {
    const redirectTo = shouldRedirect ? window.location.href : undefined;
    void backend.auth.logout(redirectTo).catch((error) => {
      console.error('Supabase sign-out failed:', error);
      setAuthError({ type: 'unknown', message: error.message || 'Failed to sign out' });
    });
  }, []);

  const navigateToLogin = useCallback(() => {
    backend.auth.redirectToLogin(window.location.href);
  }, []);

  const checkAppState = checkUserAuth;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
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
