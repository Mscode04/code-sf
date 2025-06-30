import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";

const NewConnection = () => {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    organization: "",
    phone: "",
    ownerName: "",
    ownerPhone: "",
    password: "",
    route: "",
    currentBalance: 0
  });

  useEffect(() => {
    // Generate initial ID
    setFormData(prev => ({ ...prev, id: "00001" }));
    
    // Fetch routes for dropdown
    const fetchRoutes = async () => {
      const querySnapshot = await getDocs(collection(db, "routes"));
      const routesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoutes(routesData);
    };
    
    fetchRoutes();
  }, []);

  const generatePassword = (phone) => {
    const randomChars = phone.slice(-4) + "@tbgmkba";
    return randomChars;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "phone" && { password: generatePassword(value) })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "customers"), formData);
      alert("Customer added successfully!");
      // Reset form with new ID
      const newId = String(parseInt(formData.id) + 1).padStart(5, '0');
      setFormData({
        id: newId,
        name: "",
        organization: "",
        phone: "",
        ownerName: "",
        ownerPhone: "",
        password: generatePassword(""),
        route: "",
        currentBalance: 0
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error adding customer");
    }
  };

  return (
    <div className="form-container">
      <h2>New Connection</h2>
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
          <label>Organization:</label>
          <input
            type="text"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Owner Name:</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Owner Phone:</label>
          <input
            type="text"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Password (Auto-generated):</label>
          <input
            type="text"
            name="password"
            value={formData.password}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Route:</label>
          <select
            name="route"
            value={formData.route}
            onChange={handleChange}
            required
          >
            <option value="">Select Route</option>
            {routes.map(route => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Current Balance Amount:</label>
          <input
            type="number"
            name="currentBalance"
            value={formData.currentBalance}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" className="submit-btn">Save Connection</button>
      </form>
    </div>
  );
};

export default NewConnection;