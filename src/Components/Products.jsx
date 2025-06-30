import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: 0,
    remarks: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const productsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProducts(productsData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "products"), formData);
      alert("Product added successfully!");
      setFormData({ id: "", name: "", price: 0, remarks: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error adding product");
    }
  };

  return (
    <div className="form-container">
      <h2>Products</h2>
      
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
          <label>Price:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
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
        
        <button type="submit" className="submit-btn">Add Product</button>
      </form>
      
      <div className="table-container">
        <h3>Current Products</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>₹{product.price}</td>
                <td>{product.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;