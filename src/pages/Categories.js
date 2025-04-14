import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Trash2, Edit, Plus, X } from "lucide-react";
import { getExpenseCategories, getIncomeCategories, addCategory, updateCategory, deleteCategory } from "../utils/api";

export default function Categories() {
  const { currentUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("Expense");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [originalCategoryName, setOriginalCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  // Check if user is admin, if not redirect to dashboard
  useEffect(() => {
    if (!currentUser || !currentUser.roles.includes("ROLE_ADMIN")) {
      navigate("/dashboard");
      toast.error("You don't have permission to access this page");
    }
  }, [currentUser, navigate]);

  // Fetch categories on component mount
  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const fetchCategories = async () => {
    await getExpenseCategories(setExpenseCategories, token);
    await getIncomeCategories(setIncomeCategories, token);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate category name
    if (!categoryName.trim()) {
      toast.error("Category name cannot be empty");
      setIsSubmitting(false);
      return;
    }

    try {
      const categoryData = {
        name: categoryName,
        type: activeTab, // "Expense" or "Income"
      };
      
      const { success, data, error, isConflict } = await addCategory(categoryData, token);
      
      if (!success) {
        if (isConflict) {
          toast.error("Category already exists");
        } else {
          toast.error(error || "Failed to add category");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success(`${activeTab} category added successfully`);
      setCategoryName("");
      setShowAddModal(false);
      fetchCategories(); // Refresh categories list
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate category name
    if (!editCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      setIsSubmitting(false);
      return;
    }

    try {
      const { success, data, error, isConflict } = await updateCategory(activeTab, originalCategoryName, editCategoryName, token);
      
      if (!success) {
        if (isConflict) {
          toast.error("Category name already exists");
        } else {
          toast.error(error || "Failed to update category");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success(`${activeTab} category updated successfully`);
      setShowEditModal(false);
      fetchCategories(); // Refresh categories list
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the category "${categoryName}"?`
    );
    if (!confirmDelete) return;

    try {
      const { success, error } = await deleteCategory(activeTab, categoryName, token);
      
      if (!success) {
        toast.error(error || "Failed to delete category");
        return;
      }

      toast.success(`${activeTab} category deleted successfully`);
      fetchCategories(); // Refresh categories list
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const openEditModal = (categoryName) => {
    setOriginalCategoryName(categoryName);
    setEditCategoryName(categoryName);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Navbar
        currentUser={currentUser}
        token={token}
        logout={logout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <div className="container mx-auto px-4 py-8 mt-16 lg:mt-0">
        <div className="bg-gray-100 rounded-2xl p-8 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-700 mb-8">Category Management</h1>

          {/* Tab Selector */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("Expense")}
              className={`flex-grow py-3 px-6 rounded-xl text-sm font-medium transition-all ${
                activeTab === "Expense"
                  ? "bg-red-100 text-red-600 shadow-neumorphic-inset dark:bg-red-900 dark:text-red-300"
                  : "text-gray-600 shadow-neumorphic hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setActiveTab("Income")}
              className={`flex-grow py-3 px-6 rounded-xl text-sm font-medium transition-all ${
                activeTab === "Income"
                  ? "bg-green-100 text-green-600 shadow-neumorphic-inset dark:bg-green-900 dark:text-green-300"
                  : "text-gray-600 shadow-neumorphic hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              Income Categories
            </button>
          </div>

          {/* Categories List */}
          <div className="rounded-lg mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTab === "Expense"
                ? expenseCategories.map((category) => (
                    <motion.div
                      key={category}
                      variants={cardVariants}
                      className="flex justify-between items-center p-6 bg-white rounded-xl shadow-neumorphic hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                    >
                      <span className="text-gray-700 dark:text-gray-200">{category}</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-neumorphic hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors"
                          title="Edit category"
                        >
                          <Edit size={20} />
                        </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg shadow-neumorphic hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  : incomeCategories.map((category) => (
                      <motion.div
                        key={category}
                        variants={cardVariants}
                        className="flex justify-between items-center p-6 bg-white rounded-xl shadow-neumorphic hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                      >
                        <span className="text-gray-700 dark:text-gray-200">{category}</span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-neumorphic hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors"
                            title="Edit category"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2.5 bg-red-100 text-red-600 rounded-xl shadow-neumorphic hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                            title="Delete category"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-lg p-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                Add New {activeTab} Category
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label
                  htmlFor="categoryName"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="mt-1 block w-full rounded-lg shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-gray-700 dark:text-gray-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Category"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <motion.div
          className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-lg p-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                Edit {activeTab} Category
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label
                  htmlFor="editCategoryName"
                  className="block text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  Category Name
                </label>
                <input
                  type="text"
                  id="editCategoryName"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="mt-1 block w-full rounded-lg shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-gray-700 dark:text-gray-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Category"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}