import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// Firebase configuration - BU KISMI SEN DOLDURACAKSIN
const firebaseConfig = {
  apiKey: "AIzaSyDfHXrLYxXcug7DGCS1IfpQj-qRXf-GvJU",
  authDomain: "message-9d11d.firebaseapp.com",
  databaseURL: "https://message-9d11d-default-rtdb.firebaseio.com",
  projectId: "message-9d11d",
  storageBucket: "message-9d11d.firebasestorage.app",
  messagingSenderId: "113552310582",
  appId: "1:113552310582:web:7c55327b8eced439b3f397",
  measurementId: "G-VLQ11D2SF2"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth
// React Native için basit auth kullan, persistence gerekmez çünkü biz deviceId kullanıyoruz
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;