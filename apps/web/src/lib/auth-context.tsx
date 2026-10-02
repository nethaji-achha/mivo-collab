'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Organization } from '@mivo/types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  primaryOrg: Organization | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (payload: any) => Promise<boolean>;
  demoLogin: (role?: 'alex' | 'sarah' | 'liam') => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [primaryOrg, setPrimaryOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setOrganizations(res.data.organizations || []);
        setPrimaryOrg(res.data.primaryOrg || null);
      } else {
        // Fallback default mock user if local session is empty so user can experience full app seamlessly
        if (!user && typeof window !== 'undefined' && !localStorage.getItem('mivo_token')) {
          // auto login demo user
          const demoRes = await api.demoLogin('alex');
          if (demoRes.success && demoRes.data) {
            api.setToken(demoRes.data.token);
            setUser(demoRes.data.user);
          }
        }
      }
    } catch (err) {
      console.warn('[Auth Provider error]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.login({ email, password: pass });
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      await refreshUser();
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const signup = async (payload: any): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.register(payload);
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      await refreshUser();
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const demoLogin = async (role: 'alex' | 'sarah' | 'liam' = 'alex'): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.demoLogin(role);
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      await refreshUser();
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setOrganizations([]);
    setPrimaryOrg(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        primaryOrg,
        isLoading,
        login,
        signup,
        demoLogin,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
