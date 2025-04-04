export const fetchTransactions = async (setTransactions, token) => {  
  try {
    const res = await fetch("http://localhost:8080/api/get", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
    });

    // if (res.status === 401) {
    //   const newToken = await refreshAccessToken();
    //   if (newToken) {
    //     res = await fetch("http://localhost:8080/api/get", {
    //       headers: {
    //         Authorization: `Bearer ${newToken}`, // Include the token in the headers
    //         'Content-Type': 'application/json',
    //       },
    //     });
    //   }
    // }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    setTransactions(data);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    setTransactions([]);
  }
};

export const handleAddTransaction = async (formData, onSubmit, onClose, token) => {
  try{
    const res = await fetch("http://localhost:8080/api/post", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData), 
    });

    if (!res.ok) {
      throw new Error("Failed to add transaction");
    }

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
    const response = await fetch(`http://localhost:8080/api/delete/${id}`, {
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
  } catch (error) {
    console.error("Error deleting transaction:", error);
  }
};

export const handleUpdateTransaction = async (transactionId, formData, token) => {
  try {

    const res = await fetch(`http://localhost:8080/api/put/${transactionId}`, {
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
    const response = await fetch(`http://localhost:8080/api/download/${userId}/csv`, {
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
    const response = await fetch(`http://localhost:8080/api/download/${userId}/pdf`, {
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
    const res = await fetch(`http://localhost:8080/api/get/summary/income/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setIncomeData(data);
  } catch (err) {
    console.error("Error fetching income data:", err);
    setIncomeData([]);
  }
};


export const fetchExpenseData = async (setExpenseData, userId, token) => {
  try {
    const res = await fetch(`http://localhost:8080/api/get/summary/expense/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    setExpenseData(data);
  } catch (err) {
    console.error("Error fetching income data:", err);
    setExpenseData([]);
  }
};

export const fetchOverallSummary = async (setOverallSummary, token) => {
  try {
    const res = await fetch(`http://localhost:8080/api/accountant/summary/overall`, {
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
  } catch (err) {
    console.error("Error fetching overall summary:", err);
    setOverallSummary({});
  }
};

export const fetchUsersList = async (setUsers, token) => {
  try {
    const res = await fetch(`http://localhost:8080/api/accountant/users`, {
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
    const res = await fetch(`http://localhost:8080/api/accountant/summary/user/${userId}`, {
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
    const res = await fetch(`http://localhost:8080/api/accountant/summary/monthly`, {
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