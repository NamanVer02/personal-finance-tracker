import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Settings from "./Settings";
import HistoryDash from "./HistoryDash";

const App = () => {
    const {user} = useAuth();

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
