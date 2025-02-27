import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Dashboard from "./Dashboard";
import Login from "./Login";
import AddTransaaction from "./AddTransaction";

const App = () => {
    const {user} = useAuth();

    return (
        <div>
        <Routes>
            <Route path="/add" element={<AddTransaaction />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={user ? <Dashboard /> : <Login />} />
        </Routes>
        </div>
    );
};

export default App;
