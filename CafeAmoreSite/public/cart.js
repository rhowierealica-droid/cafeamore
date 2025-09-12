// --- imports ---
import { db } from './firebase-config.js';
import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, 
  serverTimestamp, onSnapshot, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- DOM Elements ---
const cartItemsDiv = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const auth = getAuth();
let currentUser = null;
let cartItems = [];
let unsubscribeCart = null;

// --- Auth State ---
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loadCartRealtime();
  } else {
    currentUser = null;
    cartItemsDiv.innerHTML = '<p>Please log in to view your cart.</p>';
    cartTotalSpan.textContent = '0.00';
    cartItems = [];
    if (unsubscribeCart) unsubscribeCart();
  }
});

// ----------------------
// ADD TO CART
// ----------------------
export async function addToCart(product, selectedSize = null, selectedAddons = [], quantity = 1) {
  if (!currentUser) return alert("Please log in first.");

  const basePrice = Number(product.price || 0);
  const sizePrice = Number(selectedSize?.price || 0);
  const addonsObjects = (selectedAddons || []).map(a => ({
    name: a.name || "Addon",
    price: Number(a.price || 0),
    id: a.id || null
  }));
  const addonsPrice = addonsObjects.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + sizePrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  try {
    const cartRef = collection(db, "users", currentUser.uid, "cart");
    await addDoc(cartRef, {
      productId: product.id || null,
      name: product.name || "Unnamed Product",
      image: product.image || 'placeholder.png',
      basePrice,
      sizePrice,
      addonsPrice,
      unitPrice,
      totalPrice,
      quantity,
      size: selectedSize?.name || null,
      sizeId: selectedSize?.id || null,
      addons: addonsObjects,
      addedAt: new Date(),
      userId: currentUser.uid
    });
    alert(`${product.name || "Product"} added to cart!`);
  } catch (err) {
    console.error("Error adding to cart:", err);
    alert("Failed to add to cart.");
  }
}

// ----------------------
// REAL-TIME LOAD CART
// ----------------------
function loadCartRealtime() {
  if (!currentUser) return;
  const cartRef = collection(db, 'users', currentUser.uid, 'cart');
  if (unsubscribeCart) unsubscribeCart();

  unsubscribeCart = onSnapshot(cartRef, snapshot => {
    cartItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cartItemsDiv.innerHTML = '';
    let grandTotal = 0;

    if (!cartItems.length) {
      cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
      cartTotalSpan.textContent = '0.00';
      return;
    }

    cartItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('cart-item');

      const productName = item.name || "Unnamed Product";
      const qty = Number(item.quantity || 1);
      const totalPrice = Number(item.totalPrice || 0);

      // Add-ons display
      let addonsHTML = '';
      if (Array.isArray(item.addons) && item.addons.length) {
        addonsHTML = '<br><small>Add-ons:<br>' +
          item.addons.map(a => `&nbsp;&nbsp;${a.name} - ₱${Number(a.price || 0).toFixed(2)}`).join('<br>') +
          '</small>';
      }

      // Cart item HTML with proper image size
      itemDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px;">
          <img src="${item.image || 'placeholder.png'}" alt="${item.name}" 
               style="height:80px; width:80px; object-fit:cover; border-radius:8px; flex-shrink:0;">
          <div class="item-info">
            <strong>${productName}</strong><br>
            ${item.size ? `Size: ${item.size} - ₱${Number(item.sizePrice || 0).toFixed(2)}` : 'Size: N/A'}<br>
            ${addonsHTML}<br>
            <label>Qty: <input type="number" min="1" value="${qty}" class="qty-input"></label><br>
            <small>Total: ₱${totalPrice.toFixed(2)}</small>
          </div>
          <button class="remove-btn">❌</button>
        </div>
      `;

      // Quantity change
      const qtyInput = itemDiv.querySelector('.qty-input');
      qtyInput.addEventListener('change', async e => {
        let newQty = parseInt(e.target.value);
        if (isNaN(newQty) || newQty < 1) newQty = 1;
        e.target.value = newQty;

        const newUnitPrice = Number(item.basePrice) + Number(item.sizePrice) + Number(item.addonsPrice || 0);
        await updateDoc(doc(cartRef, item.id), { 
          quantity: newQty,
          unitPrice: newUnitPrice,
          totalPrice: newUnitPrice * newQty
        });
      });

      // Remove button
      const removeBtn = itemDiv.querySelector('.remove-btn');
      removeBtn.addEventListener('click', async () => {
        await deleteDoc(doc(cartRef, item.id));
      });

      cartItemsDiv.appendChild(itemDiv);
      grandTotal += totalPrice;
    });

    cartTotalSpan.textContent = grandTotal.toFixed(2);
  }, err => {
    console.error("Error loading cart:", err);
    cartItemsDiv.innerHTML = '<p>Failed to load cart.</p>';
    cartTotalSpan.textContent = '0.00';
  });
}

// ----------------------
// CHECKOUT
// ----------------------
checkoutBtn?.addEventListener('click', async () => {
  if (!currentUser) return alert("Please log in to checkout.");
  if (!cartItems.length) return alert("Your cart is empty!");

  try {
    const queueNumber = await getNextQueueNumber();
    const cartRef = collection(db, 'users', currentUser.uid, 'cart');

    const orderItems = cartItems.map(item => ({
      product: item.name,
      productId: item.productId || null,
      size: item.size || null,
      sizeId: item.sizeId || null,
      qty: item.quantity || 1,
      basePrice: Number(item.basePrice || 0),
      sizePrice: Number(item.sizePrice || 0),
      addonsPrice: Number(item.addonsPrice || 0),
      addons: item.addons || [],
      total: Number(item.totalPrice || 0)
    }));

    await addDoc(collection(db, 'DeliveryOrders'), {
      userId: currentUser.uid,
      customerName: currentUser.displayName || currentUser.email || "Customer",
      queueNumber,
      orderType: 'Delivery',
      items: orderItems,
      total: orderItems.reduce((sum, i) => sum + i.total, 0),
      status: 'Pending',
      createdAt: serverTimestamp()
    });

    for (const item of cartItems) {
      await deleteDoc(doc(cartRef, item.id));
    }

    alert(`Checkout successful! Queue #${queueNumber}`);
  } catch (err) {
    console.error("Checkout failed:", err);
    alert("Checkout failed. Please try again.");
  }
});

// ----------------------
// GET NEXT QUEUE NUMBER
// ----------------------
async function getNextQueueNumber() {
  const q = query(collection(db, "DeliveryOrders"), orderBy("queueNumber", "desc"), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty ? (snapshot.docs[0].data().queueNumber || 0) + 1 : 1;
}
