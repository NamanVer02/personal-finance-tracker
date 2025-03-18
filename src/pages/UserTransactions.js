import {
  BarChart3,
  LogOut,
  ArrowDownLeft,
  ArrowUpRight,
  Moon,
  FolderSync,
  Sun,
  Users,
  Search,
  Download,
  MessageCircle,
  Menu,
  X,
  Upload
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Filter } from "lucide-react";
import FilterAndSort from "../components/FilterAndSort";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import CsvUploadModal from "../components/CsvUploadModal";
import { fetchExpenseData, fetchIncomeData, fetchTransactions } from "../utils/api";

export default function UserTransactions(setIncomeData, setExpenseData, setTransactions) {
  // Variables
  const navigate = useNavigate();
  const location = useLocation();
  const { token, currentUser, logout, isAuthenticated } = useAuth();
  const userId = localStorage.getItem("userId");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );

  const [userTransactions, setUserTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    filter: {
      type: "all",
      dateFrom: "",
      dateTo: "",
      categories: [],
      amountMin: "",
      amountMax: "",
      label: "",
      userId: "",
    },
    sort: {
      field: "date",
      direction: "desc",
    },
  });

  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const totalPages = Math.ceil(
    (filteredTransactions?.length || 0) / itemsPerPage
  );

  // Functions
  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  const toggleDarkMode = () => {
    const isDarkMode = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDarkMode);
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
    toast.info(`Dark mode ${isDarkMode ? "enabled" : "disabled"}`);
  };

  const handleFilterApply = (options) => {
    setFilterOptions(options);
    toast.info("Filters applied");
  };

  const fetchAllUserTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/get/admin/transactions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter out the current admin's transactions
        const filteredData = data.filter(
          (transaction) => transaction.userId !== currentUser.id
        );
        setUserTransactions(filteredData);
        setIsLoading(false);
      } else {
        toast.error("Failed to fetch user transactions");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      toast.error("Error fetching data. Please try again.");
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/get/admin/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter out the current admin from the users list
        const filteredUsers = data.filter((user) => user.id !== currentUser.id);
        setUsersList(filteredUsers);
      } else {
        toast.error("Failed to fetch users list");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users data. Please try again.");
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    setFilterOptions({
      ...filterOptions,
      filter: {
        ...filterOptions.filter,
        userId: userId,
      },
    });
  };

  const handleDownloadUserTransactionsCsv = async () => {
    try {
      let url = `http://localhost:8080/api/download/admin`;

      if (selectedUser) {
        url += `?userId=${selectedUser}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "All-transactions.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Transactions downloaded successfully!");
      } else {
        toast.error("Failed to download transactions");
      }
    } catch (error) {
      console.error("Error downloading transactions:", error);
      toast.error("Error downloading data. Please try again.");
    }
  };

  // Check authentication and redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!currentUser?.roles?.includes("ROLE_ADMIN")) {
      navigate("/dashboard");
      toast.error("You don't have permission to access admin pages");
    }
  }, [isAuthenticated, navigate, currentUser]);

  // Initial Setup
  useEffect(() => {
    if (isAuthenticated && currentUser?.roles?.includes("ROLE_ADMIN")) {
      fetchAllUserTransactions();
      fetchAllUsers();
    }
  }, [isAuthenticated, token, currentUser]);

  // Apply filters to transactions
  useEffect(() => {
    if (userTransactions.length > 0) {
      let result = [...userTransactions];

      // Apply filters
      const { filter, sort } = filterOptions;

      // Filter by userId
      if (filter.userId) {
        result = result.filter(
          (t) => String(t.userId) === String(filter.userId)
        );
      }

      // Filter by type
      if (filter.type !== "all") {
        result = result.filter((t) => t.type === filter.type);
      }

      // Filter by date range
      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom);
        result = result.filter((t) => new Date(t.date) >= fromDate);
      }

      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of the day
        result = result.filter((t) => new Date(t.date) <= toDate);
      }

      // Filter by amount range
      if (filter.amountMin) {
        result = result.filter(
          (t) => parseFloat(t.amount) >= parseFloat(filter.amountMin)
        );
      }

      if (filter.amountMax) {
        result = result.filter(
          (t) => parseFloat(t.amount) <= parseFloat(filter.amountMax)
        );
      }

      // Filter by label (search)
      if (filter.label) {
        const searchTerm = filter.label.toLowerCase();
        result = result.filter((t) =>
          t.label.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by categories
      if (filter.categories.length > 0) {
        result = result.filter((t) => filter.categories.includes(t.category));
      }

      // Apply search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (t) =>
            (t.label?.toLowerCase() || "").includes(term) ||
            (t.category?.toLowerCase() || "").includes(term) ||
            (t.username?.toLowerCase() || "").includes(term)
        );
      }

      // Apply sorting
      result.sort((a, b) => {
        if (sort.field === "date") {
          return sort.direction === "asc"
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        } else if (sort.field === "amount") {
          return sort.direction === "asc"
            ? parseFloat(a.amount) - parseFloat(b.amount)
            : parseFloat(b.amount) - parseFloat(a.amount);
        } else {
          // For label, category, and username (string fields)
          const valueA = (a[sort.field] || "")?.toLowerCase() || "";
          const valueB = (b[sort.field] || "")?.toLowerCase() || "";

          if (sort.direction === "asc") {
            return valueA.localeCompare(valueB);
          } else {
            return valueB.localeCompare(valueA);
          }
        }
      });

      setFilteredTransactions(result);
      // Update pagination when filters change
      setCurrentPage(1);
    } else {
      setFilteredTransactions([]);
    }
  }, [userTransactions, filterOptions, searchTerm]);

  // If still checking authentication, show loading
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full bg-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Page
  return (
    <motion.div className="flex min-h-screen bg-gray-100">
      <AnimatePresence>
        {showFilterPopup && (
          <FilterAndSort
            onClose={() => setShowFilterPopup(false)}
            onApply={handleFilterApply}
            showUserFilter={true}
            usersList={usersList}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCsvUploadModal && (
          <CsvUploadModal
            onClose={() => setShowCsvUploadModal(false)}
            onUploadSuccess={() => {
              fetchTransactions(setTransactions, token);
              fetchIncomeData(setIncomeData, userId, token);
              fetchExpenseData(setExpenseData, userId, token);
              toast.success("Transactions imported successfully!");
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
                    toast.success("Data Synced Successfully");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                >
                  <FolderSync className="h-4 w-4 text-gray-600" />
                  Sync Data
                </button>

                <button
                  onClick={() => {
                    toggleDarkMode();
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
      <motion.navbar className="hidden w-64 p-6 lg:block fixed h-screen bg-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-full bg-purple-600 " />
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
                onClick={() => {
                  navigate("/dashboard");
                }}
              >
                <BarChart3 className="h-4 w-4 text-gray-600" />
                Dashboard
              </button>
              {/* Conditionally render History tab */}
              {currentUser?.roles?.includes("ROLE_ADMIN") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/user-transactions"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
                    navigate("/user-transactions");
                  }}
                >
                  <Users className="h-4 w-4 text-gray-600" />
                  User Transactions
                </button>
              )}
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                  location.pathname === "/ai-assistant"
                    ? "shadow-neumorphic-inset-button"
                    : "shadow-neumorphic-button"
                }`}
                onClick={() => {
                  navigate("/ai-assistant");
                }}
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
                  toast.success("Data Synced Successfuly");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
              >
                <FolderSync className="h-4 w-4 text-gray-600" />
                Sync Data
              </button>
              <button
                onClick={toggleDarkMode}
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
      </motion.navbar>

      {/* Main Content */}
      <div className="flex-1 p-8 lg:ml-64 bg-gray-100">
        <motion.div
          className="mx-auto max-w-6xl space-y-8"
          initial={{ x: -100, opacity: 0.4 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-700">
              User Transactions
            </h1>
            <p className="text-gray-600">
              View and manage transactions from all users
            </p>
          </div>

          <div className="rounded-lg bg-gray-100 p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-inset-button w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="px-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-button"
                    value={selectedUser || ""}
                    onChange={(e) => handleUserSelect(e.target.value)}
                  >
                    <option value="">All Users</option>
                    {usersList.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button flex items-center gap-1"
                    onClick={() => setShowFilterPopup(true)}
                  >
                    <Filter className="h-4 w-4" />
                    Filter & Sort
                  </button>
                  <button
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button flex items-center gap-1"
                    onClick={handleDownloadUserTransactionsCsv}
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="h-8 w-8 rounded-full bg-purple-600 animate-pulse mx-auto" />
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600">
                        <th className="pb-2"></th>
                        <th className="pb-2">USER</th>
                        <th className="pb-2">LABEL</th>
                        <th className="pb-2">AMOUNT</th>
                        <th className="pb-2">CATEGORY</th>
                        <th className="pb-2">DATE</th>
                      </tr>
                    </thead>
                    <motion.tbody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions
                          .slice(
                            (currentPage - 1) * itemsPerPage,
                            currentPage * itemsPerPage
                          )
                          .map((transaction, index) => (
                            <motion.tr
                              key={transaction.id}
                              className="border-t border-gray-200"
                              initial={{ opacity: 1, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                            >
                              <td className="py-3">
                                {transaction.type === "Expense" ? (
                                  <ArrowDownLeft className="h-4 w-4 text-red-600" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                                )}
                              </td>
                              <td className="py-3 font-medium text-gray-600">
                                {usersList.find(
                                  (user) =>
                                    String(user.id) ===
                                    String(transaction.userId)
                                )?.username || "Unknown User"}
                              </td>
                              <td className="py-3 text-gray-700">
                                {transaction.label}
                              </td>
                              <td className="py-3 text-gray-600">
                                {transaction.amount}
                              </td>
                              <td className="py-3 text-gray-600">
                                {transaction.category}
                              </td>
                              <td className="py-3 text-gray-600">
                                {
                                  new Date(transaction?.date)
                                    .toISOString()
                                    .split("T")[0]
                                }
                              </td>
                            </motion.tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-6 text-center text-gray-600"
                          >
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </motion.tbody>
                  </table>

                  {filteredTransactions.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Showing{" "}
                        {filteredTransactions.length > 0
                          ? (currentPage - 1) * itemsPerPage + 1
                          : 0}{" "}
                        to{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredTransactions.length
                        )}{" "}
                        of {filteredTransactions.length} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevPage}
                          className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                          disabled={currentPage === 1}
                        >
                          Prev
                        </button>
                        {totalPages <= 5 ? (
                          [...Array(totalPages)].map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handlePageChange(index + 1)}
                              className={`px-3 py-1 text-sm rounded-lg ${
                                currentPage === index + 1
                                  ? "shadow-neumorphic-inset-button"
                                  : "bg-gray-100 shadow-neumorphic-button"
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))
                        ) : (
                          <>
                            {currentPage > 1 && (
                              <button
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                              >
                                1
                              </button>
                            )}
                            {currentPage > 2 && <span>...</span>}

                            {currentPage > 1 && (
                              <button
                                onClick={() =>
                                  handlePageChange(currentPage - 1)
                                }
                                className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                              >
                                {currentPage - 1}
                              </button>
                            )}

                            <button className="px-3 py-1 text-sm rounded-lg shadow-neumorphic-inset-button">
                              {currentPage}
                            </button>

                            {currentPage < totalPages && (
                              <button
                                onClick={() =>
                                  handlePageChange(currentPage + 1)
                                }
                                className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                              >
                                {currentPage + 1}
                              </button>
                            )}

                            {currentPage < totalPages - 1 && <span>...</span>}
                            {currentPage < totalPages && (
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                              >
                                {totalPages}
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={handleNextPage}
                          className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <ToastContainer draggable stacked />
    </motion.div>
  );
}
