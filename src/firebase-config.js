import {initializeApp} from "firebase/app"
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage'
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvvRMehMEIT8ydfzfiX-i-u0UFEdurbUU",
  authDomain: "projecth-be699.firebaseapp.com",
  projectId: "projecth-be699",
  storageBucket: "projecth-be699.appspot.com",
  messagingSenderId: "321003312062",
  appId: "1:321003312062:web:ddbf857730800799d59fef",
  measurementId: "G-YJ6K4ZX0N6"
};
  
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  auth.useDeviceLanguage();
  export const storage = getStorage(app)
  export const db = getFirestore(app);
 