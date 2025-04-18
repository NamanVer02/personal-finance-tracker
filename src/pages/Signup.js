import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Upload, User, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import {
  validateUsername,
  validateEmail,
  validatePassword,
} from "../utils/validation";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Avatar creator state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState("adventurer");
  const [avatarSeed, setAvatarSeed] = useState(
    Math.random().toString(36).substring(2, 8)
  );
  const [avatarBgColor, setAvatarBgColor] = useState("b6e3f4");

  const avatarStyles = [
    "adventurer",
    "adventurer-neutral",
    "avataaars",
    "big-ears",
    "big-ears-neutral",
    "big-smile",
    "bottts",
    "croodles",
    "croodles-neutral",
    "fun-emoji",
    "lorelei",
    "micah",
    "miniavs",
    "open-peeps",
    "personas",
    "pixel-art",
  ];

  const bgColors = [
    "b6e3f4",
    "c0aede",
    "d1d4f9",
    "ffd5dc",
    "ffdfbf",
    "e0efd0",
    "transparent",
  ];

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match("image.*")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar related functions
  const openAvatarModal = () => {
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const generateRandomSeed = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 8));
  };

  const getAvatarUrl = () => {
    return `https://api.dicebear.com/7.x/${avatarStyle}/png?seed=${avatarSeed}&backgroundColor=${avatarBgColor}`;
  };

  const toTitleCase = (str) => {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const confirmAvatar = async () => {
    try {
      // Fetch PNG avatar
      const response = await fetch(getAvatarUrl());
      const blob = await response.blob();
      
      // Create a File object from the PNG blob
      const file = new File([blob], `avatar-${avatarSeed}.png`, { type: 'image/png' });
      
      setProfileImage(file);
      setImagePreview(getAvatarUrl());
      closeAvatarModal();
    } catch (error) {
      toast.error("Failed to create avatar. Please try again.");
      console.error("Avatar creation error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setErrors((prev) => ({ ...prev, email: emailError || "" }));
    if (emailError) {
      toast.error(emailError);
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    const confirmError = !confirmPassword
      ? "Confirm password is required"
      : password !== confirmPassword
      ? "Passwords do not match"
      : "";

    if (confirmError) {
      toast.error(confirmError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create FormData object for multipart/form-data
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("roles", JSON.stringify(["user"]));

      // Append profile image if selected
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch("https://localhost:8080/api/auth/signup", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header when using FormData
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Failed to register");
        throw new Error(data.message || "Failed to register");
      }

      // If registration is successful, log the user in
      toast.success("Registration successful");
      const qrCodeBase64 = data.qrCodeBase64;
      console.log(qrCodeBase64);

      navigate("/setup-2fa", {
        state: {
          twoFactorSetup: data.twoFactorSetup,
        },
      });
    } catch (err) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 py-12">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Avatar Creator Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-2xl bg-gray-100 p-6 shadow-neumorphic">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">
                Create Your Avatar
              </h3>
              <button
                onClick={closeAvatarModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="mb-6 flex justify-center">
              <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-purple-200 shadow-neumorphic">
                <img
                  src={getAvatarUrl()}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Avatar Options */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Avatar Style
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {avatarStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setAvatarStyle(style)}
                    className={`rounded-md p-2 text-xs ${
                      avatarStyle === style
                        ? "bg-gray-100 text-purple-700 shadow-neumorphic-inset"
                        : "bg-gray-100 text-gray-700 shadow-neumorphic-button"
                    }`}
                  >
                    {toTitleCase(style)}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Background Color
              </label>
              <div className="flex flex-wrap gap-2">
                {bgColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarBgColor(color)}
                    className={`h-8 w-8 rounded-full shadow-neumorphic ${
                      avatarBgColor === color
                        ? "ring-2 ring-purple-500 ring-offset-2"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        color === "transparent" ? "transparent" : `#${color}`,
                      border:
                        color === "transparent" ? "1px dashed #ccc" : "none",
                    }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Random button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={generateRandomSeed}
                className="w-full rounded-md bg-gray-100 py-2 text-sm font-medium text-gray-700 shadow-neumorphic-button"
              >
                Randomize
              </button>
            </div>

            {/* Confirm button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeAvatarModal}
                className="rounded-md border bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-neumorphic"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAvatar}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 shadow-neumorphic transition-all hover:shadow-neumorphic-hover"
              >
                Use This Avatar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-grap-100 p-8 shadow-neumorphic">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-700">
              Create an Account
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Profile Image Upload */}
          <div className="mb-6 flex flex-col items-center">
            <div
              onClick={handleImageClick}
              className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-gray-100 shadow-neumorphic-inset transition-all hover:shadow-neumorphic-hover"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <div className="mt-2 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">
                Click to upload profile picture (optional)
              </p>
              <button
                type="button"
                onClick={openAvatarModal}
                className="flex items-center rounded-md bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 hover:bg-purple-200"
              >
                Create Avatar
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            encType="multipart/form-data"
          >
            {/* Username field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border-gray-300 bg-gray-100 p-3 shadow-neumorphic-inset focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-md border-gray-300 bg-gray-100 p-3 shadow-neumorphic-inset focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 bg-gray-100 p-3 shadow-neumorphic-inset focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 bg-gray-100 p-3 shadow-neumorphic-inset focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-purple-600 px-4 py-3 text-sm font-medium text-white shadow-neumorphic transition-all hover:bg-purple-700 hover:shadow-neumorphic-hover focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
