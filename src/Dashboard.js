import { BarChart3, History, Settings, LogOut, Trash2, Edit} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./AuthContext";
import { useState } from "react";
import AddTransaction from "./AddTransaction"; // Add this import


export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [showAddPopup, setShowAddPopup] = useState(false); // Add popup state
  const [products, setProducts] = useState([ // Add products state
    {
      id: 1,
      name: "MacBook Pro with M2 Chip",
      stock: "4,159",
      sold: "878",
      date: "Jul 14, 2023",
      price: "1,200",
      rating: "4.8",
    },
    {
      id: 2,
      name: "iPhone 15 128/256/512 80X",
      stock: "1,590",
      sold: "981",
      date: "Aug 09, 2023",
      price: "1,600",
      rating: "5.0",
    },
    {
      id: 3,
      name: "Apple Watch Ultra 2 Alpine",
      stock: "1,090",
      sold: "184",
      date: "Aug 12, 2023",
      price: "999",
      rating: "4.7",
    },
    {
      id: 4,
      name: "iPhone 15 Pro Max 256",
      stock: "2,590",
      sold: "995",
      date: "Aug 24, 2023",
      price: "1,600",
      rating: "4.2",
    },
    {
      id: 5,
      name: "MacBook Pro with M4 Chip",
      stock: "4,500",
      sold: "645",
      date: "Nov 30, 2023",
      price: "1,700",
      rating: "5.0",
    },
    {
      id: 6,
      name: "Apple Watch Series 8 45MM",
      stock: "3,140",
      sold: "931",
      date: "Dec 04, 2023",
      price: "899",
      rating: "4.5",
    },
    {
      id: 7,
      name: "Apple Watch Ultra 2 Alpine",
      stock: "2,150",
      sold: "187",
      date: "Dec 08, 2023",
      price: "799",
      rating: "4.8",
    },
  ]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil((products?.length || 0) / itemsPerPage);


  // Add this function to handle new products
  const handleAddProduct = (newProduct) => {
    setProducts(prev => [...prev, newProduct]);
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

  if(!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Add the popup component */}
      {showAddPopup && (
        <AddTransaction
          onClose={() => setShowAddPopup(false)}
          onSubmit={handleAddProduct}
        />
      )}
      
      {/* Sidebar */}
      <div className="hidden w-64 border-r bg-background p-6 lg:block">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-full bg-purple-600" />
          <div>
            <h3 className="font-medium">Naman Verma</h3>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium">MENU</h4>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-100">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-600">
                <History className="h-4 w-4" />
                History
              </button>
            </div>
          </div>

          <div className="px-2 py-1">
            <h4 className="mb-2 text-sm font-medium">ACCOUNT</h4>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-600">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="December income" value="$287,000" change="+16.24%" changeType="positive" />
              <Card title="December sales" value="4.5k" change="-0.85%" changeType="negative" />
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Current Month Report</h2>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-gray-100 rounded-md">Download</button>
                    <button 
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md"
                      onClick={() => setShowAddPopup(true)} // Add click handler
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
              <div className="px-6 pb-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-2">LABEL</th>
                      <th className="pb-2">AMOUNT</th>
                      <th className="pb-2">CATEGORY</th>
                      <th className="pb-2">DATE ADDED</th>
                      <th className="pb-2">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice((currentPage-1)*itemsPerPage, Math.min((currentPage)*itemsPerPage, indexOfLastItem)).map((product) => (
                      <tr key={product.name} className="border-t">
                        <td className="py-3 font-medium">{product.name}</td>
                        <td className="py-3">{product.stock}</td>
                        <td className="py-3">{product.sold}</td>
                        <td className="py-3">{product.date}</td>
                        <td className="py-3 flex items-center gap-3">
                          <button className="text-gray-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">Showing {indexOfFirstItem} to {Math.min(indexOfLastItem, products.length)} of {products.length} entries</div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrevPage}
                      className="px-3 py-1 text-sm border rounded-md"
                      disabled={currentPage === 1}>Prev</button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 text-sm rounded-md ${currentPage === index + 1 ? "bg-purple-600 text-white" : "border"}`}
                      >
                        {index+1}
                      </button>
                    ))}
                    <button 
                    onClick={handleNextPage}
                      className="px-3 py-1 text-sm border rounded-md"
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
  )
}

function Card({ title, value, change, changeType }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 outline outline-1 outline-gray-300">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-4 h-[80px] w-full bg-purple-50 rounded-md" />
      <div className="mt-2 flex items-center gap-2">
        <div
          className={`text-xs px-2 py-0.5 rounded ${changeType === "positive" ? "text-purple-600 bg-purple-50" : "text-red-600 bg-red-50"}`}
        >
          {change}
        </div>
      </div>
    </div>
  )
}