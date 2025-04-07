import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  User,
  BarChart3,
  MessageCircle,
  FolderSync,
  Sun,
  Moon,
  Upload,
  LogOut,
  Users,
  Key,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

export default function UserDashboard() {
  const { currentUser, token, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [accountStats, setAccountStats] = useState({
    joinDate: "Jan 15, 2023",
    lastLogin: "Apr 7, 2025",
    totalTransactions: 157,
  });

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleDarkMode = () => {
    const isDarkMode = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDarkMode);
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
    toast.info(`Dark mode ${isDarkMode ? "enabled" : "disabled"}`);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const formatLoginDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const getDaySuffix = (day) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day}${getDaySuffix(day)} ${month}, ${year}`;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    console.log(currentUser);

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${currentUser.userId}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update password");
      }

      toast.success("Password updated successfully");
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== currentUser.username) {
      toast.error("Username confirmation doesn't match");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${currentUser.userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: currentPassword,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }

      toast.success("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${currentUser.userId}/2fa/disable`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: currentPassword,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to disable 2FA");
      }

      toast.success("Two-factor authentication disabled successfully");
      setIs2FAModalOpen(false);
      setCurrentPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to disable 2FA");
    }
  };

  useEffect(() => {
    if (!currentUser) {
      console.log("currentUser not ready yet...");
      return;
    }

    const fetchUserDetails = async () => {
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode === "enabled") {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/users/${currentUser.userId}/details`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const data = await response.json();
        setUserDetails(data);
        console.log(data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch user details");
      }
    };

    fetchUserDetails();
  }, [currentUser, token]);

  return (
    <div className={`min-h-screen bg-gray-100 transition-all duration-300`}>
      {/* Mobile Top Navbar - only visible on small screens */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 shadow-md lg:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-600" />
            <h3 className="font-medium">{currentUser?.username || "User"}</h3>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-100 shadow-neumorphic-button"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-100 shadow-md"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/dashboard"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/dashboard");
                  }}
                >
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  Dashboard
                </button>

                {currentUser?.roles?.includes("ROLE_ADMIN") && (
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                      location.pathname === "/user-transactions"
                        ? "shadow-neumorphic-inset-button"
                        : "shadow-neumorphic-button"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/user-transactions");
                    }}
                  >
                    <Users className="h-4 w-4 text-gray-600" />
                    User Transactions
                  </button>
                )}

                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/user-settings"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/user-settings");
                  }}
                >
                  <User className="h-4 w-4 text-gray-600" />
                  Account Settings
                </button>

                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/ai-assistant"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/ai-assistant");
                  }}
                >
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  AI Assistant
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-600" />
                  )}
                  {isDarkMode ? "Enable Light Mode" : "Enable Dark Mode"}
                </button>

                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button text-red-600"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed Sidebar */}
      <motion.nav className="hidden w-64 p-6 lg:block fixed h-screen bg-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-purple-600" />
          <div>
            <h3 className="font-medium">{currentUser?.username || "User"}</h3>
            <p className="text-sm text-gray-600">
              {currentUser?.roles
                ?.map((role) =>
                  role
                    .replace("ROLE_", "")
                    .toLowerCase()
                    .split(" ")
                    .map(function (word) {
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(" ")
                )
                .join(", ") || "User"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium text-gray-600">MENU</h4>
            <div className="space-y-4">
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                  location.pathname === "/dashboard"
                    ? "shadow-neumorphic-inset-button"
                    : "shadow-neumorphic-button"
                }`}
                onClick={() => navigate("/dashboard")}
              >
                <BarChart3 className="h-4 w-4 text-gray-600" />
                Dashboard
              </button>

              {currentUser?.roles?.includes("ROLE_ADMIN") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/user-transactions"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => navigate("/user-transactions")}
                >
                  <Users className="h-4 w-4 text-gray-600" />
                  User Transactions
                </button>
              )}

              <button
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-inset-button`}
              >
                <User className="h-4 w-4 text-gray-600" />
                Account Settings
              </button>

              <button
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                  location.pathname === "/ai-assistant"
                    ? "shadow-neumorphic-inset-button"
                    : "shadow-neumorphic-button"
                }`}
                onClick={() => navigate("/ai-assistant")}
              >
                <MessageCircle className="h-4 w-4 text-gray-600" />
                AI Assistant
              </button>
            </div>
          </div>

          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium text-gray-600">ACCOUNT</h4>
            <div className="space-y-4">
              <button
                onClick={toggleDarkMode}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 text-gray-700 shadow-neumorphic-button`}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-gray-600" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-600" />
                )}
                {isDarkMode ? "Enable Light Mode" : "Enable Dark Mode"}
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen pt-20 lg:pt-8 px-4 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div
            className="space-y-2"
            initial={{ x: -100, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-700">
              Account Dashboard
            </h1>
            <p className="text-gray-600">
              Configure your accoutns settings here.
            </p>
          </motion.div>

          {/* User Profile Section */}
          <motion.div
            className="bg-gray-100 rounded-lg p-6 shadow-neumorphic mb-6"
            variants={cardVariants}
            initial="hidden"
            animate="show"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              User Profile
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-purple-600"></div>
              </div>
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">Username</p>
                  <p className="font-medium">
                    {currentUser?.username || "User"}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Roles</p>
                  <p className="font-medium">
                    {currentUser?.roles
                      ?.map((role) =>
                        role
                          .replace("ROLE_", "")
                          .toLowerCase()
                          .split(" ")
                          .map(function (word) {
                            return word.charAt(0).toUpperCase() + word.slice(1);
                          })
                          .join(" ")
                      )
                      .join(", ") || "User"}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Email</p>
                  <p className="font-medium">{userDetails.user.email}</p>
                </div>
                <div>
                  <p className="text-sm">Last Login</p>
                  <p className="font-medium">
                    {userDetails?.user.lastLoginDate
                      ? formatLoginDate(userDetails.user.lastLoginDate)
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center ml-auto">
                <div className="shadow-neumorphic-inset p-4 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                  <p className="text-sm">Transactions</p>
                  <p className="font-medium text-lg">
                    {userDetails.totalTransactions || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            className="bg-gray-100 rounded-lg p-6 shadow-neumorphic mb-6"
            variants={cardVariants}
            initial="hidden"
            animate="show"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Security Settings
            </h2>
            <div className="space-y-4">
              {/* Password Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-100 rounded-lg">
                <div className="w-full sm:w-auto">
                  <h3 className="font-medium mb-1">Password</h3>
                  <p className="text-sm text-gray-500">
                    Change your account password
                  </p>
                </div>
                <div className="w-full sm:w-[160px] mt-2 sm:mt-0">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full px-4 py-2 rounded-lg shadow-neumorphic-button text-sm"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* 2FA Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-100 rounded-lg">
                <div className="w-full sm:w-auto">
                  <h3 className="font-medium mb-1">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentUser?.twoFactorEnabled
                      ? "Currently enabled"
                      : "Currently disabled"}
                  </p>
                </div>
                <div className="w-full sm:w-[160px] mt-2 sm:mt-0">
                  {currentUser?.twoFactorEnabled ? (
                    <button
                      onClick={() => setIs2FAModalOpen(true)}
                      className="w-full px-4 py-2 rounded-lg shadow-neumorphic-button text-sm"
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button className="w-full px-4 py-2 rounded-lg shadow-neumorphic-button text-sm">
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>

              {/* Delete Account */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-100 rounded-lg">
                <div className="w-full sm:w-auto">
                  <h3 className="font-medium mb-1 text-red-600">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <div className="w-full sm:w-[160px] mt-2 sm:mt-0">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full px-4 py-2 rounded-lg shadow-neumorphic-button text-sm"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                Update Password
              </h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-button text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-neumorphic-purple flex items-center gap-2"
                >
                  <Save size={18} />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-100 rounded-lg p-6 shadow-neumorphic max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-red-600">
                Delete Account
              </h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                This action is irreversible. All your data will be permanently
                deleted.
              </p>
              <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">
                <p className="text-sm">
                  To confirm deletion, please enter your username:{" "}
                  <strong>{currentUser?.username}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="deleteConfirmation"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Username Confirmation
                </label>
                <input
                  type="text"
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="deletePassword"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-button text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-100 rounded-lg p-6 shadow-neumorphic max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-yellow-700">
                Disable Two-Factor Authentication
              </h2>
              <button
                onClick={() => setIs2FAModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                Disabling two-factor authentication will make your account less
                secure. Are you sure you want to continue?
              </p>
              <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4 flex items-center gap-3">
                <Shield size={20} />
                <p className="text-sm">
                  Two-factor authentication adds an additional layer of security
                  to your account.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="tfaPassword"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Enter Password to Confirm
                </label>
                <input
                  type="password"
                  id="tfaPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIs2FAModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-button text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg flex items-center gap-2"
                >
                  <Shield size={18} />
                  Disable 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
}
