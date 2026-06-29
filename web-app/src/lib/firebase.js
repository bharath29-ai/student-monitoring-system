import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATbqIQJ3acmu1gCStojlfRkwK_qjRImq4",
  authDomain: "app-084e0d55.firebaseapp.com",
  projectId: "app-084e0d55",
  storageBucket: "app-084e0d55.firebasestorage.app",
  messagingSenderId: "525714936206",
  appId: "1:525714936206:web:9a2737cbf65f7ca24694df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export default app;
