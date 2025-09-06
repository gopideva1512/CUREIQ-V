import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBtjDCX6cMQc_F04PAlC3lfI2M0zDN3xlM",
  authDomain: "cure-8dd3a.firebaseapp.com",
  projectId: "cure-8dd3a",
  storageBucket: "cure-8dd3a.firebasestorage.app",
  messagingSenderId: "241761903383",
  appId: "1:241761903383:web:ba2b9472ee5d362c9e4d52",
  measurementId: "G-9J3YNRBSLN"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
