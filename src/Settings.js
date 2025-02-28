import React, { useState } from 'react';
import { Moon, Trash2 } from 'lucide-react';

export default function Settings() {
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center justify-center gap-4 p-6 text-xl font-semibold rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            } border border-gray-200 shadow-lg`}
          >
            <Moon className="h-8 w-8" />
            {isDarkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
          </button>
          <button
            onClick={clearAllData}
            className="flex items-center justify-center gap-4 p-6 text-xl font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors border border-red-500 shadow-lg"
          >
            <Trash2 className="h-8 w-8" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
