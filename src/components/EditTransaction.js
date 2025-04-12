import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { getExpenseCategories, getIncomeCategories } from "../utils/api";
import { validateTransaction } from "../utils/validation";

export default function EditTransaction({ onClose, onSubmit, transaction }) {
  const token = localStorage.getItem("token");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [formData, setFormData] = useState(
    {
      label: transaction?.label || "",
      amount: transaction?.amount || "",
      type: transaction?.type || "Expense",
      category: transaction?.category || "Miscellaneous",
      date: transaction?.date
        ? new Date(transaction?.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      version: transaction?.version || 0,
    },
    []
  );

  let categories =
    formData.type === "Expense" ? expenseCategories : incomeCategories;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prevData) => ({
      ...prevData,
      type,
    }));
    categories = type === "Expense" ? expenseCategories : incomeCategories;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate transaction data
    const errors = validateTransaction(formData);
    if (errors) {
      // Display the first error message
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await onSubmit(transaction.id, formData);

      if (!result || typeof result.success === "undefined") {
        toast.error("Unexpected response from server");
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        if (result.isConflict) {
          toast.error(result.error || "Failed to update transaction");
        }
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (error) {
      console.log(error);
      toast.error("An error occurred while updating the transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
      getExpenseCategories(setExpenseCategories, token);
      getIncomeCategories(setIncomeCategories, token);
    }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute right-0 top-0 w-96 bg-gray-100 h-full p-6 overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("Expense")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  formData.type === "Expense"
                    ? "bg-red-100 text-red-600 shadow-neumorphic-inset"
                    : "bg-gray-100 text-gray-600 shadow-neumorphic"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("Income")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  formData.type === "Income"
                    ? "bg-green-100 text-green-600 shadow-neumorphic-inset"
                    : "bg-gray-100 text-gray-600 shadow-neumorphic"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Transaction Label */}
          <div>
            <label
              htmlFor="label"
              className="block text-sm font-medium text-gray-600"
            >
              Transaction Label
            </label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-600"
            >
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              min="0"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-600"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-600"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg shadow-neumorphic-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Transaction"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
