import { BarChart3, History, Settings, LogOut, Trash2, Edit, ArrowDownLeft, ArrowUpRight} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import AddTransaction from "./AddTransaction"; // Add this import


export default function HistoryDash() {
  const navigate = useNavigate();
  const location = useLocation();
  const month = new Date().toLocaleString("default", { month: "long" });
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [showAddPopup, setShowAddPopup] = useState(false); // Add popup state
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      label: "Groceries",
      type: "Expense",
      amount: "-$150",
      category: "Food",
      date: "Oct 10, 2023",
    },
    {
      id: 2,
      label: "Salary",
      type: "Income",
      amount: "+$3,000",
      category: "Salary",
      date: "Oct 15, 2023",
    },
    {
      id: 3,
      label: "Rent",
      type: "Expense",
      amount: "-$1,200",
      category: "Housing",
      date: "Oct 1, 2023",
    },
    {
      id: 4,
      label: "Freelance Work",
      type: "Income",
      amount: "+$800",
      category: "Freelance",
      date: "Oct 20, 2023",
    },
    {
      id: 5,
      label: "Netflix Subscription",
      type: "Expense",
      amount: "-$15",
      category: "Entertainment",
      date: "Oct 5, 2023",
    },
    {
      id: 6,
      label: "Electricity Bill",
      type: "Expense",
      amount: "-$120",
      category: "Utilities",
      date: "Oct 12, 2023",
    },
    {
      id: 7,
      label: "Car Maintenance",
      type: "Expense",
      amount: "-$300",
      category: "Transportation",
      date: "Oct 18, 2023",
    },
    {
      id: 8,
      label: "Bonus",
      type: "Income",
      amount: "+$500",
      category: "Bonus",
      date: "Oct 25, 2023",
    },
    {
      id: 9,
      label: "Dinner Out",
      type: "Expense",
      amount: "-$75",
      category: "Food",
      date: "Oct 22, 2023",
    },
    {
      id: 10,
      label: "Gym Membership",
      type: "Expense",
      amount: "-$50",
      category: "Health",
      date: "Oct 3, 2023",
    },
  ]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil((transactions?.length || 0) / itemsPerPage);



  // Add this function to handle new transactions
  const handleAddProduct = (newProduct) => {
    setTransactions(prev => [...prev, newProduct]);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    console.log(page);
  }

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage-1, 1));
  }

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage+1, totalPages));
  }

  const handleSettings = () => {
    navigate("/settings");
  }

  if(!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100"> {/* Changed background color */}
      {/* Add the popup component */}
      <AnimatePresence>
        {showAddPopup && (
            <AddTransaction
              onClose={() => setShowAddPopup(false)}
              onSubmit={handleAddProduct}
            />
        )}
      </AnimatePresence>

      {/* Fixed Sidebar */}
      <navbar className="hidden w-64 p-6 lg:block fixed h-screen bg-gray-100"> {/* Changed background color */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-full bg-purple-600 " /> {/* Added neumorphic shadow */}
          <div>
            <h3 className="font-medium">Naman Verma</h3>
            <p className="text-sm text-gray-600">{user.role}</p> 
          </div>
        </div>
  
        <div className="space-y-4">
          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium text-gray-600">MENU</h4> 
            <div className="space-y-1">
              <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${location.pathname === '/dashboard' ? 'shadow-neumorphic-inset' : 'shadow-neumorphic'}`}  onClick={() => {navigate("/dashboard")}}>
                <BarChart3 className="h-4 w-4 text-gray-600" /> 
                Dashboard
              </button>
              {/* Conditionally render History tab */}
              {user.role !== 'user' && (
                <button className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 ${location.pathname === '/history' ? 'shadow-neumorphic-inset' : 'shadow-neumorphic'}`}>
                  <History className="h-4 w-4 text-gray-600" /> 
                  History
                </button>
              )}
            </div>
          </div>
  
          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium text-gray-600">ACCOUNT</h4> 
            <div className="space-y-3">
              <button onClick={handleSettings} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic">
                <Settings className="h-4 w-4 text-gray-600" /> 
                Settings
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-100 shadow-neumorphic text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </navbar>
  
      {/* Main Content */}
      <div className="flex-1 p-8 lg:ml-64 bg-gray-100">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-700">Dashboard</h1>
          </div>
  
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card title={`Total Expense`} value="$287,000" change="+16.24%" changeType="positive" />
              <Card title={`Total Income`} value="4.5k" change="-0.85%" changeType="negative" />
            </div>
  
            <div className="rounded-lg bg-gray-100 shadow-neumorphic p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-700">{month} Report</h2>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic">Download</button>
                    <button
                      className="px-3 py-1 text-sm rounded-lg bg-purple-600 text-white shadow-neumorphic-purple"
                      onClick={() => setShowAddPopup(true)}
                    >
                      Add Transaction
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600">Active</button>
                  <button className="text-sm text-gray-600">Draft</button>
                </div>
              </div>
              <div className="mt-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-2"></th>
                      <th className="pb-2">LABEL</th>
                      <th className="pb-2">AMOUNT</th>
                      <th className="pb-2">CATEGORY</th>
                      <th className="pb-2">DATE ADDED</th>
                      <th className="pb-2">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        Math.min(currentPage * itemsPerPage, indexOfLastItem)
                      )
                      .map((transaction) => (
                        <tr key={transactions.name} className="border-t border-gray-200">
                          {transaction.type === "Expense" ? <ArrowDownLeft className="h-4 w-4 text-red-600" /> : <ArrowUpRight className="h-4 w-4 text-green-600" />}
                          <td className="py-3 font-medium text-gray-700">{transaction.label}</td> 
                          <td className="py-3 text-gray-600">{transaction.amount}</td> 
                          <td className="py-3 text-gray-600">{transaction.category}</td> 
                          <td className="py-3 text-gray-600">{transaction.date}</td> 
                          <td className="py-3 flex items-center gap-3">
                            <button className="text-gray-600 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-purple-600">
                              <Edit className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstItem} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic"
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 text-sm rounded-lg ${
                          currentPage === index + 1 ? "bg-purple-600 text-white shadow-neumorphic-purple" : "bg-gray-100 shadow-neumorphic"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={handleNextPage}
                      className="px-3 py-1 text-sm rounded-lg bg-gray-100 shadow-neumorphic"
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Updated Card Component with Neumorphism
  function Card({ title, value, change, changeType }) {
    return (
      <div className="rounded-lg bg-gray-100 shadow-neumorphic p-6"> 
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        <div className="text-2xl font-bold text-gray-700">{value}</div>
        <div className="mt-4 h-[80px] w-full rounded-lg" />
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`text-xs px-2 py-0.5 rounded ${
              changeType === "positive" ? "text-purple-600" : "text-red-600"
            }`}
          >
            {change}
          </div>
        </div>
      </div>
    );
  }
}