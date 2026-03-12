const API_BASE =
  window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : '';



// Script loaded
console.log('Script loaded');

// Function to add item to cart
function addToCart(id, name, price, category = null, image = null, options = {}) {
    const { gender = null, size = null, skipGenderModal = false } = options || {};

    // Check if it's a pet product (gender selection flow)
    if (!skipGenderModal && category && category.toLowerCase().includes('pet') && !gender) {
        pendingProduct = { id, name, price, category, image };
        showGenderModal();
        return;
    }

    const existingItem = cart.find(item => item.id === id && item.gender === gender && item.size === size);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1, image, gender, size });
    }
    saveCartToStorage();
    updateCartCount();
    updateCartDisplay();
    showToast(`${name} added to cart`, 'success');
}

// Cart array to store items
let cart = [];
let pendingProduct = null;
let toastContainer = null;
// Simple wallet balance stored in localStorage profile (citymart_profile.walletBalance)

function saveCartToStorage() {
    try {
        localStorage.setItem('citymart_cart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Could not persist cart to localStorage', e);
    }
}

// Simple auth state
let currentUser = null;
let authToken = null;
let loginContext = null; // 'customer' or 'vendor'
let authMode = 'login'; // 'login' or 'signup'
// Track whether vendor is editing an existing product
let editingProductId = null;

// Function to update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

// Function to show vendors modal
async function showVendorsModal() {
    console.log('Enter Mart button clicked');
    const modal = document.getElementById('vendors-modal');
    const trolleyModal = document.getElementById('vendors-cart-modal');
    if (modal) {
        modal.style.display = 'block';
        modal.style.zIndex = '9999'; // Ensure it's on top
        console.log('Vendors modal displayed');
    } else {
        console.error('Vendors modal not found');
    }
    // Open the independent trolley modal alongside the vendors modal
    let userCode;
    try {
        userCode = await askForOtpCode(email, statusEl);
    } catch (e) {
        // User cancelled
        return;
    }

    // hi

    // Step 2: verify the code
    const verifyResp = await fetch(API_BASE + '/api/users/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: userCode.trim() }),
    });

    const verifyData = await verifyResp.json();

    if (!verifyResp.ok) {
        const msg = verifyData && verifyData.message ? verifyData.message : 'Verification failed';
        showToast(msg, 'error');
        if (statusEl) statusEl.textContent = msg;
        return;
    }

    showToast('Account verified successfully. Logging you in...', 'success');

    // Auto-login after successful verification
    const loginResp = await fetch(API_BASE + '/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const loginData = await loginResp.json();

    if (!loginResp.ok) {
        const msg = loginData && loginData.message ? loginData.message : 'Login failed after verification';
        showToast(msg, 'error');
        if (statusEl) statusEl.textContent = msg;
        return;
    }

    const userRole = loginData.user && loginData.user.role;
    if (loginContext === 'vendor' && userRole !== 'vendor') {
        const msg = 'This account is not a vendor account.';
        showToast(msg, 'error');
        if (statusEl) statusEl.textContent = msg;
        return;
    }
    if (loginContext === 'customer' && userRole === 'vendor') {
        const msg = 'Please use Customer Login for customer accounts.';
        showToast(msg, 'error');
        if (statusEl) statusEl.textContent = msg;
        return;
    }

    authToken = loginData.token;
    currentUser = loginData.user;

    try {
        localStorage.setItem('citymart_token', authToken);
        localStorage.setItem('citymart_user', JSON.stringify(currentUser));
    } catch (e) {
        console.warn('Could not access localStorage', e);
    }

    updateAuthUI();
    if (statusEl) statusEl.textContent = '';

    if (loginContext === 'vendor' && currentUser.role === 'vendor') {
        openVendorProductModal();
    }

    closeAuthModal();
}

    
