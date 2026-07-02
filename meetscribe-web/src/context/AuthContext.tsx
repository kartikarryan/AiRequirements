import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CognitoUser,
  TokenResponse,
  parseIdToken,
  refreshAccessToken,
  getLoginUrl,
  getLogoutUrl,
} from '../config/auth';

interface AuthState {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const STORAGE_KEYS = {
  accessToken: 'meetscribe_access_token',
  idToken: 'meetscribe_id_token',
  refreshToken: 'meetscribe_refresh_token',
  expiresAt: 'meetscribe_expires_at',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setUser(null);
    setAccessToken(null);
  }, []);

  const setSession = useCallback((tokens: TokenResponse) => {
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
    localStorage.setItem(STORAGE_KEYS.idToken, tokens.id_token);
    if (tokens.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
    }
    localStorage.setItem(STORAGE_KEYS.expiresAt, expiresAt.toString());

    setAccessToken(tokens.access_token);
    setUser(parseIdToken(tokens.id_token));
  }, []);

  const tryRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
      clearSession();
      return;
    }
    try {
      const tokens = await refreshAccessToken(refreshToken);
      setSession(tokens);
    } catch {
      clearSession();
    }
  }, [clearSession, setSession]);

  useEffect(() => {
    const idToken = localStorage.getItem(STORAGE_KEYS.idToken);
    const storedAccessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt);

    if (!idToken || !storedAccessToken || !expiresAt) {
      setIsLoading(false);
      return;
    }

    if (Date.now() > Number(expiresAt)) {
      tryRefresh().finally(() => setIsLoading(false));
      return;
    }

    setUser(parseIdToken(idToken));
    setAccessToken(storedAccessToken);
    setIsLoading(false);
  }, [tryRefresh]);

  const login = () => {
    window.location.href = getLoginUrl();
  };

  const logout = () => {
    clearSession();
    window.location.href = getLogoutUrl();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
