import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import Chat from "../components/Chat";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const ChatPage = () => {
  const { isAuthenticated, currentUser, logout, token, userId } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        currentUser={currentUser}
        token={token}
        userId={userId}
        logout={logout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <div className="lg:ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            Chat
          </h1>
          <p className="text-gray-600">
            Connect and communicate with other users
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
