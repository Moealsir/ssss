import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import Connections from "@/pages/connections";
import ApiKeys from "@/pages/api-keys";
import Webhooks from "@/pages/webhooks";
import Logs from "@/pages/logs";
import Docs from "@/pages/docs";

// Simple auth context to keep track of user state
export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("wa_auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to get user");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
        })
        .catch((err) => {
          console.error("Auth error:", err);
          localStorage.removeItem("wa_auth_token");
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("wa_auth_token", data.token);
      setLocation("/");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("wa_auth_token", data.token);
      setLocation("/");
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("wa_auth_token");
    setLocation("/auth");
  };

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>

      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/connections">
        <ProtectedRoute>
          <Connections />
        </ProtectedRoute>
      </Route>

      <Route path="/api-keys">
        <ProtectedRoute>
          <ApiKeys />
        </ProtectedRoute>
      </Route>

      <Route path="/webhooks">
        <ProtectedRoute>
          <Webhooks />
        </ProtectedRoute>
      </Route>

      <Route path="/logs">
        <ProtectedRoute>
          <Logs />
        </ProtectedRoute>
      </Route>

      <Route path="/docs">
        <ProtectedRoute>
          <Docs />
        </ProtectedRoute>
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
