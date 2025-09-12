import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===============================
   Message Popup Helper
=============================== */
const messagePopup = document.getElementById("messagePopup");
const messageText = document.getElementById("messageText");
const popupOkBtn = document.getElementById("popupOkBtn");

let shouldRedirect = false;

function showMessage(msg, redirect = false) {
  messageText.textContent = msg;
  shouldRedirect = redirect;
  messagePopup.style.display = "flex";
}

popupOkBtn.addEventListener("click", () => {
  messagePopup.style.display = "none";
  if (shouldRedirect) {
    window.location.href = "login.html";
  }
});

/* ===============================
   Terms Popup with Scroll Requirement
=============================== */
const termsPopup = document.getElementById("termsPopup");
const termsCheckbox = document.getElementById("terms");
const termsLabel = document.getElementById("termsLabel");
const termsOkBtn = document.getElementById("termsOkBtn");
const termsCancelBtn = document.getElementById("termsCancelBtn");
const termsBody = document.querySelector(".terms-body");

let isOpeningPopup = false;

// Initially disable OK button
termsOkBtn.disabled = true;
termsOkBtn.style.opacity = 0.5;

// Enable OK only when scrolled to bottom
termsBody.addEventListener("scroll", () => {
  const scrollTop = termsBody.scrollTop;
  const scrollHeight = termsBody.scrollHeight;
  const clientHeight = termsBody.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 5) {
    termsOkBtn.disabled = false;
    termsOkBtn.style.opacity = 1;
  }
});

// Open Terms Popup helper
function openTermsPopup() {
  termsOkBtn.disabled = true;
  termsOkBtn.style.opacity = 0.5;
  termsBody.scrollTop = 0;
  termsPopup.style.display = "flex";
}

// Checkbox change
termsCheckbox.addEventListener("change", (e) => {
  if (termsCheckbox.checked && !isOpeningPopup) {
    e.preventDefault();
    termsCheckbox.checked = false;
    openTermsPopup();
  }
});

// Label click
termsLabel.addEventListener("click", (e) => {
  if (!termsCheckbox.checked) {
    e.preventDefault();
    openTermsPopup();
  }
});

// OK → check the box
termsOkBtn.addEventListener("click", () => {
  isOpeningPopup = true;
  termsCheckbox.checked = true;
  isOpeningPopup = false;
  termsPopup.style.display = "none";
});

// Cancel → keep unchecked
termsCancelBtn.addEventListener("click", () => {
  termsPopup.style.display = "none";
  termsCheckbox.checked = false;
});

/* ===============================
   Password Validation
=============================== */
function validatePassword(pass) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(pass);
}

/* ===============================
   Registration
=============================== */
const registerForm = document.getElementById("registerForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const passwordError = document.getElementById("passwordError");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset errors
    password.classList.remove("input-error");
    confirmPassword.classList.remove("input-error");
    passwordError.style.display = "none";

    // Must accept terms
    if (!termsCheckbox.checked) {
      showMessage("You must agree to the Terms and Conditions before registering.");
      return;
    }

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = password.value;
    const confirmPass = confirmPassword.value;
    const barangay = document.getElementById("barangay").value;
    const houseNumber = document.getElementById("houseNumber").value.trim();

    // Validate password strength
    if (!validatePassword(pass)) {
      password.classList.add("input-error");
      passwordError.innerText =
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
      passwordError.style.display = "block";
      return;
    }

    // Check password match
    if (pass !== confirmPass) {
      password.classList.add("input-error");
      confirmPassword.classList.add("input-error");
      passwordError.innerText = "Passwords do not match.";
      passwordError.style.display = "block";
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(userCred.user);

      await setDoc(doc(db, "users", userCred.user.uid), {
        firstName,
        lastName,
        email,
        barangay,
        houseNumber,
        region: "South Luzon",
        province: "Cavite",
        city: "Bacoor",
        role: "Customer"
      });

      showMessage("Registration successful! Please verify your email.", true);
      registerForm.reset();
      termsCheckbox.checked = false;

    } catch (error) {
      showMessage("Error: " + error.message);
    }
  });
}
