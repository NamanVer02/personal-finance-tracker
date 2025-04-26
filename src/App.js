import { Routes, Route } from "react-router-dom";
import { useEffect, React } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserTransactions from "./pages/UserTransactions";
import AiAssistant from "./pages/AiAssistant";
import GoogleAuthSetup from "./pages/GoogleAuthSetup";
import AccountantDashboard from "./pages/AccountantDashboard";
import CustomCursor from "./components/CustomCursor";
import UserDashboard from "./pages/UserDashboard";
import UserRoleManagement from "./pages/UserRoleManagement";
import Categories from "./pages/Categories";
import MenuManagement from "./pages/MenuManagement";
import HikariCPDemo from "./pages/HikariCPDemo";

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
        <div clasname="no-scrollbar cursor-none">
        {/* <CustomCursor /> */}
        <Routes>
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/user-transactions" element={<UserTransactions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ai-assistant" element={<AiAssistant/>} />
            <Route path="/setup-2fa" element={<GoogleAuthSetup />} />
            <Route path="/accountant-dashboard" element={<AccountantDashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/user-role-management" element={<UserRoleManagement />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/menu-management" element={<MenuManagement />} />
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Login />} />
            <Route path="/connection-pool" element={<HikariCPDemo />} />
        </Routes>
        </div>
    );
};

export default App;