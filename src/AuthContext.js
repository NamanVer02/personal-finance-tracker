import React, { createContext, useContext, useState } from 'react';

// Create a context for authentication
const AuthContext = createContext();

// Custom hook to access authentication context
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component to wrap the app and provide auth context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // State to store user info (null means not logged in)

  // Login function (role can be either 'user' or 'admin')
  const login = (role) => {
    setUser({ role });
  };

  // Logout function
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
