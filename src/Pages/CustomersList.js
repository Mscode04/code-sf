import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Container, 
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  InputAdornment,
  useTheme,
  useMediaQuery
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';

const AllCustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customersData = querySnapshot.docs.map(doc => ({
          firebaseId: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)))
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

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
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 2 : 0,
        mb: 4 
      }}>
        <Typography variant="h4" component="h1">
          All Customers
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          width: isMobile ? '100%' : 'auto'
        }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by name or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              width: isMobile ? '100%' : 300,
            }}
          />
     
        </Box>
      </Box>

      {filteredCustomers.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          textAlign: 'center'
        }}>
          <Typography variant="h6" color="textSecondary">
            {searchTerm ? 'No customers match your search' : 'No customers found'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCustomers.map((customer) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={customer.firebaseId}>
              <Card 
               className="rounded-3"
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }} onClick={() => navigate(`/customer/${customer.firebaseId}`)} className="rounded-3">
                  <Typography variant="h6" component="div" gutterBottom>
                    {customer.name}
                  </Typography>
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Phone:</strong> {customer.phone || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Route:</strong> {customer.route || '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1
                  }}>
                    <Typography variant="body2">
                      <strong>Balance:</strong>
                    </Typography>
                    <Chip 
                      label={`₹${customer.currentBalance?.toLocaleString('en-IN') || '0'}`}
                      color={customer.currentBalance > 0 ? 'error' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Typography variant="body2">
                      <strong>Gas On Hand:</strong>
                    </Typography>
                    <Chip 
                      label={customer.currentGasOnHand || '0'}
                      color="info"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default AllCustomersList;