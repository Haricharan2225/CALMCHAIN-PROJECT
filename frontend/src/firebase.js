import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-ZjwZHBUSekpjqnKjGXVyB_JH9PreDGs",
  authDomain: "calmchain-project.firebaseapp.com",
  projectId: "calmchain-project",
  storageBucket: "calmchain-project.firebasestorage.app",
  messagingSenderId: "270254382941",
  appId: "1:270254382941:web:a18c7740516237f543d2b4",
  measurementId: "G-H5DYDM7KR4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
