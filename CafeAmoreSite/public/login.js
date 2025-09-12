import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const DEFAULT_PASSWORD = "CafeAmoreX17";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value;

  try {
    // Check if email exists in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return showMessage("Account does not exist.");
    }

    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    const role = data.role;
    const storedPassword = data.password;

    if (role === "Customer") {
      // Firebase Auth login for customers
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        if (!userCredential.user.emailVerified) {
          return showMessage("Please verify your email before logging in.");
        }
        window.location.href = "index.html"; // Customer home
      } catch (authError) {
        return showMessage("Wrong password.");
      }
    } 
    
    else if (role === "Admin") {
      // Firebase Auth login for customers
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        if (!userCredential.user.emailVerified) {
          return showMessage("Please verify your email before logging in.");
        }
        window.location.href = "adminpanel.html"; // Customer home
      } catch (authError) {
        return showMessage("Wrong password.");
      }
    }
    else {
      // Firestore login for employees
      if (pass !== storedPassword) {
        return showMessage("Wrong password.");
      }

      // First-time login for employees with default password
      if (pass === DEFAULT_PASSWORD) {
        return window.location.href = "updatepass.html?uid=" + userDoc.id;
      }

      // Redirect based on role
      switch(role) {
        case "Cashier":
          window.location.href = "orders.html";
          break;
        case "Bartender":
          window.location.href = "incomingorders.html";
          break;
        case "Driver":
          window.location.href = "driver.html";
          break;
        default:
          showMessage("Role not recognized!");
      }
    }

  } catch (error) {
    console.error(error);
    showMessage("Error logging in: " + error.message);
  }
});

/* ===============================
   Forgot Password (Customer Only)
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

// Reset password
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

    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    const role = data.role;

    if (role !== "Customer") {
      // Employees cannot use forgot password
      return showMessage("Only customers can reset their password here. Employees must contact the admin.");
    }

    // Send Firebase Auth password reset email for customers
    await sendPasswordResetEmail(auth, resetEmail);
    showMessage(`Password reset email sent to ${resetEmail}. Please check your inbox.`);
    forgotPopup.style.display = "none";

  } catch (error) {
    console.error(error);
    showMessage("Error: " + error.message);
  }
});
