import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Button
} from "@mui/material";
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { FiEye, FiPhone, FiDollarSign, FiPackage, FiHash, FiRepeat, FiCreditCard } from "react-icons/fi";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [todayTotalSaleAmount, setTodayTotalSaleAmount] = useState(0);
  const [todayTotalReceived, setTodayTotalReceived] = useState(0);
  const [todayTotalCredit, setTodayTotalCredit] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedRouteName = localStorage.getItem("routeName");
        if (!storedRouteName) {
          throw new Error("Route name not found in localStorage");
        }
        setRouteName(storedRouteName);

        const today = format(new Date(), 'yyyy-MM-dd');
        const salesRef = collection(db, "sales");
        const q = query(
          salesRef,
          where("route", "==", storedRouteName),
          where("date", "==", today)
        );

        const querySnapshot = await getDocs(q);
        const salesData = [];
        let totalSaleValue = 0;
        let totalReceived = 0;
        let totalCredit = 0;

        querySnapshot.forEach(doc => {
          const data = doc.data();
          const price = data.productPrice || data.productData?.price || 0;
          const qty = data.salesQuantity || 0;
          const saleAmount = price * qty;
          
          const sale = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            todayCredit: data.todayCredit || 0,
            totalAmountReceived: data.totalAmountReceived || 0,
            totalBalance: data.totalBalance || 0,
            previousBalance: data.previousBalance || 0,
            saleAmount: saleAmount
          };

          if (data.type === 'sale' || data.transactionType === 'sale') {
            totalSaleValue += saleAmount;
            totalCredit += (saleAmount - (data.totalAmountReceived || 0));
          }
          totalReceived += data.totalAmountReceived || 0;

          salesData.push(sale);
        });

        setTodaySales(salesData);
        setTodayTotalSaleAmount(totalSaleValue);
        setTodayTotalReceived(totalReceived);
        setTodayTotalCredit(totalCredit);
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError(err.message || "Failed to load today's sales");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals
  const totalSalesQty = todaySales.reduce((sum, sale) => 
    (sale.type === 'sale' || sale.transactionType === 'sale') ? sum + (sale.salesQuantity || 0) : sum, 0);
  
  const totalEmptyQty = todaySales.reduce((sum, sale) => 
    (sale.type === 'sale' || sale.transactionType === 'sale') ? sum + (sale.emptyQuantity || 0) : sum, 0);
  
  const totalTransactions = todaySales.length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(date, 'hh:mm a');
  };

  const handleViewDetails = (sale) => {
    navigate(`/sales/${sale.id}`, { state: { sale } });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2, backgroundColor: 'error.light', color: 'white' }}>
        {error}
      </Paper>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Summary Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Today's Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Route: {routeName} | {format(new Date(), 'MMMM do, yyyy')}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
              <Typography variant="subtitle2" color="textSecondary">Total Sales Value</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatCurrency(todayTotalSaleAmount)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #2196f3' }}>
              <Typography variant="subtitle2" color="textSecondary">Total Received</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatCurrency(todayTotalReceived)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #ff9800' }}>
              <Typography variant="subtitle2" color="textSecondary">Total Credit</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatCurrency(todayTotalCredit)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, borderLeft: '4px solid #9c27b0' }}>
              <Typography variant="subtitle2" color="textSecondary">Transactions</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalTransactions}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Transactions List */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
        Recent Transactions ({todaySales.length})
      </Typography>

      {todaySales.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
          <Typography variant="body1">No transactions recorded for today</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {todaySales.map((sale) => (
            <Grid item xs={12} sm={6} md={4} key={sale.id}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {sale.customerName || sale.customerData?.name}
                    </Typography>
                    <Chip
                      label={sale.type === 'payment' || sale.transactionType === 'payment' ? 'Payment' : 'Sale'}
                      size="small"
                      color={sale.type === 'payment' || sale.transactionType === 'payment' ? 'success' : 'primary'}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <FiPhone size={14} style={{ marginRight: 4 }} />
                    {sale.customerPhone || sale.customerData?.phone} • {formatDate(sale.timestamp)}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  {(sale.type === 'sale' || sale.transactionType === 'sale') && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          <FiPackage size={14} style={{ marginRight: 4 }} />
                          Product
                        </Typography>
                        <Typography variant="body2">
                          {sale.productName || sale.productData?.name}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          <FiHash size={14} style={{ marginRight: 4 }} />
                          Quantity
                        </Typography>
                        <Typography variant="body2">{sale.salesQuantity}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          <FiDollarSign size={14} style={{ marginRight: 4 }} />
                          Sale Amount
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatCurrency(sale.saleAmount)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="textSecondary">
                          <FiRepeat size={14} style={{ marginRight: 4 }} />
                          Empty Returned
                        </Typography>
                        <Typography variant="body2">{sale.emptyQuantity}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </>
                  )}

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      <FiDollarSign size={14} style={{ marginRight: 4 }} />
                      Amount Received
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(sale.totalAmountReceived)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      <FiCreditCard size={14} style={{ marginRight: 4 }} />
                      Credit
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: (sale.saleAmount - sale.totalAmountReceived) > 0 ? 'warning.main' : 'success.main'
                      }}
                    >
                      {formatCurrency(sale.saleAmount - sale.totalAmountReceived)}
                    </Typography>
                  </Box>

                  {/* <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">
                      Balance
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: sale.totalBalance < 0 ? 'error.main' : 'success.main'
                      }}
                    >
                      {formatCurrency(sale.totalBalance)}
                    </Typography>
                  </Box> */}

                  <Box mt={2} display="flex" justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FiEye />}
                      onClick={() => handleViewDetails(sale)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;