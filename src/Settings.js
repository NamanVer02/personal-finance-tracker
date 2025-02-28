import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Trash2, FolderSync, ArrowLeft } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would typically implement the actual dark mode toggle
    document.documentElement.classList.toggle('dark');
  };

  const clearAllData = () => {
    // Implement the logic to clear all data
    console.log('Clearing all data...');
    // You might want to show a confirmation dialog before actually clearing the data
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button className="flex items-center gap-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1> 
        </button>
        <div className="grid gap-12 md:grid-cols-3">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center justify-center gap-4 p-6 aspect-square text-xl font-semibold rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
            } shadow-neumorphic-button`}
          >
            <Moon className="h-8 w-8" />
            {isDarkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
          </button>
          <button
            className={`flex items-center justify-center gap-4 p-6 text-xl font-semibold rounded-lg shadow-neumorphic-button`}
          >
            <FolderSync className="h-8 w-8" />
            Sync Data
          </button>
          <button
            onClick={clearAllData}
            className="flex items-center justify-center gap-4 p-6 text-xl font-semibold rounded-lg bg-red-500 text-white shadow-neumorphic-button"
          >
            <Trash2 className="h-8 w-8" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
