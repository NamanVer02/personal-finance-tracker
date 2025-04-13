import {
  BarChart3,
  Users,
  LogOut,
  Moon,
  FolderSync,
  Sun,
  MessageCircle,
  Menu,
  X,
  Upload,
  User,
  BadgeDollarSign,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import CsvUploadModal from "./CsvUploadModal";
import { toast } from "react-toastify";
import CacheMonitor from "./CacheMonitor";

export default function Navbar({
  currentUser,
  token,
  userId,
  logout,
  isDarkMode,
  setIsDarkMode,
  setTransactions,
  setIncomeData,
  setExpenseData,
  fetchTransactions,
  fetchIncomeData,
  fetchExpenseData,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);

  // Initialize dark mode from localStorage when component mounts
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "enabled") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, [setIsDarkMode]);

  const toggleDarkMode = () => {
    const darkModeEnabled = document.documentElement.classList.toggle("dark");
    setIsDarkMode(darkModeEnabled);
    localStorage.setItem("darkMode", darkModeEnabled ? "enabled" : "disabled");
    return `Dark mode ${darkModeEnabled ? "enabled" : "disabled"}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    return "Logged out successfully!";
  };

  const syncData = () => {
    if (fetchTransactions) {
      fetchTransactions(setTransactions, token);
      return "Data synced successfully";
    }
    return "";
  };

  const handleCsvUploadSuccess = () => {
    if (fetchTransactions) fetchTransactions(setTransactions, token);
    if (fetchIncomeData) fetchIncomeData(setIncomeData, userId, token);
    if (fetchExpenseData) fetchExpenseData(setExpenseData, userId, token);
    return "Transactions imported successfully!";
  };

  return (
    <>
      <AnimatePresence>
        {showCsvUploadModal && (
          <CsvUploadModal
            onClose={() => setShowCsvUploadModal(false)}
            onUploadSuccess={() => {
              const message = handleCsvUploadSuccess();
              toast.success(message);
            }}
          />
        )}
      </AnimatePresence>

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

                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/user-dashboard"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/user-dashboard");
                  }}
                >
                  <User className="h-4 w-4 text-gray-600" />
                  User Dashboard
                </button>
                {currentUser?.roles?.includes("ROLE_ADMIN") && (
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                      location.pathname === "/user-role-management"
                        ? "shadow-neumorphic-inset-button"
                        : "shadow-neumorphic-button"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/user-role-management");
                    }}
                  >
                    <Users className="h-4 w-4 text-gray-600" />
                    Role Management
                  </button>
                )}
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
                    <BadgeDollarSign className="h-4 w-4 text-gray-600" />
                    User Transactions
                  </button>
                )}

                {currentUser?.roles?.includes("ROLE_ACCOUNTANT") && (
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                      location.pathname === "/accountant-dashboard"
                        ? "shadow-neumorphic-inset-button"
                        : "shadow-neumorphic-button"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/accountant-dashboard");
                    }}
                  >
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    Accountant Dashboard
                  </button>
                )}

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
                  onClick={() => {
                    const message = syncData();
                    if (message) toast.success(message);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                >
                  <FolderSync className="h-4 w-4 text-gray-600" />
                  Sync Data
                </button>

                <button
                  onClick={() => {
                    const message = toggleDarkMode();
                    toast.info(message);
                    setMobileMenuOpen(false);
                  }}
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
                  onClick={() => {
                    setShowCsvUploadModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                >
                  <Upload className="h-4 w-4 text-gray-600" />
                  Import CSV
                </button>

                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button text-red-600"
                  onClick={() => {
                    const message = handleLogout();
                    toast.success(message);
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
      <motion.navbar className="hidden w-64 p-6 lg:block fixed h-screen bg-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-purple-600" />
          <div>
            <h3 className="font-medium">{currentUser?.username || "User"}</h3>
            <p className="text-sm text-gray-600">
              {currentUser?.roles
                ?.map((role) =>
                  role
                    .toLowerCase()
                    .split(" ")
                    .map(function (word) {
                      return word.charAt(5).toUpperCase() + word.slice(6);
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

              <button
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                  location.pathname === "/user-dashboard"
                    ? "shadow-neumorphic-inset-button"
                    : "shadow-neumorphic-button"
                }`}
                onClick={() => navigate("/user-dashboard")}
              >
                <User className="h-4 w-4 text-gray-600" />
                User Dashboard
              </button>
              {currentUser?.roles?.includes("ROLE_ADMIN") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/user-role-management"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => navigate("/user-role-management")}
                >
                  <Users className="h-4 w-4 text-gray-600" />
                  Role Management
                </button>
              )}
              {currentUser?.roles?.includes("ROLE_ADMIN") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/user-transactions"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => navigate("/user-transactions")}
                >
                  <BadgeDollarSign className="h-4 w-4 text-gray-600" />
                  User Transactions
                </button>
              )}

              {currentUser?.roles?.includes("ROLE_ACCOUNTANT") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/accountant-dashboard"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => navigate("/accountant-dashboard")}
                >
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  Accountant Dashboard
                </button>
              )}

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
                onClick={() => {
                  const message = syncData();
                  if (message) toast.success(message);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
              >
                <FolderSync className="h-4 w-4 text-gray-600" />
                Sync Data
              </button>
              <button
                onClick={() => {
                  const message = toggleDarkMode();
                  toast.info(message);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-gray-100 text-white"
                    : "bg-gray-100 text-gray-700"
                } shadow-neumorphic-button`}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-gray-600" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-600" />
                )}
                {isDarkMode ? "Enable Light Mode" : "Enable Dark Mode"}
              </button>

              <button
                onClick={() => setShowCsvUploadModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
              >
                <Upload className="h-4 w-4 text-gray-600" />
                Import CSV
              </button>

              {currentUser?.roles?.includes("ROLE_ADMIN") && (
                <button
                  onClick={() => setShowCacheModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                >
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  Cache Metrics
                </button>
              )}

              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button text-red-600"
                onClick={() => {
                  const message = handleLogout();
                  toast.success(message);
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.navbar>

      {/* Cache Metrics Modal */}
      <AnimatePresence>
        {showCacheModal && currentUser?.roles?.includes("ROLE_ADMIN") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowCacheModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-100 rounded-lg shadow-lg w-full max-w-lg mx-4"
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Cache Metrics</h2>
                <CacheMonitor />
                <button
                  onClick={() => setShowCacheModal(false)}
                  className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg shadow-neumorphic-purple"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
