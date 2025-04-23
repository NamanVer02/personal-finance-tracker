import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "../AuthContext";
import { invalidateCache, CACHE_KEYS} from '../utils/cacheService';


const CsvUploadModal = ({ onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError("Please select a valid CSV file");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    // Invalidate relevant caches when deleting transaction
    invalidateCache(CACHE_KEYS.TRANSACTIONS);
    invalidateCache(CACHE_KEYS.INCOME_DATA);
    invalidateCache(CACHE_KEYS.EXPENSE_DATA);

    try {
      const response = await fetch("https://localhost:8080/api/import-csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      setLoading(false);
      onUploadSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to upload file");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-100 rounded-lg p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          Import Transactions
        </h2>

        <p className="text-gray-600 mb-4">
          Upload a CSV file with your transactions. The file should have these columns:
          label, type, amount, category, date (YYYY-MM-DD format)
        </p>

        <div className="mb-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => document.getElementById("csvFile").click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">
              {file ? file.name : "Click to select a CSV file"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {file ? `${(file.size / 1024).toFixed(2)} KB` : "CSV files only"}
            </p>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic-button"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-4 py-2 text-sm rounded-lg ${
              !file || loading
                ? "bg-gray-300 text-gray-500"
                : "bg-purple-500 text-white shadow-neumorphic-purple"
            }`}
          >
            {loading ? "Uploading..." : "Import Transactions"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CsvUploadModal;