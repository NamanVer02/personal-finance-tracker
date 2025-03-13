import { Routes, Route } from "react-router-dom";
import { useEffect, React } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserTransactions from "./pages/UserTransactions";

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
            <Route path="/user-transactions" element={<UserTransactions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
        </Routes>
        </div>
    );
};

export default App;