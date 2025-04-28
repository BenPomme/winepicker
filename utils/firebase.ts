import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4ORkgfn69X5Sa12CuSyynuAt0ilnU9Sg",
  authDomain: "winepicker-63daa.firebaseapp.com",
  projectId: "winepicker-63daa",
  storageBucket: "winepicker-63daa.appspot.com",
  messagingSenderId: "583485908328",
  appId: "1:583485908328:web:1930fc0de1d6e3a2dce2dd",
  measurementId: "G-EN9HMKSP6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1'); // Specify region explicitly

// Cloud Functions
const analyzeWineFunction = httpsCallable(functions, 'analyzeWine');
const getAnalysisResultFunction = httpsCallable(functions, 'getAnalysisResult');
const testOpenAIFunction = httpsCallable(functions, 'testOpenAI');
const getPriceEstimateFunction = httpsCallable(functions, 'getPriceEstimate');

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  db, 
  storage, 
  auth,
  functions, 
  googleProvider,
  signInWithPopup,
  GoogleAuthProvider,
  firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  analyzeWineFunction, 
  getAnalysisResultFunction,
  testOpenAIFunction,
  getPriceEstimateFunction
};