import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';
import type { RecordModel } from 'pocketbase';
import { pb, authStore } from '../lib/pocketbase';

export interface AuthContextType {
  user: RecordModel | null;
  login: (identity: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const subscribeToAuthStore = (callback: () => void) => {
  return pb.authStore.onChange(callback);
};

const getAuthSnapshot = (): RecordModel | null => {
  return pb.authStore.record;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribeToAuthStore, getAuthSnapshot, getAuthSnapshot);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback(
    async (identity: string, password: string, rememberMe = false) => {
      setIsLoading(true);
      try {
        authStore.setRememberMe(rememberMe);
        const authData = await pb.collection('users').authWithPassword(identity, password);

        // Ensure auth store saves token and record (supports both live PB and test mocks)
        if (pb.authStore.token !== authData?.token) {
          pb.authStore.save(authData.token, authData.record);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
