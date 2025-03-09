import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (accessToken, username, roles) => {
    localStorage.setItem("token", accessToken);
    
    const user = {
      username,
      roles
    };
    
    localStorage.setItem("user", JSON.stringify(user));
    setToken(accessToken);
    setCurrentUser(user);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
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