/**
 * Authentication Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_verified?: boolean;
  did_id?: string;
  wallet_address?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      apiClient.clearTokens();
    }
  }, []);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    checkAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    apiClient.setTokens(tokens);
    await refreshUser();
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    await authApi.register({ email, password, name, phone });
    // Auto-login after registration
    await login(email, password);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
