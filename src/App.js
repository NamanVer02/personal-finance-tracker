import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Dashboard from "./Dashboard";
import Login from "./Login";
import Settings from "./Settings";

const App = () => {
    const {user} = useAuth();

    return (
        <div>
        <Routes>
            <Route path="/" element={user ? <Dashboard /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
        </Routes>
        </div>
    );
};

export default App;
