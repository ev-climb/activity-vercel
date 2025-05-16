import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCg5ts9ZDghiYmwA877DN1HmR1eto2Flw",
  authDomain: "pim-activity-7075a.firebaseapp.com",
  projectId: "pim-activity-7075a",
  storageBucket: "pim-activity-7075a.firebasestorage.app",
  messagingSenderId: "560886668797",
  appId: "1:560886668797:web:d86cbb0e8b845d080a4d94",
  measurementId: "G-XQPDBV65VG"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp) as any;
const db = getFirestore(firebaseApp);

export { auth, firebaseApp, db };