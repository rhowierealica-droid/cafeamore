import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===============================
   Message Popup Helper
=============================== */
const messagePopup = document.getElementById("messagePopup");
const messageText = document.getElementById("messageText");
const closeMessage = document.getElementById("closeMessage");

function showMessage(msg) {
  messageText.textContent = msg;
  messagePopup.style.display = "flex";
}

closeMessage.addEventListener("click", () => {
  messagePopup.style.display = "none";
});

/* ===============================
   Login with Role Redirection
=============================== */
const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value;

  try {
    // Check if email exists in Firestore first
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return showMessage("Account not existing.");
    }

    // Email exists, try sign in
    const userCred = await signInWithEmailAndPassword(auth, email, pass);

    if (!userCred.user.emailVerified) {
      return showMessage("Please verify your email before logging in.");
    }

    const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
    if (!userDoc.exists()) return showMessage("Account not existing.");

    const role = userDoc.data().role;

    if (role === "Admin") window.location.href = "adminpanel.html";
    else if (role === "Customer") window.location.href = "index.html";
    else if (role === "Employee") window.location.href = "employeedashboard.html";
    else showMessage("Role not recognized!");
  } catch (error) {
    // Everything that reaches here is basically wrong password
    showMessage("Wrong password.");
  }
});

/* ===============================
   Forgot Password Popup
=============================== */
const forgotLink = document.getElementById("forgotPassword");
const forgotPopup = document.getElementById("forgotPopup");
const closeForgotBtn = document.getElementById("closeForgot");
const sendResetBtn = document.getElementById("sendReset");

// Show popup
forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  forgotPopup.style.display = "flex";
});

// Close popup
closeForgotBtn.addEventListener("click", () => {
  forgotPopup.style.display = "none";
});

// Send password reset
sendResetBtn.addEventListener("click", async () => {
  const resetEmail = document.getElementById("resetEmail").value.trim();
  if (!resetEmail) return showMessage("Please enter your email.");

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", resetEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return showMessage("This account does not exist.");
    }

    await sendPasswordResetEmail(auth, resetEmail);
    showMessage("Password reset email sent. Please check your inbox.");
    forgotPopup.style.display = "none";
  } catch (error) {
    showMessage("Error: " + error.message);
  }
});
