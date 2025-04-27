import React, { useState } from 'react';

const CacheDemoButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const callCacheDemo = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/cache/demo', { method: 'POST' });
      if (response.ok) {
        setMessage('Cache demo method called successfully');
      } else {
        setMessage('Failed to call cache demo method');
      }
    } catch (error) {
      setMessage('Error calling cache demo method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={callCacheDemo}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Calling...' : 'Call Cache Demo Method'}
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
};

export default CacheDemoButton;
