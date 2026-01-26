import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Rehydrate from localStorage on first load
  useEffect(() => {
    const storedToken = localStorage.getItem("aegis_token");
    const storedUser = localStorage.getItem("aegis_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // 2. Login helper – call your backend and persist state
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      // Backend returns { token, user }
      const accessToken: string = data.token;
      const userObj: User = data.user;

      setToken(accessToken);
      setUser(userObj);

      localStorage.setItem("aegis_token", accessToken);
      localStorage.setItem("aegis_user", JSON.stringify(userObj));
    } catch (error: any) {
      // Re-throw so the Login page can handle it
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 3. Logout helper
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

