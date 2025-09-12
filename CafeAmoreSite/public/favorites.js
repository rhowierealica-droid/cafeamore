import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// DOM Elements
const favoritesContainer = document.querySelector('.favorites-container');
const loginPopup = document.getElementById('loginPopup');
const loginRedirect = document.getElementById('loginRedirect');

// Redirect to login
loginRedirect.addEventListener('click', () => window.location.href = 'login.html');

const auth = getAuth();
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!currentUser) {
    loginPopup.style.display = 'flex';
    return;
  }
  await loadFavorites();
});

// Load user's favorites
async function loadFavorites() {
  favoritesContainer.innerHTML = '';

  const favSnapshot = await getDocs(collection(db, "favorites"));
  const userFavs = favSnapshot.docs
    .map(doc => doc.data())
    .filter(f => f.userId === currentUser.uid);

  if (userFavs.length === 0) {
    favoritesContainer.innerHTML = '<p>You have no favorite products yet.</p>';
    return;
  }

  for (let fav of userFavs) {
    const productDoc = await getDoc(doc(db, "products", fav.productId));
    if (!productDoc.exists()) continue;

    const product = productDoc.data();
    const card = document.createElement('div');
    card.className = 'product-card';

    // Use 'product.image' not 'imageURL'
    card.innerHTML = `
      <img src="${product.image || 'placeholder.png'}" alt="${product.name}" class="product-image">
      <h3>${product.name || 'Unnamed Product'}</h3>
      <p>${product.description || ''}</p>
      <i class="fa-solid fa-heart favorite-icon"></i>
    `;

    const heartIcon = card.querySelector('.fa-heart');
    heartIcon.addEventListener('click', async () => {
      // Remove from favorites
      await deleteDoc(doc(db, "favorites", `${currentUser.uid}_${fav.productId}`));
      card.remove();
    });

    favoritesContainer.appendChild(card);
  }
}

// Close popup if clicked outside
window.addEventListener('click', e => {
  if (e.target === loginPopup) loginPopup.style.display = 'none';
});
