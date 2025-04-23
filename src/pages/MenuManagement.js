import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import { Save, X, Check, AlertTriangle } from "lucide-react";

const MenuManagement = () => {
  const { currentUser, token, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState(["ROLE_USER", "ROLE_ADMIN", "ROLE_ACCOUNTANT"]);

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
    // Check if user is admin, if not redirect to dashboard
    if (!currentUser || !currentUser.roles.includes("ROLE_ADMIN")) {
      toast.error("You don't have permission to access this page");
      window.location.href = "/dashboard";
      return;
    }

    // Fetch menu items from the server
    fetchMenuItems();
  }, [currentUser]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://localhost:8080/api/admin/menu-items", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }

      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (menuItemId, role) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === menuItemId) {
          const updatedAllowedRoles = [...item.allowedRoles];
          if (updatedAllowedRoles.includes(role)) {
            // Remove role if it already exists
            return {
              ...item,
              allowedRoles: updatedAllowedRoles.filter((r) => r !== role),
            };
          } else {
            // Add role if it doesn't exist
            return {
              ...item,
              allowedRoles: [...updatedAllowedRoles, role],
            };
          }
        }
        return item;
      })
    );
  };

  const saveMenuConfiguration = async () => {
    try {
      const response = await fetch("https://localhost:8080/api/admin/menu-items", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menuItems),
      });

      if (!response.ok) {
        throw new Error("Failed to save menu configuration");
      }

      toast.success("Menu configuration saved successfully");
    } catch (error) {
      console.error("Error saving menu configuration:", error);
      toast.error("Failed to save menu configuration");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar
          currentUser={currentUser}
          token={token}
          logout={logout}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        <div className="lg:ml-64 p-8 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-700">Menu Management</h1>
            <button
              onClick={saveMenuConfiguration}
              className="flex items-center gap-2 shadow-neumorphic-button text-gray-700 px-4 py-2 rounded-md transition-all hover:text-purple-500"
            >
              <Save size={16} />
              Save Configuration
            </button>
          </div>

          <div className="bg-white shadow-neumorphic rounded-lg p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Configure which roles can access each menu item. Changes will take effect after saving.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {menuItems.map((menuItem) => (
                <motion.div
                  key={menuItem.id}
                  variants={itemVariants}
                  className="shadow-neumorphic bg-gray-100 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium text-gray-700">{menuItem.name}</h3>
                      <p className="text-sm text-gray-500">{menuItem.path}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Allowed Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <button
                          key={`${menuItem.id}-${role}`}
                          onClick={() => handleRoleToggle(menuItem.id, role)}
                          className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${menuItem.allowedRoles.includes(role) ? "bg-purple-100 text-purple-700 shadow-neumorphic-inset-button" : "bg-gray-100 text-gray-500 shadow-neumorphic-button"}`}
                        >
                          {menuItem.allowedRoles.includes(role) ? (
                            <Check size={12} />
                          ) : (
                            <X size={12} />
                          )}
                          {role.replace("ROLE_", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;