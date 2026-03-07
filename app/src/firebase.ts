import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDetSA_g6gEVG9Iv6QCL8h6eyRpw0yQuVE",
  authDomain: "chestet-217c9.firebaseapp.com",
  projectId: "chestet-217c9",
  storageBucket: "chestet-217c9.firebasestorage.app",
  messagingSenderId: "753899994678",
  appId: "1:753899994678:web:28371ad584c2a8b9cb6297",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
