import React, { useState, useEffect } from 'react';
import { CACHE_KEYS } from '../utils/cacheService';

const CacheMonitor = () => {
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
    <div className="shadow rounded-lg p-4 mt-4">
      <h2 className="text-xl font-semibold mb-4">Cache Monitor</h2>
      <div className="space-y-4">
        {Object.entries(cacheStats).map(([key, stats]) => (
          <div key={key} className="border-b pb-2">
            <h3 className="font-medium">{key}</h3>
            <div className="text-sm text-gray-600">
              <p>Size: {(stats.size / 1024).toFixed(2)} KB</p>
              <p>Expires in: {stats.expiresIn} seconds</p>
              <p>Last updated: {stats.lastUpdated}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CacheMonitor;