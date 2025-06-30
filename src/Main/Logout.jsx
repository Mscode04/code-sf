import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const Logout = ({ onLogout }) => {
  useEffect(() => {
    const performLogout = async () => {
      const routeId = localStorage.getItem("routeId");
      
      if (routeId) {
        try {
          // Find the most recent session without a logout time
          const sessionsRef = collection(db, "sessions");
          const q = query(
            sessionsRef,
            where("routeId", "==", routeId),
            where("logoutTime", "==", null)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            // Update the most recent session with logout time
            const sessionDoc = querySnapshot.docs[0];
            await updateDoc(sessionDoc.ref, {
              logoutTime: new Date()
            });
          }
        } catch (error) {
          console.error("Error recording logout:", error);
        }
      }
      
      // Clear local storage and call logout handler
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("routeName");
      localStorage.removeItem("routeId");
      onLogout();
    };
    
    performLogout();
  }, [onLogout]);

  return <Navigate to="/" replace={true} />;
};

export default Logout;