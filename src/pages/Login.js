import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PasswordResetModal from "../components/PasswordResetModal";
import { Eye, EyeOff } from "lucide-react";
import { validateUsername, validate2FACode } from "../utils/validation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    twoFactorCode: ''
  });
  // New state for password reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    const twoFactorError = validate2FACode(twoFactorCode);
    
    setErrors({
      twoFactorCode: twoFactorError || ''
    });

    if (twoFactorError) {
      toast.error(twoFactorError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          twoFactorCode: parseInt(twoFactorCode, 10) || null, // Convert to integer as per your API requirement
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials or 2FA code");
      }

      // Store the JWT token and user info
      const token = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const userId = data.id;

      if (!token) {
        throw new Error("Authentication failed: No token received");
      }

      // Pass the token to your auth context
      login(token, refreshToken, data.username, data.roles || ["user"], userId);

      // Show success toast
      toast.success("Login successful! Redirecting to dashboard...");

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      // Show error toast
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the password reset modal
  const openResetModal = () => {
    setIsResetModalOpen(true);
  };

  // Handle closing the password reset modal
  const closeResetModal = () => {
    setIsResetModalOpen(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-100 p-4 transition-all duration-300`}
    >
      <div className="bg-gray-100 p-8 rounded-lg shadow-neumorphic w-96">
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-700">Welcome Back!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Track your finances and achieve your goals.
          </p>
        </div>

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
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors(prev => ({...prev, username: validateUsername(e.target.value) || ''}));
              }}
              className={`mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset ${
                errors.username ? 'border-red-500' : 'focus:ring-2 focus:ring-purple-500'
              } outline-none p-2`}
              required
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-500" />
                ) : (
                  <Eye size={20} className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* 2FA Code Field */}
          <div>
            <label
              htmlFor="twoFactorCode"
              className="block text-sm font-medium text-gray-600"
            >
              2FA Code
            </label>
            <input
              type="text"
              id="twoFactorCode"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={openResetModal}
              className="text-sm text-purple-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Signup Link */}
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-purple-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* ToastContainer component to render toasts */}
      <ToastContainer draggable stacked />

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={closeResetModal}
        username={username}
      />
    </div>
  );
}
