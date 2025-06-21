import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FirebaseConfig } from '@/types';

// Your Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyCodfRipbDScgI2FWwSCNLKIpMZh2_ffgk",
  authDomain: "ai-fashion-stylist-efb69.firebaseapp.com",
  projectId: "ai-fashion-stylist-efb69",
  storageBucket: "ai-fashion-stylist-efb69.firebasestorage.app",
  messagingSenderId: "175207214105",
  appId: "1:175207214105:web:80f33e9a4976acf90f8e88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (will use default persistence)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
export default app; 