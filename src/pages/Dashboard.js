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
  Filter,
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
import FilterAndSort from "../components/FilterAndSort";
import { motion } from "framer-motion";
import Pagination from "../components/Pagination";
import Navbar from "../components/Navbar";

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

      {/* Navbar component */}
      <Navbar
        currentUser={currentUser}
        token={token}
        userId={userId}
        logout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setTransactions={setTransactions}
        setIncomeData={setIncomeData}
        setExpenseData={setExpenseData}
        fetchTransactions={fetchTransactions}
        fetchIncomeData={fetchIncomeData}
        fetchExpenseData={fetchExpenseData}
      />

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

            <div className="mt-8 space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-700">
                  Latest Transactions
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilterPopup(true)}
                    className="flex gap-1 items-center px-3 py-2 bg-gray-100 rounded-lg shadow-neumorphic-button"
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                  </button>

                  <button
                    onClick={() => handleDownloadCsv(token)}
                    className="flex gap-1 items-center px-3 py-2 bg-gray-100 rounded-lg shadow-neumorphic-button"
                  >
                    Download CSV
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(token)}
                    className="flex gap-1 items-center px-3 py-2 bg-gray-100 rounded-lg shadow-neumorphic-button"
                  >
                    Download PDF
                  </button>

                  <button
                    onClick={() => setShowAddPopup(true)}
                    className="flex gap-1 items-center px-3 py-2 bg-purple-600 text-white rounded-lg shadow-neumorphic-button"
                  >
                    New Transaction
                  </button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-auto">
                <table className="w-full">
                  <thead className="text-xs text-left text-gray-700 uppercase bg-gray-100 p-4">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Date</th>
                      <th className="p-3">Label</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((transaction, index) => (
                        <tr
                          key={index}
                          className="bg-gray-100 border-b border-gray-200"
                        >
                          <td className="p-3">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 max-w-[200px] overflow-hidden text-ellipsis">
                            {transaction.label}
                          </td>
                          <td className="p-3">{transaction.category}</td>
                          <td
                            className={`p-3 flex items-center gap-1 ${
                              transaction.type === "expense"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {transaction.type === "expense" ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                            {`$${transaction.amount}`}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                className="p-1 text-gray-600 hover:text-amber-600"
                                onClick={() => handleEditClick(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1 text-gray-600 hover:text-red-600"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this transaction?"
                                    )
                                  ) {
                                    handleDeleteTransaction(
                                      transaction.id,
                                      token
                                    ).then(() => {
                                      fetchTransactions(setTransactions, token);
                                      fetchIncomeData(
                                        setIncomeData,
                                        userId,
                                        token
                                      );
                                      fetchExpenseData(
                                        setExpenseData,
                                        userId,
                                        token
                                      );
                                      toast.success(
                                        "Transaction deleted successfully!"
                                      );
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredTransactions.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No transactions found.</p>
                  <button
                    onClick={() => setShowAddPopup(true)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-neumorphic-button"
                  >
                    Add Your First Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme={isDarkMode ? "dark" : "light"}
        />
      </div>
    </motion.div>
  );
}
