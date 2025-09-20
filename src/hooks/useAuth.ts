// src/hooks/useAuth.ts
import React from 'react';
import AuthService, { AuthUser } from '../services/AuthService';

export type UseAuth = {
  user: AuthUser | null;
  loading: boolean;
  login: (ident: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  getUser: () => Promise<AuthUser | null>;
  updateUser: (patch: Partial<{ username: string; email: string; password: string; role: string }>) => Promise<AuthUser>;
  token: string | null;
};

const AuthContext = React.createContext<UseAuth | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [token, setToken] = React.useState<string | null>(AuthService.getToken());

  const refreshUser = React.useCallback(async (): Promise<AuthUser | null> => {
    const tok = AuthService.getToken();
    setToken(tok);
    if (!tok) {
      setUser(null);
      return null;
    }
    try {
      const { user } = await AuthService.getUser();
      setUser(user);
      return user;
    } catch (e) {
      // token invalid
      AuthService.setToken(null);
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  React.useEffect(() => {
    // On mount, try to load the user if token exists
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = React.useCallback(async (ident: string, password: string) => {
    const res = await AuthService.login({ ident, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = React.useCallback(async (username: string, email: string, password: string) => {
    const res = await AuthService.register({ username, email, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  }, []);

  const getUser = React.useCallback(async () => {
    const u = await refreshUser();
    return u;
  }, [refreshUser]);

  const updateUser = React.useCallback(async (patch: Partial<{ username: string; email: string; password: string; role: string }>) => {
    const res = await AuthService.updateUser(patch);
    setUser(res.user);
    return res.user;
  }, []);

  const value: UseAuth = {
    user,
    loading,
    login,
    register,
    logout,
    getUser,
    updateUser,
    token,
  };

  return React.createElement(AuthContext.Provider, { value }, children as any);
}

export function useAuth(): UseAuth {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
