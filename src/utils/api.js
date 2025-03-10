export const fetchTransactions = async (setTransactions, token) => {  
  console.log("Fetch Token: ", token);

  try {
    const res = await fetch("http://localhost:8080/api/get", {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
    });

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

export const handleDeleteTransaction = async (id, setTransactions, token) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this transaction?"
  );
  if (!confirmDelete) return;

  console.log("Delete Token: ", token);

  try {
    const response = await fetch(`http://localhost:8080/api/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id)
    );
  } catch (error) {
    console.error("Error deleting transaction:", error);
  }
};

export const handleUpdateTransaction = async (
  id,
  updatedData,
  setTransactions,
  token
) => {
  try {
    const response = await fetch(`http://localhost:8080/api/put/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    console.log("Update Token: ", token);

    if (!response.ok) throw new Error("Failed to update transaction");
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updatedData } : transaction
      )
    );

  } catch (error) {
    console.error("Error updating transaction:", error);
  }
};

export const handleDownloadCsv = async (token) => {
  try {
    const response = await fetch("http://localhost:8080/api/download", {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
        'Content-Type': 'application/json',
      },
      method: "GET",
    });

    console.log("Download Token: ", token);

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

