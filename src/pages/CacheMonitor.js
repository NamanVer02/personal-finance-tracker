import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import CacheMonitorModal from "../components/CacheMonitorModal";
import { Play, Pause, RotateCcw, Database, Activity, Server, Zap } from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import "chart.js/auto";

const CacheMonitor = () => {
  const { currentUser, token, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalHits: 0,
    totalMisses: 0,
    totalEvictions: 0,
    hitRate: 0,
    caches: {}
  });
  const [isPolling, setIsPolling] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Overall Hit Rate",
        data: [],
        borderColor: "rgb(75, 192, 192)",
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
    fetchCacheStats();
    fetchCacheLogs();
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const fetchCacheStats = async () => {
    try {
      const response = await fetch("https://localhost:8080/api/cache/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cache stats");
      }

      const data = await response.json();
      setCacheStats(data);
      
      // Update chart data
      updateChartData(data);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      toast.error("Failed to fetch cache stats");
    }
  };
  
  const updateChartData = (data) => {
    setChartData(prevData => {
      const now = new Date().toLocaleTimeString();
      
      // Prepare datasets
      const datasets = [];
      
      // Overall hit rate dataset
      datasets.push({
        label: "Overall Hit Rate",
        data: [...(prevData.datasets[0]?.data || []), data.hitRate],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1
      });
      
      // Individual cache hit rates
      const colors = [
        "rgb(255, 99, 132)",  // pink
        "rgb(54, 162, 235)",  // blue
        "rgb(255, 206, 86)",  // yellow
        "rgb(153, 102, 255)", // purple
        "rgb(255, 159, 64)"   // orange
      ];
      
      const cacheNames = Object.keys(data.caches || {});
      cacheNames.forEach((name, index) => {
        const colorIndex = index % colors.length;
        const datasetIndex = prevData.datasets.findIndex(ds => ds.label === `${name} Hit Rate`);
        
        if (datasetIndex >= 0) {
          datasets.push({
            ...prevData.datasets[datasetIndex],
            data: [...prevData.datasets[datasetIndex].data, data.caches[name].hitRate]
          });
        } else {
          datasets.push({
            label: `${name} Hit Rate`,
            data: [data.caches[name].hitRate],
            borderColor: colors[colorIndex],
            tension: 0.1
          });
        }
      });
      
      // Keep only last 30 data points
      const newLabels = [...(prevData.labels || []), now];
      if (newLabels.length > 30) {
        newLabels.shift();
        datasets.forEach(ds => {
          if (ds.data.length > 30) {
            ds.data.shift();
          }
        });
      }
      
      return {
        labels: newLabels,
        datasets: datasets
      };
    });
  };

  const fetchCacheLogs = async () => {
    try {
      const response = await fetch("https://localhost:8080/api/cache/logs", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cache logs");
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
      fetchCacheStats();
      fetchCacheLogs();
      pollingInterval.current = setInterval(() => {
        fetchCacheStats();
        fetchCacheLogs();
      }, 1000);
    }
    setIsPolling(!isPolling);
  };

  const resetStats = async () => {
    try {
      await fetch("https://localhost:8080/api/cache/reset", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChartData({
        labels: [],
        datasets: [{
          label: "Overall Hit Rate",
          data: [],
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1
        }]
      });
      setLogs([]);
      setCacheStats({
        totalHits: 0,
        totalMisses: 0,
        totalEvictions: 0,
        hitRate: 0,
        caches: {}
      });
      toast.success("Cache statistics reset successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to reset cache statistics");
    }
  };

  const callCacheDemo = async () => {
    try {
      const response = await fetch("https://localhost:8080/api/cache/demo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to call cache demo");
      }

      toast.success("Cache demo called successfully");
      fetchCacheStats();
      fetchCacheLogs();
    } catch (error) {
      console.error("Error calling cache demo:", error);
      toast.error("Failed to call cache demo");
    }
  };

  // Prepare doughnut chart data for hit/miss ratio
  const doughnutData = {
    labels: ['Hits', 'Misses'],
    datasets: [
      {
        data: [cacheStats.totalHits, cacheStats.totalMisses],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
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
      <div className="lg:ml-64 p-8">
        <div className="rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-700">Cache Performance Monitor</h1>
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
                onClick={resetStats}
                className="flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
              >
                <RotateCcw size={16} />
                Reset Stats
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
              >
                Local Cache Monitor
              </button>
              <button
                onClick={callCacheDemo}
                className="flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
              >
                Run Cache Demo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cache Stats Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Database className="text-green-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Cache Hits</h3>
                    <p className="text-2xl font-bold text-gray-700">{cacheStats.totalHits}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Server className="text-red-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Cache Misses</h3>
                    <p className="text-2xl font-bold text-gray-700">{cacheStats.totalMisses}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Activity className="text-purple-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Hit Rate</h3>
                    <p className="text-2xl font-bold text-gray-700">{cacheStats.hitRate.toFixed(2)}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gray-100 shadow-neumorphic rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <Zap className="text-yellow-500" />
                  <div>
                    <h3 className="text-sm text-gray-500">Evictions</h3>
                    <p className="text-2xl font-bold text-gray-700">{cacheStats.totalEvictions}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hit Rate Chart */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-2 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Cache Hit Rate Trends</h2>
              <div className="h-64">
                <Line 
                  data={chartData} 
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Hit Rate (%)'
                        }
                      }
                    },
                    animation: {
                      duration: 0
                    }
                  }} 
                />
              </div>
            </motion.div>

            {/* Hit/Miss Ratio */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-1 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Hit/Miss Ratio</h2>
              <div className="h-64 flex items-center justify-center">
                {cacheStats.totalHits + cacheStats.totalMisses > 0 ? (
                  <Doughnut 
                    data={doughnutData} 
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }} 
                  />
                ) : (
                  <p className="text-gray-500">No cache activity recorded yet</p>
                )}
              </div>
            </motion.div>

            {/* Cache Details */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-3 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Cache Details</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-100 shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left">Cache Name</th>
                      <th className="py-2 px-4 text-left">Hits</th>
                      <th className="py-2 px-4 text-left">Misses</th>
                      <th className="py-2 px-4 text-left">Hit Rate</th>
                      <th className="py-2 px-4 text-left">Evictions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(cacheStats.caches || {}).map(([name, stats]) => (
                      <tr key={name} className="border-t">
                        <td className="py-2 px-4">{name}</td>
                        <td className="py-2 px-4">{stats.hits}</td>
                        <td className="py-2 px-4">{stats.misses}</td>
                        <td className="py-2 px-4">{parseFloat(stats.hitRate).toFixed(2)}%</td>
                        <td className="py-2 px-4">{stats.evictions}</td>
                      </tr>
                    ))}
                    {Object.keys(cacheStats.caches || {}).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                          No cache data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Cache Logs */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-3 bg-gray-100 shadow-neumorphic rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Cache Activity Logs</h2>
              <div className="bg-gray-800 text-gray-100 rounded-md p-4 h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-gray-400">No cache logs available. Start monitoring to view logs.</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className={`mb-1 ${
                      log.includes("HIT") ? "text-green-400" :
                      log.includes("MISS") ? "text-red-400" :
                      log.includes("EVICTION") ? "text-yellow-400" :
                      log.includes("PUT") ? "text-blue-400" :
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
      {showModal && <CacheMonitorModal onClose={() => setShowModal(false)} />}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
};

export default CacheMonitor;
