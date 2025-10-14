'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { noteNinjasAPI, TokenManager, User, LoginResponse } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, email: string) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = TokenManager.getUser();
    const token = TokenManager.getToken();
    
    if (storedUser && token) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, email: string): Promise<LoginResponse> => {
    const response = await noteNinjasAPI.login(name, email);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    noteNinjasAPI.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await noteNinjasAPI.getMe();
      setUser(updatedUser);
      TokenManager.setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
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
