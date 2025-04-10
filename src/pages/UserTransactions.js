import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import FilterAndSort from "../components/FilterAndSort";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import CsvUploadModal from "../components/CsvUploadModal";
import {
  fetchExpenseData,
  fetchIncomeData,
  fetchTransactions,
} from "../utils/api";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { fetchAllFinanceEntries } from "../utils/api";

export default function UserTransactions() {
  // Variables
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { token, currentUser, logout, isAuthenticated } = useAuth();

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

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

  // Functions
  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFilter = async () => {
    await fetchAllFinanceEntries(
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

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/get/admin/users`,
        {
          method: "POST",
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
    setFilterCriteria((prev) => ({
      ...prev,
      id: userId || null,
    }));
  };

  const handleDownloadUserTransactionsCsv = async () => {
    try {
      let url = `http://localhost:8080/api/download/admin/csv`;

      if (selectedUser) {
        url += `?userId=${selectedUser}`;
      }

      const response = await fetch(url, {
        method: "POST",
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

  const handleDownloadUserTransactionsPdf = async () => {
    try {
      let url = `http://localhost:8080/api/download/admin/pdf`;

      if (selectedUser) {
        url += `?userId=${selectedUser}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "All-transactions.pdf";
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

  // Initial Setup
  useEffect(() => {
    if (isAuthenticated && currentUser?.roles?.includes("ROLE_ADMIN")) {
      fetchAllUsers();

      fetchAllFinanceEntries(
        setTransactions,
        setTotalPages,
        setTotalItems,
        currentPage,
        token,
        filterCriteria,
        sortCriteria,
        itemsPerPage
      );
    }
  }, [
    isAuthenticated,
    token,
    currentUser,
    currentPage,
    token,
    filterCriteria,
    sortCriteria,
    itemsPerPage,
  ]);

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

  console.log("Transactions:", transactions);

  // Page
  return (
    <motion.div className="flex min-h-screen bg-gray-100">
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

      <Navbar
        currentUser={currentUser}
        token={token}
        userId={userId}
        logout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        fetchTransactions={fetchAllFinanceEntries}
        setTransactions={setTransactions}
        setIncomeData={setIncomeData}
        setExpenseData={setExpenseData}
      />

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
                      value={filterCriteria.label}
                      onChange={(e) =>
                        setFilterCriteria((prev) => ({
                          ...prev,
                          label: e.target.value,
                        }))
                      }
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
                  <button
                    className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button flex items-center gap-1"
                    onClick={handleDownloadUserTransactionsPdf}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>
              </div>

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
                    {transactions.length > 0 ? (
                      transactions.map((transaction, index) => (
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
                                String(user.id) === String(transaction.userId)
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
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <ToastContainer draggable stacked />
    </motion.div>
  );
}
