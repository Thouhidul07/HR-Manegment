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

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@nexoratech.com': {
    password: 'Admin@1234',
    user: {
      id: '1',
      name: 'System Admin',
      email: 'admin@nexoratech.com',
      role: 'admin'
    }
  },
  'hr.manager01@nexoratech.com': {
    password: 'Hr@1234',
    user: {
      id: '2',
      name: 'HR Manager',
      email: 'hr.manager01@nexoratech.com',
      role: 'hr_manager'
    }
  },
  'employee01@nexoratech.com': {
    password: 'Emp@1234',
    user: {
      id: '3',
      name: 'Employee User',
      email: 'employee01@nexoratech.com',
      role: 'employee'
    }
  },
  'project.manager@nexoratech.com': {
    password: 'Pm@1234',
    user: {
      id: '12',
      name: 'Project Manager',
      email: 'project.manager@nexoratech.com',
      role: 'project_manager'
    }
  }
};

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

      if ((import.meta as any).env?.PROD) {
        throw new Error('Invalid email or password');
      }
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim();

        if (MOCK_USERS[normalizedEmail]) {
          const { password: expectedPassword, user: mockUser } = MOCK_USERS[normalizedEmail];
          if (password === expectedPassword) {
            setUser(mockUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
            resolve();
            return;
          }
        }

        if (normalizedEmail.endsWith('@nexoratech.com') && password === 'password123') {
          const name = normalizedEmail.split('@')[0].replace(/[._]/g, ' ');
          const capitalizedName = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const newUser: User = {
            id: Date.now().toString(),
            name: capitalizedName,
            email: normalizedEmail,
            role: 'employee'
          };

          setUser(newUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
          resolve();
          return;
        }

        reject(new Error('Invalid email or password'));
      }, 800);
    });
  };

  const logout = () => {
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
