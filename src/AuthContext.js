import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedUserId = localStorage.getItem("userId");
    
    if (storedToken && storedUser && storedUserId) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
      setUserId(storedUserId);
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (accessToken, username, roles, userId) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("userId", userId);
    
    const user = {
      userId,
      username,
      roles
    };
    
    localStorage.setItem("user", JSON.stringify(user));
    setToken(accessToken);
    setCurrentUser(user);
    setUserId(userId);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setToken(null);
    setCurrentUser(null);
    setUserId(null);
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
    userId,
    login,
    logout,
    hasRole,
    authHeader,
    isAuthenticated: !!token,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}