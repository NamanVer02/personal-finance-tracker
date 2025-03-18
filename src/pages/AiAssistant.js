import {
  Send,
  Moon,
  Sun,
  RefreshCw,
  MessageSquare,
  LogOut,
  BarChart3,
  Users,
  MessageCircle,
  FolderSync,
  Menu,
  X,
  Upload
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { fetchExpenseData, fetchTransactions, fetchIncomeData } from "../utils/api";
import { AnimatePresence } from "framer-motion";
import CsvUploadModal from "../components/CsvUploadModal";

export default function AiAssistant({setTransactions, setIncomeData, setExpenseData}) {
  // Navigation and authentication
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, token, isAuthenticated } = useAuth();
  const userId = localStorage.getItem("userId");

  // State variables
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Functions
  const toggleDarkMode = () => {
    const darkModeEnabled = document.documentElement.classList.toggle("dark");
    setIsDarkMode(darkModeEnabled);
    localStorage.setItem("darkMode", darkModeEnabled ? "enabled" : "disabled");
    toast.info(`Dark mode ${darkModeEnabled ? "enabled" : "disabled"}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  const sendMessage = async (e) => {
    e?.preventDefault();

    if (!question.trim()) return;

    const userMessage = {
      type: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };

    // Update chat with user message and clear input
    setChatHistory((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add bot response to chat history
        setChatHistory((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              data.answer ||
              data.response ||
              "I'm not sure how to answer that.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        throw new Error("Failed to get response from chatbot");
      }
    } catch (error) {
      console.error("Error querying chatbot:", error);
      toast.error("Failed to get response. Please try again.");

      // Add error message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    toast.info("Chat history cleared");
  };

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <motion.div
      className="flex min-h-screen bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
      <motion.div
        className="flex-1 flex flex-col lg:ml-64 bg-gray-100 pt-16 lg:pt-0"
        initial={{ x: -100, opacity: 0.4 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Desktop header */}
        <div className="hidden lg:flex justify-between items-center p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-700">AI Assistant</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Chat
            </button>
          </div>
        </div>

        {/* Chat container */}
        <div
          ref={chatContainerRef}
          className="flex-grow p-6 overflow-y-auto"
          style={{ height: "calc(100vh - 180px)" }}
        >
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mb-4 text-purple-400" />
              <h2 className="text-xl font-medium mb-2">How can I help you?</h2>
              <p className="max-w-md">
                Ask me anything about your data, transactions, or finances.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {chatHistory.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-lg rounded-lg p-4 ${
                      message.type === "user"
                        ? "bg-purple-600 text-white shadow-neumorphic-button"
                        : message.isError
                        ? "bg-gray-100 text-red-500 shadow-neumorphic-inset-button"
                        : "bg-gray-100 text-gray-700 shadow-neumorphic-inset-button"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70 text-right">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="max-w-lg rounded-lg p-4 bg-gray-100 text-gray-700 shadow-neumorphic-inset-button">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="h-2 w-2 rounded-full bg-purple-600 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full bg-purple-600 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full bg-purple-600 animate-bounce"
                          style={{ animationDelay: "600ms" }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">Thinking...</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input form */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-gray-200 bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your question..."
              className="flex-grow px-4 py-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-neumorphic-inset-button"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="p-3 rounded-lg bg-purple-600 text-white shadow-neumorphic-button disabled:opacity-50"
              disabled={!question.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </motion.div>

      <ToastContainer draggable stacked />
    </motion.div>
  );
}
