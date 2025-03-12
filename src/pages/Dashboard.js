import {
  BarChart3,
  History,
  LogOut,
  Trash2,
  Edit,
  ArrowDownLeft,
  ArrowUpRight,
  Moon,
  FolderSync,
  Sun,
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
} from "../utils/api";
import { toast, ToastContainer } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import the default styles for the toast notifications
import { Filter } from "lucide-react";
import FilterAndSort from "../components/FilterAndSort";

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
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );
  const [transactions, setTransactions] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil((transactions?.length || 0) / itemsPerPage);

  const [showFilterPopup, setShowFilterPopup] = useState(false);
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
  const [filteredTransactions, setFilteredTransactions] = useState([]);

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

  const clearAllData = () => {
    // Implement the logic to clear all data
    console.log("Clearing all data...");
    toast.warn("All data cleared!");
    // You might want to show a confirmation dialog before actually clearing the data
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
    setTotalIncome(
      incomeData.reduce(
        (accumulator, current) => accumulator + current.value,
        0
      )
    );
    setTotalExpense(
      expenseData.reduce(
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
    <div className="flex min-h-screen bg-gray-100">
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
            onClose={() => setShowEditPopup(false)}
            onSubmit={(id, data) => {
              handleUpdateTransaction(id, data, setTransactions, token);
              toast.success("Transaction updated successfully!");
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

      {/* Fixed Sidebar */}
      <navbar className="hidden w-64 p-6 lg:block fixed h-screen bg-gray-100">
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
            <div className="space-y-1">
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
              {currentUser?.roles?.includes("admin") && (
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${
                    location.pathname === "/history"
                      ? "shadow-neumorphic-inset-button"
                      : "shadow-neumorphic-button"
                  }`}
                  onClick={() => {
                    navigate("/history");
                  }}
                >
                  <History className="h-4 w-4 text-gray-600" />
                  History
                </button>
              )}
            </div>
          </div>

          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium text-gray-600">ACCOUNT</h4>
            <div className="space-y-4">
              <button
                onClick={() => {
                  fetchTransactions(setTransactions, token);
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
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-neumorphic-button text-white bg-red-500 hover:bg-red-800"
                onClick={clearAllData}
              >
                <Trash2 className="h-4 w-4" />
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      </navbar>

      {/* Main Content */}
      <div className="flex-1 p-8 lg:ml-64 bg-gray-100">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-700">Dashboard</h1>
          </div>

          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="grid gap-6 md:grid-rows-2">
                <StatCard
                  title={`Net Income`}
                  value={`$${(totalIncome - totalExpense).toFixed(2)}`}
                  changeType={
                    totalIncome - totalExpense >= 0 ? `positive` : `negative`
                  }
                />
                <StatCard
                  title={`Savings Rate`}
                  value={`${(
                    ((totalIncome - totalExpense) / totalIncome) *
                    100
                  ).toFixed(2)}%`}
                  changeType={
                    ((totalIncome - totalExpense) / totalIncome) * 100 >= 0
                      ? `positive`
                      : `negative`
                  }
                />
                <StatCard
                  title={`Expense to Income Ratio`}
                  value={`${(totalExpense / totalIncome).toFixed(2)}`}
                  changeType={
                    totalExpense / totalIncome <= 1 ? `positive` : `negative`
                  }
                />
              </div>
              <GraphCard
                title={`Expense per Category`}
                value={`$${totalExpense}`}
                data={expenseData}
              />
              <GraphCard
                title={`Income per Category`}
                value={`$${totalIncome}`}
                data={incomeData}
              />
            </div>

            <div className="rounded-lg bg-gray-100 p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-700">
                    {month} Report
                  </h2>
                  <div className="flex gap-4">
                    <button
                      className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button flex items-center gap-1"
                      onClick={() => setShowFilterPopup(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filter & Sort
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                      onClick={() => {
                        handleDownloadCsv(token);
                        toast.success("Downloaded Successfully!");
                      }}
                    >
                      Download CSV
                    </button>
                    <button
                      className="px-3 py-1 text-sm rounded-lg bg-purple-500 text-white shadow-neumorphic-purple"
                      onClick={() => setShowAddPopup(true)}
                    >
                      Add Transaction
                    </button>
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
                  <tbody>
                    {filteredTransactions
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((transaction) => (
                        <tr
                          key={transaction.id}
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
                                }}
                              />
                            </button>
                            <button className="text-gray-600 hover:text-purple-600">
                              <Edit
                                className="h-4 w-4"
                                onClick={() => handleEditClick(transaction)}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
                    {[...Array(totalPages)].map((_, index) => (
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
                    ))}
                    <button
                      onClick={handleNextPage}
                      className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ToastContainer component to render toasts */}
      <ToastContainer draggable stacked />
    </div>
  );
}