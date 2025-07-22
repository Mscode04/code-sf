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
  Button,
  IconButton
} from "@mui/material";
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";

const Dashboard = () => {
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeName, setRouteName] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        const storedRouteName = localStorage.getItem("routeName");
        if (!storedRouteName) {
          throw new Error("Route name not found in localStorage");
        }
        setRouteName(storedRouteName);

        const today = new Date();
        const todayDateString = format(today, 'yyyy-MM-dd');

        const salesRef = collection(db, "sales");
        const q = query(
          salesRef,
          where("routeName", "==", storedRouteName),
          where("date", "==", todayDateString)
        );

        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, // Firebase document ID
            customerName: data.customerName || "",
            customerPhone: data.customerPhone || "",
            productName: data.productName || "",
            productPrice: data.productPrice || 0,
            salesQuantity: data.salesQuantity || 0,
            emptyQuantity: data.emptyQuantity || 0,
            todayCredit: data.todayCredit || 0,
            totalAmountReceived: data.totalAmountReceived || 0,
            totalBalance: data.totalBalance || 0,
            status: data.status || "completed",
            date: data.date || todayDateString,
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });

        setTodaySales(salesData);
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError(err.message || "Failed to load today's sales");
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySales();
  }, []);



  // Calculate totals
  const totalSalesQty = todaySales.reduce((sum, sale) => sum + (sale.salesQuantity || 0), 0);
  const totalEmptyQty = todaySales.reduce((sum, sale) => sum + (sale.emptyQuantity || 0), 0);
  const totalCreditAmount = todaySales.reduce((sum, sale) => sum + (sale.todayCredit || 0), 0);
  const totalAmountReceived = todaySales.reduce((sum, sale) => sum + (sale.totalAmountReceived || 0), 0);
  const totalBalance = todaySales.reduce((sum, sale) => sum + (sale.totalBalance || 0), 0);
  const reportCount = todaySales.length;

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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Today's Sales
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Route: {routeName} | {format(new Date(), 'MMMM do, yyyy')}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2, borderLeft: `4px solid ${theme.palette.success.main}` }}>
            <Typography variant="subtitle2" color="textSecondary">Received</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{totalAmountReceived.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Sales</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{reportCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Sales Qty</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalSalesQty}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Empty Qty</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalEmptyQty}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
            <Typography variant="subtitle2" color="textSecondary">Credit</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{totalCreditAmount.toLocaleString()}</Typography>
          </Paper>
        </Grid>

        {/* <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', borderRadius: 2, borderLeft: `4px solid ${theme.palette.error.main}` }}>
            <Typography variant="subtitle2" color="textSecondary">Balance</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{totalBalance.toLocaleString()}</Typography>
          </Paper>
        </Grid> */}
      </Grid>

      {/* Sales Cards */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
        Transaction Records ({todaySales.length})
      </Typography>

      {todaySales.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
          <Typography variant="body1">No sales recorded for today</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} className="mb-5">
          {todaySales.map((sale) => (
            <Grid item xs={12} sm={6} md={4} key={sale.id}>
              <Card
                elevation={3}

                sx={{
                  borderRadius: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6]
                  }
                }}
              >
                <CardContent className="cursor-pointer">
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {sale.customerName}
                    </Typography>
                    <Chip
                      label={sale.status}
                      size="small"
                      color={sale.status === 'completed' ? 'success' : 'warning'}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {sale.customerPhone} • {format(sale.timestamp, 'hh:mm a')}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Product</Typography>
                      <Typography variant="body1">{sale.productName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Price</Typography>
                      <Typography variant="body1">₹{sale.productPrice}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Quantity</Typography>
                      <Typography variant="body1">{sale.salesQuantity}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Empty</Typography>
                      <Typography variant="body1">{sale.emptyQuantity}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="textSecondary">Received</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ₹{sale.totalAmountReceived.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2" color="textSecondary">
                        Credit
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: (sale.todayCredit - sale.totalAmountReceived) > 0
                            ? theme.palette.warning.main
                            : 'text.primary'
                        }}
                      >
                        ₹{(sale.todayCredit - sale.totalAmountReceived).toLocaleString()}
                      </Typography>
                    </Box>

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