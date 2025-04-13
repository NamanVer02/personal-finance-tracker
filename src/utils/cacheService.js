// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  TRANSACTIONS: 5 * 60 * 1000, // 5 minutes
  USER_DATA: 10 * 60 * 1000, // 10 minutes
  FINANCIAL_SUMMARY: 5 * 60 * 1000, // 5 minutes
};

export const CACHE_KEYS = {
  TRANSACTIONS: 'cached_transactions',
  USER_DATA: 'cached_user_data',
  INCOME_DATA: 'cached_income_data',
  EXPENSE_DATA: 'cached_expense_data',
  FINANCIAL_SUMMARY: 'cached_financial_summary',
};

// Helper to get cache with expiration check
export const getWithExpiry = (key) => {
  const cachedItem = localStorage.getItem(key);
  if (!cachedItem) {
    console.log(`Cache miss for key: ${key}`);
    return null;
  }

  const item = JSON.parse(cachedItem);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    console.log(`Cache expired for key: ${key}`);
    localStorage.removeItem(key);
    return null;
  }
  console.log(`Cache hit for key: ${key}`);
  return item.value;
};

// Helper to set cache with expiration
export const setWithExpiry = (key, value, ttl) => {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
  console.log(`Cache set for key: ${key}, expires in ${ttl/1000} seconds`);
};

// Cache transactions data
export const cacheTransactions = (transactions) => {
  setWithExpiry(CACHE_KEYS.TRANSACTIONS, transactions, CACHE_DURATIONS.TRANSACTIONS);
};

// Get cached transactions
export const getCachedTransactions = () => {
  return getWithExpiry(CACHE_KEYS.TRANSACTIONS);
};

// Cache income data
export const cacheIncomeData = (incomeData) => {
  setWithExpiry(CACHE_KEYS.INCOME_DATA, incomeData, CACHE_DURATIONS.TRANSACTIONS);
};

// Get cached income data
export const getCachedIncomeData = () => {
  return getWithExpiry(CACHE_KEYS.INCOME_DATA);
};

// Cache expense data
export const cacheExpenseData = (expenseData) => {
  setWithExpiry(CACHE_KEYS.EXPENSE_DATA, expenseData, CACHE_DURATIONS.TRANSACTIONS);
};

// Get cached expense data
export const getCachedExpenseData = () => {
  return getWithExpiry(CACHE_KEYS.EXPENSE_DATA);
};

// Clear all cached data
export const clearCache = () => {
  Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key));
};

// Invalidate specific cache
export const invalidateCache = (key) => {
  localStorage.removeItem(key);
};