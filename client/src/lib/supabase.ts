// This file contains helper functions for interacting with the Supabase authentication API
// In a real application, we would use the Supabase JavaScript client directly

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string | null;
    avatar_url: string | null;
  };
  token: string;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }

  return await response.json();
}

export async function registerWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return await response.json();
}

export async function loginWithGoogle(): Promise<AuthResponse> {
  // In a real app, this would redirect to the Supabase OAuth flow
  throw new Error("Google authentication not implemented");
}

export async function getCurrentUser(token: string): Promise<AuthResponse["user"]> {
  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get current user");
  }

  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem("wa_auth_token");
}
