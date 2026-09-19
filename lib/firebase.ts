import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_HW4ixrOvWk6pYG-y2JfcVsgx3hHrIXI",
  authDomain: "encouraging-tooling-1rwfn.firebaseapp.com",
  projectId: "encouraging-tooling-1rwfn",
  storageBucket: "encouraging-tooling-1rwfn.firebasestorage.app",
  messagingSenderId: "299618543404",
  appId: "1:299618543404:web:513ec172a0fb9f863d2e89",
};

const firebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp, 'ai-studio-dhotiaalechatbat-69c84123-add4-4ada-9664-7426c44ab205');

export { firebaseApp, auth, db };
