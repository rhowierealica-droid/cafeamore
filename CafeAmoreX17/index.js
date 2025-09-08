import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ==========================
// DOM Elements
// ==========================
const drinksContainer = document.querySelector('.category-list[data-main="Drink"]');
const sandwichContainer = document.querySelector('.category-list[data-main="Sandwich"]');
const loginPopup = document.getElementById('loginPopup');
const loginRedirect = document.getElementById('loginRedirect');

// ==========================
// Auth
// ==========================
const auth = getAuth();
let currentUser = null;
onAuthStateChanged(auth, user => currentUser = user);

// Redirect button
loginRedirect?.addEventListener('click', () => window.location.href = 'login.html');

// ==========================
// LOAD PRODUCTS
// ==========================
async function loadProducts() {
  if (!drinksContainer && !sandwichContainer) return;

  try {
    const productsCol = collection(db, "products");
    const productSnapshot = await getDocs(productsCol);
    const products = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const product of products) {
      const card = document.createElement('div');
      card.classList.add('product-card');

      let displayPrice = product.price || 0;
      if (product.sizes?.length) {
        displayPrice = Math.min(...product.sizes.map(s => s.price || Infinity));
      }

      const isUnavailable = !product.available || product.sizes?.every(s => s.qty <= 0);
      if (isUnavailable) card.classList.add('unavailable');

      card.innerHTML = `
        <h3>${product.name || 'Unnamed Product'}</h3>
        <p>₱${displayPrice.toFixed(2)}</p>
        ${!isUnavailable ? `<button class="add-cart-btn">Add to Cart</button>` : ''}
      `;

      const mainCategory = ["Ice Espresso", "Non-Coffee", "Iced Cold Brew", "Hot Coffee"].includes(product.category)
        ? "Drink"
        : "Sandwich";
      const container = mainCategory === "Drink" ? drinksContainer : sandwichContainer;
      container?.appendChild(card);

      // ✅ Button shows success alert
      const addBtn = card.querySelector('.add-cart-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          alert(`${product.name} successfully added to cart!`);
        });
      }
    }
  } catch (err) {
    console.error("Error fetching products:", err);
  }
}

// ==========================
// INIT
// ==========================
loadProducts();
