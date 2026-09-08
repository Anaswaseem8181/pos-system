let cart = [];
let products = [];
let currentUser = null;
let currentCategory = 'All';

document.addEventListener('DOMContentLoaded', async () => {
	await fetchUser();
	await loadProducts();
	await loadCustomers();
	setupSearch();

	//  LOGOUT
	const logoutBtn = document.getElementById('logout-btn');
	if (logoutBtn) {
		logoutBtn.addEventListener('click', async () => {
			await API.post('/api/auth/logout');
			window.location.href = '/';
		});
	}

	// New Customer Handler
	document.getElementById('add-customer-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const data = {
			name: document.getElementById('c-name').value,
			phone: document.getElementById('c-phone').value
		};
		try {
			const newCust = await API.post('/api/customers', data);
			bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
			await loadCustomers();
			document.getElementById('customer-select').value = newCust.id;
			e.target.reset();
		} catch (err) { API.showToast(err.message, 'error'); }
	});

	// Discount listener
	document.getElementById('discount-input').addEventListener('input', renderCart);
});

async function loadCustomers() {
	try {
		const customers = await API.get('/api/customers');
		const select = document.getElementById('customer-select');
		select.innerHTML = customers.map(c => `
            <option value="${c.id}">${c.name} (${c.phone})</option>
        `).join('');
	} catch (err) { console.error("Failed to load customers", err); }
}

async function fetchUser() {
	try {
		const result = await API.get('/api/auth/me');
		currentUser = result.user;

		const titleEl = document.getElementById('terminal-title');
		if (titleEl) {
			titleEl.innerHTML = `🛒 POS Terminal - <small class="fw-normal">${currentUser.username} (${currentUser.role})</small>`;
		}

		if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
			document.getElementById('dashboard-link').classList.remove('d-none');
		}
	} catch (err) {
		console.error("Failed to fetch user", err);
	}
}

async function loadProducts() {
	try {
		products = await API.get('/api/products?activeOnly=true');
		renderCategories();
		renderProductList(products);
	} catch (err) {
		console.error("Failed to load products", err);
	}
}

function renderCategories() {
	const categories = ['All', ...new Set(products.map(p => p.category || 'General'))];
	const container = document.getElementById('category-list');

	container.innerHTML = categories.map(cat => `
        <div class="category-pill ${currentCategory === cat ? 'active' : ''}" 
             onclick="filterByCategory('${cat}')">${cat}</div>
    `).join('');
}

window.filterByCategory = function (category) {
	currentCategory = category;
	renderCategories();

	const searchTerm = document.getElementById('search-input').value.toLowerCase();
	const filtered = products.filter(p => {
		const matchesCat = category === 'All' || (p.category || 'General') === category;
		const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.barcode.includes(searchTerm);
		return matchesCat && matchesSearch;
	});
	renderProductList(filtered);
};

function renderProductList(list) {
	const container = document.getElementById('product-list');

	container.innerHTML = list.map((p, index) => {
		const cartItem = cart.find(item => item.id === p.id);
		const availableQty = p.quantity - (cartItem ? cartItem.cartQuantity : 0);
		const bgColor = index % 2 === 0 ? 'bg-light' : 'bg-white';
		const isLowStock = availableQty > 0 && availableQty < 10;

		return `
        <div class="col-12 mb-2">
            <div class="card product-card ${bgColor} ${availableQty <= 0 ? 'opacity-50' : ''} ${isLowStock ? 'low-stock' : ''}" 
                 onclick="addToCart(${p.id})" 
                 style="cursor: pointer; position: relative;">
                ${isLowStock ? '<div class="low-stock-badge">LOW STOCK</div>' : ''}
                <div class="card-body d-flex justify-content-between align-items-center py-2">
                    <div>
                        <h6 class="mb-0">${p.name}</h6>
                        <small class="text-muted">Barcode: ${p.barcode}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-primary">Rs. ${p.price.toLocaleString()}</div>
                        <small class="${availableQty < 10 ? 'text-danger fw-bold' : 'text-muted'}">
                            Stock: ${availableQty}
                        </small>
                    </div>
                </div>
            </div>
        </div>
        `;
	}).join('');
}

function addToCart(productId) {
	const product = products.find(p => p.id === productId);
	if (!product || product.quantity <= 0) return API.showToast('Out of stock', 'error');

	const existing = cart.find(item => item.id === productId);
	if (existing) {
		if (existing.cartQuantity < product.quantity) {
			existing.cartQuantity++;
		} else {
			alert('Maximum stock reached');
		}
	} else {
		cart.push({ ...product, cartQuantity: 1 });
	}
	renderCart();
}


window.updateQty = function (index, delta) {
	const item = cart[index];
	const product = products.find(p => p.id === item.id);

	if (delta > 0) {
		if (item.cartQuantity < product.quantity) {
			item.cartQuantity++;
		} else {
			alert("No more stock available");
		}
	} else {
		if (item.cartQuantity > 1) {
			item.cartQuantity--;
		} else {
			removeFromCart(index);
			return;
		}
	}
	renderCart();
};

window.removeFromCart = function (index) {
	cart.splice(index, 1);
	renderCart();
};

function renderCart() {
	const tbody = document.getElementById('cart-body');
	let subtotal = 0;
	let itemCount = 0;

	tbody.innerHTML = cart.map((item, index) => {
		const itemSubtotal = item.price * item.cartQuantity;
		subtotal += itemSubtotal;
		itemCount += item.cartQuantity;
		return `
            <div class="cart-item">
                <div class="flex-grow-1">
                    <div class="fw-bold">${item.name}</div>
                    <small class="text-muted">Rs. ${item.price.toLocaleString()} x ${item.cartQuantity}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="btn-group btn-group-sm shadow-sm">
                        <button class="btn btn-light border" onclick="updateQty(${index}, -1)">-</button>
                        <span class="btn btn-light border disabled fw-bold" style="min-width:35px">${item.cartQuantity}</span>
                        <button class="btn btn-light border" onclick="updateQty(${index}, 1)">+</button>
                    </div>
                    <button class="btn btn-sm text-danger px-1" onclick="removeFromCart(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
	}).join('');

	if (cart.length === 0) {
		tbody.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-cart-x" style="font-size: 3rem;"></i>
                <p class="mt-2">Cart is empty</p>
            </div>
        `;
	}

	const discountPercent = parseFloat(document.getElementById('discount-input').value) || 0;
	const discountAmount = (subtotal * discountPercent) / 100;
	const grandTotal = Math.max(0, subtotal - discountAmount);

	document.getElementById('grand-total').innerText = grandTotal.toLocaleString();
	document.getElementById('subtotal').innerText = subtotal.toLocaleString();
	document.getElementById('cart-count').innerText = `${itemCount} items`;

	const searchTerm = document.getElementById('search-input').value.toLowerCase();
	const filtered = products.filter(p => {
		const matchesCat = currentCategory === 'All' || (p.category || 'General') === currentCategory;
		const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.barcode.includes(searchTerm);
		return matchesCat && matchesSearch;
	});
	renderProductList(filtered);
}

async function checkout() {
	if (cart.length === 0) return API.showToast("Cart is empty", "error");

	const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
	const discountPercent = parseFloat(document.getElementById('discount-input').value) || 0;
	const discountAmount = (subtotal * discountPercent) / 100;
	const total = Math.max(0, subtotal - discountAmount);
	const customerId = document.getElementById('customer-select').value;

	try {
		const result = await API.post('/api/sales/checkout', {
			items: cart,
			discountPercent,
			customerId
		});
		showReceipt(result.saleId, subtotal, discountPercent, discountAmount, total, [...cart]);
		cart = [];
		document.getElementById('discount-input').value = 0;
		renderCart();
		await loadProducts();
		API.showToast("Sale completed successfully!");
	} catch (err) {
		API.showToast("Checkout failed: " + err.message, 'error');
	}
}

function showReceipt(id, subtotal, discountPercent, discountAmount, total, items) {
	const date = new Date().toLocaleString();
	const cashierName = currentUser ? currentUser.username : 'Unknown';
	const customerName = document.getElementById('customer-select').options[document.getElementById('customer-select').selectedIndex].text;

	const itemRows = items.map(i => `
        <tr>
            <td>
                <strong>${i.name}</strong><br>
                <small class="text-muted">Rs. ${i.price.toLocaleString()} x ${i.cartQuantity}</small>
            </td>
            <td class="text-end align-middle">
                Rs. ${(i.price * i.cartQuantity).toLocaleString()}
            </td>
        </tr>
    `).join('');

	const receiptHTML = `
        <div class="text-center mb-4">
            <h4 class="mb-0">RETAIL SHOP</h4>
            <p class="text-muted small">Official Sale Receipt</p>
        </div>
        
        <div class="d-flex justify-content-between mb-2 small">
            <span><strong>Sale ID:</strong> #${id}</span>
            <span><strong>Date:</strong> ${date}</span>
        </div>
        <div class="mb-1 small">
            <strong>Cashier:</strong> ${cashierName}
        </div>
        <div class="mb-3 small border-bottom pb-2">
            <strong>Customer:</strong> ${customerName}
        </div>

        <table class="table table-sm table-borderless border-top border-bottom">
            <thead>
                <tr class="small text-muted text-uppercase">
                    <th>Item Description</th>
                    <th class="text-end">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
        </table>

        <div class="d-flex justify-content-between mt-3 small">
            <span>Subtotal</span>
            <span>Rs. ${subtotal.toLocaleString()}</span>
        </div>
        ${discountPercent > 0 ? `
        <div class="d-flex justify-content-between text-danger small">
            <span>Discount (${discountPercent}%)</span>
            <span>- Rs. ${discountAmount.toLocaleString()}</span>
        </div>
        ` : ''}
        <div class="d-flex justify-content-between mt-2">
            <span class="h5">Grand Total</span>
            <span class="h5 text-primary">Rs. ${total.toLocaleString()}</span>
        </div>
        
        <div class="text-center mt-4 border-top pt-3">
            <p class="mb-0 small">Thank you for shopping with us!</p>
            <p class="text-muted" style="font-size: 0.75rem;">Please keep this for your records.</p>
        </div>
    `;

	document.getElementById('receipt-body').innerHTML = receiptHTML;
	new bootstrap.Modal(document.getElementById('receiptModal')).show();
}

function setupSearch() {
	document.getElementById('search-input').addEventListener('input', (e) => {
		const term = e.target.value.toLowerCase();
		const filtered = products.filter(p => {
			const matchesCat = currentCategory === 'All' || (p.category || 'General') === currentCategory;
			const matchesSearch = p.name.toLowerCase().includes(term) || p.barcode.includes(term);
			return matchesCat && matchesSearch;
		});
		renderProductList(filtered);
	});
}
async function logout(event) {
	const btn = event.target;
	const originalText = btn.innerText;

	try {
		btn.disabled = true;
		btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';

		await API.post('/auth/logout');

		window.location.replace('/');
	} catch (error) {
		btn.disabled = false;
		btn.innerText = originalText;
		alert("Logout fail ho gaya!");
	}
}
