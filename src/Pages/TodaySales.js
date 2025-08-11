import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";
import { useNavigate } from "react-router-dom";
import "./SalesReports.css";
import { FiSearch } from "react-icons/fi";

const SalesReports = () => {
  const routeName = localStorage.getItem("routeName");
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const navigate = useNavigate();

  // Formatting functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = `${phone}`.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  const fetchSales = async () => {
    try {
      if (!routeName) {
        throw new Error("Route information not found. Please login again.");
      }

      setLoading(true);
      setError(null);
      setIsIndexBuilding(false);

      // Calculate date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Try with indexed query first
      let salesQuery;
      let salesData = [];
      
      try {
        salesQuery = query(
          collection(db, "sales"),
          where("routeName", "==", routeName),
          where("timestamp", ">=", today),
          where("timestamp", "<", tomorrow)
        );
        
        const querySnapshot = await getDocs(salesQuery);
        salesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
      } catch (err) {
        if (err.code === 'failed-precondition') {
          // Index is building, fallback to client-side filtering
          setIsIndexBuilding(true);
          
          const fallbackQuery = query(
            collection(db, "sales"),
            where("routeName", "==", routeName)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          salesData = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          }));
          
          // Filter by date manually
          salesData = salesData.filter(sale => {
            return sale.timestamp >= today && sale.timestamp < tomorrow;
          });
        } else {
          throw err;
        }
      }

      salesData.sort((a, b) => b.timestamp - a.timestamp);
      setSales(salesData);
      setFilteredSales(salesData);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [routeName]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSales(sales);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = sales.filter(sale => 
        (sale.customerData?.name?.toLowerCase().includes(term)) ||
        (sale.customerData?.phone?.includes(term)) ||
        (sale.customerData?.ownerName?.toLowerCase().includes(term)) ||
        (sale.productData?.name?.toLowerCase().includes(term))
      );
      setFilteredSales(filtered);
    }
  }, [searchTerm, sales]);

  const handleCardClick = (docId) => {
    const sale = sales.find(s => s.id === docId);
    navigate(`/sales/${docId}`, { state: { sale } });
  };

  if (!routeName) {
    return (
      <div className="error-container">
        <h2>Route Information Missing</h2>
        <p>Please login again to access sales reports.</p>
        <button onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading sales data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        {error.includes("index") && (
          <p>The query requires an index. Please try again later.</p>
        )}
      </div>
    );
  }

  return (
    <div className="sales-reports-container">
      <div className="sales-header">
        <div>
          <h1>Today's Sales Report</h1>
          <p>Route: {routeName}</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, phone, owner, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sales Cards */}
      <div className="sales-cards-container mb-5">
        {filteredSales.length > 0 ? (
          <div className="sales-cards-grid">
            {filteredSales.map((sale) => (
              <div 
                key={sale.id} 
                className="sales-card"
                onClick={() => handleCardClick(sale.id)}
              >
                {/* <div className="card-header">
                  <span className="card-time">{formatTime(sale.timestamp)}</span>
                  <span className="card-amount">{formatCurrency(sale.totalAmountReceived)}</span>
                </div> */}
                
                <div className="card-customer">
                  <h3>{sale.customerData?.name || 'Unknown'}</h3>
                  {sale.customerData?.ownerName && (
                    <p className="card-owner">{sale.customerData.ownerName}</p>
                  )}
                  {sale.customerData?.phone && (
                    <p className="card-phone">{formatPhoneNumber(sale.customerData.phone)}</p>
                  )}
                </div>
                
                <div className="card-product">
                  <div className="product-info">
                    <span className="product-name">{sale.productData?.name || 'N/A'}</span>
                    <span className="product-qty">Qty: {sale.salesQuantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>No sales found</h3>
            <p>
              {searchTerm ? "Try adjusting your search" : "No sales recorded for today"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReports;