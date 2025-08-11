import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiPackage, 
  FiDollarSign, 
  FiCalendar, 
  FiCreditCard,
  FiTruck,
  FiHash,
  FiTag,
  FiLayers,
  FiRepeat,
  FiTrendingUp
} from "react-icons/fi";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
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
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h2>Sale Not Found</h2>
          <p>The requested sale record could not be loaded.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-primary"
          >
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-light btn-sm"
          >
            <FiArrowLeft size={18} className="me-1" />
            Back
          </button>
          <h2 className="mb-0">
            {sale.transactionType === 'payment' ? 'Payment' : 'Sale'} Details
          </h2>
          <div className="text-end">
            <small className="text-light">Transaction ID: {sale.id}</small>
          </div>
        </div>
        
        <div className="card-body">
          <div className="row">
            {/* Customer Information */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-light d-flex align-items-center">
                  <FiUser className="me-2" size={18} />
                  <h5 className="mb-0">Customer Information</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-2">
                    <div className="col-4 fw-bold">Name:</div>
                    <div className="col-8">{sale.customerName || sale.customerData?.name || 'N/A'}</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold">Phone:</div>
                    <div className="col-8">
                      <FiPhone className="me-1" size={16} />
                      {formatPhoneNumber(sale.customerPhone || sale.customerData?.phone)}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-4 fw-bold">Address:</div>
                    <div className="col-8">
                      <FiMapPin className="me-1" size={16} />
                      {sale.customerAddress || sale.customerData?.address || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transaction Information */}
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header bg-light d-flex align-items-center">
                  <FiDollarSign className="me-2" size={18} />
                  <h5 className="mb-0">Transaction Information</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-2">
                    <div className="col-4 fw-bold">Date:</div>
                    <div className="col-8">
                      <FiCalendar className="me-1" size={16} />
                      {formatDate(sale.timestamp || sale.date)}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold">Route:</div>
                    <div className="col-8">
                      <FiTruck className="me-1" size={16} />
                      {sale.routeName || sale.route || 'N/A'}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-4 fw-bold">Type:</div>
                    <div className="col-8">
                      {sale.transactionType === 'payment' ? (
                        <span className="badge bg-success">Payment</span>
                      ) : (
                        <span className="badge bg-primary">Sale</span>
                      )}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-4 fw-bold">Amount:</div>
                    <div className="col-8 fw-bold text-success">
                      
                      {formatCurrency(sale.totalAmountReceived)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Information (only for sales) */}
          {sale.transactionType !== 'payment' && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-light d-flex align-items-center">
                    <FiPackage className="me-2" size={18} />
                    <h5 className="mb-0">Product Information</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold">Product Name:</div>
                        <div>
                          <FiTag className="me-1" size={16} />
                          {sale.productName || sale.productData?.name || 'N/A'}
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold">Base Price:</div>
                        <div>
                          
                          {formatCurrency(sale.baseProductPrice || sale.productData?.price)}
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold">Actual Price:</div>
                        <div>
                          
                          {formatCurrency(sale.productPrice)}
                          {sale.isCustomPrice && (
                            <span className="badge bg-warning text-dark ms-2">Custom</span>
                          )}
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold">Quantity:</div>
                        <div>
                          <FiHash className="me-1" size={16} />
                          {sale.salesQuantity}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="fw-bold">Empty Returned:</div>
                        <div>
                          <FiRepeat className="me-1" size={16} />
                          {sale.emptyQuantity}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="fw-bold">Total Credit:</div>
                        <div>
                          
                          {formatCurrency(sale.todayCredit)}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="fw-bold">New Gas Count:</div>
                        <div>
                          <FiLayers className="me-1" size={16} />
                          {(sale.customerData?.currentGasOnHand || 0) - (sale.emptyQuantity || 0) + (sale.salesQuantity || 0)}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="fw-bold">Sale Amount:</div>
                        <div>
                          <FiTrendingUp className="me-1" size={16} />
                          {formatCurrency((sale.productPrice || 0) * (sale.salesQuantity || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Balance Information */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-light d-flex align-items-center">
                  <FiCreditCard className="me-2" size={18} />
                  <h5 className="mb-0">Balance Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="fw-bold">Previous Balance:</div>
                      <div>
                        
                        {formatCurrency(sale.previousBalance || sale.customerData?.currentBalance)}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="fw-bold">Amount Received:</div>
                      <div>
                        
                        {formatCurrency(sale.totalAmountReceived)}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="fw-bold">New Balance:</div>
                      <div className={sale.totalBalance < 0 ? 'text-danger' : 'text-success'}>
                        
                        {formatCurrency(sale.totalBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReportDetails;