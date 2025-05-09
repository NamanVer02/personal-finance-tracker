import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import {
  Play,
  Pause,
  RotateCcw,
  Mail,
  Ban,
  AlertTriangle,
  Send,
  Loader,
} from "lucide-react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import "chart.js/auto";

const EmailRateMonitor = () => {
  const { currentUser, token, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailStats, setEmailStats] = useState({
    totalEmailsSent: 0,
    totalEmailsBlocked: 0,
    rateLimitPerUser: 5,
    rateLimitWindowHours: 24,
    userRateLimits: {},
    topRecipients: {},
    recentEmails: [],
  });
  const [isPolling, setIsPolling] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const pollingInterval = useRef(null);

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    // Initial fetch
    fetchEmailStats();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const fetchEmailStats = async () => {
    try {
      const response = await fetch("https://localhost:8080/api/email/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch email stats");
      }

      const data = await response.json();
      setEmailStats(data);
    } catch (error) {
      console.error("Error fetching email stats:", error);
      toast.error("Failed to fetch email stats");
    }
  };

  const togglePolling = () => {
    if (isPolling) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    } else {
      fetchEmailStats();
      pollingInterval.current = setInterval(() => {
        fetchEmailStats();
      }, 3000);
    }
    setIsPolling(!isPolling);
  };

  const resetStats = async () => {
    try {
      await fetch("https://localhost:8080/api/email/reset", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchEmailStats();
      toast.success("Email statistics reset successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to reset email statistics");
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(
        `https://localhost:8080/api/email/test?email=${encodeURIComponent(
          testEmail
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.warning(data.error || "Rate limit exceeded for this email");
        } else {
          throw new Error(data.error || "Failed to send test email");
        }
      } else {
        toast.success("Test email sent successfully");
      }

      fetchEmailStats();
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setIsSending(false);
    }
  };

  // Prepare doughnut chart data for sent/blocked ratio
  const sentBlockedData = {
    labels: ["Sent", "Blocked"],
    datasets: [
      {
        data: [emailStats.totalEmailsSent, emailStats.totalEmailsBlocked],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
        borderColor: ["rgb(75, 192, 192)", "rgb(255, 99, 132)"],
        borderWidth: 1,
      },
    ],
  };

  // Prepare bar chart for top recipients
  const topRecipientsData = {
    labels: Object.keys(emailStats.topRecipients || {}).slice(0, 5),
    datasets: [
      {
        label: "Email Count",
        data: Object.values(emailStats.topRecipients || {}).slice(0, 5),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgb(54, 162, 235)",
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for user rate limit usage
  const userRateLimitData = {
    labels: Object.keys(emailStats.userRateLimits || {}).slice(0, 5),
    datasets: [
      {
        label: "Rate Limit Usage (%)",
        data: Object.values(emailStats.userRateLimits || {})
          .slice(0, 5)
          .map((stats) => stats.percentUsed),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgb(255, 159, 64)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        currentUser={currentUser}
        token={token}
        logout={logout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <ToastContainer
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
      />

      <div className="lg:ml-64 p-8">
        <div className="rounded-lg p-6">
          <div className="mt-6 flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-700">
              Email Rate Limit Monitor
            </h1>
          </div>
          <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex gap-6">
              <button
                onClick={togglePolling}
                className={`flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500 ${
                  isPolling ? "text-purple-500" : ""
                }`}
              >
                {isPolling ? <Pause size={16} /> : <Play size={16} />}
                {isPolling ? "Stop Live Updates" : "Start Live Updates"}
              </button>
              <button
                onClick={resetStats}
                className="flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
              >
                <RotateCcw size={16} />
                Reset Statistics
              </button>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-md flex w-full">
                <input
                  type="email"
                  placeholder="Email address"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="shadow-neumorphic-inset bg-transparent px-4 py-2 rounded-l-md text-gray-700 focus:outline-none flex-1 w-full"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={isSending}
                  className="shadow-neumorphic-button flex items-center gap-2 text-gray-700 px-4 py-2 rounded-r-md transition-all hover:text-purple-500 border-l border-gray-200 whitespace-nowrap"
                >
                  {isSending ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSending ? "Sending..." : "Send Test Email"}
                </button>
              </div>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <motion.div
              variants={itemVariants}
              className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-100 text-green-800">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Total Emails Sent</h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {emailStats.totalEmailsSent}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-red-100 text-red-800">
                  <Ban size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Emails Blocked</h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {emailStats.totalEmailsBlocked}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-800">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Rate Limit</h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {emailStats.rateLimitPerUser}
                  </p>
                  <p className="text-xs text-gray-500">
                    emails per {emailStats.rateLimitWindowHours}h
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-800">
                  <Send size={24} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Block Rate</h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {emailStats.totalEmailsSent +
                      emailStats.totalEmailsBlocked >
                    0
                      ? (
                          (emailStats.totalEmailsBlocked /
                            (emailStats.totalEmailsSent +
                              emailStats.totalEmailsBlocked)) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              variants={itemVariants}
              className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Sent vs. Blocked Emails
              </h3>
              <div className="h-64">
                <Doughnut
                  data={sentBlockedData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Top Email Recipients
              </h3>
              <div className="h-64">
                <Bar
                  data={topRecipientsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={containerVariants}
            className="bg-gray-100 shadow-neumorphic rounded-lg p-6 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Rate Limit Usage by User
            </h3>
            <div className="h-64">
              <Bar
                data={userRateLimitData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `${context.formattedValue}% used`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: "Usage Percentage",
                      },
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="bg-gray-100 shadow-neumorphic rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Recent Email Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left text-gray-600">
                      Timestamp
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600">
                      Recipient
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600">
                      Subject
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-gray-600">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {emailStats.recentEmails &&
                  emailStats.recentEmails.length > 0 ? (
                    emailStats.recentEmails.map((log, index) => (
                      <tr
                        key={index}
                        className={`border-t border-gray-200 ${getStatusColor(
                          log.status
                        )}`}
                      >
                        <td className="px-4 py-2 text-gray-700">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {log.recipient}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {log.subject}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {log.status}
                        </td>
                        <td className="px-4 py-2 text-gray-700 truncate max-w-xs">
                          {log.message}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-2 text-center text-gray-500"
                      >
                        No email activity recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

function getStatusColor(status) {
  switch (status) {
    case "SENT":
    case "MOCK_SENT":
      return "bg-green-50";
    case "BLOCKED":
      return "bg-red-50";
    case "FAILED":
      return "bg-yellow-50";
    default:
      return "";
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export default EmailRateMonitor;
