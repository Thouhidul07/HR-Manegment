import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr_manager' | 'employee';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms-auth';
const TOKEN_KEY = 'hrspace-token';

function normalizeUser(user: User): User {
  if (user.role !== 'admin') return user;

  return {
    ...user,
    name: 'System Admin',
  };
}

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@hrms.com': {
    password: 'Admin@1234',
    user: {
      id: '1',
      name: 'System Admin',
      email: 'admin@hrms.com',
      role: 'admin'
    }
  },
  'hr@hrms.com': {
    password: 'Hr@1234',
    user: {
      id: '2',
      name: 'HR Manager',
      email: 'hr@hrms.com',
      role: 'hr_manager'
    }
  },
  'employee@hrms.com': {
    password: 'Emp@1234',
    user: {
      id: '3',
      name: 'Employee User',
      email: 'employee@hrms.com',
      role: 'employee'
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

      if (import.meta.env.PROD) {
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

        if (normalizedEmail.endsWith('@hrms.com') && password === 'password123') {
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

  const value: AuthContextType = {
    user,
    login,
    logout,
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
