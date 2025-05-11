import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../models/types';
import authRepository from '../repository/auth-repository';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          // Validate token
          await authRepository.getUserProfile();
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authRepository.login(token);
      
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', token);
      
      toast.success('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials and try again.');
      toast.error('Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}