import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// DOM Elements
const historyContainer = document.querySelector('.history-container');
const loginPopup = document.getElementById('loginPopup');
const loginRedirect = document.getElementById('loginRedirect');

loginRedirect.addEventListener('click', () => window.location.href = 'login.html');

const auth = getAuth();
const storage = getStorage();
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!currentUser) {
    loginPopup.style.display = 'flex';
    return;
  }
  await loadHistory();
});

async function loadHistory() {
  historyContainer.innerHTML = '';

  const ordersSnapshot = await getDocs(collection(db, "DeliveryOrders"));

  const userOrders = ordersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(order => 
      order.userId === currentUser.uid &&
      (order.status?.includes("Completed") || order.status?.includes("Canceled"))
    );

  if (userOrders.length === 0) {
    historyContainer.innerHTML = '<p>You have no completed or cancelled orders yet.</p>';
    return;
  }

  for (let order of userOrders) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const date = order.createdAt?.toDate?.()?.toLocaleString() || "Unknown date";
    card.innerHTML = `
      <h3>Order #${order.queueNumber || order.id}</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p class="status ${order.status}">Status: ${order.status}</p>
      <div class="order-items"></div>
    `;

    const itemsContainer = card.querySelector('.order-items');

    for (let item of order.items || []) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'order-item';
      itemDiv.style.display = 'flex';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.gap = '10px';
      itemDiv.style.marginBottom = '8px';

      let imgUrl = null;

      // If item.image is a storage path, get download URL
      if (item.image) {
        try {
          imgUrl = await getDownloadURL(ref(storage, item.image));
        } catch (err) {
          console.error('Failed to load image:', err);
          imgUrl = 'placeholder.png';
        }
      }

      if (imgUrl) {
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = item.product || 'Product Image';
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';
        itemDiv.appendChild(img);
      }

      const nameP = document.createElement('p');
      nameP.textContent = item.product || 'Unnamed Item';
      nameP.style.margin = 0;
      itemDiv.appendChild(nameP);

      itemsContainer.appendChild(itemDiv);
    }

    historyContainer.appendChild(card);
  }
}

// Close popup if clicked outside
window.addEventListener('click', e => {
  if (e.target === loginPopup) loginPopup.style.display = 'none';
});
