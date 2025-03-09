import { Routes, Route } from "react-router-dom";
import { useEffect, React } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import HistoryDash from "./pages/HistoryDash";
import Signup from "./pages/Signup";

const App = () => {

    useEffect(() => {
        // Check localStorage for dark mode preference
        const savedDarkMode = localStorage.getItem("darkMode");
        if (savedDarkMode === "enabled") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, []);

    return (
        <div>
        <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<HistoryDash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/settings" element={<Settings />} />
        </Routes>
        </div>
    );
};

export default App;