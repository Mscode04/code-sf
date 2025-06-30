import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  Typography, 
  Box, 
  Button, 
  CircularProgress, 
  Chip,
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Home as HomeIcon,
  Directions as RouteIcon,
  AttachMoney as BalanceIcon,
  LocalGasStation as GasIcon,
  ArrowBack as BackIcon
} from "@mui/icons-material";

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeName = localStorage.getItem("routeName");
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer using the document ID directly
        const customerDocRef = doc(db, "customers", id);
        const customerDoc = await getDoc(customerDocRef);
        
        if (!customerDoc.exists()) {
          throw new Error("Customer not found");
        }
        
        const customerData = {
          firebaseId: customerDoc.id,
          ...customerDoc.data()
        };
        setCustomer(customerData);
        
        // Fetch sales using document reference
        const salesQuery = query(
          collection(db, "sales"),
          where("customerRef", "==", customerDocRef)
        );
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSales(salesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          fullWidth={isMobile}
        >
          Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4 }}>
      {/* <Button 
        variant="outlined"
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
        fullWidth={isMobile}
      >
        Back
      </Button> */}
      
      {/* Main Customer Card */}
      <Card elevation={3} sx={{ mb: 4 }} className="rounded-3 p-2">
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: isMobile ? 60 : 80,
                height: isMobile ? 60 : 80,
                fontSize: isMobile ? '2rem' : '2.5rem',
                mb: isMobile ? 2 : 0,
                mr: isMobile ? 0 : 3
              }}
            >
              {customer.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {customer.name}
              </Typography>
              <Chip 
                label={routeName || 'No Route Assigned'}
                color="secondary"
                size="small"
                icon={<RouteIcon />}
                sx={{ mb: isMobile ? 1 : 0 }}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Customer Details */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'background.default',
                borderRadius: 2
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'text.secondary'
                }}>
                  Customer Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: 'primary.light',
                        width: 32, 
                        height: 32 
                      }}>
                        <PhoneIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Phone Number" 
                      secondary={customer.phone || 'Not provided'} 
                      secondaryTypographyProps={{ 
                        color: customer.phone ? 'text.primary' : 'text.secondary'
                      }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: 'primary.light',
                        width: 32, 
                        height: 32 
                      }}>
                        <HomeIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Address" 
                      secondary={customer.address || 'Not provided'} 
                      secondaryTypographyProps={{ 
                        color: customer.address ? 'text.primary' : 'text.secondary'
                      }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            {/* Account Summary */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ 
                p: 2, 
                backgroundColor: 'background.default',
                borderRadius: 2
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'text.secondary'
                }}>
                  Account Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: customer.currentBalance > 0 ? 'error.light' : 'success.light',
                        width: 32, 
                        height: 32 
                      }}>
                        <BalanceIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Current Balance" 
                      secondary={
                        <Chip 
                          label={`₹${customer.currentBalance?.toLocaleString('en-IN') || '0'}`}
                          color={customer.currentBalance > 0 ? 'error' : 'success'}
                          size={isMobile ? 'small' : 'medium'}
                          variant="outlined"
                        />
                      } 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: 'info.light',
                        width: 32, 
                        height: 32 
                      }}>
                        <GasIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Gas On Hand" 
                      secondary={
                        <Chip 
                          label={customer.currentGasOnHand || '0'}
                          color="info"
                          size={isMobile ? 'small' : 'medium'}
                          variant="outlined"
                        />
                      } 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CustomerProfile;