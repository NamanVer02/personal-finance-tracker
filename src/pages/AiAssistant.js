import {
  Send,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import {
  fetchExpenseData,
  fetchTransactions,
  fetchIncomeData,
} from "../utils/api";
import { AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Navbar from "../components/Navbar";

export default function AiAssistant() {
  // Navigation and authentication
  const navigate = useNavigate();
  const { currentUser, logout, token, isAuthenticated } = useAuth();
  const userId = localStorage.getItem("userId");

  // State variables
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("darkMode") === "enabled" ? true : false
  );
  const [question, setQuestion] = useState("");
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Functions
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sendMessage = async (e) => {
    e?.preventDefault();

    const inputError = validateChatInput(question);
    if (inputError) {
      toast.error(inputError);
      return;
    }

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
        var transactionsData = [];

        try {
          const res = await fetch("http://localhost:8080/api/get", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`, 
              'Content-Type': 'application/json',
            },
          });
      
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
      
          transactionsData = await res.json();
        } catch (err) {
          console.error("Error fetching transactions:", err);
        }

        const response = await fetch("http://localhost:5000/chatbot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                question: userMessage.content,
                transactions: transactionsData, // Include transactions data in the request body
            }),
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
                    <ReactMarkdown>{message.content}</ReactMarkdown>
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
              className={`flex-grow px-4 py-3 rounded-lg bg-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none shadow-neumorphic-inset-button w-full p-3 pr-12 ${inputError ? 'border-red-500' : ''}`}
              value={question}
              onChange={(e) => {
            setQuestion(e.target.value);
            setInputError(validateChatInput(e.target.value));
          }}
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

const validateChatInput = (input) => {
  if (!input.trim()) return 'Question cannot be empty';
  if (input.length > 500) return 'Question is too long (max 500 characters)';
  return null;
};
