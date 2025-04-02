import {
  BarChart3,
  Users,
  LogOut,
  Trash2,
  Edit,
  ArrowDownLeft,
  ArrowUpRight,
  Moon,
  FolderSync,
  Sun,
  MessageCircle,
  Menu,
  X,
  Upload,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AddTransaction from "../components/AddTransaction";
import EditTransaction from "../components/EditTransaction";
import GraphCard from "../components/GraphCard";
import StatCard from "../components/StatCard";
import {
  fetchTransactions,
  handleDeleteTransaction,
  handleUpdateTransaction,
  handleDownloadCsv,
  fetchIncomeData,
  fetchExpenseData,
  handleDownloadPdf,
} from "../utils/api";
import { toast, ToastContainer } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import the default styles for the toast notifications
import { Filter } from "lucide-react";
import FilterAndSort from "../components/FilterAndSort";
import { motion } from "framer-motion";
import CsvUploadModal from "../components/CsvUploadModal";
import Pagination from "../components/Pagination";

export default function Dashboard() {
  // Variables
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");
  const { token } = useAuth();
  const month = new Date().toLocaleString("default", { month: "long" });
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [incomeData, setIncomeData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expenseData, setExpenseData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
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
    },
    sort: {
      field: "date",
      direction: "desc",
    },
  });
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
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const totalPages = Math.ceil((transactions?.length || 0) / itemsPerPage);

  // Functions
  const handlePageChange = (page) => setCurrentPage(page);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  const handleEditClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowEditPopup(true);
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

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Initial Setup
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions(setTransactions, token);
      fetchIncomeData(setIncomeData, userId, token);
      fetchExpenseData(setExpenseData, userId, token);
    }
  }, [isAuthenticated, token, userId]);

  useEffect(() => {
    const formattedIncomeData = Object.keys(incomeData).map((key) => ({
      name: key,
      value: incomeData[key],
    }));
    setTotalIncome(
      formattedIncomeData.reduce(
        (accumulator, current) => accumulator + current.value,
        0
      )
    );

    const formattedExpenseData = Object.keys(expenseData).map((key) => ({
      name: key,
      value: expenseData[key],
    }));
    setTotalExpense(
      formattedExpenseData.reduce(
        (accumulator, current) => accumulator + current.value,
        0
      )
    );
  }, [incomeData, expenseData]);

  useEffect(() => {
    if (transactions.length > 0) {
      let result = [...transactions];

      // Apply filters
      const { filter, sort } = filterOptions;

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
          // For label and category (string fields)
          const valueA = a[sort.field].toLowerCase();
          const valueB = b[sort.field].toLowerCase();

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
  }, [transactions, filterOptions]);

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
      {/* Add the popup component */}
      <AnimatePresence>
        {showAddPopup && (
          <AddTransaction
            onClose={() => setShowAddPopup(false)}
            onSubmit={() => {
              fetchTransactions(setTransactions, token);
              fetchIncomeData(setIncomeData, userId, token);
              fetchExpenseData(setExpenseData, userId, token);
              toast.success("Transaction added successfully!");
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditPopup && (
          <EditTransaction
            onClose={() => {
              setShowEditPopup(false);
              fetchTransactions(setTransactions, token);
              fetchIncomeData(setIncomeData, userId, token);
              fetchExpenseData(setExpenseData, userId, token);
            }}
            onSubmit={async (id, data) => {
              try {
                // Attempt to update the transaction
                const res = await handleUpdateTransaction(id, data, token);
                
                if(!res.success) {
                  toast.error("Older version of the entity is being edited. Please refresh the data before editing.")
                  return ;
                }

                // Fetch updated data
                await fetchExpenseData(setExpenseData, userId, token);
                await fetchIncomeData(setIncomeData, userId, token);

                // If everything goes well, return success
                toast.success("Transaction updated sucessfully")
                return { success: true };
              } catch (error) {
                // Handle specific error cases if needed
                console.error("Error updating transaction:", error);

                // Return an object indicating failure
                return {
                  success: false,
                  isConflict: error.isConflict || false, // Adjust based on your error handling logic
                  error: error.message || "An error occurred",
                };
              }
            }}
            transaction={selectedTransaction}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilterPopup && (
          <FilterAndSort
            onClose={() => setShowFilterPopup(false)}
            onApply={handleFilterApply}
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
                    fetchTransactions(setTransactions, token);
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
              {currentUser?.roles?.includes("ROLE_ACCOUNTANT") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/accountant-dashboard"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
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
                  fetchTransactions(setTransactions, token);
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
        <div className="mx-auto max-w-6xl space-y-8">
          <motion.div
            className="space-y-2"
            initial={{ x: -100, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-700">Dashboard</h1>
            <p className="text-gray-600">
              Get a quick overview of your monthly finances.
            </p>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              className="grid gap-6 md:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div
                className="grid gap-6 md:grid-rows-2"
                variants={cardVariants}
              >
                <StatCard
                  title={`Net Income`}
                  value={`$${(totalIncome - totalExpense).toFixed(2)}`}
                  changeType={
                    totalIncome - totalExpense >= 0 ? `positive` : `negative`
                  }
                />
                <StatCard
                  title={`Savings Rate`}
                  value={
                    totalIncome === 0
                      ? "N/A" // or you can use another placeholder like "Cannot calculate"
                      : `${(
                          ((totalIncome - totalExpense) / totalIncome) *
                          100
                        ).toFixed(2)}%`
                  }
                  changeType={
                    totalIncome === 0
                      ? "neutral" // or another appropriate value to indicate that the calculation is not applicable
                      : (totalIncome - totalExpense) / totalIncome >= 0
                      ? "positive"
                      : "negative"
                  }
                />
                <StatCard
                  title={`Expense to Income Ratio`}
                  value={
                    totalIncome === 0
                      ? "N/A" // or you can use another placeholder like "Cannot calculate"
                      : `${(totalExpense / totalIncome).toFixed(2)}`
                  }
                  changeType={
                    totalIncome === 0
                      ? "neutral" // or another value that indicates this metric is not applicable
                      : totalExpense / totalIncome <= 1
                      ? "positive"
                      : "negative"
                  }
                />
              </motion.div>
              <motion.div variants={cardVariants}>
                <GraphCard
                  title={`Expense per Category`}
                  value={`$${totalExpense}`}
                  data={expenseData}
                />
              </motion.div>
              <motion.div variants={cardVariants}>
                <GraphCard
                  title={`Income per Category`}
                  value={`$${totalIncome}`}
                  data={incomeData}
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="rounded-lg bg-gray-100 p-6"
              initial={{ x: -100, opacity: 0.4 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-700">
                    {month} Report
                  </h2>
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button flex items-center gap-1"
                      onClick={() => setShowFilterPopup(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filter & Sort
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                      onClick={() => {
                        handleDownloadCsv(token, userId);
                        toast.success("Downloaded Successfully!");
                      }}
                    >
                      Download CSV
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                      onClick={() => {
                        handleDownloadPdf(token, userId);
                        toast.success("Downloaded Successfully!");
                      }}
                    >
                      Download PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1 text-sm rounded-lg bg-purple-500 text-white shadow-neumorphic-purple"
                      onClick={() => setShowAddPopup(true)}
                    >
                      Add Transaction
                    </motion.button>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-2"></th>
                      <th className="pb-2">LABEL</th>
                      <th className="pb-2">AMOUNT</th>
                      <th className="pb-2">CATEGORY</th>
                      <th className="pb-2">DATE ADDED</th>
                      <th className="pb-2">ACTIONS</th>
                    </tr>
                  </thead>
                  <motion.tbody>
                    {filteredTransactions
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 1, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }} // Staggered delay
                          className="border-t border-gray-200"
                        >
                          <td className="py-3">
                            {transaction.type === "Expense" ? (
                              <ArrowDownLeft className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                          <td className="py-3 font-medium text-gray-700">
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
                          <td className="py-3 flex items-center gap-3">
                            <button className="text-gray-600 hover:text-red-600">
                              <Trash2
                                className="h-4 w-4"
                                onClick={() => {
                                  handleDeleteTransaction(
                                    transaction.id,
                                    setTransactions,
                                    token
                                  );
                                  toast.success(
                                    "Transaction deleted successfully!"
                                  );
                                  fetchExpenseData(
                                    setExpenseData,
                                    userId,
                                    token
                                  );
                                  fetchIncomeData(setIncomeData, userId, token);
                                }}
                              />
                            </button>
                            <button className="text-gray-600 hover:text-purple-600">
                              <Edit
                                className="h-4 w-4"
                                onClick={() => {
                                  handleEditClick(transaction);
                                  fetchExpenseData(
                                    setExpenseData,
                                    userId,
                                    token
                                  );
                                  fetchIncomeData(setIncomeData, userId, token);
                                }}
                              />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                  </motion.tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredTransactions.length}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* ToastContainer component to render toasts */}
      <ToastContainer draggable stacked />
    </motion.div>
  );
}
