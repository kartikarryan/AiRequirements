import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CognitoUser,
  TokenResponse,
  parseIdToken,
  refreshAccessToken,
  getLoginUrl,
} from '../config/auth';
import { STORAGE_KEYS } from '../services/apiClient';

interface AuthState {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function readTokensFromStorage() {
  const idToken = localStorage.getItem(STORAGE_KEYS.idToken);
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);

  if (idToken && accessToken && expiresAt && Date.now() < Number(expiresAt)) {
    return { user: parseIdToken(idToken), accessToken, needsRefresh: false };
  }

  if (refreshToken) {
    return { user: null, accessToken: null, needsRefresh: true };
  }

  return { user: null, accessToken: null, needsRefresh: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = readTokensFromStorage();
  const [user, setUser] = useState<CognitoUser | null>(stored.user);
  const [accessToken, setAccessToken] = useState<string | null>(stored.accessToken);
  const [isLoading, setIsLoading] = useState(stored.needsRefresh);
  const didRefresh = useRef(false);

  const clearSession = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => {
    if (!stored.needsRefresh || didRefresh.current) return;
    didRefresh.current = true;

    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    refreshAccessToken(refreshToken)
      .then((tokens: TokenResponse) => {
        const expiresAt = Date.now() + tokens.expires_in * 1000;
        localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
        localStorage.setItem(STORAGE_KEYS.idToken, tokens.id_token);
        if (tokens.refresh_token) {
          localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
        }
        localStorage.setItem(STORAGE_KEYS.expiresAt, expiresAt.toString());
        setAccessToken(tokens.access_token);
        setUser(parseIdToken(tokens.id_token));
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async () => {
    try {
      const url = await getLoginUrl();
      window.location.assign(url);
    } catch (err) {
      console.error('Login redirect failed:', err);
    }
  };

  const logout = () => {
    clearSession();
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
