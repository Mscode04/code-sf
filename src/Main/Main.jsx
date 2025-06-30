import React, { useState } from "react";
import { Outlet, Navigate, Link, useParams, useNavigate } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Divider,
  Box
} from "@mui/material";
import { db } from "../Firebase/config";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import {
  Home as HomeIcon,
  Receipt as SalesIcon,
  People as CustomersIcon,
  AddCircle as NewSaleIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  AccountCircle as AccountIcon
} from "@mui/icons-material";
import "./Main.css";

const Main = ({ isAuthenticated, setIsAuthenticated }) => {
  const { routeName } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const [logoutOpen, setLogoutOpen] = useState(false);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogoutClick = () => {
    setLogoutOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      const routeId = localStorage.getItem("routeId");
      
      if (routeId) {
        const sessionsRef = collection(db, "sessions");
        const q = query(
          sessionsRef,
          where("routeId", "==", routeId),
          where("logoutTime", "==", null),
          where("routeName", "==", routeName)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const sessionDoc = querySnapshot.docs[0];
          await updateDoc(sessionDoc.ref, {
            logoutTime: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error recording logout:", error);
    } finally {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("routeName");
      localStorage.removeItem("routeId");
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const navItems = [
    { icon: <HomeIcon />, text: "Home", path: `/dashboard/${routeName}` },
    { icon: <NewSaleIcon />, text: "New Sale", path: `/sales/new/${routeName}` },
    { icon: <SalesIcon />, text: "Today's Sales", path: `/sales/today/${routeName}` },
    { icon: <CustomersIcon />, text: "Customers", path: `/customers/${routeName}` }
  ];

  const drawer = (
    <div className="drawer-container">
      <div className="drawer-header">
        <Typography variant="h6" className="logo-text">
          TBGS Track
        </Typography>
        <Typography variant="subtitle2" className="route-display">
          {/* {routeName} */}
        </Typography>
      </div>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            className="nav-item"
          >
            <ListItemIcon className="nav-icon">{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
      <Divider />
      <List>
        <ListItem 
          button 
          onClick={handleLogoutClick}
          className="nav-item logout-item"
        >
          <ListItemIcon className="nav-icon"><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ variant: 'body2' }} />
        </ListItem>
      </List>
      <div className="powered-by-drawer">
        <Typography variant="caption" color="textSecondary">
          Powered by <a href="https://neuraq.in" target="_blank" rel="noopener noreferrer">Neuraq Technologies</a>
        </Typography>
      </div>
    </div>
  );

  return (
    <div className="main-layout">
      {/* Top App Bar - Shown on all devices */}
      <AppBar position="fixed" className="top-app-bar" elevation={0}>
        <Toolbar className="toolbar">
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              className="menu-button"
              size="large"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <div className="logo-container">
            <Typography variant="h6" component="div" className="logo-text" noWrap>
              TBGS Track
            </Typography>
            {isDesktop && (
              <Typography variant="subtitle2" className="route-display" noWrap>
                {/* {routeName} */}
              </Typography>
            )}
          </div>
          
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
          
          <div className="top-bar-info">
            <Typography variant="subtitle2" className="date-display" noWrap>
              {today}
            </Typography>
          </div>
          
          <div className="user-actions">
            <Button
              startIcon={<LogoutIcon />}
              color="inherit"
              onClick={handleLogoutClick}
              className="logout-button"
              sx={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </div>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Navigation - Desktop */}
      {isDesktop && (
        <nav className="desktop-sidebar">
          {drawer}
        </nav>
      )}
      
      {/* Mobile Sidebar Navigation */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        className="mobile-drawer"
      >
        {drawer}
      </Drawer>
      
      {/* Main Content */}
      <main className={`main-content ${isDesktop ? 'desktop-view' : ''}`}>
        <Outlet />
      </main>
      
      {/* Bottom Navigation - Mobile/Tablet */}
      {!isDesktop && (
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <Link to={item.path} className="nav-link" key={item.text}>
              {item.icon}
            </Link>
          ))}
        </nav>
      )}
      
      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout from the application?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Main;