import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const SalesForm = () => {
  const routeName = localStorage.getItem("routeName");
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState({
    initial: true,
    submitting: false
  });
  const [isPaymentOnly, setIsPaymentOnly] = useState(false);
  
  const [formData, setFormData] = useState({
    id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
    customerId: "",
    customerData: null,
    productId: "",
    productData: null,
    salesQuantity: "",
    emptyQuantity: "",
    todayCredit: 0,
    totalAmountReceived: "",
    totalBalance: 0,
    previousBalance: 0,
    date: new Date().toISOString().split('T')[0],
    route: routeName,
    customPrice: null,
    type: "sale" // 'sale' or 'payment'
  });

  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true }));
        
        // 1. Fetch customers
        const customersQuery = query(
          collection(db, "customers"),
          // where("route", "==", routeName)
        );
        const customersSnapshot = await getDocs(customersQuery);
        
        const customersData = customersSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        console.log("Fetched customers:", customersData);
        setCustomers(customersData);
        
        // 2. Fetch products
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsData);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error(`Error loading data: ${err.message}`);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };
    
    if (routeName) {
      fetchData();
    } else {
      toast.error("Route information not found. Please login again.");
    }
  }, [routeName]);

  // Toggle between sale and payment mode
  const togglePaymentOnly = () => {
    setIsPaymentOnly(!isPaymentOnly);
    if (!isPaymentOnly) {
      // When switching to payment only mode, reset product-related fields
      setSelectedProduct(null);
      setFormData(prev => ({
        ...prev,
        productId: "",
        productData: null,
        salesQuantity: "",
        emptyQuantity: "",
        todayCredit: 0,
        type: "payment",
        totalBalance: (prev.previousBalance || 0) - (prev.totalAmountReceived || 0)
      }));
    } else {
      // When switching back to sale mode, reset to defaults
      setFormData(prev => ({
        ...prev,
        salesQuantity: 1,
        type: "sale",
        totalBalance: (prev.previousBalance || 0) + (prev.todayCredit || 0) - (prev.totalAmountReceived || 0)
      }));
    }
  };

  // Format customers for dropdown
  const customerOptions = customers.map(customer => ({
    value: customer.id || customer.docId,
    label: `${customer.name} (${customer.phone}) - Balance: ₹${customer.currentBalance || 0} - Cylinders: ${customer.currentGasOnHand || 0}`,
    customer
  }));

  // Format products for dropdown
  const productOptions = products.map(product => ({
    value: product.id || product.docId,
    label: `${product.name} (₹${product.price})`,
    product
  }));

  // Handle customer selection
  const handleCustomerChange = (selectedOption) => {
    if (selectedOption) {
      const customer = selectedOption.customer;
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId: selectedOption.value,
        customerData: customer,
        previousBalance: customer.currentBalance || 0,
        totalBalance: (customer.currentBalance || 0) + (prev.todayCredit || 0) - (prev.totalAmountReceived || 0)
      }));
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({
        ...prev,
        customerId: "",
        customerData: null,
        previousBalance: 0,
        totalBalance: (prev.todayCredit || 0) - (prev.totalAmountReceived || 0),
        customPrice: null
      }));
    }
  };

  // Handle product selection
  const handleProductChange = (selectedOption) => {
    if (selectedOption) {
      const product = selectedOption.product;
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        productId: selectedOption.value,
        productData: product,
        customPrice: null,
        todayCredit: (prev.customPrice || product.price) * (prev.salesQuantity || 0),
        totalBalance: (prev.previousBalance || 0) + ((prev.customPrice || product.price) * (prev.salesQuantity || 0)) - (prev.totalAmountReceived || 0)
      }));
    } else {
      setSelectedProduct(null);
      setFormData(prev => ({
        ...prev,
        productId: "",
        productData: null,
        customPrice: null,
        todayCredit: 0,
        totalBalance: (prev.previousBalance || 0) - (prev.totalAmountReceived || 0)
      }));
    }
  };

  // Handle custom price change
  const handleCustomPriceChange = (e) => {
    const { value } = e.target;
    const price = parseFloat(value) || 0;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        customPrice: price > 0 ? price : null,
        todayCredit: price > 0 ? price * (prev.salesQuantity || 0) : (selectedProduct?.price || 0) * (prev.salesQuantity || 0)
      };
      
      updatedData.totalBalance = (updatedData.previousBalance || 0) + 
                               (updatedData.todayCredit || 0) - 
                               (updatedData.totalAmountReceived || 0);
      
      return updatedData;
    });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "salesQuantity" || name === "emptyQuantity" || name === "totalAmountReceived" 
      ? parseInt(value) || 0
      : value;
    
    setFormData(prev => {
      const updatedData = { ...prev, [name]: newValue };
      
      // Recalculate balances when relevant fields change
      if (name === "salesQuantity" || name === "totalAmountReceived" || name === "emptyQuantity") {
        const currentPrice = prev.customPrice || selectedProduct?.price || 0;
        updatedData.todayCredit = isPaymentOnly ? 0 : currentPrice * (updatedData.salesQuantity || 0);
        updatedData.totalBalance = (updatedData.previousBalance || 0) + 
                                 (updatedData.todayCredit || 0) - 
                                 (updatedData.totalAmountReceived || 0);
      }
      
      return updatedData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      // Validate form
      if (!formData.customerId) throw new Error("Please select a customer");
      
      if (!isPaymentOnly) {
        // Validate sale-specific fields
        if (!formData.productId) throw new Error("Please select a product");
        if (formData.salesQuantity < 1) throw new Error("Sales quantity must be at least 1");
      }

      // Prepare transaction document
      const transactionData = {
        ...formData,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        type: isPaymentOnly ? "payment" : "sale",
        routeName: routeName,
        timestamp: new Date(),
        status: "completed"
      };

      // Add product details if it's a sale
      if (!isPaymentOnly) {
        const actualPrice = formData.customPrice || selectedProduct.price;
        transactionData.productName = selectedProduct.name;
        transactionData.productPrice = actualPrice;
        transactionData.baseProductPrice = selectedProduct.price;
        transactionData.isCustomPrice = formData.customPrice !== null;
      }

      // Add transaction record
      await addDoc(collection(db, "sales"), transactionData);
      
      // Update customer document
      const customerQuery = query(
        collection(db, "customers"),
        where("id", "==", formData.customerId)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerDocRef = customerSnapshot.docs[0].ref;
        await updateDoc(customerDocRef, {
          currentBalance: formData.totalBalance,
          currentGasOnHand: isPaymentOnly 
            ? (selectedCustomer.currentGasOnHand || 0) 
            : (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity,
          lastPurchaseDate: new Date()
        });
      }

      // Reset form
      setFormData({
        id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
        customerId: "",
        customerData: null,
        productId: "",
        productData: null,
        salesQuantity: isPaymentOnly ? 0 : 1,
        emptyQuantity: 0,
        todayCredit: 0,
        totalAmountReceived: 0,
        totalBalance: 0,
        previousBalance: 0,
        date: new Date().toISOString().split('T')[0],
        route: routeName,
        customPrice: null,
        type: isPaymentOnly ? "payment" : "sale"
      });
      setSelectedProduct(null);
      setSelectedCustomer(null);
      
      toast.success(isPaymentOnly ? "Payment recorded successfully!" : "Sale recorded successfully!");
    } catch (err) {
      console.error("Error processing transaction:", err);
      toast.error(err.message);
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  if (!routeName) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h2>Route Information Missing</h2>
          <p>Please login again to access the sales form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-2">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 className="mb-0">{isPaymentOnly ? "Payment" : "New Sale"}</h2>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="paymentToggle"
              checked={isPaymentOnly}
              onChange={togglePaymentOnly}
            />
            <label className="form-check-label" htmlFor="paymentToggle">
              {isPaymentOnly ? "Switch to Sale Mode" : "Switch to Payment Mode"}
            </label>
          </div>
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Transaction ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.id}
                  readOnly
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Route</label>
                <input
                  type="text"
                  className="form-control"
                  value={routeName}
                  readOnly
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label">Customer</label>
                <Select
                  options={customerOptions}
                  value={customerOptions.find(option => option.value === formData.customerId)}
                  onChange={handleCustomerChange}
                  placeholder="Select Customer"
                  isClearable
                  isSearchable
                  isLoading={loading.initial}
                  noOptionsMessage={() => "No customers found"}
                  classNamePrefix="select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: '#ced4da',
                      '&:hover': {
                        borderColor: '#ced4da'
                      }
                    })
                  }}
                />
              </div>
            </div>
            
            {selectedCustomer && (
              <div className="alert alert-info mb-3">
                <div className="row">
                  <div className="col-md-4">
                    <p><strong>Current Balance:</strong> ₹{selectedCustomer.currentBalance || 0}</p>
                  </div>
                  <div className="col-md-4">
                    <p><strong>Cylinders On Hand:</strong> {selectedCustomer.currentGasOnHand || 0}</p>
                  </div>
                  <div className="col-md-4">
                    <p><strong>New Balance After Transaction:</strong> ₹{formData.totalBalance}</p>
                  </div>
                </div>
              </div>
            )}
            
            {!isPaymentOnly && (
              <>
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Product</label>
                    <Select
                      options={productOptions}
                      value={productOptions.find(option => option.value === formData.productId)}
                      onChange={handleProductChange}
                      placeholder="Select Product"
                      isClearable
                      isSearchable
                      isLoading={loading.initial}
                      noOptionsMessage={() => "No products found"}
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '38px',
                          borderColor: '#ced4da',
                          '&:hover': {
                            borderColor: '#ced4da'
                          }
                        })
                      }}
                    />
                  </div>
                </div>
                
                {selectedProduct && (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Base Price (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={selectedProduct.price}
                          readOnly
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">
                          Custom Price (₹) {formData.customPrice !== null && (
                            <span className="badge bg-warning text-dark">Custom</span>
                          )}
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="customPrice"
                          value={formData.customPrice || ''}
                          onChange={handleCustomPriceChange}
                          placeholder="Enter custom price"
                          min="0"
                          step="0.01"
                          disabled={loading.submitting}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">Actual Price (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.customPrice || selectedProduct.price}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Sales Quantity</label>
                        <input
                          type="number"
                          className="form-control"
                          name="salesQuantity"
                          value={formData.salesQuantity}
                          onChange={handleChange}
                          
                          
                          disabled={loading.submitting}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">Empty Cylinders Returned</label>
                        <input
                          type="number"
                          className="form-control"
                          name="emptyQuantity"
                          value={formData.emptyQuantity}
                          onChange={handleChange}
                          disabled={loading.submitting}
                        />
                        <small className="text-muted">Can be any number (negative values allowed)</small>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Today's Credit (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.todayCredit}
                  readOnly
                  disabled={isPaymentOnly}
                />
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Previous Balance (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.previousBalance}
                  readOnly
                />
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Amount Received (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  name="totalAmountReceived"
                  value={formData.totalAmountReceived}
                  onChange={handleChange}
                  min="0"
                  disabled={loading.submitting}
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">New Balance (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.totalBalance}
                  readOnly
                />
              </div>
              
              {!isPaymentOnly && (
                <div className="col-md-6">
                  <label className="form-label">New Cylinder Count</label>
                  <input
                    type="number"
                    className="form-control"
                    value={
                      selectedCustomer 
                        ? (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity
                        : 0
                    }
                    readOnly
                  />
                  <small className="text-muted">May be negative if returning more than current</small>
                </div>
              )}
            </div>
            
            <div className="d-grid gap-2 mt-4">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg mb-5"
                disabled={loading.submitting || !selectedCustomer || (!isPaymentOnly && !selectedProduct)}
              >
                {loading.submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : isPaymentOnly ? "Record Payment" : "Record Sale"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;