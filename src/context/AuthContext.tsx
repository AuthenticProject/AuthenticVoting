import React, { useState } from 'react';
import type { AdminUser } from '../types/election';
import { authService, type LoginCredentials } from '../services/authService';
import { AuthContext } from '../hooks/useAuth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    const { user: loggedInUser, error } = await authService.login(credentials);
    setIsLoading(false);

    if (error || !loggedInUser) {
      return { success: false, error: error || 'Login gagal.' };
    }

    setUser(loggedInUser);
    return { success: true };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
