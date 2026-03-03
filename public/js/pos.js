let cart = [];
let products = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupSearch();
});

async function loadProducts() {
    try {
        products = await API.get('/api/products');
        renderProductList(products);
    } catch (err) {
        console.error("Failed to load products", err);
    }
}

function renderProductList(list) {
    const container = document.getElementById('product-list');
    
    container.innerHTML = list.map((p, index) => {
        const bgColor = index % 2 === 0 ? 'bg-danger  text-white' : 'bg-white'; 
        return `
        <div class="col-md-4 mb-3">
            <div class="card product-card ${bgColor} ${p.quantity <= 0 ? 'opacity-50' : ''}" 
                 onclick="addToCart(${p.id})" 
                 style="cursor: pointer;">
                <div class="card-body">
                    <h6 class="card-title">${p.name}</h6>
                    <p class="card-text">
                        Rs. ${p.price.toLocaleString()} <br> 
                        <small class="text-muted">Stock: ${p.quantity}</small>
                    </p>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity <= 0) return alert('Out of stock');

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


window.updateQty = function(index, delta) {
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

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
};

function renderCart() {
    const tbody = document.getElementById('cart-body');
    let total = 0;
    
    tbody.innerHTML = cart.map((item, index) => {
        const subtotal = item.price * item.cartQuantity;
        total += subtotal;
        return `
            <tr>
                <td>${item.name}<br><small class="text-muted">Rs. ${item.price}</small></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="updateQty(${index}, -1)">-</button>
                        <span class="btn border-top border-bottom" style="width:40px">${item.cartQuantity}</span>
                        <button class="btn btn-outline-secondary" onclick="updateQty(${index}, 1)">+</button>
                    </div>
                </td>
                <td class="text-end">Rs. ${subtotal.toLocaleString()}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-link text-danger" onclick="removeFromCart(${index})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('grand-total').innerText = total.toLocaleString();
}

async function checkout() {
    if (cart.length === 0) return alert("Cart is empty");
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    
    try {
        const result = await API.post('/api/sales/checkout', { items: cart, total });
        showReceipt(result.saleId, total, [...cart]);
        cart = [];
        renderCart();
        await loadProducts();
    } catch (err) {
        alert(err.message);
    }
}

function showReceipt(id, total, items) {
    const date = new Date().toLocaleString();
    
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
        
        <div class="d-flex justify-content-between mb-3 small">
            <span><strong>Sale ID:</strong> #${id}</span>
            <span><strong>Date:</strong> ${date}</span>
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

        <div class="d-flex justify-content-between mt-3">
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
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(term) || p.barcode.includes(term)
        );
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
