export const fetchTransactions = async (setTransactions) => {
  try {
    const res = await fetch("http://localhost:8080/api/get");
    const data = await res.json();
    setTransactions(data);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    setTransactions([]);
  }
};

export const handleDeleteTransaction = async (id, setTransactions) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this transaction?"
  );
  if (!confirmDelete) return;

  try {
    const response = await fetch(`http://localhost:8080/api/delete/${id}`, {
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
  setTransactions
) => {
  try {
    const response = await fetch(`http://localhost:8080/api/put/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
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

export const handleDownloadCsv = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/download", {
      method: "GET",
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
