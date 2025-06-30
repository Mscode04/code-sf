// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDoDc6qX8u4Y6FKJIZTbGnEj4J5nISSKg",
  authDomain: "tbg-base.firebaseapp.com",
  projectId: "tbg-base",
  storageBucket: "tbg-base.firebasestorage.app",
  messagingSenderId: "1084027646100",
  appId: "1:1084027646100:web:c14f8414d0597206c00481",
  measurementId: "G-RDZ67TZSJ9"
};

const FirebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(FirebaseApp);
