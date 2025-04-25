import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Search,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";

const AdminUserRolesPage = () => {
    const { logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([
    "ROLE_USER",
    "ROLE_ADMIN",
    "ROLE_ACCOUNTANT",
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    // Get current user from localStorage or your auth context
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    if (storedToken) {
      setToken(storedToken);
      fetchUsers(storedToken);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setSelectedRoles(user.roles.map((role) => role.name));
    
    // If user doesn't have a version property, log a warning
    if (user.version === undefined) {
      console.warn('User object does not have version information for optimistic locking');
    }
  };

  const handleRoleToggle = (roleName) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleName)) {
        // Prevent removing the last role
        if (prev.length <= 1) {
          toast.error("Cannot remove user's only role");
          return prev;
        }
        return prev.filter((r) => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  const handleRemoveRole = async (userId, roleName) => {
  const user = users.find(u => u.id === userId);
  if (!user) {
    toast.error("User not found");
    return;
  }
  if (user.roles.length === 1) {
    toast.error("Cannot remove user's only role");
    return;
  }
  try {
      const response = await fetch(
        `https://localhost:8080/api/admin/users/${userId}/roles/${roleName}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove role");
      }

      // Update the user in local state
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              roles: user.roles.filter((r) => r.name !== roleName),
            };
          }
          return user;
        })
      );

      toast.success(`Removed ${roleName} from user`);
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  const handleAddRole = async (userId, roleName) => {
    try {
      const response = await fetch(
        `https://localhost:8080/api/admin/users/${userId}/roles/${roleName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add role");
      }

      // Update the user in local state
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            const updatedRoles = [...user.roles];
            if (!updatedRoles.some((r) => r.name === roleName)) {
              updatedRoles.push({ name: roleName });
            }
            return { ...user, roles: updatedRoles };
          }
          return user;
        })
      );

      toast.success(`Added ${roleName} to user`);
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("Failed to add role");
    }
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;

    try {
      // Include version in the request body if available
      const requestBody = { 
        roleNames: selectedRoles,
        version: editingUser.version // Include version for optimistic locking
      };
      
      const response = await fetch(
        `https://localhost:8080/api/admin/users/${editingUser.id}/roles`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      // Handle version conflict (409 Conflict status)
      if (response.status === 409) {
        toast.error(
          "This user was updated by someone else. Refreshing data...",
          { autoClose: 5000, closeButton: true }
        );
        refreshUsers();
        setEditingUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update roles. Please referesh the page.");
      }

      // Get updated user data with new version from response
      const updatedUser = await response.json();
      
      // Update user in the local state with new version
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === editingUser.id) {
            return { 
              ...user, 
              roles: selectedRoles.map((name) => ({ name })),
              version: updatedUser.version // Update version from response
            };
          }
          return user;
        })
      );

      toast.success(`Roles updated for ${editingUser.username}`);
      setEditingUser(null);

      // New logout logic
      toast.info(
        "You need to login again to continue. Logging out in 10 seconds...",
        {
          autoClose: 10000,
          closeButton: false,
        }
      );

      setTimeout(() => {
        // Clear auth state (example - modify according to your auth system)
        logout();

        // Navigate to login
        window.location.href = "/login"; // Or use your routing method (React Router useNavigate, etc.)
      }, 10000);
    } catch (error) {
      console.error("Error updating roles:", error);
      toast.error("Failed to update roles. Please refresh the page.");
    }
  };

  const fetchUsers = async (authToken) => {
    setLoading(true);
    try {
      const response = await fetch("https://localhost:8080/api/admin/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      // Display toast when refreshing data after version conflict
      if (editingUser) {
        setEditingUser(null);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers(token);
    toast.info("Refreshing user list...");
  };

  const handleExpireAccount = async (userId) => {
    try {
      const response = await fetch(
        `https://localhost:8080/api/admin/users/${userId}/expire`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to expire account");
      }

      const updatedUser = await response.json();
      
      // Update the user in local state
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            return { ...user, expired: true, expirationDate: updatedUser.expirationDate };
          }
          return user;
        })
      );

      toast.success(`Account for ${updatedUser.username} will be expired in 7 days if not logged in`);
    } catch (error) {
      console.error("Error expiring account:", error);
      toast.error("Failed to expire account");
    }
  };

  const handleUnexpireAccount = async (userId) => {
    try {
      const response = await fetch(
        `https://localhost:8080/api/admin/users/${userId}/unexpire`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unexpire account");
      }

      const updatedUser = await response.json();
      
      // Update the user in local state
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            return { ...user, expired: false, expirationDate: null };
          }
          return user;
        })
      );

      toast.success(`Account for ${updatedUser.username} is no longer marked for expiration`);
    } catch (error) {
      console.error("Error unexpiring account:", error);
      toast.error("Failed to unexpire account");
    }
  };

  const formatRoleName = (roleName) => {
    return roleName
      .replace("ROLE_", "")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className={`min-h-screen bg-gray-100 transition-all duration-300`}>
      <Navbar
        currentUser={currentUser}
        token={token}
        userId={currentUser?.userId}
        logout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen pt-20 lg:pt-8 px-4 lg:px-8">
        <motion.div
          className="max-w-6xl mx-auto space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div
            className="space-y-2"
            initial={{ x: -100, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-700">
              User Role Management
            </h1>
            <p className="text-gray-600">
              Assign or remove roles from users in the system.
            </p>
          </motion.div>

          {/* Search and Actions Bar */}
          <motion.div
            className="bg-gray-100 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
            variants={cardVariants}
          >
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset p-2 pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={16}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshUsers}
                className="px-4 py-2 rounded-lg shadow-neumorphic-button flex items-center gap-2 text-purple-700"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </motion.div>

          {/* Users List */}
          <motion.div
            className="bg-gray-100 rounded-lg p-6 shadow-neumorphic"
            variants={cardVariants}
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              System Users
            </h2>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-300">
                      <th className="pb-2">Username</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Roles</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-200">
                          <td className="py-4">
                            {user.username}
                            {user.version !== undefined && (
                              <span className="text-xs text-gray-500 ml-2" title="Version for optimistic locking">
                                v{user.version}
                              </span>
                            )}
                          </td>
                          <td className="py-4">{user.email}</td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <span
                                  key={role.name}
                                  className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700"
                                >
                                  {formatRoleName(role.name)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="px-3 py-1 rounded-lg shadow-neumorphic-button text-sm"
                              >
                                Edit Roles
                              </button>
                              {user.expired ? (
                                <button
                                  onClick={() => handleUnexpireAccount(user.id)}
                                  className="px-3 py-1 rounded-lg shadow-neumorphic-button text-sm bg-green-100 text-green-700 flex items-center gap-1"
                                  title="Unexpire Account"
                                >
                                  <Clock size={14} />
                                  <span>Unexpire</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleExpireAccount(user.id)}
                                  className="px-3 py-1 rounded-lg shadow-neumorphic-button text-sm bg-amber-100 text-amber-700 flex items-center gap-1"
                                  title="Expire Account"
                                  disabled={user.id === currentUser?.id}
                                >
                                  <AlertTriangle size={14} />
                                  <span>Expire</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-4 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Roles Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                Edit Roles: {editingUser.username}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 mb-2">
                  Select roles to assign to this user:
                </p>
                {editingUser.version !== undefined && (
                  <span className="text-xs text-gray-500" title="This version number helps prevent conflicts when multiple admins edit roles simultaneously">
                    Version: {editingUser.version}
                  </span>
                )}
              </div>

              {roles.map((role) => (
                <div
                  key={role}
                  className="flex items-center p-3 bg-gray-100 rounded-lg shadow-neumorphic-inset"
                >
                  <input
                    type="checkbox"
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    disabled={selectedRoles.length <= 1 && selectedRoles.includes(role)}
                    className="mr-3 h-4 w-4"
                  />
                  <label htmlFor={`role-${role}`} className="flex-grow">
                    {formatRoleName(role)}
                  </label>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddRole(editingUser.id, role)}
                      className="p-1 rounded-full hover:bg-purple-100"
                      title="Add role"
                    >
                      <CheckCircle size={18} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => handleRemoveRole(editingUser.id, role)}
                      className="p-1 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove role"
                      disabled={selectedRoles.length <= 1 || editingUser.id === currentUser?.id}
                    >
                      <XCircle size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-button text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoles}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-neumorphic-purple flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default AdminUserRolesPage;
