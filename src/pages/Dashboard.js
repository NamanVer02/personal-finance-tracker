import {
  Trash2,
  Edit,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  fetchFinanceEntries,
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
  const userId = localStorage.getItem("userId");
  const { token } = useAuth();
  const { currentUser, logout, isAuthenticated } = useAuth();

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [incomeData, setIncomeData] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expenseData, setExpenseData] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );
  const [sortCriteria, setSortCriteria] = useState({
    field: "date",
    direction: "desc",
  });
  const [filterCriteria, setFilterCriteria] = useState({
    type: "all",
    id: null,
    categories: [],
    amountMin: "",
    amountMax: "",
    dateFrom: "",
    dateTo: "",
    label: "",
    sortField: "date",
    sortDirection: "desc",
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

  // Functions
  const handlePageChange = (page) => {
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  const handleEditClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowEditPopup(true);
  };

  const handleFilter = async () => {
    await fetchFinanceEntries(
      setTransactions,
      setTotalPages,
      setTotalItems,
      currentPage,
      token,
      filterCriteria,
      sortCriteria
    );
    setShowFilterPopup(false);
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
      // fetchTransactions(setTransactions, token);
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
    // Use the filter-enabled function only
    fetchFinanceEntries(
      setTransactions,
      setTotalPages,
      setTotalItems,
      currentPage,
      token,
      filterCriteria,
      sortCriteria,
      itemsPerPage
    );
  }, [currentPage, token, filterCriteria, sortCriteria, itemsPerPage]); // Add filterCriteria as dependency

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
              // fetchTransactions(setTransactions, token);
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
              // fetchTransactions(setTransactions, token);
              fetchIncomeData(setIncomeData, userId, token);
              fetchExpenseData(setExpenseData, userId, token);
            }}
            onSubmit={async (id, data) => {
              try {
                // Attempt to update the transaction
                const res = await handleUpdateTransaction(id, data, token);

                if (!res.success) {
                  toast.error(
                    "Older version of the entity is being edited. Please refresh the data before editing."
                  );
                  return;
                }

                // Fetch updated data
                await fetchExpenseData(setExpenseData, userId, token);
                await fetchIncomeData(setIncomeData, userId, token);

                // If everything goes well, return success
                toast.success("Transaction updated sucessfully");
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
            onApply={handleFilter}
            filterCriteria={filterCriteria}
            setFilterCriteria={setFilterCriteria}
            sortCriteria={sortCriteria}
            setSortCriteria={setSortCriteria}
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

            <div className="mt-8 space-y-10 py-10">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-700">
                  Latest Transactions
                </h2>
                <div className="flex gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-inset-button w-64"
                      value={filterCriteria.label}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage(0);
                      setShowFilterPopup(true);
                    }}
                    className="flex gap-1 items-center px-3 py-2 bg-gray-100 rounded-lg shadow-neumorphic-button"
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                  </button>

                  <button
                    onClick={() => handleDownloadCsv(token, userId)}
                    className="flex gap-1 items-center px-3 py-2 bg-gray-100 rounded-lg shadow-neumorphic-button"
                  >
                    Download CSV
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(token, userId)}
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

              <div className="max-h-[75vh] overflow-auto no-scrollbar">
                <motion.table
                  className="table-auto w-full"
                  style={{ tableLayout: "fixed" }}
                >
                  <thead>
                    <tr>
                      <th className="w-1/12"></th>
                      <th className="w-2/12 text-left">Date</th>
                      <th className="w-3/12 text-left">Label</th>
                      <th className="w-2/12 text-left">Category</th>
                      <th className="w-2/12 text-left">Amount</th>
                      <th className="w-2/12 text-left">Actions</th>
                    </tr>
                  </thead>

                  <motion.tbody>
                    {transactions.length > 0 ? (
                      transactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          className="border-t border-gray-200"
                          initial={{ opacity: 1, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                          <td className="w-1/12 py-3">
                            {transaction.type === "Expense" ? (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            )}
                          </td>

                          <td className="w-2/12 py-3 text-gray-600">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>

                          <td className="w-3/12 py-3 text-gray-700 truncate">
                            {transaction.label}
                          </td>

                          <td className="w-2/12 py-3 text-gray-600">
                            {transaction.category}
                          </td>

                          <td className="w-2/12 py-3 text-gray-600">
                            ${transaction.amount}
                          </td>

                          <td className="w-2/12 py-3">
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
                </motion.table>
              </div>

              {/* Pagination */}
              {transactions.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={setItemsPerPage}
                  totalItems={totalItems}
                />
              )}

              {transactions.length === 0 && (
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
