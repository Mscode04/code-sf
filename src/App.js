import React, { useState } from "react";
import {  Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Main/LoginPage";
import Main from './Main/Main';
import Dashboard from "./Pages/Dashboard";
import SalesForm from "./Pages/SalesForm";
import CustomersList from "./Pages/CustomersList";
import CustomerProfile from "./Pages/CustomerProfile";
import TodaySales from "./Pages/TodaySales";
import SalesDetails from "./Pages/SalesReportDetails";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  return (
    
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? 
            <LoginPage setIsAuthenticated={setIsAuthenticated} /> : 
            <Navigate to={`/dashboard/${localStorage.getItem("routeName")}`} />
        } />
        
        <Route path="/" element={<Main isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />}>
          <Route index element={<Navigate to={`/dashboard/${localStorage.getItem("routeName")}`} />} />
          <Route path="dashboard/:routeName" element={<Dashboard />} />
          <Route path="sales/new/:routeName" element={<SalesForm />} />
          <Route path="sales/today/:routeName" element={<TodaySales />} />
          <Route path="customers/:routeName" element={<CustomersList />} />
          <Route path="customer/:id" element={<CustomerProfile />} />
          <Route path="sales/:id" element={<SalesDetails />} />
          
        </Route>

        <Route path="*" element={
          isAuthenticated ? 
            <Navigate to={`/dashboard/${localStorage.getItem("routeName")}`} /> : 
            <Navigate to="/login" />
        } />
      </Routes>
    
  );
}

export default App;