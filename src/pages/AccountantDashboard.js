import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  MessageCircle,
  FolderSync,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  UserCircle,
  Upload,
} from "lucide-react";
import {
  fetchExpenseData,
  fetchTransactions,
  fetchIncomeData,
} from "../utils/api";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import StatCard from "../components/StatCard";
import GraphCard from "../components/GraphCard";
import Navbar from "../components/Navbar";

// User card for selecting a user
const UserCard = ({ user, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg cursor-pointer flex items-center gap-3 ${
      isSelected
        ? " shadow-neumorphic-inset-button"
        : " shadow-neumorphic-button"
    }`}
  >
    <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
      <UserCircle className="h-6 w-6 text-white" />
    </div>
    <div>
      <h3 className="font-medium">{user.username}</h3>
      <p className="text-sm text-gray-600">
        {user.roles && Array.isArray(user.roles)
          ? user.roles
              .filter((role) => typeof role === "string")
              .map((role) =>
                role
                  .toLowerCase()
                  .split(" ")
                  .map(function (word) {
                    return word.charAt(5).toUpperCase() + word.slice(6);
                  })
                  .join(" ")
              )
              .join(", ")
          : "User"}
      </p>
    </div>
  </div>
);

// Main component
export default function AccountantDashboard({
  setTransactions,
  setIncomeData,
  setExpenseData,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { currentUser, token, logout } = useAuth();

  // Data states
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );
  const [overallSummary, setOverallSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
  });
  const [userSummary, setUserSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    categoryWiseIncome: {},
    categoryWiseExpense: {},
  });
  const [monthlySummary, setMonthlySummary] = useState({
    monthlyIncome: {},
    monthlyExpense: {},
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch data functions
  const fetchUsers = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/accountant/users",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Usually needed for POST requests
          },
          body: JSON.stringify({}), // Empty object as the request body
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    }
  };

  const fetchOverallSummary = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/accountant/summary/overall",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOverallSummary(data);
    } catch (error) {
      toast.error("Failed to fetch overall summary");
      console.error("Error fetching overall summary:", error);
    }
  };

  const fetchUserSummary = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/accountant/summary/user/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUserSummary(data);
    } catch (error) {
      toast.error("Failed to fetch user summary");
      console.error("Error fetching user summary:", error);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/accountant/summary/monthly",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setMonthlySummary(data);
    } catch (error) {
      toast.error("Failed to fetch monthly summary");
      console.error("Error fetching monthly summary:", error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers();
    fetchOverallSummary();
    fetchMonthlySummary();
  }, [token]);

  // Fetch user summary when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      fetchUserSummary(selectedUserId);
    }
  }, [selectedUserId]);

  // Format monthly data for the chart
  const formatMonthlyData = () => {
    const months = Object.keys(monthlySummary.monthlyIncome || {}).sort();

    return months.map((month) => ({
      month,
      income: monthlySummary.monthlyIncome[month] || 0,
      expense: monthlySummary.monthlyExpense[month] || 0,
      net:
        (monthlySummary.monthlyIncome[month] || 0) -
        (monthlySummary.monthlyExpense[month] || 0),
    }));
  };

  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gray-100">
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
      <div className="lg:ml-64 p-4 pt-16 lg:pt-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <motion.div
            className="space-y-2"
            initial={{ x: -100, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-700">
              Accounting Dashboard
            </h1>
            <p className="text-gray-600">
              View financial statistics without specific transaction details.
            </p>
          </motion.div>

          {/* Overall Statistics */}
          <div className="space-y-10">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {/* Left Column - Stat Cards */}
              <motion.div
                className="flex flex-col gap-6"
                variants={containerVariants}
              >
                <motion.div variants={cardVariants}>
                  <StatCard
                    title="Total Income (All Users)"
                    value={`$${overallSummary.totalIncome.toFixed(2)}`}
                    changeType="positive"
                  />
                </motion.div>
                <motion.div variants={cardVariants}>
                  <StatCard
                    title="Total Expenses (All Users)"
                    value={`$${overallSummary.totalExpense.toFixed(2)}`}
                    changeType="negative"
                  />
                </motion.div>
                <motion.div variants={cardVariants}>
                  <StatCard
                    title="Net Amount (All Users)"
                    value={`$${overallSummary.netAmount.toFixed(2)}`}
                    changeType={
                      overallSummary.netAmount >= 0 ? "positive" : "negative"
                    }
                  />
                </motion.div>
              </motion.div>

              {/* Right Column - Monthly Data Visualization */}
              <motion.div
                className="p-6 rounded-lg bg-gray-100 shadow-neumorphic-card"
                variants={cardVariants}
              >
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Monthly Financial Trends
                </h2>
                <div className="h-64">
                  <svg viewBox="0 0 800 300" className="w-full h-full">
                    {/* X and Y axes */}
                    <line
                      x1="50"
                      y1="250"
                      x2="750"
                      y2="250"
                      stroke="#888"
                      strokeWidth="2"
                    />
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="250"
                      stroke="#888"
                      strokeWidth="2"
                    />

                    {/* Y-axis labels */}
                    <text
                      x="30"
                      y="250"
                      textAnchor="end"
                      fontSize="12"
                      fill="#888"
                    >
                      0
                    </text>
                    <text
                      x="30"
                      y="200"
                      textAnchor="end"
                      fontSize="12"
                      fill="#888"
                    >
                      25%
                    </text>
                    <text
                      x="30"
                      y="150"
                      textAnchor="end"
                      fontSize="12"
                      fill="#888"
                    >
                      50%
                    </text>
                    <text
                      x="30"
                      y="100"
                      textAnchor="end"
                      fontSize="12"
                      fill="#888"
                    >
                      75%
                    </text>
                    <text
                      x="30"
                      y="50"
                      textAnchor="end"
                      fontSize="12"
                      fill="#888"
                    >
                      100%
                    </text>

                    {/* Data visualization */}
                    {formatMonthlyData().map((item, index, array) => {
                      const x =
                        50 + (700 / Math.max(array.length - 1, 1)) * index;
                      const maxValue = Math.max(
                        ...array.map((d) => Math.max(d.income, d.expense))
                      );

                      const incomeY = 250 - (item.income / maxValue) * 200;
                      const expenseY = 250 - (item.expense / maxValue) * 200;

                      // Connect lines between points
                      return (
                        <g key={index}>
                          {/* X-axis label */}
                          <text
                            x={x}
                            y="270"
                            textAnchor="middle"
                            fontSize="12"
                            fill="#888"
                          >
                            {item.month}
                          </text>

                          {/* Draw lines to next points */}
                          {index < array.length - 1 && (
                            <>
                              <line
                                x1={x}
                                y1={incomeY}
                                x2={
                                  50 +
                                  (700 / Math.max(array.length - 1, 1)) *
                                    (index + 1)
                                }
                                y2={
                                  250 -
                                  (array[index + 1].income / maxValue) * 200
                                }
                                stroke="#4F46E5"
                                strokeWidth="2"
                              />
                              <line
                                x1={x}
                                y1={expenseY}
                                x2={
                                  50 +
                                  (700 / Math.max(array.length - 1, 1)) *
                                    (index + 1)
                                }
                                y2={
                                  250 -
                                  (array[index + 1].expense / maxValue) * 200
                                }
                                stroke="#EF4444"
                                strokeWidth="2"
                              />
                            </>
                          )}

                          {/* Data points */}
                          <circle cx={x} cy={incomeY} r="4" fill="#4F46E5" />
                          <circle cx={x} cy={expenseY} r="4" fill="#EF4444" />
                        </g>
                      );
                    })}

                    {/* Legend */}
                    <circle cx="600" cy="30" r="4" fill="#4F46E5" />
                    <text x="610" y="35" fontSize="14" fill="#666">
                      Income
                    </text>
                    <circle cx="680" cy="30" r="4" fill="#EF4444" />
                    <text x="690" y="35" fontSize="14" fill="#666">
                      Expense
                    </text>
                  </svg>
                </div>
              </motion.div>
            </motion.div>

            {/* User Selection Section */}
            <motion.div
              className="p-6 rounded-lg bg-gray-100 shadow-neumorphic-card"
              variants={cardVariants}
              initial="hidden"
              animate="show"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                User Analysis
              </h2>
              <p className="text-gray-600 mb-4">
                Select a user to view their financial statistics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedUserId === user.id}
                    onClick={() => handleUserSelect(user.id)}
                  />
                ))}
              </div>

              {selectedUserId && (
                <motion.div
                  className="mt-6"
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    User Financial Summary
                  </h3>

                  <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <StatCard
                      title="Total Income"
                      value={`$${userSummary.totalIncome.toFixed(2)}`}
                      changeType="positive"
                    />
                    <StatCard
                      title="Total Expenses"
                      value={`$${userSummary.totalExpense.toFixed(2)}`}
                      changeType="negative"
                    />
                    <StatCard
                      title="Net Amount"
                      value={`$${userSummary.netAmount.toFixed(2)}`}
                      changeType={
                        userSummary.netAmount >= 0 ? "positive" : "negative"
                      }
                    />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <GraphCard
                      title="Income by Category"
                      value={`$${userSummary.totalIncome.toFixed(2)}`}
                      data={userSummary.categoryWiseIncome || {}}
                    />
                    <GraphCard
                      title="Expenses by Category"
                      value={`$${userSummary.totalExpense.toFixed(2)}`}
                      data={userSummary.categoryWiseExpense || {}}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
