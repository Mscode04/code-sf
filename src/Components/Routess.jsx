import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";

const Routes = () => {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    remarks: ""
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const querySnapshot = await getDocs(collection(db, "routes"));
    const routesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRoutes(routesData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "routes"), formData);
      alert("Route added successfully!");
      setFormData({ id: "", name: "", remarks: "" });
      fetchRoutes();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error adding route");
    }
  };

  return (
    <div className="form-container">
      <h2>Routes</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID:</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Remarks:</label>
          <input
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>
        
        <button type="submit" className="submit-btn">Add Route</button>
      </form>
      
      <div className="table-container">
        <h3>Current Routes</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route.id}>
                <td>{route.id}</td>
                <td>{route.name}</td>
                <td>{route.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Routes;