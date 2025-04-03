import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || null
  );
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");
    const storedUserId = localStorage.getItem("userId");

    if (storedToken && storedUser && storedUserId) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setCurrentUser(JSON.parse(storedUser));
      setUserId(storedUserId);
    }

    setLoading(false);
  }, []);

  // Login function
  const login = (accessToken, refreshTokenValue, username, roles, userId) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshTokenValue);
    localStorage.setItem("userId", userId);

    const user = {
      userId,
      username,
      roles,
    };

    localStorage.setItem("user", JSON.stringify(user));
    setToken(accessToken);
    setRefreshToken(refreshTokenValue);
    setCurrentUser(user);
    setUserId(userId);
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        // Notify the server to blacklist the token
        await fetch("http://localhost:8080/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clean up local storage regardless of server response
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      setToken(null);
      setRefreshToken(null);
      setCurrentUser(null);
      setUserId(null);
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      
      // Update tokens
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // On failure, clear auth state
      logout();
      return null;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return currentUser?.roles?.includes(role) || false;
  };

  // Create authorization header for API requests
  const authHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };


  const value = {
    currentUser,
    token,
    refreshToken,
    userId,
    login,
    logout,
    refreshAccessToken,
    hasRole,
    authHeader,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
