import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set a longer timeout to allow for slow network connections
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Auth state check timeout - setting loading to false');
      setLoading(false);
      // If we timeout, try to get current user one more time
      AuthService.getCurrentUser().then(user => {
        if (user) {
          setUser(user);
        }
      }).catch(() => {
        // Ignore errors on timeout fallback
      });
    }, 10000); // 10 second timeout (increased from 3 to allow for slow networks)
    
    const unsubscribe = AuthService.onAuthStateChange(async (authUser) => {
      console.log('Auth state changed:', authUser ? 'User logged in' : 'User logged out');
      clearTimeout(timeoutId); // Clear timeout since we got a response
      
      try {
        setUser(authUser); // authUser is already the User object from AuthService
        console.log('User state updated:', authUser ? authUser.email : 'null');
      } catch (e) {
        console.error("Failed to update user state:", e);
        setUser(null); // On error, ensure user is logged out
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
    setError(null);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: UserContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    signOut,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 