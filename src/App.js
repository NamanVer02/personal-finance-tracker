import { Routes, Route } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, React } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import HistoryDash from "./pages/HistoryDash";

const App = () => {
    const {user} = useAuth();
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
            <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
            <Route path="/history" element={user ? <HistoryDash /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
        </Routes>
        </div>
    );
};

export default App;