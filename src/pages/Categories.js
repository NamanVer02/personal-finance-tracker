import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Trash2, Edit, Plus, X } from "lucide-react";
import { getExpenseCategories, getIncomeCategories, deleteCategory } from "../utils/api";
import AddCategoryModal from "../components/AddCategoryModal";
import EditCategoryModal from "../components/Editcategorymodal";

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
  // useEffect(() => {
  //   if (!currentUser || !currentUser.roles.includes("ROLE_ADMIN")) {
  //     navigate("/dashboard");
  //     toast.error("You don't have permission to access this page");
  //   }
  // }, [currentUser, navigate]);

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

  const handleCategoryAdded = () => {
    fetchCategories(); // Refresh categories list
    setShowAddModal(false);
  };

  const handleCategoryEdited = () => {
    fetchCategories(); // Refresh categories list
    setShowEditModal(false);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState("");

  const handleDeleteCategory = async (categoryName) => {
    setCategoryToDelete(categoryName);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      const { success, error } = await deleteCategory(activeTab, categoryToDelete, token);

      if (!success) {
        toast.error(error || "Failed to delete category");
        setIsDeleteModalOpen(false);
        return;
      }

      toast.success(`${activeTab} category deleted successfully`);
      fetchCategories(); // Refresh categories list
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
      setIsDeleteModalOpen(false);
    }
  };

  const openEditModal = (categoryName) => {
    setOriginalCategoryName(categoryName);
    setEditCategoryName(categoryName);
    setShowEditModal(true);
  };

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
            <h1 className="text-2xl font-bold text-gray-700 ">
              Manage Categories
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 shadow-neumorphic-button  text-gray-700  px-4 py-2 rounded-md transition-all hover:text-purple-500"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>

          <div className="mb-6">
            <div className="flex">
              <button
                className={`py-2 px-4 font-medium shadow-neumorphic-button rounded-t-md transition-all ${activeTab === "Expense" ? "text-purple-500  shadow-neumorphic-inset" : "text-gray-500"}`}
                onClick={() => setActiveTab("Expense")}
              >
                Expense Categories
              </button>
              <button
                className={`py-2 px-4 font-medium shadow-neumorphic-button rounded-t-md transition-all ${activeTab === "Income" ? "text-purple-500  shadow-neumorphic-inset" : "text-gray-500"}`}
                onClick={() => setActiveTab("Income")}
              >
                Income Categories
              </button>
            </div>
          </div>

          {activeTab === "Expense" ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {expenseCategories.map((category) => (
                <motion.div
                  key={`${category}-${activeTab}-${Math.random()}`}
                  variants={cardVariants}
                  className="shadow-neumorphic bg-gray-100 p-4 rounded-lg flex justify-between items-center"
                >
                  <span className="text-gray-700 font-medium">
                    {category}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="shadow-neumorphic-button p-2 rounded-md text-blue-500 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="shadow-neumorphic-button  p-2 rounded-md text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {incomeCategories.map((category) => (
                <motion.div
                  key={`${category}-${activeTab}-${Math.random()}`}
                  variants={cardVariants}
                  className="shadow-neumorphic bg-gray-100  p-4 rounded-lg flex justify-between items-center"
                >
                  <span className="text-gray-700 font-medium">
                    {category}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 shadow-neumorphic-button rounded-md text-blue-500 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 shadow-neumorphic-button rounded-md text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onCategoryAdded={handleCategoryAdded}
          type={activeTab}
        />
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <EditCategoryModal
          onClose={() => setShowEditModal(false)}
          onCategoryEdited={handleCategoryEdited}
          type={activeTab}
          originalName={originalCategoryName}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-red-600">
                Delete Category
              </h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the category "{categoryToDelete}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 shadow-neumorphic-button text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-neumorphic-red flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
