import React, { useState, useEffect } from 'react';
import { CACHE_KEYS } from '../utils/cacheService';

const CacheMonitorModal = ({ onClose }) => {
  const [cacheStats, setCacheStats] = useState({});

  useEffect(() => {
    const updateCacheStats = () => {
      const stats = {};
      Object.values(CACHE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          stats[key] = {
            size: new Blob([item]).size,
            expiresIn: Math.max(0, Math.floor((parsed.expiry - Date.now()) / 1000)),
            lastUpdated: new Date(parsed.expiry - parsed.ttl).toLocaleString()
          };
        }
      });
      setCacheStats(stats);
    };

    updateCacheStats();
    const interval = setInterval(updateCacheStats, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cache Monitor (Local Storage)</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 dark:hover:text-white font-bold text-lg"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="space-y-4">
          {Object.entries(cacheStats).length === 0 ? (
            <p className="text-gray-500">No cache data available in local storage.</p>
          ) : (
            Object.entries(cacheStats).map(([key, stats]) => (
              <div key={key} className="border-b pb-2">
                <h3 className="font-medium">{key}</h3>
                <div className="text-sm text-gray-600">
                  <p>Size: {(stats.size / 1024).toFixed(2)} KB</p>
                  <p>Expires in: {stats.expiresIn} seconds</p>
                  <p>Last updated: {stats.lastUpdated}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              // Manual refresh
              const updateCacheStats = () => {
                const stats = {};
                Object.values(CACHE_KEYS).forEach(key => {
                  const item = localStorage.getItem(key);
                  if (item) {
                    const parsed = JSON.parse(item);
                    stats[key] = {
                      size: new Blob([item]).size,
                      expiresIn: Math.max(0, Math.floor((parsed.expiry - Date.now()) / 1000)),
                      lastUpdated: new Date(parsed.expiry - parsed.ttl).toLocaleString()
                    };
                  }
                });
                setCacheStats(stats);
              };
              updateCacheStats();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheMonitorModal;
