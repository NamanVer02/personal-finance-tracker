import { getCachedTransactions, cacheTransactions, getCachedIncomeData, cacheIncomeData, getCachedExpenseData, cacheExpenseData, invalidateCache, CACHE_KEYS, getWithExpiry, setWithExpiry, CACHE_DURATIONS } from './cacheService';

export const fetchTransactions = async (setTransactions, token) => {  
  try {
    // Check cache first
    const cachedData = getCachedTransactions();
    if (cachedData) {
      setTransactions(cachedData);
      return;
    }

    const res = await fetch("https://localhost:8080/api/get", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    setTransactions(data);
    // Cache the response
    cacheTransactions(data);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    setTransactions([]);
  }
};

export const handleAddTransaction = async (formData, onSubmit, onClose, token) => {
  try{
    const res = await fetch("https://localhost:8080/api/post", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData), 
    });

    if (!res.ok) {
      throw new Error("Failed to add transaction");
    }

    // Invalidate relevant caches when adding new transaction
    invalidateCache(CACHE_KEYS.TRANSACTIONS);
    invalidateCache(CACHE_KEYS.INCOME_DATA);
    invalidateCache(CACHE_KEYS.EXPENSE_DATA);

    onSubmit();
    onClose();
  }
  catch (error) {
    console.error(error);
  }
}

export const handleDeleteTransaction = async (id, setTransactions, token) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this transaction?"
  );
  if (!confirmDelete) return;

  try {
    const response = await fetch(`https://localhost:8080/api/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      method: "DELETE",
    });

    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.message || "This record was modified by another user. Please refresh and try again.");
    }

    if (!response.ok) throw new Error("Failed to delete transaction");
    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id)
    );

    // Invalidate relevant caches when deleting transaction
    invalidateCache(CACHE_KEYS.TRANSACTIONS);
    invalidateCache(CACHE_KEYS.INCOME_DATA);
    invalidateCache(CACHE_KEYS.EXPENSE_DATA);

  } catch (error) {
    console.error("Error deleting transaction:", error);
  }
};

export const handleUpdateTransaction = async (transactionId, formData, token) => {
  try {
    const res = await fetch(`https://localhost:8080/api/put/${transactionId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (res.status === 409) {
      // Handle version conflict
      return {
        success: false,
        error: "This transaction was updated by someone else. Please refresh and try again.",
        isConflict: true
      };
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    // Invalidate relevant caches when updating transaction
    invalidateCache(CACHE_KEYS.TRANSACTIONS);
    invalidateCache(CACHE_KEYS.INCOME_DATA);
    invalidateCache(CACHE_KEYS.EXPENSE_DATA);

    return { success: true, data };
  } catch (err) {
    console.error("Error updating transaction:", err);
    return { 
      success: false, 
      error: err.message || "Failed to update transaction"
    };
  }
};

export const handleDownloadCsv = async (token, userId) => {
  try {
    const response = await fetch(`https://localhost:8080/api/download/${userId}/csv`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      method: "POST",
    });

    if (!response.ok) throw new Error("Failed to download CSV");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Transactions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Error downloading CSV:", error);
  }
};

export const handleDownloadPdf = async (token, userId) => {
  try {
    const response = await fetch(`https://localhost:8080/api/download/${userId}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      method: "POST",
    });
    
    if (!response.ok) throw new Error("Failed to download PDF");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Transactions.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV:", error);
  }
};

export const fetchIncomeData = async (setIncomeData, userId, token) => {
  try {
    // Check cache first
    const cachedData = getCachedIncomeData();
    if (cachedData) {
      setIncomeData(cachedData);
      return;
    }

    const res = await fetch(`https://localhost:8080/api/get/summary/income/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setIncomeData(data);
    console.log("Income data:", data);
    // Cache the response
    cacheIncomeData(data);
  } catch (err) {
    console.error("Error fetching income data:", err);
    setIncomeData([]);
  }
};


export const fetchExpenseData = async (setExpenseData, userId, token) => {
  try {
    // Check cache first
    const cachedData = getCachedExpenseData();
    if (cachedData) {
      setExpenseData(cachedData);
      return;
    }

    const res = await fetch(`https://localhost:8080/api/get/summary/expense/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setExpenseData(data);
    // Cache the response
    cacheExpenseData(data);
  } catch (err) {
    console.error("Error fetching expense data:", err);
    setExpenseData([]);
  }
};

export const fetchOverallSummary = async (setOverallSummary, token) => {
  try {
    // Check cache first
    const cachedData = getWithExpiry(CACHE_KEYS.FINANCIAL_SUMMARY);
    if (cachedData) {
      setOverallSummary(cachedData);
      return;
    }

    const res = await fetch(`https://localhost:8080/api/accountant/summary/overall`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setOverallSummary(data);
    // Cache the response
    setWithExpiry(CACHE_KEYS.FINANCIAL_SUMMARY, data, CACHE_DURATIONS.FINANCIAL_SUMMARY);
  } catch (err) {
    console.error("Error fetching overall summary:", err);
    setOverallSummary({});
  }
};

export const fetchUsersList = async (setUsers, token) => {
  try {
    const res = await fetch(`https://localhost:8080/api/accountant/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setUsers(data);
  } catch (err) {
    console.error("Error fetching users list:", err);
    setUsers([]);
  }
};

export const fetchUserSummary = async (setUserSummary, userId, token) => {
  try {
    const res = await fetch(`https://localhost:8080/api/accountant/summary/user/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setUserSummary(data);
  } catch (err) {
    console.error("Error fetching user summary:", err);
    setUserSummary({});
  }
};

export const fetchMonthlySummary = async (setMonthlySummary, token) => {
  try {
    const res = await fetch(`https://localhost:8080/api/accountant/summary/monthly`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setMonthlySummary(data);
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
    setMonthlySummary({});
  }
};

export const getExpenseCategories = async (setExpenseCategories, token) => {
  try {
    const res = await fetch("https://localhost:8080/api/categories/expense", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    const namesArray = Object.values(data).map(item => item.name);
    setExpenseCategories(namesArray);
  } catch (err) {
    console.error("Error fetching expense categories:", err);
    setExpenseCategories([]);
  }
}

export const getIncomeCategories = async (setIncomeCategories, token) => {
  try {
    const res = await fetch("https://localhost:8080/api/categories/income", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    const namesArray = Object.values(data).map(item => item.name);
    setIncomeCategories(namesArray);
  } catch (err) {
    console.error("Error fetching income categories:", err);
    setIncomeCategories([]);
  }
}

export const addCategory = async (categoryData, token) => {
  try {
    const response = await fetch("https://localhost:8080/api/categories", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });

    if (response.status === 409) {
      return { success: false, error: "Category already exists", isConflict: true };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error adding category:", error);
    return { success: false, error: error.message || "Failed to add category" };
  }
}

export const updateCategory = async (categoryType, originalName, newName, token) => {
  try {
    // First, get all categories of the specified type to find the ID
    const categoriesRes = await fetch(`https://localhost:8080/api/categories/${categoryType.toLowerCase()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!categoriesRes.ok) {
      throw new Error(`HTTP error! status: ${categoriesRes.status}`);
    }

    const categories = await categoriesRes.json();
    const category = categories.find(cat => cat.name === originalName);

    if (!category) {
      return { success: false, error: `Category '${originalName}' not found`, isNotFound: true };
    }

    // Now use the ID for the update request
    const response = await fetch(`https://localhost:8080/api/categories/${category.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    if (response.status === 409) {
      return { success: false, error: "Category name already exists", isConflict: true };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message || "Failed to update category" };
  }
}

export const deleteCategory = async (categoryType, categoryName, token) => {
  try {
    // First, get all categories of the specified type to find the ID
    const categoriesRes = await fetch(`https://localhost:8080/api/categories/${categoryType.toLowerCase()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!categoriesRes.ok) {
      throw new Error(`HTTP error! status: ${categoriesRes.status}`);
    }

    const categories = await categoriesRes.json();
    const category = categories.find(cat => cat.name === categoryName);

    if (!category) {
      return { success: false, error: `Category '${categoryName}' not found`, isNotFound: true };
    }

    // Now use the ID for the delete request
    const response = await fetch(`https://localhost:8080/api/categories/${category.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message || "Failed to delete category" };
  }
}


export const fetchFinanceEntries = async (
  setTransactions,
  setTotalPages,
  setTotalItems,
  currentPage,
  token,
  filterCriteria,
  sortCriteria,
  size = 10
) => {
  // Convert filter criteria to API parameters
  const params = {
    page: currentPage || 0,
    size,
    type: filterCriteria.type === 'all' ? null : filterCriteria.type,
    category: filterCriteria.categories.length > 0 ? filterCriteria.categories.join(',') : null,
    minAmount: filterCriteria.amountMin || null,
    maxAmount: filterCriteria.amountMax || null,
    startDate: filterCriteria.dateFrom || null,
    endDate: filterCriteria.dateTo || null,
    searchTerm: filterCriteria.label || null,
    sort: [`${sortCriteria.field},${sortCriteria.direction}`]  
  };

  // Build query string with proper URL encoding
  const queryString = Object.entries(params)
  .filter(([_, value]) => value !== null && value !== '' && value.length !== 0)
  .flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(v => `${key}=${encodeURIComponent(v)}`);
    }
    return `${key}=${encodeURIComponent(value)}`;
  })
  .join('&');

  try {
    const res = await fetch(`https://localhost:8080/api/search?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    setTransactions(data.content);
    setTotalPages(data.totalPages);
    setTotalItems(data.totalElements);
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
};

export const fetchAllFinanceEntries = async (
  setTransactions,
  setTotalPages,
  setTotalItems,
  currentPage,
  token,
  filterCriteria,
  sortCriteria,
  size = 10
) => {
  // Convert filter criteria to API parameters
  const params = {
    page: currentPage || 0,
    size,
    type: filterCriteria.type === 'all' ? null : filterCriteria.type,
    id: filterCriteria.id || null,
    category: filterCriteria.categories.length > 0 ? filterCriteria.categories.join(',') : null,
    minAmount: filterCriteria.amountMin || null,
    maxAmount: filterCriteria.amountMax || null,
    startDate: filterCriteria.dateFrom || null,
    endDate: filterCriteria.dateTo || null,
    searchTerm: filterCriteria.label || null,
    sort: [`${sortCriteria.field},${sortCriteria.direction}`]  
  };

  // Build query string with proper URL encoding
  const queryString = Object.entries(params)
  .filter(([_, value]) => value !== null && value !== '' && value.length !== 0)
  .flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map(v => `${key}=${encodeURIComponent(v)}`);
    }
    return `${key}=${encodeURIComponent(value)}`;
  })
  .join('&');


  try {
    const res = await fetch(`https://localhost:8080/api/admin/search?${queryString}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    setTransactions(data.content);
    setTotalPages(data.totalPages);
    setTotalItems(data.totalElements);
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
};
