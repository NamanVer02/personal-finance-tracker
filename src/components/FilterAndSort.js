import { useState } from "react";
import { X, Filter, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { motion } from "framer-motion";

const expenseCategories = [
  "Housing",
  "Utilities",
  "Groceries",
  "Transportation",
  "Insurance",
  "Healthcare",
  "Debt Repayment",
  "Entertainment & Leisure",
  "Savings & Emergency Fund",
  "Investments",
  "Miscellaneous",
];

const incomeCategories = [
  "Salary",
  "Business",
  "Investments",
  "Gifts",
  "Miscellaneous",
];

export default function FilterAndSort({ onClose, onApply }) {
  const [filterCriteria, setFilterCriteria] = useState({
    type: "all",
    dateFrom: "",
    dateTo: "",
    categories: [],
    amountMin: "",
    amountMax: "",
    label: "",
  });

  const [sortCriteria, setSortCriteria] = useState({
    field: "date",
    direction: "desc",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFilterCriteria((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, value]
        : prev.categories.filter((cat) => cat !== value),
    }));
  };

  const handleSortChange = (field) => {
    setSortCriteria((prev) => ({
      field,
      direction:
        prev.field === field
          ? prev.direction === "asc"
            ? "desc"
            : "asc"
          : "asc",
    }));
  };

  const handleApply = () => {
    onApply({ filter: filterCriteria, sort: sortCriteria });
    onClose();
  };

  const handleReset = () => {
    setFilterCriteria({
      type: "all",
      dateFrom: "",
      dateTo: "",
      categories: [],
      amountMin: "",
      amountMax: "",
      label: "",
    });
    setSortCriteria({
      field: "date",
      direction: "desc",
    });
  };

  const allCategories = [...new Set([...expenseCategories, ...incomeCategories])];

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute right-0 top-0 w-96 bg-gray-100 h-full p-6 overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Filter & Sort</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Filter Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-700 mb-4">
              <Filter className="h-5 w-5" />
              Filter Transactions
            </h3>

            <div className="space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Transaction Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ target: { name: "type", value: "all" } })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      filterCriteria.type === "all"
                        ? "bg-purple-100 text-purple-600 shadow-neumorphic-inset"
                        : "bg-gray-100 text-gray-600 shadow-neumorphic"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ target: { name: "type", value: "Expense" } })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      filterCriteria.type === "Expense"
                        ? "bg-red-100 text-red-600 shadow-neumorphic-inset"
                        : "bg-gray-100 text-gray-600 shadow-neumorphic"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ target: { name: "type", value: "Income" } })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      filterCriteria.type === "Income"
                        ? "bg-green-100 text-green-600 shadow-neumorphic-inset"
                        : "bg-gray-100 text-gray-600 shadow-neumorphic"
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="dateFrom" className="block text-xs text-gray-500 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      id="dateFrom"
                      name="dateFrom"
                      value={filterCriteria.dateFrom}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="dateTo" className="block text-xs text-gray-500 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      id="dateTo"
                      name="dateTo"
                      value={filterCriteria.dateTo}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Amount Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="amountMin" className="block text-xs text-gray-500 mb-1">
                      Min
                    </label>
                    <input
                      type="number"
                      id="amountMin"
                      name="amountMin"
                      value={filterCriteria.amountMin}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-sm"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="amountMax" className="block text-xs text-gray-500 mb-1">
                      Max
                    </label>
                    <input
                      type="number"
                      id="amountMax"
                      name="amountMax"
                      value={filterCriteria.amountMax}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-sm"
                      min="0"
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>

              {/* Label Search */}
              <div>
                <label htmlFor="label" className="block text-sm font-medium text-gray-600 mb-2">
                  Transaction Label
                </label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={filterCriteria.label}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg bg-gray-100 shadow-neumorphic-inset focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none p-2 text-sm"
                  placeholder="Search labels..."
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Categories
                </label>
                <div className="max-h-40 overflow-y-auto bg-gray-100 shadow-neumorphic-inset rounded-lg p-3 no-scrollbar">
                  {allCategories.map((category) => (
                    <div key={category} className="flex items-center mb-2 last:mb-0">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        value={category}
                        checked={filterCriteria.categories.includes(category)}
                        onChange={handleCategoryChange}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded-sm"
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sort Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-700 mb-4">
              {sortCriteria.direction === "asc" ? (
                <ArrowDownAZ className="h-5 w-5" />
              ) : (
                <ArrowUpAZ className="h-5 w-5" />
              )}
              Sort By
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {["date", "amount", "label", "category"].map((field) => (
                <button
                  key={field}
                  onClick={() => handleSortChange(field)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize ${
                    sortCriteria.field === field
                      ? "bg-purple-100 text-purple-600 shadow-neumorphic-inset"
                      : "bg-gray-100 text-gray-600 shadow-neumorphic"
                  }`}
                >
                  {field}
                  {sortCriteria.field === field && (
                    <span className="ml-1">
                      {sortCriteria.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={handleReset}
              className="py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 shadow-neumorphic"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="py-2 rounded-lg text-sm font-medium bg-purple-600 text-white shadow-neumorphic-purple"
            >
              Apply
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}