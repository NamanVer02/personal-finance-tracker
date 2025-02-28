import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === "user" && password === "user") {
      login("user");
      setError("");
      navigate("/dashboard");
    }
    else if (username === "admin" && password === "admin") {
      login("admin");
      setError("");
      navigate("/dashboard");
    }
    else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-gray-100 p-8 rounded-lg shadow-neumorphic w-96">
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-700">Welcome Back!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Track your finances and achieve your goals.
          </p>
        </div>
  
        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}
  
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-600"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              required
            />
          </div>
  
          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              required
            />
          </div>
  
          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
