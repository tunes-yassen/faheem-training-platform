'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_USERS } from '@/lib/demo-data';
import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loginAsRole: (role: UserRole, customName?: string, identifier?: string, serverUser?: Partial<User>) => void;
  logout: () => void;
  portalPathForRole: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function portalPathForRole(role: UserRole): string {
  switch (role) {
    case 'TRAINEE':
      return '/portal/trainee';
    case 'STUDENT':
      return '/portal/student';
    case 'PARENT':
      return '/portal/parent';
    case 'TUTOR':
      return '/portal/tutor';
    case 'TRAINER':
      return '/portal/trainer';
    case 'COORDINATOR':
      return '/portal/coordinator';
    default:
      return '/portal/student';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('faheem_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const loginAsRole = (
    role: UserRole,
    customName?: string,
    identifier?: string,
    serverUser?: Partial<User>,
  ) => {
    const base = DEMO_USERS[role] || DEMO_USERS.STUDENT;
    const nextUser: User = {
      ...base,
      ...serverUser,
      role,
      name: serverUser?.name || customName?.trim() || base.name,
      email: serverUser?.email || (identifier?.includes('@') ? identifier : base.email),
      phone: serverUser?.phone || (identifier && !identifier.includes('@') ? identifier : base.phone),
    };
    setUser(nextUser);
    try {
      localStorage.setItem('faheem_user', JSON.stringify(nextUser));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('faheem_user');
      localStorage.removeItem('faheem_token');
      localStorage.removeItem('faheem_refresh_token');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loginAsRole,
        logout,
        portalPathForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
