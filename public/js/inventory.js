let allProducts = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
	await fetchUser();
	applyRoleVisibility();
	loadInventory();
	loadReports();
	loadCategories();

	// ADD PRODUCT HANDLER
	document.getElementById('add-product-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const productData = {
			name: document.getElementById('p-name').value,
			barcode: document.getElementById('p-barcode').value,
			category: document.getElementById('p-category').value,
			price: parseFloat(document.getElementById('p-price').value),
			quantity: parseInt(document.getElementById('p-qty').value)
		};

		try {
			await API.post('/api/products', productData);
			bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
			e.target.reset();
			loadInventory();
		} catch (err) { API.showToast(err.message, 'error'); }
	});

	// EDIT PRODUCT HANDLER
	document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const id = document.getElementById('edit-p-id').value;
		const updatedData = {
			name: document.getElementById('edit-p-name').value,
			barcode: document.getElementById('edit-p-barcode').value,
			category: document.getElementById('edit-p-category').value,
			price: parseFloat(document.getElementById('edit-p-price').value),
			quantity: parseInt(document.getElementById('edit-p-qty').value)
		};

		try {
			await API.put(`/api/products/${id}`, updatedData);
			bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
			loadInventory();
			API.showToast('Product updated successfully!');
		} catch (err) { API.showToast("Update failed: " + err.message, 'error'); }
	});

	// ADD CATEGORY HANDLER
	document.getElementById('add-category-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const data = { name: document.getElementById('cat-name').value };
		try {
			await API.post('/api/categories', data);
			bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
			e.target.reset();
			loadCategories();
			API.showToast("Category added successfully!");
		} catch (err) { API.showToast(err.message, 'error'); }
	});

	//  LOGOUT
	const logoutBtn = document.getElementById('logout-btn');
	if (logoutBtn) {
		logoutBtn.addEventListener('click', async () => {
			await API.post('/api/auth/logout');
			window.location.href = '/';
		});
	}
});

async function fetchUser() {
	try {
		const result = await API.get('/api/auth/me');
		currentUser = result.user;
	} catch (err) { console.error("Failed to fetch user", err); }
}

function applyRoleVisibility() {
	if (!currentUser) return;
	if (currentUser.role !== 'ADMIN') {
		document.querySelectorAll('.admin-only').forEach(el => el.classList.add('d-none'));
	}
}

async function loadInventory() {
	try {
		allProducts = await API.get('/api/products');
		const tbody = document.getElementById('inventory-table');
		const isAdmin = currentUser && currentUser.role === 'ADMIN';

		fetchInventoryStats();

		if (!allProducts || allProducts.length === 0) {
			tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        No products found. Click "+ Add Product" to add one.
                    </td>
                </tr>
            `;
			return;
		}
		tbody.innerHTML = allProducts.map(p => `
            <tr class="${p.quantity < 10 ? 'table-danger-subtle' : ''} ${p.isActive === 0 ? 'opacity-50' : ''}">
                <td><code>${p.barcode}</code></td>
                <td>${p.name} ${p.isActive === 0 ? '<span class="badge bg-secondary ms-1">Inactive</span>' : ''}</td>
                <td>${p.category || 'General'}</td>
                <td>Rs. ${p.price.toLocaleString()}</td> 
                <td class="fw-bold ${p.quantity < 10 ? 'text-danger' : ''}">${p.quantity}</td>
                <td>
                    <span class="badge ${p.isActive ? 'bg-success' : 'bg-danger'}">${p.isActive ? 'Active' : 'Deactive'}</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-warning" onclick="openEditModal(${p.id})">Edit</button>
                        ${isAdmin ? `
                            <button class="btn ${p.isActive ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="toggleStatus(${p.id})">
                                ${p.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-danger" onclick="deleteProduct(${p.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

		const lowStockItems = allProducts.filter(p => p.quantity < 10 && p.isActive === 1);
		const lowStockCountEl = document.getElementById('stat-low-stock');
		const sidebarBadge = document.getElementById('sidebar-low-stock-count');

		if (lowStockCountEl) lowStockCountEl.innerText = lowStockItems.length;
		if (sidebarBadge) {
			if (lowStockItems.length > 0) {
				sidebarBadge.innerText = lowStockItems.length;
				sidebarBadge.classList.remove('d-none');
			} else {
				sidebarBadge.classList.add('d-none');
			}
		}

		const lowStockList = document.getElementById('low-stock-list');
		if (lowStockList) {
			lowStockList.innerHTML = lowStockItems.map(p => `
                <li class="list-group-item d-flex justify-content-between align-items-center py-3 border-0 border-bottom">
                    <div>
                        <div class="fw-bold small">${p.name}</div>
                        <small class="text-muted">Barcode: ${p.barcode}</small>
                    </div>
                    <span class="badge bg-danger rounded-pill">${p.quantity}</span>
                </li>
            `).join('');

			if (lowStockItems.length === 0) {
				lowStockList.innerHTML = '<li class="list-group-item text-center py-4 text-muted border-0">All items are sufficiently stocked.</li>';
			}
		}
	} catch (err) {
		console.error("Error loading inventory:", err);
	}
}

function openEditModal(id) {
	const product = allProducts.find(p => p.id === id);
	if (!product) return;

	document.getElementById('edit-p-id').value = product.id;
	document.getElementById('edit-p-name').value = product.name;
	document.getElementById('edit-p-barcode').value = product.barcode;
	document.getElementById('edit-p-category').value = product.category;
	document.getElementById('edit-p-price').value = product.price;
	document.getElementById('edit-p-qty').value = product.quantity;

	new bootstrap.Modal(document.getElementById('editProductModal')).show();
}

async function deleteProduct(id) {
	if (!confirm('Are you sure?')) return;
	await API.delete(`/api/products/${id}`);
	loadInventory();
}

async function loadReports() {
	const start = document.getElementById('report-start').value;
	const end = document.getElementById('report-end').value;
	let url = '/api/sales/report';
	if (start && end) url += `?startDate=${start}&endDate=${end}`;

	try {
		const sales = await API.get(url);
		fetchTopProducts(start, end); // Update analytics list
		const tbody = document.getElementById('sales-table');
		let totalRev = 0;

		tbody.innerHTML = sales.map(s => {
			totalRev += s.total;
			return `
                <tr>
                    <td class="small text-muted">${new Date(s.date).toLocaleString()}</td>
                    <td>${s.customer_name || 'Walk-in'}</td>
                    <td class="small">${s.username}</td>
                    <td class="text-end fw-bold">Rs. ${s.total.toLocaleString()}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary py-0" onclick="viewSaleDetails(${s.id})">
                            <i class="bi bi-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
		}).join('');

		if (sales.length === 0) {
			tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No sales found for this period.</td></tr>';
		}

		document.getElementById('stat-revenue').innerText = `Rs. ${totalRev.toLocaleString()}`;
		document.getElementById('stat-count').innerText = sales.length;
	} catch (err) {
		console.error("Failed to load reports", err);
	}
}

async function fetchTopProducts(start, end) {
	let url = '/api/sales/top-products?limit=5';
	if (start && end) url += `&startDate=${start}&endDate=${end}`;

	try {
		const top = await API.get(url);
		const tbody = document.getElementById('top-selling-table');
		if (!tbody) return;

		if (top.length === 0) {
			tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted small">No sales data</td></tr>';
			return;
		}

		tbody.innerHTML = top.map(p => `
            <tr>
                <td class="align-middle">${p.name} <br><small class="text-muted">${p.category || 'General'}</small></td>
                <td class="text-end fw-bold align-middle">${p.total_sold}</td>
                <td class="text-end align-middle">Rs. ${p.total_revenue.toLocaleString()}</td>
            </tr>
        `).join('');
	} catch (err) {
		console.error("Failed to fetch top products:", err);
	}
}

async function fetchInventoryStats() {
	try {
		const stats = await API.get('/api/products/stats');
		const valueEl = document.getElementById('stat-inventory-value');
		if (valueEl) {
			valueEl.innerText = `Rs. ${(stats.total_value || 0).toLocaleString()}`;
		}
	} catch (err) {
		console.error("Failed to fetch inventory stats:", err);
	}
}

async function toggleStatus(id) {
	try {
		await API.patch(`/api/products/${id}/toggle-status`);
		loadInventory();
		API.showToast("Product status updated!");
	} catch (err) { API.showToast(err.message, 'error'); }
}

async function viewSaleDetails(id) {
	try {
		const sale = await API.get(`/api/sales/${id}`);
		const content = document.getElementById('sale-slip-content');

		content.innerHTML = `
            <div class="text-center small mb-3">
                <div class="fw-bold">Receipt ID: #${sale.id}</div>
                <div>Date: ${new Date(sale.date).toLocaleString()}</div>
                <div>Cashier: ${sale.username}</div>
            </div>
            <hr class="my-2 border-dashed">
            <div class="small mb-2">
                <strong>Customer:</strong> ${sale.customer_name || 'Walk-in'}<br>
                ${sale.customer_phone ? `<strong>Phone:</strong> ${sale.customer_phone}` : ''}
            </div>
            <table class="table table-sm table-borderless small mb-2">
                <thead>
                    <tr class="border-bottom">
                        <th>Item</th>
                        <th class="text-end">Qty</th>
                        <th class="text-end">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td class="text-end">x${item.quantity}</td>
                            <td class="text-end">${(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr class="my-2">
            <div class="small">
                <div class="d-flex justify-content-between">
                    <span>Discount:</span>
                    <span>Rs. ${sale.discount.toLocaleString()}</span>
                </div>
                <div class="d-flex justify-content-between fw-bold fs-6">
                    <span>Total:</span>
                    <span>Rs. ${sale.total.toLocaleString()}</span>
                </div>
            </div>
        `;

		new bootstrap.Modal(document.getElementById('saleDetailModal')).show();
	} catch (err) {
		API.showToast("Failed to load sale details", "error");
	}
}

async function loadCategories() {
	try {
		const categories = await API.get('/api/categories');
		const table = document.getElementById('categories-table');
		const pSelect = document.getElementById('p-category');
		const editPSelect = document.getElementById('edit-p-category');

		if (table) {
			table.innerHTML = categories.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${c.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
		}

		if (pSelect && editPSelect) {
			const options = '<option value="">Select Category</option>' +
				categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

			pSelect.innerHTML = options;
			editPSelect.innerHTML = options;
		}

	} catch (err) { console.error("Failed to load categories", err); }
}

async function deleteCategory(id) {
	if (!confirm('Deleting a category will not delete products, but they will become uncategorized. Continue?')) return;
	try {
		await API.delete(`/api/categories/${id}`);
		loadCategories();
		API.showToast("Category deleted");
	} catch (err) { API.showToast(err.message, 'error'); }
}

function exportInventory() {
	const date = new Date().toLocaleString();
	const printWindow = window.open('', '_blank');

	let html = `
		<html>
		<head>
			<title>Inventory Report - ${date}</title>
			<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
			<style>
				body { padding: 40px; font-family: 'Inter', sans-serif; }
				.report-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
				.table thead { background-color: #f8f9fa; }
			</style>
		</head>
		<body>
			<div class="report-header">
				<h1 class="display-5 fw-bold">Inventory Status Report</h1>
				<p class="text-muted">Generated on: ${date}</p>
			</div>
			<table class="table table-striped table-bordered">
				<thead>
					<tr>
						<th>Barcode</th>
						<th>Product Name</th>
						<th>Category</th>
						<th class="text-end">Price</th>
						<th class="text-end">Stock Level</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
	`;

	allProducts.forEach(p => {
		html += `
			<tr>
				<td><code>${p.barcode}</code></td>
				<td>${p.name}</td>
				<td>${p.category || 'General'}</td>
				<td class="text-end">Rs. ${p.price.toLocaleString()}</td>
				<td class="text-end ${p.quantity < 10 ? 'fw-bold text-danger' : ''}">${p.quantity}</td>
				<td>${p.isActive ? 'Active' : 'Inactive'}</td>
			</tr>
		`;
	});

	html += `
				</tbody>
			</table>
			<div class="mt-4 text-center small text-muted">
				End of Report
			</div>
			<script>
				window.onload = () => {
					window.print();
					// window.close(); // Optional: close after printing
				};
			</script>
		</body>
		</html>
	`;

	printWindow.document.write(html);
	printWindow.document.close();
}
