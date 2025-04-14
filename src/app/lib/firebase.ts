import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: "AIzaSyDjdKfmGxPll4JYsbfbEWCkZBsdjXgNHQk",
  authDomain: "todolist-1b574.firebaseapp.com",
  projectId: "todolist-1b574",
  storageBucket: "todolist-1b574.firebasestorage.app",
  messagingSenderId: "497152808951",
  appId: "1:497152808951:web:1760d33cffa6bcb96f40f2",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
