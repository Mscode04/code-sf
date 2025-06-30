import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = ({ setIsAuthenticated }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing authentication
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedRouteName = localStorage.getItem("routeName");
    
    if (storedAuth === "true" && storedRouteName) {
      setIsAuthenticated(true);
      scheduleMidnightLogout();
      navigate(`/dashboard/${storedRouteName}`);
    }
  }, [navigate, setIsAuthenticated]);

  const scheduleMidnightLogout = () => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0
    );
    const timeUntilMidnight = midnight - now;

    setTimeout(() => {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("routeName");
      localStorage.removeItem("routeId");
      window.location.href = "/login";
    }, timeUntilMidnight);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const routesRef = collection(db, "routes");
      const q = query(routesRef, where("id", "==", id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Route not found. Please check your ID.");
        return;
      }

      const routeDoc = querySnapshot.docs[0];
      const routeData = routeDoc.data();

      if (!routeData.name) {
        setError("Route name is missing in database.");
        return;
      }

      if (routeData.password !== password) {
        setError("Incorrect password. Please try again.");
        return;
      }

      // Record login session
      const sessionsRef = collection(db, "sessions");
      await addDoc(sessionsRef, {
        routeId: id,
        routeName: routeData.name,
        loginTime: serverTimestamp(),
        logoutTime: null,
        date: new Date().toISOString().split('T')[0]
      });

      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("routeName", routeData.name);
      localStorage.setItem("routeId", id);
      
      scheduleMidnightLogout();
      navigate(`/dashboard/${routeData.name}`);
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <h2>Route Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>Route ID:</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Enter your route ID"
            required
          />
          
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;