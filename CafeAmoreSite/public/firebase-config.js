import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyDt2-px9G5MCtUMDWOtKUDb1lf8b_sxhhA",
  authDomain: "cafeamore-4f73a.firebaseapp.com",
  projectId: "cafeamore-4f73a",
  storageBucket: "cafeamore-4f73a.firebasestorage.app",
  messagingSenderId: "701414268950",
  appId: "1:701414268950:web:eb7f23497104615487d537"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

