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
  const [isPaymentOnly, setIsPaymentOnly] = useState(false);
  const [todayTotalSale, setTodayTotalSale] = useState(0);
  const [loadingTodaySale, setLoadingTodaySale] = useState(true);
  const [todaySaleAmount, setTodaySaleAmount] = useState(0);
  
  const [formData, setFormData] = useState({
    id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
    customerId: "",
    customerData: null,
    productId: "",
    productData: null,
    salesQuantity: 0,
    emptyQuantity: 0,
    todayCredit: 0,
    totalAmountReceived: 0,
    totalBalance: 0,
    previousBalance: 0,
    date: new Date().toISOString().split('T')[0],
    route: routeName,
    customPrice: null,
    transactionType: "sale" // 'sale' or 'payment'
  });

  // Fetch today's total sales amount
  useEffect(() => {
    const fetchTodayTotalSale = async () => {
      setLoadingTodaySale(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const salesQuery = query(
          collection(db, "sales"),
          where("date", "==", today),
          where("transactionType", "==", "sale")
        );
        const snapshot = await getDocs(salesQuery);
        let total = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const price = data.productPrice || 0;
          const qty = data.salesQuantity || 0;
          total += price * qty;
        });
        setTodayTotalSale(total);
      } catch (err) {
        setTodayTotalSale(0);
      }
      setLoadingTodaySale(false);
    };
    fetchTodayTotalSale();
  }, []);

  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch customers
        const customersQuery = query(
          collection(db, "customers"),
          where("route", "==", routeName)
        );
        const customersSnapshot = await getDocs(customersQuery);
        
        const customersData = customersSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
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
      }
    };
    
    if (routeName) {
      fetchData();
    } else {
      toast.error("Route information not found. Please login again.");
    }
  }, [routeName]);

  // Update customer details when customerId changes
  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c.id === formData.customerId || c.docId === formData.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerData: customer,
          previousBalance: customer.currentBalance || 0,
          totalBalance: (customer.currentBalance || 0) + (prev.todayCredit || 0) - (prev.totalAmountReceived || 0)
        }));
      }
    }
  }, [formData.customerId, customers]);

  // Update product details when productId changes
  useEffect(() => {
    if (formData.productId && !isPaymentOnly) {
      const product = products.find(p => p.id === formData.productId || p.docId === formData.productId);
      if (product) {
        setSelectedProduct(product);
        setFormData(prev => ({
          ...prev,
          productData: product,
          todayCredit: (prev.customPrice || product.price) * (prev.salesQuantity || 0),
          totalBalance: (prev.previousBalance || 0) + ((prev.customPrice || product.price) * (prev.salesQuantity || 0)) - (prev.totalAmountReceived || 0)
        }));
      }
    }
  }, [formData.productId, products, isPaymentOnly]);

  // Calculate balances when relevant fields change
  useEffect(() => {
    if ((selectedProduct && formData.salesQuantity) || isPaymentOnly) {
      const currentPrice = isPaymentOnly ? 0 : (formData.customPrice || selectedProduct?.price || 0);
      const saleQty = Number(formData.salesQuantity || 0);
      const amountReceived = Number(formData.totalAmountReceived) || 0;
      const saleAmount = isPaymentOnly ? 0 : currentPrice * saleQty;
      const todayCredit = saleAmount - amountReceived;
      const previousBalance = Number(formData.previousBalance) || 0;
      const totalBalance = previousBalance + todayCredit;
      
      setTodaySaleAmount(saleAmount);

      setFormData(prev => ({
        ...prev,
        todayCredit,
        totalBalance
      }));
    }
  }, [selectedProduct, formData.salesQuantity, formData.totalAmountReceived, formData.previousBalance, formData.customPrice, isPaymentOnly]);

  // Toggle between sale and payment mode
  const togglePaymentMode = () => {
    setIsPaymentOnly(!isPaymentOnly);
    setFormData(prev => ({
      ...prev,
      transactionType: !isPaymentOnly ? "payment" : "sale",
      productId: !isPaymentOnly ? "" : prev.productId,
      productData: !isPaymentOnly ? null : prev.productData,
      salesQuantity: !isPaymentOnly ? 0 : prev.salesQuantity,
      emptyQuantity: !isPaymentOnly ? 0 : prev.emptyQuantity,
      todayCredit: !isPaymentOnly ? 0 : prev.todayCredit,
      customPrice: !isPaymentOnly ? null : prev.customPrice
    }));
    
    if (!isPaymentOnly) {
      setSelectedProduct(null);
    }
  };

  // Format customers for dropdown
  const customerOptions = customers.map(customer => ({
    value: customer.id || customer.docId,
    label: `${customer.name} (${customer.phone}) - Balance: ₹${customer.currentBalance || 0} - Gas: ${customer.currentGasOnHand || 0}`,
    data: customer
  }));

  // Format products for dropdown
  const productOptions = products.map(product => ({
    value: product.id || product.docId,
    label: `${product.name} (₹${product.price})`,
    data: product
  }));

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "salesQuantity" || name === "emptyQuantity" || name === "totalAmountReceived" || name === "customPrice"
        ? Number(value) || 0 
        : value 
    }));
  };

  // Handle custom price change
  const handleCustomPriceChange = (e) => {
    if (isPaymentOnly) return;
    
    const { value } = e.target;
    const price = parseFloat(value) || 0;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        customPrice: price > 0 ? price : null,
        todayCredit: price > 0 ? price * (prev.salesQuantity || 0) : (selectedProduct?.price || 0) * (prev.salesQuantity || 0)
      };
      
      updatedData.totalBalance = (updatedData.previousBalance || 0) + 
                               updatedData.todayCredit - 
                               (updatedData.totalAmountReceived || 0);
      
      return updatedData;
    });
  };

  // Handle customer selection
  const handleCustomerChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      customerId: selectedOption ? selectedOption.value : "",
      customerData: selectedOption ? selectedOption.data : null,
      customPrice: null
    }));
  };

  // Handle product selection
  const handleProductChange = (selectedOption) => {
    if (isPaymentOnly) return;
    
    setFormData(prev => ({
      ...prev,
      productId: selectedOption ? selectedOption.value : "",
      productData: selectedOption ? selectedOption.data : null,
      customPrice: null
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (!isPaymentOnly && !selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    if (!isPaymentOnly && formData.salesQuantity <= 0) {
      toast.error("Sales quantity must be greater than 0");
      return;
    }

    try {
      // Prepare transaction data
      const transactionData = {
        ...formData,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        routeName: routeName,
        timestamp: new Date(),
        transactionType: isPaymentOnly ? "payment" : "sale"
      };

      // Add product details if it's a sale
      if (!isPaymentOnly) {
        const actualPrice = formData.customPrice || selectedProduct.price;
        transactionData.productName = selectedProduct.name;
        transactionData.productPrice = actualPrice;
        transactionData.baseProductPrice = selectedProduct.price;
        transactionData.isCustomPrice = formData.customPrice !== null;
      } else {
        // For payments, clear product-related fields
        transactionData.productName = "";
        transactionData.productPrice = 0;
        transactionData.baseProductPrice = 0;
        transactionData.isCustomPrice = false;
        transactionData.salesQuantity = 0;
        transactionData.emptyQuantity = 0;
        transactionData.todayCredit = 0;
      }

      // Add transaction to sales collection
      await addDoc(collection(db, "sales"), transactionData);
      
      // Update customer document
      const customerQuery = query(
        collection(db, "customers"),
        where("id", "==", formData.customerId)
      );
      
      const querySnapshot = await getDocs(customerQuery);
      if (!querySnapshot.empty) {
        const customerDocRef = querySnapshot.docs[0].ref;
        await updateDoc(customerDocRef, {
          currentBalance: formData.totalBalance,
          currentGasOnHand: isPaymentOnly 
            ? (selectedCustomer.currentGasOnHand || 0)
            : (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity,
          lastPurchaseDate: new Date()
        });
      }
      
      toast.success(isPaymentOnly ? "Payment recorded successfully!" : "Sale recorded successfully!");
      
      // Reset form
      setFormData({
        id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
        customerId: "",
        customerData: null,
        productId: "",
        productData: null,
        salesQuantity: 0,
        emptyQuantity: 0,
        todayCredit: 0,
        totalAmountReceived: 0,
        totalBalance: 0,
        previousBalance: 0,
        date: new Date().toISOString().split('T')[0],
        route: routeName,
        customPrice: null,
        transactionType: isPaymentOnly ? "payment" : "sale"
      });
      setSelectedProduct(null);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error(`Error recording ${isPaymentOnly ? "payment" : "sale"}: ${error.message}`);
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
      
      <div style={{ marginBottom: 16, padding: 8, background: "#f5f5f5", borderRadius: 6 }}>
        <strong>Today's Total Sale Amount: </strong>
        {loadingTodaySale ? "Loading..." : `₹${todayTotalSale}`}
      </div>
      
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 className="mb-0">{isPaymentOnly ? "Payment" : "New Sale"}</h2>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="paymentToggle"
              checked={isPaymentOnly}
              onChange={togglePaymentMode}
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
                          required
                          min="1"
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
                          required
                          min="0"
                        />
                        <small className="text-muted">Current on hand: {selectedCustomer?.currentGasOnHand || 0}</small>
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">Today Sale Amount (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={todaySaleAmount}
                          readOnly
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">Today Credit (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="todayCredit"
                          value={formData.todayCredit}
                          readOnly
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">New Gas On Hand After Sale</label>
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
                        <small className="text-muted">Can be negative if returning more than currently has</small>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Previous Balance (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  name="previousBalance"
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
                  required
                  min="0"
                />
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Total Balance (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  name="totalBalance"
                  value={formData.totalBalance}
                  readOnly
                />
              </div>
            </div>
            
            <div className="d-grid gap-2 mt-4">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg mb-5"
                disabled={!selectedCustomer || (!isPaymentOnly && !selectedProduct)}
              >
                {isPaymentOnly ? "Record Payment" : "Record Sale"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;