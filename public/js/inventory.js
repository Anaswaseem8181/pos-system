let allProducts = []; 
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    loadReports();

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
        } catch (err) { alert(err.message); }
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
            alert('Product updated successfully!');
        } catch (err) { alert("Update failed: " + err.message); }
    });

    //  LOGOUT
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await API.post('/auth/logout');
        window.location.href = '/';
    });
});

async function loadInventory() {
    try {
        allProducts = await API.get('/api/products');
        const tbody = document.getElementById('inventory-table');

        if (!allProducts || allProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        No products found. Click "New Product" to add one.
                    </td>
                </tr>
            `;
            return;
        }
       tbody.innerHTML = allProducts.map(p => `
            <tr>
                <td><code>${p.barcode}</code></td>
                <td>${p.name}</td>
                <td>${p.category || 'General'}</td>
                <td>Rs. ${p.price.toLocaleString()}</td> 
                <td>${p.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="openEditModal(${p.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            </tr>
        `).join('');
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
    const sales = await API.get('/api/sales/report');
    const tbody = document.getElementById('sales-table');
    let totalRev = 0;
    tbody.innerHTML = sales.map(s => {
        totalRev += s.total;
        return `<tr><td>${s.date}</td><td>Rs. ${s.total.toLocaleString()}</td></tr>`;
    }).join('');
    document.getElementById('stat-revenue').innerText = `Rs. ${totalRev.toLocaleString()}`;
    document.getElementById('stat-count').innerText = sales.length;
}
