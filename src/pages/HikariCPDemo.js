import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import { Play, Pause, RotateCcw, Database, Activity, AlertCircle, Server } from "lucide-react";
import { ToastContainer } from "react-toastify";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const HikariCPDemo = () => {
  const { currentUser, token, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [poolStats, setPoolStats] = useState({
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    threadsAwaitingConnection: 0
  });
  const [isPolling, setIsPolling] = useState(false);
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Active Connections",
        data: [],
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1
      },
      {
        label: "Idle Connections",
        data: [],
        borderColor: "rgb(54, 162, 235)",
        tension: 0.1
      },
      {
        label: "Waiting Threads",
        data: [],
        borderColor: "rgb(255, 206, 86)",
        tension: 0.1
      }
    ]
  });
  
  const logsEndRef = useRef(null);
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
    fetchPoolStats();
    fetchLogs();
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const fetchPoolStats = async () => {
    try {
      const response = await fetch("https://localhost:8080/demo/pool-stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pool stats");
      }

      const data = await response.json();
      setPoolStats(data);
      
      // Update chart data
      setChartData(prevData => {
        const now = new Date().toLocaleTimeString();
        
        // Add new data points
        const newLabels = [...prevData.labels, now];
        const newDatasets = prevData.datasets.map((dataset, index) => {
          const newData = [...dataset.data];
          if (index === 0) newData.push(data.activeConnections);
          else if (index === 1) newData.push(data.idleConnections);
          else if (index === 2) newData.push(data.threadsAwaitingConnection);
          
          return {
            ...dataset,
            data: newData
          };
        });
        
        // Keep only last 30 data points
        if (newLabels.length > 30) {
          newLabels.shift();
          newDatasets.forEach(dataset => {
            dataset.data.shift();
          });
        }
        
        return {
          labels: newLabels,
          datasets: newDatasets
        };
      });
    } catch (error) {
      console.error("Error fetching pool stats:", error);
      toast.error("Failed to fetch pool stats");
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("https://localhost:8080/demo/connection-logs", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch connection logs");
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const togglePolling = () => {
    if (isPolling) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    } else {
      fetchPoolStats();
      fetchLogs();
      pollingInterval.current = setInterval(() => {
        fetchPoolStats();
        fetchLogs();
      }, 1000);
    }
    setIsPolling(!isPolling);
  };

  const simulateConnectionReuse = async () => {
    try {
      await fetch("https://localhost:8080/demo/connection-reuse", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.info("Connection reuse demonstration triggered");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to demonstrate connection reuse");
    }
  };

  const simulateMultipleConnections = async (count = 15) => {
    try {
      await fetch(`https://localhost:8080/demo/multiple-connections?count=${count}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.info(`Simulating ${count} concurrent connections`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to simulate multiple connections");
    }
  };

  const resetDemo = async () => {
    try {
      await fetch("https://localhost:8080/demo/reset", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChartData({
        labels: [],
        datasets: chartData.datasets.map(dataset => ({
          ...dataset,
          data: []
        }))
      });
      setLogs([]);
      toast.success("Demo reset successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to reset demo");
    }
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
      <div className="lg:ml-64 p-8">
        <div className="rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-700">HikariCP Connection Pooling Demo</h1>
            <div className="flex gap-2">
              <button
                onClick={togglePolling}
                className={`flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500 ${
                  isPolling ? "text-purple-500" : ""
                }`}
              >
                {isPolling ? <Pause size={16} /> : <Play size={16} />}
                {isPolling ? "Stop Monitoring" : "Start Monitoring"}
              </button>
              <button
                onClick={resetDemo}
                className="flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
              >
                <RotateCcw size={16} />
                Reset Demo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pool Stats Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Database className="text-purple-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Active Connections</h3>
                    <p className="text-2xl font-bold text-gray-700">{poolStats.activeConnections}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Server className="text-blue-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Idle Connections</h3>
                    <p className="text-2xl font-bold text-gray-700">{poolStats.idleConnections}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-green-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Total Connections</h3>
                    <p className="text-2xl font-bold text-gray-700">{poolStats.totalConnections}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-yellow-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Waiting Threads</h3>
                    <p className="text-2xl font-bold text-gray-700">{poolStats.threadsAwaitingConnection}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Connection Pool Chart */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-2 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Connection Pool Metrics</h2>
              <div className="h-64">
                <Line 
                  data={chartData} 
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    },
                    animation: {
                      duration: 0
                    }
                  }} 
                />
              </div>
            </motion.div>

            {/* Demo Actions */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-1 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Demo Actions</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Simulate Connection Reuse</p>
                  <button
                    onClick={simulateConnectionReuse}
                    className="w-full flex justify-center items-center gap-2 shadow-neumorphic-button bg-gray-100 text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
                  >
                    <Database size={16} />
                    Connection Reuse
                  </button>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Simulate Multiple Connections</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 20].map(count => (
                      <button
                        key={count}
                        onClick={() => simulateMultipleConnections(count)}
                        className="flex justify-center items-center shadow-neumorphic-button bg-gray-100 text-gray-700 px-3 py-2 rounded-md transition-all hover:text-purple-500"
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connection Logs */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-3 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Connection Pool Logs</h2>
              <div className="bg-gray-800 text-gray-100 rounded-md p-4 h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-gray-400">No connection logs available. Start monitoring to view logs.</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className={`mb-1 ${
                      log.includes("created") ? "text-green-400" :
                      log.includes("acquired") ? "text-blue-400" :
                      log.includes("used") ? "text-purple-400" :
                      log.includes("timeout") ? "text-red-400" :
                      "text-gray-300"
                    }`}>
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
};

export default HikariCPDemo;
