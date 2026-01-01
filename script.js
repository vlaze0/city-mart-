

// Test if script is loading
console.log('Script loaded successfully');

// Function to calculate discounted price
function calculateDiscountedPrice(price, discount) {
    if (!discount || discount === '') return price;

    // Parse discount string like "Up to 5% Off"
    const match = discount.match(/(\d+(?:\.\d+)?)%/);
    if (match) {
        const discountPercent = parseFloat(match[1]);
        return price * (1 - discountPercent / 100);
    }

    return price;
}

// Global variables
let cart = [];
let currentUser = null;
let pendingProduct = null;

// Function to show vendors modal
function showVendorsModal() {
    const modal = document.getElementById('vendors-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Function to close vendors modal
function closeVendorsModal() {
    const modal = document.getElementById('vendors-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to show cart modal
function showCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'block';
        displayCart();
    }
}

// Function to close cart modal
function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to show checkout modal
function showCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Function to close checkout modal
function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to show vendor products modal
function showVendorProductsModal() {
    const modal = document.getElementById('vendor-products-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Function to close vendor products modal
function closeVendorProductsModal() {
    const modal = document.getElementById('vendor-products-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to navigate to products
function navigateToProducts(category) {
    closeVendorsModal();
    showVendorProductsModal();
    document.getElementById('vendor-products-title').textContent = category;
    fetchProducts(category);
}

// Function to fetch products from backend
async function fetchProducts(category) {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const products = await response.json();
        // Filter products by category if needed
        const filteredProducts = products.filter(product => 
            product.category.toLowerCase().includes(category.toLowerCase().split(' ')[0])
        );
        displayProducts(filteredProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to load products. Please try again later.');
    }
}

// Function to display products
function displayProducts(products) {
    const grid = document.getElementById('vendor-products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<p>No products found in this category.</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
        return `
        <div class="product-card">
            <img src="${product.image || './images/placeholder.jpg'}" alt="${product.name}" onerror="this.src='./images/placeholder.jpg'">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="price">₹${discountedPrice.toFixed(2)}${product.discount ? ` <span style="text-decoration: line-through; color: gray;">₹${product.price}</span>` : ''}</p>
                ${product.discount ? `<p style="color: green; font-size: 0.9em;">${product.discount}</p>` : ''}
                <button class="add-to-cart" onclick="addToCart('${product._id}', '${product.name}', ${discountedPrice}, '${product.category}', '${product.image || './images/placeholder.jpg'}', '${product.discount}')">Add to Cart</button>
            </div>
        </div>
    `}).join('');
}

// Function to add item to cart
function addToCart(id, name, price, category, image, discount) {
    if (category && category.toLowerCase().includes('pet')) {
        pendingProduct = { id, name, price, image, discount };
        showGenderModal();
    } else {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1, image, discount });
        }
        updateCartCount();
        alert(`${name} added to cart!`);
    }
}

// Function to update cart count
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Function to display cart
function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (!cartItems || !cartTotal) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        cartTotal.textContent = '0.00';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || './images/placeholder.jpg'}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
            <div class="cart-item-info">
                <h4>${item.name}${item.gender ? ` (${item.gender})` : ''}</h4>
                <p>Price: ₹${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Total: ₹${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

// Function to remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartCount();
    displayCart();
}

// Function to show gender modal
function showGenderModal() {
    const modal = document.getElementById('gender-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Function to close gender modal
function closeGenderModal() {
    const modal = document.getElementById('gender-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingProduct = null;
}

// Function to select gender
function selectGender(gender) {
    if (pendingProduct) {
        const { id, name, price, discount } = pendingProduct;
        const existingItem = cart.find(item => item.id === id && item.gender === gender);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1, gender, discount });
        }
        updateCartCount();
        alert(`${name} (${gender}) added to cart!`);
        closeGenderModal();
    }
}

// Function to checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    closeCartModal();
    showCheckoutModal();
}

// Function to handle checkout form submission
document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const address = document.getElementById('address').value;
            const phone = document.getElementById('phone').value;

            // Get current user
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to place an order.');
                return;
            }

            const products = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            try {
                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        products,
                        totalAmount
                    })
                });

                if (response.ok) {
                    alert('Order placed successfully!');
                    cart = [];
                    updateCartCount();
                    closeCheckoutModal();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Failed to place order.');
                }
            } catch (error) {
                console.error('Checkout error:', error);
                alert('Failed to place order. Please try again.');
            }
        });
    }
});

// Function to show the orders modal
function showOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'block';
        fetchOrders();
    }
}

// Function to close the orders modal
function closeOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to fetch orders from the backend
async function fetchOrders() {
    try {
        const response = await fetch('http://localhost:3000/api/orders');
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        alert('Failed to load orders. Please try again later.');
    }
}

// Function to display orders in the modal
function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            <h3>Order ID: ${order._id}</h3>
            <p>Status: ${order.status}</p>
            <p>Total Amount: ₹${order.totalAmount}</p>
            <p>Created At: ${new Date(order.createdAt).toLocaleString()}</p>
            <h4>Products:</h4>
            <ul>
                ${order.products.map(product => `
                    <li>${product.name} - Quantity: ${product.quantity} - Price: ₹${product.price}</li>
                `).join('')}
            </ul>
            ${order.status === 'pending' ? `<button onclick="confirmOrder('${order._id}')">Confirm Order</button>` : ''}
        </div>
    `).join('');
}

// Function to confirm an order
async function confirmOrder(orderId) {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to confirm order');
        }
        alert('Order confirmed successfully!');
        fetchOrders(); // Refresh the orders list
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('Failed to confirm order. Please try again.');
    }
}

// Function to show login modal
function showLoginModal(role = null) {
    closeLoginOptionsModal();
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    const roleTitle = role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Login` : 'Login';
    modal.innerHTML = `
        <div class="auth-content">
            <span class="close" onclick="closeAuthModal()">&times;</span>
            <h2>${roleTitle}</h2>
            <form id="login-form">
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <a href="#" onclick="showRegisterModal('${role || ''}')">Register</a></p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Handle form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Function to show register modal
function showRegisterModal(role = null) {
    closeAuthModal();
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    const roleOptions = [
        { value: 'customer', label: 'Customer' },
        { value: 'vendor', label: 'Vendor' }
    ];
    const optionsHtml = roleOptions.map(option =>
        `<option value="${option.value}" ${role === option.value ? 'selected' : ''}>${option.label}</option>`
    ).join('');
    modal.innerHTML = `
        <div class="auth-content">
            <span class="close" onclick="closeAuthModal()">&times;</span>
            <h2>Register</h2>
            <form id="register-form">
                <input type="text" id="register-username" placeholder="Username" required>
                <input type="email" id="register-email" placeholder="Email" required>
                <input type="password" id="register-password" placeholder="Password" required>
                <select id="register-role">
                    ${optionsHtml}
                </select>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="#" onclick="showLoginModal('${role || ''}')">Login</a></p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Handle form submission
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

// Function to close auth modal
function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) {
        modal.remove();
    }
}

// Function to handle login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            closeAuthModal();
            alert('Login successful!');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Function to handle register
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
        const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            showLoginModal();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// Function to show login options
function showLoginOptions() {
    const modal = document.createElement('div');
    modal.className = 'login-options-modal';
    modal.innerHTML = `
        <div class="login-options-content">
            <span class="close" onclick="closeLoginOptionsModal()">&times;</span>
            <h2>Choose Login Type</h2>
            <div class="login-options">
                <button onclick="showLoginModal('vendor')">Vendor Login</button>
                <button onclick="showLoginModal('customer')">Customer Login</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Function to close login options modal
function closeLoginOptionsModal() {
    const modal = document.querySelector('.login-options-modal');
    if (modal) {
        modal.remove();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orders-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
