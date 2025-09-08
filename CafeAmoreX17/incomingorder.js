import { db } from './firebase-config.js';
import { 
    collection, doc, onSnapshot, updateDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ordersBody = document.getElementById("ordersBody");
const tabButtons = document.querySelectorAll(".tab-btn");

let ordersData = [];
let selectedTab = "Pending"; // default tab

// 🔹 Helper: format queue number
function formatQueueNumber(num) {
    return num ? num.toString().padStart(4, "0") : "----";
}

// 🔹 Tab switch handler
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedTab = btn.dataset.status;
        renderOrders();
    });
});

// 🔹 Listen for In-Store Orders only
onSnapshot(collection(db, "InStoreOrders"), snapshot => 
    handleOrderSnapshot(snapshot, "In-Store", "InStoreOrders")
);

// 🔹 Handle snapshot
function handleOrderSnapshot(snapshot, type, collectionName) {
    snapshot.docChanges().forEach(change => {
        const docSnap = change.doc;
        const order = {
            id: docSnap.id,
            type: type,
            collection: collectionName,
            data: {
                status: docSnap.data().status || "Pending",
                ...docSnap.data()
            }
        };
        const existingIndex = ordersData.findIndex(o => o.id === docSnap.id);

        if (change.type === "removed") {
            ordersData = ordersData.filter(o => o.id !== docSnap.id);
        } else if (existingIndex >= 0) {
            ordersData[existingIndex] = order;
        } else {
            ordersData.push(order);
        }
    });
    renderOrders();
}

// 🔹 Render orders
function renderOrders() {
    ordersBody.innerHTML = "";

    ordersData
        .filter(orderItem => orderItem.data.status === selectedTab)
        .forEach(orderItem => {
            const order = orderItem.data;
            const orderId = orderItem.id;

            let tr = document.createElement("tr");
            let orderHtml = "";

            (order.products || order.items || []).forEach(p => {
                const addons = p.addons?.length 
                    ? ` (Add-ons: ${p.addons.map(a => a.name).join(", ")})` 
                    : "";
                let sizeText = "";

                if (p.size) {
                    if (typeof p.size === "string") sizeText = ` [${p.size}]`;
                    else if (p.size.name) sizeText = ` [${p.size.name}]`;
                }

                orderHtml += `<div>${p.qty} x ${p.product}${sizeText}${addons}</div>`;
            });

            const queueNumber = formatQueueNumber(order.queueNumber);

            // Determine action buttons based on status (Delivery removed)
            let actionBtnHtml = "";
            switch(order.status) {
                case "Pending":
                    actionBtnHtml = `
                        <button class="accept-btn" data-id="${orderId}" data-collection="${orderItem.collection}">Preparing</button>
                        <button class="cancel-btn" data-id="${orderId}" data-collection="${orderItem.collection}">Cancel</button>
                    `;
                    break;
                case "Preparing":
                    actionBtnHtml = `<button class="complete-btn" data-id="${orderId}" data-collection="${orderItem.collection}">Completed</button>`;
                    break;
                case "Completed":
                case "Canceled":
                    actionBtnHtml = "";
                    break;
            }

            tr.innerHTML = `
                <td>${queueNumber}</td>
                <td>${orderItem.type}</td>
                <td>${orderHtml || "No products"}</td>
                <td>${order.status}</td>
                <td>${actionBtnHtml}</td>
            `;

            ordersBody.appendChild(tr);
        });

    // Attach button handlers
    document.querySelectorAll(".accept-btn").forEach(btn => btn.addEventListener("click", e => {
        updateOrderStatus(e.target.dataset.id, e.target.dataset.collection, "Preparing");
    }));

    document.querySelectorAll(".cancel-btn").forEach(btn => btn.addEventListener("click", e => {
        updateOrderStatus(e.target.dataset.id, e.target.dataset.collection, "Canceled");
    }));

    document.querySelectorAll(".complete-btn").forEach(btn => btn.addEventListener("click", e => {
        updateOrderStatus(e.target.dataset.id, e.target.dataset.collection, "Completed");
    }));
}

// 🔹 Update order status
async function updateOrderStatus(orderId, collectionName, newStatus) {
    if (!orderId || !collectionName) return;

    try {
        const orderData = ordersData.find(o => o.id === orderId)?.data;
        if (!orderData) return;

        // Return stock if canceled
        if (newStatus === "Canceled") {
            const inventorySnapshot = await getDocs(collection(db, "Inventory"));

            for (const product of orderData.products || orderData.items || []) {
                const itemsUsed = [
                    ...(product.ingredients || []),
                    ...(product.addons || []),
                    ...(product.others || [])
                ];

                if (product.size) {
                    if (typeof product.size === "string") 
                        itemsUsed.push({ name: product.size, qty: 1 });
                    else if (product.size.name) 
                        itemsUsed.push({ name: product.size.name, qty: product.size.qty || 1 });
                }

                for (const item of itemsUsed) {
                    const invDoc = inventorySnapshot.docs.find(d => d.data().name === item.name);
                    if (!invDoc) continue;

                    const invData = invDoc.data();
                    const qtyUsed = (item.qty || 1) * (product.qty || 1);
                    await updateDoc(doc(db, "Inventory", invDoc.id), { 
                        quantity: (invData.quantity || 0) + qtyUsed 
                    });
                }
            }
        }

        await updateDoc(doc(db, collectionName, orderId), { status: newStatus });
        renderOrders();
    } catch (err) {
        console.error(err);
        alert("Failed to update order status.");
    }
}
