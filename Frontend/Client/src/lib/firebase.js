import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase config (copy from your Firebase project)
const firebaseConfig = {
  apiKey: "AIzaSyBdc2UBVS7MhAaNICS4zwjmTmlssOZkzsQ",
  authDomain: "quantum-code-dbcac.firebaseapp.com",
  projectId: "quantum-code-dbcac",
  storageBucket: "quantum-code-dbcac.firebasestorage.app",
  messagingSenderId: "794048412573",
  appId: "1:794048412573:web:aa1011a9bbb46089bc0d74",
  measurementId: "G-C2TZLQN749"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Optional: Add custom parameters to Google Auth
googleProvider.setCustomParameters({
  prompt: "select_account"
});