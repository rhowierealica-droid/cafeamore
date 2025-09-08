// ==========================
// Sidebar & Navigation
// ==========================
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const closeBtn = document.getElementById('closeBtn');
const logo = document.querySelector('.logo');

// Hamburger toggle
hamburger.addEventListener('click', () => {
  sidebar.classList.add('active');
  hamburger.style.display = 'none';
});

closeBtn?.addEventListener('click', () => {
  sidebar.classList.remove('active');
  hamburger.style.display = 'block';
});

// Reset sidebar on resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) {
    sidebar.classList.remove('active');
    hamburger.style.display = 'none';
  } else {
    hamburger.style.display = 'block';
  }
});

// ==========================
// Navigation links
// ==========================
const navLinks = sidebar.querySelectorAll('nav ul li');
const linkMap = {
  "menu-link": "index.html",
  "cart-link": "cart.html",
  "order-status-link": "customer-status.html",
  "favorites-link": "favorites.html",
  "history-link": "history.html"
};

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = linkMap[link.classList[0]];
    if (target) window.location.href = target;
  });
});

// ==========================
// Logo click
// ==========================
logo?.addEventListener('click', () => {
  window.location.href = "index.html";
});

// ==========================
// Profile & Logout
// ==========================
const profileCard = document.getElementById("profileCard");
const editProfile = document.getElementById("editProfile");
const logoutBtn = document.getElementById("logoutBtn");

// Profile card click → profile page
profileCard?.addEventListener("click", () => {
  window.location.href = "profile.html";
});

// Edit Profile click → edit page
editProfile?.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent redirect to profile
  window.location.href = "edit-profile.html";
});

// Logout click → back to login/homepage
logoutBtn?.addEventListener("click", () => {
  window.location.href = "login.html"; // or "index.html" if you fully removed login
});
