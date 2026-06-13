import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr_manager' | 'project_manager' | 'employee';
  avatar?: string;
  phone?: string;
  department?: string;
  designation?: string;
  company_id?: string | number;
  employee_code?: string;
  company_name?: string;
  company_domain?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms-auth';
const TOKEN_KEY = 'hrspace-token';

function normalizeUser(user: any): User {
  if (!user) return user;

  const company_id = user.company_id ?? user.company?.id;
  const company_name = user.company_name ?? user.company?.name;
  const company_domain = user.company_domain ?? user.company?.domain;

  const normalized: User = {
    ...user,
    company_id,
    company_name,
    company_domain,
    employee_code: user.employee_code ?? user.employeeCode,
  };

  if (normalized.role === 'admin') {
    normalized.name = 'System Admin';
  }

  return normalized;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsedUser = normalizeUser(JSON.parse(storedAuth));
        setUser(parsedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedUser));
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const authenticatedUser = normalizeUser(response.data.user);

      setUser(authenticatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      localStorage.setItem(TOKEN_KEY, response.data.token);
      return;
    } catch (apiError: any) {
      if (apiError?.response) {
        throw new Error(apiError.response.data?.message || 'Invalid email or password');
      }
      throw new Error('Unable to reach the authentication service');
    }
  };

  const logout = () => {
    api.post("/auth/logout").catch(() => undefined);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const updatedUser = normalizeUser({ ...currentUser, ...updates });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
