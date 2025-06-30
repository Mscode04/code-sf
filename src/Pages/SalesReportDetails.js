import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiPhone, FiMapPin, FiPackage, FiDollarSign, FiCalendar, FiCreditCard } from "react-icons/fi";
import './SalesReportDetails.css';

const SalesReportDetails = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const sale = state?.sale;

  // Formatting functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const options = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return new Date(date).toLocaleString('en-IN', options);
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    const cleaned = `${phone}`.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  };

  if (!sale) {
    return (
      <div className="error-container">
        <h2>Sale Not Found</h2>
        <p>The requested sale record could not be loaded.</p>
        <button onClick={() => navigate(-1)} className="action-button">
          Back to Sales
        </button>
      </div>
    );
  }

  return (
    <div className="details-container">
      <header className="details-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FiArrowLeft size={20} />
        </button>
        <h1>Sale Details</h1>
      </header>

      <main className="details-content">
        {/* Customer Section */}
        <section className="details-card">
          <div className="section-header">
            <FiUser className="section-icon" />
            <h2>Customer</h2>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Name</span>
            <span className="detail-value">{sale.customerData?.name || 'N/A'}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-value phone-value">
              <FiPhone className="inline-icon" />
              {formatPhoneNumber(sale.customerData?.phone)}
            </span>
          </div>
          
          <div className="detail-item address-item">
            <span className="detail-label">Address</span>
            <span className="detail-value address-value">
              <FiMapPin className="inline-icon" />
              <span className="address-text">
                {sale.customerData?.address || sale.customerAddress || 'N/A'}
              </span>
            </span>
          </div>
        </section>

        {/* Other sections remain the same... */}
        {/* Product Section */}
        <section className="details-card">
          <div className="section-header">
            <FiPackage className="section-icon" />
            <h2>Product</h2>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Name</span>
            <span className="detail-value">{sale.productData?.name || 'N/A'}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Price</span>
            <span className="detail-value">{formatCurrency(sale.productPrice)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Quantity Sold</span>
            <span className="detail-value">{sale.salesQuantity}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Empty Returned</span>
            <span className="detail-value">{sale.emptyQuantity}</span>
          </div>
        </section>

        {/* Transaction Section */}
        <section className="details-card highlight-card">
          <div className="section-header">
            <FiDollarSign className="section-icon" />
            <h2>Transaction</h2>
          </div>
          
          <div className="detail-item highlight">
            <span className="detail-label">Total Amount</span>
            <span className="detail-value">{formatCurrency(sale.totalAmountReceived)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Credit</span>
            <span className="detail-value">{formatCurrency(sale.todayCredit)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Date & Time</span>
            <span className="detail-value">
              <FiCalendar className="inline-icon" />
              {formatDate(sale.timestamp)}
            </span>
          </div>
        </section>

        {/* Balance Section */}
        <section className="details-card mb-5">
          <div className="section-header">
            <FiCreditCard className="section-icon" />
            <h2>Balance</h2>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Current Balance</span>
            <span className="detail-value">{formatCurrency(sale.customerData?.currentBalance)}</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SalesReportDetails;