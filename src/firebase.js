import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging } from "firebase/messaging";

// Paste your exact config object from the Firebase console below:
const firebaseConfig = {
  apiKey: "AIzaSyDG_3AmQLzljj3xzib8i-bUKt1ZmfSLokg",
  authDomain: "p-106-e2f8a.firebaseapp.com",
  databaseURL: "https://p-106-e2f8a-default-rtdb.europe-west1.firebasedatabase.app", 
  projectId: "p-106-e2f8a", // 
  storageBucket: "p-106-e2f8a.firebasestorage.app",
  messagingSenderId: "18307360107",
  appId: "1:18307360107:web:5ce3811a811c42ab00182e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database utility so App.jsx can use it
export const db = getDatabase(app);
export const messaging = getMessaging(app);