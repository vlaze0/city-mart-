const API_BASE =
  window.location.protocol === 'file:'
    ? 'http://localhost:4000'
    : window.location.origin; // use current host (e.g. citymart.net.in) when deployed



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
let cart = JSON.parse(localStorage.getItem("citymart_cart")) || [];
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
function showVendorsModal() {
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
    if (trolleyModal) {
        trolleyModal.style.display = 'block';
    }
}

// Function to close vendors modal
function closeVendorsModal() {
    const modal = document.getElementById('vendors-modal');
    const trolleyModal = document.getElementById('vendors-cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Close the trolley modal as well so they always stay in sync
    if (trolleyModal) {
        trolleyModal.style.display = 'none';
    }
}

// Function to show cart modal
function showCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        updateCartDisplay();
        // Show cart overlay below the fixed header while keeping
        // the navbar visible above it.
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.top = '90px';           // header height
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = 'calc(100% - 90px)';
        modal.style.zIndex = '2500';        // below header (3000)
    }
}

// Function to close cart modal
function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';

    if (cart.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Your cart is empty. Start adding some products!';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#7f8c8d';
        cartItems.appendChild(emptyMessage);
        cartTotal.textContent = '0.00';
        return;
    }

    let total = 0;
    let mrpTotal = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';

        const leftSection = document.createElement('div');
        leftSection.className = 'cart-item-left';

        if (item.image) {
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.name;
            img.onerror = function () {
                this.src = './images/placeholder.jpg';
            };
            leftSection.appendChild(img);
        }

        const details = document.createElement('div');
        details.className = 'cart-item-details';

        const title = document.createElement('h4');
        title.textContent = item.gender ? `${item.name} (${item.gender})` : item.name;
        details.appendChild(title);

        const priceLine = document.createElement('p');
        const mrp = (item.price * 1.1).toFixed(2);
        priceLine.innerHTML = `MRP: <span style="text-decoration: line-through; color: #888;">₹${mrp}</span> ₹${item.price.toFixed(2)}`;
        details.appendChild(priceLine);

        // Delivery info and actions, Flipkart-style
        const meta = document.createElement('div');
        meta.className = 'cart-item-meta';

        const delivery = document.createElement('span');
        delivery.textContent = 'Delivery by 3–5 days';
        meta.appendChild(delivery);

        const freeDelivery = document.createElement('span');
        freeDelivery.textContent = 'Free Delivery';
        meta.appendChild(freeDelivery);

        const actions = document.createElement('div');
        actions.className = 'cart-item-actions';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = 'Save for later';
        saveBtn.onclick = () => showToast('Save for later is not implemented yet.', 'error');

        const wishlistBtn = document.createElement('button');
        wishlistBtn.type = 'button';
        wishlistBtn.textContent = 'Move to wishlist';
        wishlistBtn.onclick = () => showToast('Wishlist is not implemented yet.', 'error');

        actions.appendChild(saveBtn);
        actions.appendChild(wishlistBtn);

        details.appendChild(meta);
        details.appendChild(actions);

        leftSection.appendChild(details);

        const rightSection = document.createElement('div');
        rightSection.className = 'cart-item-right';

        const quantityControls = document.createElement('div');
        quantityControls.className = 'quantity-controls';

        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = '-';
        decreaseBtn.onclick = () => decreaseQuantity(item.id, item.gender);

        const quantitySpan = document.createElement('span');
        quantitySpan.textContent = item.quantity;

        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = '+';
        increaseBtn.onclick = () => increaseQuantity(item.id, item.gender);

        quantityControls.appendChild(decreaseBtn);
        quantityControls.appendChild(quantitySpan);
        quantityControls.appendChild(increaseBtn);

        const itemTotalSection = document.createElement('div');
        itemTotalSection.className = 'cart-item-total';

        const itemTotal = document.createElement('p');
        const lineTotal = item.price * item.quantity;
        const mrpLineTotal = (item.price * 1.1) * item.quantity; // fake MRP ~10% higher
        itemTotal.textContent = `₹${lineTotal.toFixed(2)}`;

        mrpTotal += mrpLineTotal;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeFromCart(item.id, item.gender);

        itemTotalSection.appendChild(itemTotal);
        itemTotalSection.appendChild(removeBtn);

        rightSection.appendChild(quantityControls);
        rightSection.appendChild(itemTotalSection);

        itemElement.appendChild(leftSection);
        itemElement.appendChild(rightSection);

        cartItems.appendChild(itemElement);

        total += lineTotal;
    });

    cartTotal.textContent = total.toFixed(2);

    // Bill-time discount preview: 10% off for orders ≥ ₹1000
    const discountLineEl = document.getElementById('cart-discount-line');
    if (discountLineEl) {
        if (total >= 1000) {
            const previewDiscount = total * 0.10;
            discountLineEl.textContent = `Discount at checkout: -₹${previewDiscount.toFixed(2)}`;
            discountLineEl.style.color = '#388e3c';
        } else {
            discountLineEl.textContent = '';
        }
    }

    const savingTextEl = document.getElementById('cart-saving-text');
    if (savingTextEl) {
        const savings = mrpTotal - total;
        if (savings > 0.5) {
            savingTextEl.textContent = `You will save ₹${savings.toFixed(2)} on this order.`;
        } else {
            savingTextEl.textContent = '';
        }
    }
}

// Function to checkout
function checkout() {
  // Close cart modal (if open)
  closeCartModal();

  // Populate summary on the right using current cart contents
  try {
    const nameEl       = document.getElementById('checkout-order-name');
    const imgEl        = document.getElementById('checkout-order-image');
    const qtyEl        = document.getElementById('checkout-order-qty');
    const itemsTotalEl = document.getElementById('checkout-items-total');
    const subtotalEl   = document.getElementById('checkout-subtotal');
    const totalEl      = document.getElementById('checkout-total-amount');
    const listEl       = document.getElementById('checkout-items-list');

    if (nameEl && imgEl && qtyEl && itemsTotalEl && subtotalEl && totalEl) {
      let totalQty   = 0;
      let itemsTotal = 0;

      cart.forEach(item => {
        totalQty   += item.quantity;
        itemsTotal += item.price * item.quantity;
      });

      if (listEl) listEl.innerHTML = '';

      // Helper to build a row with thumbnail + text for each cart item
      const buildItemRow = (item) => {
        const row = document.createElement('div');
        row.className = 'checkout-item-row';

        const thumb = document.createElement('img');
        thumb.src = item.image || './images/placeholder.jpg';
        thumb.alt = item.name;
        thumb.onerror = function () { this.src = './images/placeholder.jpg'; };

        const text = document.createElement('div');
        text.className = 'checkout-item-row-text';
        text.textContent = `${item.name} x ${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`;

        row.appendChild(thumb);
        row.appendChild(text);
        return row;
      };

      if (cart.length >= 1) {
        const first = cart[0];

        if (cart.length === 1) {
          // Single-product checkout
          nameEl.textContent = first.name;
          qtyEl.textContent  = first.quantity;
        } else {
          // Multiple products: generic header + total quantity
          nameEl.textContent = 'Your items';
          qtyEl.textContent  = `${totalQty} items in cart`;
        }

        imgEl.src = first.image || './images/placeholder.jpg';

        if (listEl) {
          cart.forEach(item => {
            listEl.appendChild(buildItemRow(item));
          });
        }
      } else {
        // Empty cart
        nameEl.textContent = 'Your items';
        imgEl.src          = './images/placeholder.jpg';
        qtyEl.textContent  = '0';

        if (listEl) {
          const row = document.createElement('div');
          row.className = 'checkout-item-row';
          row.textContent = 'No items in cart.';
          listEl.appendChild(row);
        }
      }

      itemsTotalEl.textContent = itemsTotal.toFixed(2);
      subtotalEl.textContent   = itemsTotal.toFixed(2);
      totalEl.textContent      = itemsTotal.toFixed(2); // no extra fees in demo
    }
  } catch (e) {
    console.warn('Could not populate checkout summary', e);
  }

  // Finally show the checkout modal
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) {
    checkoutModal.style.display = 'block';
  }
}

// Close the checkout modal
function closeCheckoutModal() {
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) {
    checkoutModal.style.display = 'none';
  }
}
function showOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'block';
        loadOrders();
    }
}

// Function to close orders modal
function closeOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to load orders for current user (customer/vendor)
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const subtitle = document.getElementById('orders-subtitle');
    if (!ordersList) return;

    ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">Loading your orders...</p>';
    if (subtitle) subtitle.textContent = '';

    if (!currentUser) {
        ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">Please login to view your orders.</p>';
        return;
    }

    try {
        // hi
        let url = '';
        let mode = 'customer';

        if (currentUser.role === 'customer') {
            url = API_BASE + '/api/orders/' + encodeURIComponent(currentUser.id || currentUser._id);
            if (subtitle) subtitle.textContent = 'Orders placed from this customer account.';
        } else if (currentUser.role === 'vendor') {
            // Vendors see orders containing their products
            url = API_BASE + '/api/orders';
            if (subtitle) subtitle.textContent = 'Orders that include your products.';
            mode = 'vendor';
        } else {
            ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">Use the admin dashboard to view all orders.</p>';
            return;
        }

        // Include auth token when calling the orders API so protected routes work
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            ordersList.innerHTML = '<p style="padding:1rem; text-align:center; color:red;">Failed to load orders.</p>';
            return;
        }
        let orders = await resp.json();
        if (!Array.isArray(orders)) orders = [];

        if (mode === 'vendor') {
            const vendorId = currentUser.id || currentUser._id;
            orders = orders.filter(o => (o.products || []).some(p => {
                const prod = p.productId;
                return prod && prod.vendorId && String(prod.vendorId) === String(vendorId);
            }));
        }

        // Apply filters (status + date) before rendering
        const statusFilter = document.getElementById('orders-status-filter');
        const fromInput = document.getElementById('orders-from-date');
        const toInput = document.getElementById('orders-to-date');

        if (statusFilter && statusFilter.value !== 'all') {
            const val = statusFilter.value;
            orders = orders.filter(o => (o.status || 'pending') === val);
        }

        if (fromInput && fromInput.value) {
            const fromDate = new Date(fromInput.value);
            orders = orders.filter(o => {
                const t = new Date(o.createdAt || 0).getTime();
                return !Number.isNaN(t) && t >= fromDate.getTime();
            });
        }
        if (toInput && toInput.value) {
            const toDate = new Date(toInput.value);
            toDate.setHours(23, 59, 59, 999);
            orders = orders.filter(o => {
                const t = new Date(o.createdAt || 0).getTime();
                return !Number.isNaN(t) && t <= toDate.getTime();
            });
        }

        if (!orders.length) {
            ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">No orders found for selected filters.</p>';
            return;
        }

        // Sort newest first
        orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        ordersList.innerHTML = '';

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';

            const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : '-';
            const total = Number(order.totalAmount || 0).toFixed(2);
            const status = order.status || 'pending';

            const left = document.createElement('div');
            const header = document.createElement('div');
            header.className = 'order-card-header';
            header.innerHTML = `
                <div>
                    <div class="order-id">Order #${order._id}</div>
                    <div class="order-date">${created}</div>
                </div>
                <span class="order-status-badge order-status-${status}">${status}</span>
            `;
            left.appendChild(header);

            const totalEl = document.createElement('div');
            totalEl.className = 'order-total';
            totalEl.textContent = `Total: ₹${total}`;
            left.appendChild(totalEl);

            const right = document.createElement('div');
            const productsWrap = document.createElement('div');
            productsWrap.className = 'order-products';

            (order.products || []).forEach(p => {
                const prod = p.productId || {};
                const name = prod.name || 'Product';
                const qty = p.quantity || 0;
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'order-product-chip';

                const img = document.createElement('img');
                img.src = prod.image || './images/placeholder.jpg';
                img.alt = name;
                img.onerror = function () { this.src = './images/placeholder.jpg'; };

                const textSpan = document.createElement('span');
                textSpan.textContent = `${name} × ${qty}`;

                chip.appendChild(img);
                chip.appendChild(textSpan);

                chip.addEventListener('click', () => {
                    openProductFromOrder(prod);
                });
                productsWrap.appendChild(chip);
            });

            if (!(order.products || []).length) {
                const none = document.createElement('span');
                none.textContent = 'No items';
                productsWrap.appendChild(none);
            }

            right.appendChild(productsWrap);

            const meta = document.createElement('div');
            meta.className = 'order-meta';
            if (mode === 'vendor' && order.userId) {
                const customerName = order.userId.username || order.userId.email || '';
                meta.textContent = `Customer: ${customerName}`;
            } else {
                meta.textContent = '';
            }
            right.appendChild(meta);

            // For customers, show a Cancel button on pending / confirmed orders
            if (mode === 'customer' && (status === 'pending' || status === 'confirmed')) {
                const actions = document.createElement('div');
                actions.className = 'order-actions';
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'order-cancel-btn';
                cancelBtn.textContent = 'Cancel order';
                cancelBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    cancelCustomerOrder(order._id);
                });
                actions.appendChild(cancelBtn);
                left.appendChild(actions);
            }

            card.appendChild(left);
            card.appendChild(right);

            ordersList.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading orders:', err);
        ordersList.innerHTML = '<p style="padding:1rem; text-align:center; color:red;">Error loading orders.</p>';
    }
}

// Allow customers to cancel their own orders from the My Orders modal
async function cancelCustomerOrder(orderId) {
    if (!orderId) return;
    if (!authToken || !currentUser) {
        showToast('Please login again to cancel your order.', 'error');
        return;
    }

    const ok = window.confirm('Cancel this order?');
    if (!ok) return;

    try {
        // hi
        // Use dedicated customer cancel route so it never goes through admin-only checks
        const resp = await fetch(API_BASE + '/api/customer/orders/' + orderId + '/cancel', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json',
            },
        });

        const data = await resp.json().catch(() => null);

        if (!resp.ok) {
            const msg = data && data.message ? data.message : 'Failed to cancel order.';
            showToast(msg, 'error');
            return;
        }

        showToast('Order cancelled successfully.', 'success');
        // Reload list so status + button update
        loadOrders();
    } catch (err) {
        console.error('Error cancelling customer order:', err);
        showToast('Network error while cancelling order.', 'error');
    }
}

// Function to show login options / or open account dropdown when logged in
function showLoginOptions() {
    if (currentUser) {
        // For any logged-in user (admin, vendor, customer), use the header dropdown
        toggleUserMenuDropdown();
        return;
    }
    openLoginOptionsModal();
}

function openLoginOptionsModal() {
    const modal = document.getElementById('login-options-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeLoginOptionsModal() {
    const modal = document.getElementById('login-options-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function startLoginAs(type) {
    loginContext = type; // 'customer' or 'vendor'
    const titleEl = document.getElementById('auth-modal-title');
    if (titleEl) {
        titleEl.textContent = type === 'vendor' ? 'Vendor Login' : 'Customer Login';
    }
    closeLoginOptionsModal();
    openAuthModal();
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Vendor product modal helpers
function openVendorProductModal() {
    const modal = document.getElementById('vendor-product-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeVendorProductModal() {
    const modal = document.getElementById('vendor-product-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleVendorProductSubmit(event) {
    event.preventDefault();

    if (!authToken || !currentUser || currentUser.role !== 'vendor') {
        showToast('Only logged-in vendors can add or edit products.', 'error');
        return;
    }

    const nameInput = document.getElementById('vendor-product-name');
    const priceInput = document.getElementById('vendor-product-price');
    const mainCategoryInput = document.getElementById('vendor-product-main-category');
    const subCategoryInput = document.getElementById('vendor-product-sub-category');
    const brandInput = document.getElementById('vendor-product-brand');
    const descriptionInput = document.getElementById('vendor-product-description');
    const discountInput = document.getElementById('vendor-product-discount');
    const deliveryTimeInput = document.getElementById('vendor-product-delivery-time');
    const featuresInput = document.getElementById('vendor-product-features');
    const imageInput = document.getElementById('vendor-product-image');
    const clothingSizeRow = document.getElementById('vendor-size-row-clothing');
    const shoeSizeRow = document.getElementById('vendor-size-row-shoes');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? parseFloat(priceInput.value) : NaN;
    const mainCategory = mainCategoryInput ? mainCategoryInput.value : '';
    const subCategory = subCategoryInput ? subCategoryInput.value : '';
    const brand = brandInput ? brandInput.value.trim() : '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const discount = discountInput ? discountInput.value.trim() : '';
    const deliveryTime = deliveryTimeInput ? deliveryTimeInput.value.trim() : '';
    const baseFeatures = featuresInput ? featuresInput.value.trim() : '';

    function collectSizesFromRow(rowEl) {
        if (!rowEl) return [];
        const boxes = rowEl.querySelectorAll('input[type="checkbox"]');
        const values = [];
        boxes.forEach(b => { if (b.checked) values.push(b.value); });
        return values;
    }

    let sizeList = [];
    const isClothing = mainCategory === 'clothing';
    const isShoe = isClothing && subCategory && subCategory.toLowerCase().includes('shoe');
    if (isShoe) {
        sizeList = collectSizesFromRow(shoeSizeRow);
    } else if (isClothing) {
        sizeList = collectSizesFromRow(clothingSizeRow);
    }

    if (!name || !mainCategory || !subCategory || !brand || !description || !deliveryTime || isNaN(price)) {
        showToast('Please fill all required fields (name, price, main category, sub category, brand, description, delivery time).', 'error');
        return;
    }

    // For clothing / shoes, fold size info into features so its visible even if backend schema is simple.
    let finalFeatures = baseFeatures;
    if (sizeList.length) {
        const extraText = `Sizes: ${sizeList.join(', ')}`;
        finalFeatures = baseFeatures ? `${baseFeatures} | ${extraText}` : extraText;
    }

    // Map new main/sub categories to legacy long category names used on the website,
    // so that vendor-added products also appear under the correct "Vendor" tiles.
    function mapToLegacyCategory(main, sub) {
        const m = (main || '').toLowerCase();
        const s = (sub || '').toLowerCase();

        if (m === 'pet') {
            return 'Local pet shops (food, toys, accessories)';
        }

        if (m === 'food') {
            if (s.includes('fruit') || s.includes('vegetable')) return 'Fruit & vegetable sellers';
            if (s.includes('bakery')) return 'Bakeries and sweet shops';
            if (s.includes('meat') || s.includes('fish')) return 'Butchers and fishmongers';
            if (s.includes('organic') || s.includes('health')) return 'Organic and health food stores';
            return 'Packaged goods distributors';
        }

        if (m === 'electronics') {
            if (s.includes('mobile') || s.includes('laptop') || s.includes('tablet')) return 'Mobile and laptop dealers';
            if (s.includes('repair') || s.includes('service')) return 'Repair shops and service centers';
            if (s.includes('accessories') || s.includes('headphones')) return 'Accessories retailers (chargers, cases, headphones)';
            if (s.includes('appliance') || s.includes('tv') || s.includes('refrigerator') || s.includes('mixer')) return 'Appliance stores (TVs, refrigerators, mixers)';
            return 'Mobile and laptop dealers';
        }

        if (m === 'household') {
            if (s.includes('clean')) return 'Cleaning supply wholesalers';
            if (s.includes('kitchen')) return 'Kitchenware and utensils shops';
            if (s.includes('furniture') || s.includes('decor')) return 'Furniture and home decor sellers';
            if (s.includes('hardware') || s.includes('tool')) return 'Local hardware stores';
            return 'Cleaning supply wholesalers';
        }

        if (m === 'clothing') {
            if (s.includes('shirt') || s.includes('pant') || s.includes('dress')) return 'Boutique clothing stores';
            if (s.includes('shoe') || s.includes('sandal') || s.includes('footwear')) return 'Shoe and accessories shops';
            if (s.includes('tailor') || s.includes('alteration')) return 'Tailors and alteration services';
            if (s.includes('beauty') || s.includes('skin') || s.includes('makeup')) return 'Beauty and skincare outlets';
            return 'Boutique clothing stores';
        }

        if (m === 'stationery') {
            if (s.includes('book') || s.includes('notebook') || s.includes('pen')) return 'Bookstores and school supply shops';
            if (s.includes('coach') || s.includes('tuition')) return 'Coaching centers (for listing services)';
            if (s.includes('art') || s.includes('craft')) return 'Art and craft supply sellers';
            return 'Bookstores and school supply shops';
        }

        if (m === 'services') {
            if (s.includes('electric') || s.includes('plumb') || s.includes('carpent')) return 'Electricians, plumbers, and carpenters';
            if (s.includes('clean')) return 'Home cleaning services';
            if (s.includes('delivery') || s.includes('logistic') || s.includes('courier')) return 'Delivery partners and logistics providers';
            return 'Delivery partners and logistics providers';
        }

        // Fallback to whatever the vendor selected so at least search/filter works.
        return sub || main || '';
    }

    const legacyCategory = mapToLegacyCategory(mainCategory, subCategory);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', String(price));
    formData.append('mainCategory', mainCategory);
    formData.append('subCategory', subCategory);
    formData.append('brand', brand);
    // keep legacy category for compatibility with seeded data and vendor tiles
    formData.append('category', legacyCategory);
    formData.append('description', description);
    if (discount) formData.append('discount', discount);
    if (finalFeatures) formData.append('features', finalFeatures);
    if (deliveryTime) formData.append('deliveryTime', deliveryTime);
    if (imageInput && imageInput.files && imageInput.files.length) {
        // Allow up to 4 images, all under the same field name "image" so
        // the backend (multer array) can receive them as req.files.
        Array.from(imageInput.files).slice(0, 4).forEach(file => {
            formData.append('image', file);
        });
    }

    try {
        // hi
        const isEditing = !!editingProductId;
        const url = API_BASE + (isEditing ? `/api/products/${editingProductId}` : '/api/products');
        const method = isEditing ? 'PUT' : 'POST';

        const resp = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
        });

        const data = await resp.json();

        if (!resp.ok) {
            const msg = data && data.message ? data.message : 'Failed to add product.';
            showToast(msg, 'error');
            return;
        }

        showToast(isEditing ? 'Product updated successfully.' : 'Product added successfully.', 'success');

        // Reset size checkboxes
        [clothingSizeRow, shoeSizeRow].forEach(row => {
            if (!row) return;
            row.querySelectorAll('input[type="checkbox"]').forEach(b => { b.checked = false; });
        });

        // Reset form and editing state
        event.target.reset();
        editingProductId = null;
        const submitBtn = document.querySelector('.vendor-product-submit');
        if (submitBtn) {
            submitBtn.textContent = 'Save Product';
        }

        // If we are on the vendor dashboard, refresh the list after adding/updating
        if (typeof refreshVendorProductsList === 'function') {
            refreshVendorProductsList();
        }

        // Close modal if it exists (legacy flow)
        const vendorModal = document.getElementById('vendor-product-modal');
        if (vendorModal) {
            closeVendorProductModal();
        }
    } catch (err) {
        console.error('Error adding product:', err);
        showToast('Network error while adding product.', 'error');
    }
}

// Show correct size options when vendor chooses clothing vs shoes
function initVendorSizeOptions() {
    const mainCatSelect = document.getElementById('vendor-product-main-category');
    const subCatSelect = document.getElementById('vendor-product-sub-category');
    const clothingRow = document.getElementById('vendor-size-row-clothing');
    const shoeRow = document.getElementById('vendor-size-row-shoes');
    const extraBlock = document.getElementById('vendor-product-clothing-fields');

    if (!mainCatSelect || !subCatSelect || !extraBlock) return;

    function updateSizeVisibility() {
        const mainVal = mainCatSelect.value || '';
        const subVal = (subCatSelect.value || '').toLowerCase();
        const isClothing = mainVal === 'clothing';
        const isShoe = isClothing && (subVal.includes('shoe') || subVal.includes('sandal') || subVal.includes('footwear'));

        if (!isClothing) {
            extraBlock.style.display = 'none';
            if (clothingRow) clothingRow.style.display = 'none';
            if (shoeRow) shoeRow.style.display = 'none';
            return;
        }

        extraBlock.style.display = '';
        if (isShoe) {
            if (clothingRow) clothingRow.style.display = 'none';
            if (shoeRow) shoeRow.style.display = 'flex';
        } else {
            if (clothingRow) clothingRow.style.display = 'flex';
            if (shoeRow) shoeRow.style.display = 'none';
        }
    }

    mainCatSelect.addEventListener('change', updateSizeVisibility);
    subCatSelect.addEventListener('change', updateSizeVisibility);

    // Run once on load
    updateSizeVisibility();
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const statusEl = document.getElementById('login-status');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
    }

    try {
        if (statusEl) statusEl.textContent = authMode === 'signup' ? 'Signing up...' : 'Logging in...';

        if (authMode === 'signup') {
            await handleSignupFlow(email, password, statusEl);
            return;
        }

        // hi
        const response = await fetch(API_BASE + '/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data && data.message ? data.message : 'Login failed';
            showToast(msg, 'error');
            if (statusEl) statusEl.textContent = msg;
            return;
        }

        // Enforce role based on loginContext, but always allow admin
        const userRole = data.user && data.user.role;
        if (userRole !== 'admin') {
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
        }

        authToken = data.token;
        currentUser = data.user;

        // Persist session
        try {
            localStorage.setItem('citymart_token', authToken);
            localStorage.setItem('citymart_user', JSON.stringify(currentUser));
        } catch (e) {
            console.warn('Could not access localStorage', e);
        }

        updateAuthUI();
        showToast(`Welcome, ${currentUser.username || currentUser.email}`, 'success');
        if (statusEl) statusEl.textContent = '';

        // Redirect based on role
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (loginContext === 'vendor' && currentUser.role === 'vendor') {
            window.location.href = 'vendor.html';
        }

        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error during login.', 'error');
        if (statusEl) statusEl.textContent = 'Network error.';
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    try {
        localStorage.removeItem('citymart_token');
        localStorage.removeItem('citymart_user');
        localStorage.removeItem('citymart_cart');
        localStorage.removeItem('citymart_profile');
    } catch (e) {
        console.warn('Could not clear localStorage', e);
    }
    if (typeof cart !== 'undefined') {
        cart = [];
    }
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    if (typeof updateCartDisplay === 'function') {
        try { updateCartDisplay(); } catch(e) {}
    }
    updateAuthUI();
    showToast('Logged out successfully.', 'success');
}

function updateAuthUI() {
    const loginLinks = document.querySelectorAll('a[onclick=\"showLoginOptions()\"], .login-btn');
    loginLinks.forEach(link => {
        if (!link) return;
        if (currentUser) {
            link.textContent = currentUser.username ? `Hi, ${currentUser.username}` : 'My Account';
        } else {
            link.textContent = 'Login';
        }
    });

    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    // Configure header user menu behavior
    if (userMenuToggle) {
        userMenuToggle.onclick = function (e) {
            e.preventDefault();
            showLoginOptions();
        };
    }

    // Customize dropdown contents based on role
    if (userMenuDropdown) {
        if (currentUser && currentUser.role === 'admin') {
            const name = currentUser.username || '-';
            const email = currentUser.email || '-';
            const phone = currentUser.phone || 'Not provided';
            userMenuDropdown.innerHTML = `
                <div class="user-menu-profile">
                    <img src="./images/placeholder.jpg" alt="Admin avatar" class="user-menu-avatar">
                    <div class="user-menu-profile-text">
                        <div class="user-menu-name">${name}</div>
                        <div class="user-menu-email">${email}</div>
                        <div class="user-menu-phone">${phone}</div>
                    </div>
                </div>
                <button type="button" class="user-menu-item" onclick="openAdminActions()">
                    <span class="user-menu-item-icon">📊</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Admin actions</span>
                        <span class="user-menu-item-desc">Review orders, vendors, and reports</span>
                    </span>
                </button>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item" onclick="logoutFromMenu()">
                    <span class="user-menu-item-icon">↩</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Logout</span>
                        <span class="user-menu-item-desc">Sign out from this admin account</span>
                    </span>
                </button>
            `;
        } else if (currentUser && currentUser.role === 'vendor') {
            // Keep vendor options for vendors (styled like menu rows)
            userMenuDropdown.innerHTML = `
                <button type="button" class="user-menu-item" onclick="openVendorProfileModal()">
                    <span class="user-menu-item-icon">👤</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Profile</span>
                        <span class="user-menu-item-desc">View your vendor details</span>
                    </span>
                </button>
                <button type="button" class="user-menu-item" onclick="goToVendorProducts()">
                    <span class="user-menu-item-icon">🛍️</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">My products</span>
                        <span class="user-menu-item-desc">Manage items you are selling</span>
                    </span>
                </button>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item" onclick="logoutFromMenu()">
                    <span class="user-menu-item-icon">↩</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Logout</span>
                        <span class="user-menu-item-desc">Sign out from this vendor account</span>
                    </span>
                </button>
            `;
        } else if (currentUser) {
            // Customer (or any non-admin/non-vendor logged-in user)
            const name = currentUser.username || '-';
            userMenuDropdown.innerHTML = `
                <div class="user-menu-profile">
                    <img src="./images/placeholder.jpg" alt="Customer avatar" class="user-menu-avatar">
                    <div class="user-menu-profile-text">
                        <div class="user-menu-name">${name}</div>
                    </div>
                </div>
                <button type="button" class="user-menu-item" onclick="goToCustomerProfilePage()">
                    <span class="user-menu-item-icon">👤</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Profile</span>
                        <span class="user-menu-item-desc">View your details and preferences</span>
                    </span>
                </button>
                <button type="button" class="user-menu-item" onclick="openOrdersFromMenu()">
                    <span class="user-menu-item-icon">📦</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">My orders</span>
                        <span class="user-menu-item-desc">Track things you've ordered</span>
                    </span>
                </button>
                <button type="button" class="user-menu-item" onclick="openCartFromMenu()">
                    <span class="user-menu-item-icon">🛒</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Cart</span>
                        <span class="user-menu-item-desc">See items ready to order</span>
                    </span>
                </button>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item" onclick="logoutFromMenu()">
                    <span class="user-menu-item-icon">↩</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Logout</span>
                        <span class="user-menu-item-desc">Sign out from this account</span>
                    </span>
                </button>
            `;
        } else {
            // Logged out: no dropdown actions
            userMenuDropdown.innerHTML = '';
            userMenuDropdown.classList.remove('open');
        }
    }

    // Show/hide phone input and reCAPTCHA container based on authMode
    const phoneInput = document.getElementById('login-phone');
    const recaptchaContainer = document.getElementById('firebase-recaptcha-container');
    if (phoneInput) {
        phoneInput.style.display = authMode === 'signup' ? 'block' : 'none';
        if (authMode === 'signup') {
            phoneInput.required = false;
        } else {
            phoneInput.required = false;
        }
    }
    if (recaptchaContainer) {
        recaptchaContainer.style.display = authMode === 'signup' ? 'block' : 'none';
    }

    const titleEl = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-button');
    const switchLink = document.querySelector('.auth-switch a');

    if (titleEl) {
        if (authMode === 'signup') {
            titleEl.textContent = loginContext === 'vendor' ? 'Vendor Sign Up' : 'Customer Sign Up';
        } else {
            titleEl.textContent = loginContext === 'vendor' ? 'Vendor Login' : 'Customer Login';
        }
    }
    if (submitBtn) {
        submitBtn.textContent = authMode === 'signup' ? 'Sign Up' : 'Login';
    }
    if (switchLink) {
        switchLink.textContent = authMode === 'signup' ? 'Have an account? Login' : 'New user? Sign up';
    }
}

function switchAuthMode(event) {
    if (event) event.preventDefault();
    authMode = authMode === 'signup' ? 'login' : 'signup';
    updateAuthUI();
}

// Function to navigate to products
// If called with one argument: old behavior using ?category=...
// If called with two arguments: new behavior using ?mainCategory=...&subCategory=...
function navigateToProducts(mainCategoryOrCategory, subCategory) {
    if (subCategory) {
        const params = new URLSearchParams();
        params.set('mainCategory', mainCategoryOrCategory);
        params.set('subCategory', subCategory);
        window.location.href = `products.html?${params.toString()}`;
    } else {
        window.location.href = `products.html?category=${encodeURIComponent(mainCategoryOrCategory)}`;
    }
}

// From an order card, open the product on products page where it is listed
function openProductFromOrder(product) {
    if (!product) return;
    const params = new URLSearchParams();
    if (product._id) params.set('productId', product._id);
    if (product.mainCategory) params.set('mainCategory', product.mainCategory);
    if (product.subCategory) params.set('subCategory', product.subCategory);
    else if (product.category) params.set('category', product.category);
    const qs = params.toString();
    window.location.href = 'products.html' + (qs ? `?${qs}` : '');
}

// Function to close vendor products modal
function closeVendorProductsModal() {
    const modal = document.getElementById('vendor-products-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Vendor Profile from header: for vendors, go straight to dashboard
async function openVendorProfileModal() {
    // Ensure we know who is logged in
    if (!currentUser) {
        try {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.warn('Could not read current user for vendor profile', e);
        }
    }

    if (currentUser && currentUser.role === 'vendor') {
        // Treat "Profile" as "go to vendor dashboard" for vendors
        window.location.href = 'vendor.html';
        return;
    }

    // For non-vendors (future use), fall back to existing vendor-profile modal if present
    const modal = document.getElementById('vendor-profile-modal');
    if (!modal) {
        showToast('Please login as a vendor to view vendor profile.', 'error');
        return;
    }
    modal.style.display = 'block';
}

function closeVendorProfileModal() {
    const modal = document.getElementById('vendor-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeCustomerProfileModal() {
    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function goToVendorProducts() {
    // Navigate vendor to their dashboard
    window.location.href = 'vendor.html';
}

// Function to close budgies modal
function closeBudgiesModal() {
    const modal = document.getElementById('budgies-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to show gender modal (for pet products)
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
        const { id, name, price, category, image } = pendingProduct;
        const existingItem = cart.find(item => item.id === id && item.gender === gender);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1, gender, category, image });
        }
        saveCartToStorage();

        updateCartCount();
        updateCartDisplay();
        showToast(`${name} (${gender}) added to cart`, 'success');
        closeGenderModal();
    }
}

// Function to handle checkout form submission + Razorpay payment
async function handleCheckoutFormSubmission(e) {
    e.preventDefault();

    // Guard: must have items in cart
    if (!Array.isArray(cart) || cart.length === 0) {
        showToast('Your cart is empty. Please add some items before placing an order.', 'error');
        return;
    }

    // Guard: customer must be logged in to place an order
    if (!currentUser || currentUser.role !== 'customer') {
        showToast('Please login as a customer before placing an order.', 'error');
        if (typeof startLoginAs === 'function') {
            startLoginAs('customer');
        } else {
            openLoginOptionsModal();
        }
        return;
    }

    // Safely read form fields (some, like payment, may not exist on this page)
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const addressInput = document.getElementById('address');
    const phoneInput = document.getElementById('phone');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    // Basic validation: require only name, phone and address
    if (!name || !address || !phone) {
        showToast('Please fill in your name, phone number, and address.', 'error');
        return;
    }

    // Determine selected payment method (online via Razorpay or Cash on Delivery)
    const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethodSelect = document.getElementById('payment-method'); // legacy fallback if present
    let paymentMethod = '';
    let paymentDetails = '';

    if (selectedRadio) {
        paymentMethod = selectedRadio.value; // 'online' or 'cod'
    } else if (paymentMethodSelect) {
        paymentMethod = paymentMethodSelect.value;
    }

    if (paymentMethod === 'cod') {
        paymentDetails = 'Cash on Delivery';
    } else if (!paymentMethod || paymentMethod === 'online') {
        // Default to online payment (Razorpay) when nothing is selected explicitly
        paymentMethod = 'online';
        paymentDetails = '';
    }

    // Get current cart total from the UI
    const cartTotalEl = document.getElementById('cart-total');
    const rawTotal = parseFloat(cartTotalEl ? cartTotalEl.textContent : '0') || 0;

    // If customer has a preferred payment method saved, pre-fill when empty
    try {
        const stored = localStorage.getItem('citymart_profile');
        if (stored) {
            const profile = JSON.parse(stored);
            if (!paymentMethod && profile.paymentMethod) {
                paymentMethod = profile.paymentMethod;
                const paymentMethodSelect = document.getElementById('payment-method');
                if (paymentMethodSelect) paymentMethodSelect.value = paymentMethod;
            }
            if (!paymentDetails && profile.paymentDetails) {
                paymentDetails = profile.paymentDetails;
                const paymentDetailsInput = document.getElementById('payment-details');
                if (paymentDetailsInput) paymentDetailsInput.value = paymentDetails;
            }
        }
    } catch (e) {
        console.warn('Could not read payment preference from citymart_profile', e);
    }

    // BILL-TIME DISCOUNT LOGIC
    // Example rule: 10% discount for orders ≥ ₹1000
    let discount = 0;
    if (rawTotal >= 1000) {
        discount = rawTotal * 0.10;
    }

    const finalAmount = rawTotal - discount;

    if (finalAmount <= 0) {
        showToast('Order amount must be greater than zero to proceed with payment.', 'error');
        return;
    }

    // Wallet payment handling (still applied before sending to Razorpay)
    if (paymentMethod === 'wallet') {
        let walletBalance = 0;
        let profile = {};
        try {
            const stored = localStorage.getItem('citymart_profile');
            if (stored) {
                profile = JSON.parse(stored) || {};
                walletBalance = typeof profile.walletBalance === 'number'
                    ? profile.walletBalance
                    : Number(profile.walletBalance) || 0;
            }
        } catch (e) {
            console.warn('Could not read wallet balance', e);
        }

        if (walletBalance < finalAmount) {
            showToast('Not enough balance in wallet. Please add money or choose another payment method.', 'error');
            return;
        }

        walletBalance -= finalAmount;
        profile.walletBalance = walletBalance;
        try {
            localStorage.setItem('citymart_profile', JSON.stringify(profile));
        } catch (e) {
            console.warn('Could not update wallet balance after checkout', e);
        }
    }

    // Build a bill-style message (for potential email/printing in future)
    const billMessage =
        `Order Summary\n` +
        `-------------------------\n` +
        `Items Total:  ₹${rawTotal.toFixed(2)}\n` +
        `Discount:     -₹${discount.toFixed(2)}\n` +
        `-------------------------\n` +
        `Payable:      ${finalAmount.toFixed(2)}\n\n` +
        `Name:   ${name}\n` +
        `Email/Phone:  ${email} / ${phone}\n` +
        `Address:${address}\n` +
        `Payment method: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}`;

    // hi

    // Prepare products payload from cart for backend order creation
    const productsPayload = cart.map(item => ({
        productId: item.id || item._id || item.productId,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
    }));

    const userId = currentUser && (currentUser.id || currentUser._id)
        ? (currentUser.id || currentUser._id)
        : null;

    // If Cash on Delivery, skip Razorpay and create an order directly in MongoDB
    if (paymentMethod === 'cod') {
        try {
            const resp = await fetch(API_BASE + '/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    products: productsPayload,
                    totalAmount: finalAmount,
                }),
            });

            const data = await resp.json().catch(() => null);
            if (!resp.ok) {
                const msg = data && data.message ? data.message : 'Failed to place order.';
                showToast(msg, 'error');
                return;
            }

            // Clear cart and redirect to success page
            try {
                localStorage.removeItem('citymart_cart');
            } catch (err) {
                console.warn('Could not clear cart from localStorage after COD order', err);
            }
            cart = [];
            updateCartCount();
            updateCartDisplay();
            closeCheckoutModal();

            const params = new URLSearchParams();
            params.set('method', 'cod');
            if (data && data._id) {
                params.set('orderId', data._id);
            }
            window.location.href = 'payment-success.html' + (params.toString() ? `?${params.toString()}` : '');
            return;
        } catch (err) {
            console.error('Error creating COD order:', err);
            showToast('Could not place order. Please try again.', 'error');
            return;
        }
    }

    // --- Razorpay integration flow for online payments ---

    if (typeof Razorpay === 'undefined') {
        console.error('Razorpay script not loaded');
        showToast('Payment system is not ready. Please check your internet connection and try again.', 'error');
        return;
    }

    try {
        // 1) Ask backend to create a Razorpay order
        const createRes = await fetch(API_BASE + '/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: finalAmount}),
        });

        if (!createRes.ok) {
            const errBody = await createRes.json().catch(() => null);
            console.error('Failed to create Razorpay order', createRes.status, errBody);
            const detail = errBody && errBody.detail ? ` (${errBody.detail})` : '';
            const msg = errBody && errBody.message ? errBody.message + detail : 'Could not start payment. Please try again.';
            showToast(msg, 'error');
            return;
        }

        const { orderId, amount, currency, key } = await createRes.json(); // if this throws, it will be caught by outer try
        if (!orderId || !amount || !key) {
            console.error('Invalid create-order response');
            showToast('Could not start payment. Please try again.', 'error');
            return;
        }

        const options = {
            key,
            amount, // in paise
            currency: currency || 'INR',
            name: 'City Mart',
            description: 'Order payment',
            image: './images/logo.png',
            order_id: orderId,
            prefill: {
                name,
                email,
                contact: phone,
            },
            notes: {
                address,
                paymentMethod,
                paymentDetails,
            },
            theme: {
                color: '#3399cc',
            },
            handler: async function (response) {
                try {
                    const verifyRes = await fetch(API_BASE + '/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId,
                            products: productsPayload,
                            amount: finalAmount,
                        }),
                    });

                    if (!verifyRes.ok) {
                        console.error('Payment verification failed', verifyRes.status);
                        showToast('Payment verification failed. Please contact support if money is deducted.', 'error');
                        return;
                    }

                    const verifyData = await verifyRes.json();
                    if (!verifyData || !verifyData.success) {
                        console.error('Payment verification error body:', verifyData);
                        showToast('Payment verification failed. Please contact support if money is deducted.', 'error');
                        return;
                    }

                    // Clear cart and redirect to success page
                    try {
                        localStorage.removeItem('citymart_cart');
                    } catch (err) {
                        console.warn('Could not clear cart from localStorage after payment', err);
                    }
                    cart = [];
                    updateCartCount();
                    updateCartDisplay();

                    closeCheckoutModal();

                    const orderIdFromDb = verifyData.orderId;
                    const params = new URLSearchParams();
                    params.set('method', 'online');
                    if (orderIdFromDb) {
                        params.set('orderId', orderIdFromDb);
                    }
                    window.location.href = 'payment-success.html' + (params.toString() ? `?${params.toString()}` : '');
                } catch (err) {
                    console.error('Error in Razorpay handler verification:', err);
                    showToast('Something went wrong while finalizing your order. Please contact support.', 'error');
                }
            },
            modal: {
                ondismiss: function () {
                    console.log('Razorpay popup closed by user');
                },
            },
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (err) {
        console.error('Unexpected error during payment flow:', err);
        showToast('Could not start payment due to a technical error. Please try again.', 'error');
    }
}

// Initialize payment method UI in checkout modal
function initCheckoutPaymentUI() {
    const radios = document.querySelectorAll('input[name="payment-method"]');
    if (!radios || !radios.length) return;

    const cardSection = document.getElementById('payment-details-card');
    const upiSection = document.getElementById('payment-details-upi');
    const codSection = document.getElementById('payment-details-cod');

    function refresh() {
        const selected = document.querySelector('input[name="payment-method"]:checked');
        const method = selected ? selected.value : 'card';

        if (cardSection) cardSection.style.display = method === 'card' ? '' : 'none';
        if (upiSection) upiSection.style.display = method === 'upi' ? '' : 'none';
        if (codSection) codSection.style.display = method === 'cod' ? '' : 'none';
    }

    radios.forEach(r => {
        r.addEventListener('change', refresh);
    });

    refresh();
}

// Increase quantity of an item in the cart
function increaseQuantity(id, gender = null) {
        const item = cart.find(p => p.id === id && (gender ? p.gender === gender : !p.gender));
    if (item) {
        item.quantity += 1;
        saveCartToStorage();
        updateCartCount();
        updateCartDisplay();
    }
}

// Decrease quantity of an item in the cart
function decreaseQuantity(id, gender = null) {
    const item = cart.find(p => p.id === id && (gender ? p.gender === gender : !p.gender));
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            // Remove item if quantity would go below 1
            cart = cart.filter(p => !(p.id === id && (gender ? p.gender === gender : !p.gender)));
        }
        saveCartToStorage();
        updateCartCount();
        updateCartDisplay();
    }
}

// Remove item entirely from the cart
function removeFromCart(id, gender = null) {
    cart = cart.filter(p => !(p.id === id && (gender ? p.gender === gender : !p.gender)));
    saveCartToStorage();
    updateCartCount();
    updateCartDisplay();
}

// Progressive profiling: preferences / loyalty / personalization (from checkout)
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleProfileFormSubmit(e) {
    e.preventDefault();

    const preferences = document.getElementById('profile-preferences').value.trim();
    const loyalty = document.getElementById('profile-loyalty').value;
    const personalization = document.getElementById('profile-personalization').value.trim();

    // Store locally for now; can be sent to backend later
    try {
        const existing = localStorage.getItem('citymart_profile');
        const prev = existing ? JSON.parse(existing) : {};
        const profile = {
            ...prev,
            preferences,
            loyalty,
            personalization,
        };
        localStorage.setItem('citymart_profile', JSON.stringify(profile));
    } catch (err) {
        console.warn('Could not store profile preferences', err);
    }

    showToast('Preferences saved. Thanks for helping us personalize your experience!', 'success');
    closeProfileModal();
}

// Profile PAGE logic (customer profile.html)
function initCustomerProfilePage() {
    const pageRoot = document.getElementById('customer-profile-page');
    if (!pageRoot) return; // not on profile page

    // Basic header avatar + text
    const nameHeading = document.getElementById('profile-name');
    const emailSpan = document.getElementById('profile-email');
    const mobileSpan = document.getElementById('profile-mobile');
    const avatarImg = document.getElementById('profile-avatar-img');

    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const mobileInput = document.getElementById('profile-mobile-input');
    const addrInput = document.getElementById('profile-shipping-address');
    const prefInput = document.getElementById('profile-preferences-input');
    const loyaltyInput = document.getElementById('profile-loyalty-input');
    const personalizationInput = document.getElementById('profile-personalization-input');
    const payMethodInput = document.getElementById('profile-payment-method');
    const payDetailsInput = document.getElementById('profile-payment-details');

    const avatarInput = document.getElementById('profile-avatar-input');
    const avatarClearBtn = document.getElementById('profile-avatar-clear');

    // Wallet controls
    const walletSummary = document.getElementById('profile-wallet-summary');
    const walletDisplay = document.getElementById('profile-wallet-display');
    const walletAddAmount = document.getElementById('profile-wallet-add-amount');
    const walletAddBtn = document.getElementById('profile-wallet-add-btn');

    // Summary fields in left card
    const shippingSummary = document.getElementById('profile-shipping-summary');
    const preferencesSummary = document.getElementById('profile-preferences-summary');
    const loyaltySummary = document.getElementById('profile-loyalty-summary');
    const paymentSummary = document.getElementById('profile-payment-summary');

    const name = currentUser && currentUser.username ? currentUser.username : 'My Profile';
    const email = currentUser && currentUser.email ? currentUser.email : '-';
    const phone = currentUser && currentUser.phone ? currentUser.phone : '';

    if (nameHeading) nameHeading.textContent = name;
    if (emailSpan) emailSpan.textContent = email;
    if (mobileSpan) mobileSpan.textContent = phone || '-';

    if (nameInput) nameInput.value = name !== 'My Profile' ? name : '';
    if (emailInput) emailInput.value = email !== '-' ? email : '';
    if (mobileInput) mobileInput.value = phone;

    // Populate from stored profile (preferences, address, payment)
    let walletBalance = 0;
    try {
        const stored = localStorage.getItem('citymart_profile');
        if (stored) {
            const profile = JSON.parse(stored);
            if (addrInput && profile.shippingAddress) addrInput.value = profile.shippingAddress;
            if (prefInput && profile.preferences) prefInput.value = profile.preferences;
            if (loyaltyInput && profile.loyalty) loyaltyInput.value = profile.loyalty;
            if (personalizationInput && profile.personalization) personalizationInput.value = profile.personalization;
            if (payMethodInput && profile.paymentMethod) payMethodInput.value = profile.paymentMethod;
            if (payDetailsInput && profile.paymentDetails) payDetailsInput.value = profile.paymentDetails;

            // Avatar
            if (profile.avatarDataUrl && avatarImg) {
                avatarImg.src = profile.avatarDataUrl;
            }

            // Wallet
            walletBalance = typeof profile.walletBalance === 'number' ? profile.walletBalance : Number(profile.walletBalance) || 0;

            // Also reflect in summary card
            if (shippingSummary) shippingSummary.textContent = profile.shippingAddress || '-';
            if (preferencesSummary) preferencesSummary.textContent = profile.preferences || '-';
            if (loyaltySummary) loyaltySummary.textContent = profile.loyalty || '-';
            if (paymentSummary) paymentSummary.textContent = profile.paymentMethod || '-';
            if (walletSummary) walletSummary.textContent = `₹${walletBalance.toFixed(2)}`;
        }
    } catch (e) {
        console.warn('Could not read citymart_profile from localStorage', e);
    }

    const form = document.getElementById('customer-profile-form');
    if (form) {
        form.addEventListener('submit', handleCustomerProfileFormSubmit);
    }

    const locBtn = document.getElementById('profile-use-location-btn');
    if (locBtn) {
        locBtn.addEventListener('click', handleUseCurrentLocationClick);
    }

    // Avatar upload handlers
    if (avatarInput) {
        avatarInput.addEventListener('change', function () {
            const file = avatarInput.files && avatarInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                const dataUrl = ev.target.result;
                if (avatarImg) avatarImg.src = dataUrl;
                try {
                    const existing = localStorage.getItem('citymart_profile');
                    const prev = existing ? JSON.parse(existing) : {};
                    prev.avatarDataUrl = dataUrl;
                    localStorage.setItem('citymart_profile', JSON.stringify(prev));
                } catch (e) {
                    console.warn('Could not persist avatar image', e);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (avatarClearBtn) {
        avatarClearBtn.addEventListener('click', function () {
            if (avatarImg) avatarImg.src = './images/placeholder.jpg';
            if (avatarInput) avatarInput.value = '';
            try {
                const existing = localStorage.getItem('citymart_profile');
                const prev = existing ? JSON.parse(existing) : {};
                delete prev.avatarDataUrl;
                localStorage.setItem('citymart_profile', JSON.stringify(prev));
            } catch (e) {
                console.warn('Could not clear avatar image', e);
            }
        });
    }

    // Wallet add-money handler
    if (walletDisplay) walletDisplay.textContent = `₹${walletBalance.toFixed(2)}`;
    if (walletSummary) walletSummary.textContent = `₹${walletBalance.toFixed(2)}`;
    if (walletAddBtn) {
        walletAddBtn.addEventListener('click', () => {
            const raw = walletAddAmount ? walletAddAmount.value : '';
            const amount = Number(raw);
            if (!amount || amount <= 0) {
                showToast('Enter a valid amount to add to wallet.', 'error');
                return;
            }
            walletBalance += amount;
            if (walletDisplay) walletDisplay.textContent = `₹${walletBalance.toFixed(2)}`;
            if (walletSummary) walletSummary.textContent = `₹${walletBalance.toFixed(2)}`;
            if (walletAddAmount) walletAddAmount.value = '';

            try {
                const existing = localStorage.getItem('citymart_profile');
                const prev = existing ? JSON.parse(existing) : {};
                prev.walletBalance = walletBalance;
                localStorage.setItem('citymart_profile', JSON.stringify(prev));
            } catch (e) {
                console.warn('Could not persist wallet balance', e);
            }

            showToast('Money added to wallet.', 'success');
        });
    }
}

function handleCustomerProfileFormSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const mobileInput = document.getElementById('profile-mobile-input');
    const addrInput = document.getElementById('profile-shipping-address');
    const prefInput = document.getElementById('profile-preferences-input');
    const loyaltyInput = document.getElementById('profile-loyalty-input');
    const personalizationInput = document.getElementById('profile-personalization-input');
    const payMethodInput = document.getElementById('profile-payment-method');
    const payDetailsInput = document.getElementById('profile-payment-details');

    const profile = {
        preferences: prefInput ? prefInput.value.trim() : '',
        loyalty: loyaltyInput ? loyaltyInput.value : '',
        personalization: personalizationInput ? personalizationInput.value.trim() : '',
        shippingAddress: addrInput ? addrInput.value.trim() : '',
        paymentMethod: payMethodInput ? payMethodInput.value : '',
        paymentDetails: payDetailsInput ? payDetailsInput.value.trim() : '',
    };

    try {
        const existing = localStorage.getItem('citymart_profile');
        const prev = existing ? JSON.parse(existing) : {};
        const merged = { ...prev, ...profile };
        localStorage.setItem('citymart_profile', JSON.stringify(merged));
    } catch (err) {
        console.warn('Could not store profile preferences', err);
    }

    // Also update header text & currentUser basics in memory
    if (currentUser) {
        if (nameInput && nameInput.value.trim()) currentUser.username = nameInput.value.trim();
        // email is read-only; do not overwrite from form
        if (mobileInput && mobileInput.value.trim()) currentUser.phone = mobileInput.value.trim();
        try {
            localStorage.setItem('citymart_user', JSON.stringify(currentUser));
        } catch (e) {
            console.warn('Could not persist updated user info', e);
        }
    }

    updateAuthUI();

    // Update summary card immediately
    const shippingSummary = document.getElementById('profile-shipping-summary');
    const preferencesSummary = document.getElementById('profile-preferences-summary');
    const loyaltySummary = document.getElementById('profile-loyalty-summary');
    const paymentSummary = document.getElementById('profile-payment-summary');

    if (shippingSummary && addrInput) shippingSummary.textContent = addrInput.value.trim() || '-';
    if (preferencesSummary && prefInput) preferencesSummary.textContent = prefInput.value.trim() || '-';
    if (loyaltySummary && loyaltyInput) loyaltySummary.textContent = loyaltyInput.value || '-';
    if (paymentSummary && payMethodInput) paymentSummary.textContent = payMethodInput.value || '-';
}

// Customer dashboard page (profile.html) – show real logged-in user + real orders
async function initCustomerDashboardPage() {
    // Only run on the dashboard layout page
    if (!document.body || !document.body.classList.contains('customer-dashboard-page')) return;

    // Ensure we have the latest currentUser from localStorage if needed
    if (!currentUser) {
        try {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.warn('Could not read citymart_user for dashboard', e);
        }
    }

    const nameHeading = document.getElementById('cd-name');
    const nameMain = document.getElementById('cd-name-main');
    const emailEl = document.getElementById('cd-email');
    const phoneEl = document.getElementById('cd-phone');
    const addrEl = document.getElementById('cd-address');
    const lastTxnEl = document.getElementById('cd-last-transaction');

    const totalSpentEl = document.getElementById('cd-total-spent');
    const totalOrdersEl = document.getElementById('cd-total-orders');
    const completeOrdersEl = document.getElementById('cd-complete-orders');
    const pendingOrdersEl = document.getElementById('cd-pending-orders');

    const tbody = document.getElementById('cd-orders-tbody');
    const statusFilter = document.getElementById('cd-order-filter-status');
    const searchInput = document.getElementById('cd-order-search');

    // If not logged in as a customer, do not show any saved profile; ask to login instead
    if (!currentUser || currentUser.role !== 'customer') {
        if (nameHeading) nameHeading.textContent = 'Please login';
        if (nameMain) nameMain.textContent = 'Please login';
        if (emailEl) emailEl.textContent = '-';
        if (phoneEl) phoneEl.textContent = '-';
        if (addrEl) addrEl.textContent = '-';
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6">Please login as a customer to view your profile and orders.</td></tr>';
        }
        if (totalSpentEl) totalSpentEl.textContent = '₹0';
        if (totalOrdersEl) totalOrdersEl.textContent = '0';
        if (completeOrdersEl) completeOrdersEl.textContent = '0';
        if (pendingOrdersEl) pendingOrdersEl.textContent = '0';

        if (typeof showToast === 'function') {
            showToast('Please login as a customer to view your profile.', 'error');
        }
        if (typeof startLoginAs === 'function') {
            startLoginAs('customer');
        } else if (typeof openLoginOptionsModal === 'function') {
            openLoginOptionsModal();
        }
        return;
    }

    // Basic customer identity from currentUser
    const name = currentUser.username || 'Customer';
    if (nameHeading) nameHeading.textContent = name;
    if (nameMain) nameMain.textContent = name;
    if (emailEl) emailEl.textContent = currentUser.email || '-';
    if (phoneEl) phoneEl.textContent = currentUser.phone || '-';

    // Load saved shipping address (from profile preferences) if available
    try {
        const storedProfile = localStorage.getItem('citymart_profile');
        if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            if (addrEl && profile.shippingAddress) addrEl.textContent = profile.shippingAddress;
        }
    } catch (e) {
        console.warn('Could not read profile for dashboard address', e);
    }

    if (!tbody) return;

    // hi
    const url = API_BASE + '/api/orders/' + encodeURIComponent(currentUser.id || currentUser._id);

    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    let allOrders = [];
    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            console.error('Failed to load orders for dashboard', resp.status);
            tbody.innerHTML = '<tr><td colspan="6">Could not load your orders right now.</td></tr>';
            return;
        }
        const data = await resp.json();
        allOrders = Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Error loading orders for dashboard', err);
        tbody.innerHTML = '<tr><td colspan="6">Error loading your orders.</td></tr>';
        return;
    }

    if (!allOrders.length) {
        tbody.innerHTML = '<tr><td colspan="6">No orders found for this account yet.</td></tr>';
        if (totalSpentEl) totalSpentEl.textContent = '₹0';
        if (totalOrdersEl) totalOrdersEl.textContent = '0';
        if (completeOrdersEl) completeOrdersEl.textContent = '0';
        if (pendingOrdersEl) pendingOrdersEl.textContent = '0';
        return;
    }

    // Compute basic metrics
    const normalizeStatus = (raw) => {
        const s = (raw || '').toLowerCase();
        if (s === 'confirmed' || s === 'completed') return 'Completed';
        if (s === 'pending' || s === 'processing') return 'Pending';
        if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
        return raw || 'Pending';
    };

    const totalSpent = allOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const completedCount = allOrders.filter(o => normalizeStatus(o.status) === 'Completed').length;
    const pendingCount = allOrders.filter(o => normalizeStatus(o.status) === 'Pending').length;

    if (totalSpentEl) totalSpentEl.textContent = '₹' + totalSpent.toLocaleString('en-IN');
    if (totalOrdersEl) totalOrdersEl.textContent = String(allOrders.length);
    if (completeOrdersEl) completeOrdersEl.textContent = String(completedCount);
    if (pendingOrdersEl) pendingOrdersEl.textContent = String(pendingCount);

    // Last transaction date
    const sortedByDate = [...allOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const mostRecent = sortedByDate[0];
    if (mostRecent && lastTxnEl) {
        const dt = mostRecent.createdAt ? new Date(mostRecent.createdAt) : null;
        lastTxnEl.textContent = dt ? dt.toLocaleDateString() : '-';
    }

    function buildTableRows() {
        if (!tbody) return;
        tbody.innerHTML = '';

        const statusVal = statusFilter ? statusFilter.value : 'all';
        const query = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();

        let rows = allOrders.slice();

        if (statusVal && statusVal !== 'all') {
            rows = rows.filter(o => {
                return (o.status || '').toLowerCase() === statusVal.toLowerCase() ||
                       normalizeStatus(o.status).toLowerCase() === statusVal.toLowerCase();
            });
        }

        rows = rows.filter(o => {
            if (!query) return true;
            const idStr = (o._id || '').toString().toLowerCase();
            const firstProd = (o.products && o.products[0] && o.products[0].productId && o.products[0].productId.name) || '';
            return idStr.includes(query) || firstProd.toLowerCase().includes(query);
        });

        if (!rows.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6">No orders match the selected filters.</td>';
            tbody.appendChild(tr);
            return;
        }

        rows.forEach(o => {
            const created = o.createdAt ? new Date(o.createdAt) : null;
            const dateStr = created ? created.toLocaleDateString() : '-';
            const orderId = o._id || '';

            const products = Array.isArray(o.products) ? o.products : [];
            const firstProd = (products[0] && products[0].productId && products[0].productId.name) || 'Items';
            const itemCount = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
            const productLabel = itemCount > 1 ? `${firstProd} (+${itemCount - 1} more)` : firstProd;

            const priceStr = '₹' + Number(o.totalAmount || 0).toLocaleString('en-IN');
            const payMethod = o.paymentMethod || 'Online';
            const uiStatus = normalizeStatus(o.status);
            const pillClass = uiStatus === 'Completed' ? 'status-active' : 'status-muted';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${orderId}</td>
                <td>${productLabel}</td>
                <td>${priceStr}</td>
                <td>${payMethod}</td>
                <td><span class="status-pill ${pillClass}">${uiStatus}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (statusFilter) statusFilter.addEventListener('change', buildTableRows);
    if (searchInput) searchInput.addEventListener('input', buildTableRows);

    buildTableRows();
}

function handleUseCurrentLocationClick() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported in this browser.', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            const addrInput = document.getElementById('profile-shipping-address');
            if (addrInput && !addrInput.value) {
                addrInput.value = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
            }

            // Open Google Maps so the customer can confirm/edit the address
            const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            window.open(mapsUrl, '_blank');
        },
        (err) => {
            console.warn('Geolocation error', err);
            showToast('Could not fetch location. Please enter address manually.', 'error');
        }
    );
}

// Toast notification helper
function showToast(message, type = 'success', duration = 3000) {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;

    const msg = document.createElement('div');
    msg.className = 'toast-message';
    msg.textContent = message;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
        toastContainer.removeChild(toast);
    };

    toast.appendChild(msg);
    toast.appendChild(closeBtn);

    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toastContainer.removeChild(toast);
        }
    }, duration);
}

function toggleUserMenuDropdown() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (!dropdown) return;
    if (!currentUser) {
        // If somehow called while logged out, just open login options
        openLoginOptionsModal();
        return;
    }
    dropdown.classList.toggle('open');
}

function closeUserMenuDropdown() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) {
        dropdown.classList.remove('open');
    }
}

// Close all overlays/modals and mobile navigation.
// Useful when navigating via the main navbar so old popups
// (login, cart, vendors, etc.) do not stay open.
function closeAllOverlays() {
    try { closeUserMenuDropdown(); } catch (e) {}
    try { closeLoginOptionsModal(); } catch (e) {}
    try { closeAuthModal(); } catch (e) {}
    try { closeCartModal(); } catch (e) {}
    try { closeCheckoutModal(); } catch (e) {}
    try { closeVendorsModal(); } catch (e) {}
    try { closeVendorProductsModal(); } catch (e) {}
    try { closeOrdersModal(); } catch (e) {}
    try { closeBudgiesModal(); } catch (e) {}
    try { closeGenderModal(); } catch (e) {}
    try { closeVendorProfileModal(); } catch (e) {}
    try { closeCustomerProfileModal(); } catch (e) {}

    // Also collapse mobile navigation and header search, if open
    const mobileMenu = document.querySelector('.mobile-menu');
    const hamburger = document.querySelector('.hamburger');
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');

    const searchWrapper = document.querySelector('.global-search-wrapper');
    if (searchWrapper) searchWrapper.classList.remove('global-search-open');
}

function openCartFromMenu() {
    closeUserMenuDropdown();
    showCartModal();
}

function openOrdersFromMenu() {
    closeUserMenuDropdown();
    showOrdersModal();
}

function goToCustomerProfilePage() {
    // Navigate to dedicated profile page for customers
    window.location.href = 'profile.html';
}

// Handle clicks on the "Profile" item in the main navigation bar
function handleProfileNavClick(event) {
    if (event) event.preventDefault();

    // No user logged in: ask them to login as a customer
    if (!currentUser) {
        if (typeof showToast === 'function') {
            showToast('Please login to view your profile.', 'error');
        }
        if (typeof startLoginAs === 'function') {
            startLoginAs('customer');
        } else if (typeof openLoginOptionsModal === 'function') {
            openLoginOptionsModal();
        }
        return;
    }

    // Route based on role
    if (currentUser.role === 'customer') {
        window.location.href = 'profile.html';
    } else if (currentUser.role === 'vendor') {
        window.location.href = 'vendor.html';
    } else if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        if (typeof showToast === 'function') {
            showToast('This profile page is only for customers.', 'error');
        }
    }
}

async function openVendorProfileModal() {
    // Load current user from localStorage if needed
    try {
        if (!currentUser) {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.warn('Could not read current user for vendor profile', e);
    }

    // If vendor is logged in, treat Profile as "open vendor dashboard"
    if (currentUser && currentUser.role === 'vendor') {
        closeUserMenuDropdown();
        window.location.href = 'vendor.html';
        return;
    }

    // Otherwise show a simple message
    showToast('Please login as a vendor first.', 'error');
}

function closeVendorProfileModal() {
    const modal = document.getElementById('vendor-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openCustomerProfileModal() {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    const name = currentUser.username || '-';
    const email = currentUser.email || '-';
    const phone = currentUser.phone || 'Not provided';

    let preferences = '-';
    let loyalty = '-';
    let personalization = '-';
    try {
        const stored = localStorage.getItem('citymart_profile');
        if (stored) {
            const profile = JSON.parse(stored);
            preferences = profile.preferences || '-';
            loyalty = profile.loyalty || '-';
            personalization = profile.personalization || '-';
        }
    } catch (e) {
        console.warn('Could not read profile preferences', e);
    }

    const nameEl = document.getElementById('customer-profile-name');
    const emailEl = document.getElementById('customer-profile-email');
    const phoneEl = document.getElementById('customer-profile-phone');
    const prefEl = document.getElementById('customer-profile-preferences');
    const loyaltyEl = document.getElementById('customer-profile-loyalty');
    const personalizationEl = document.getElementById('customer-profile-personalization');

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (phoneEl) phoneEl.textContent = phone;
    if (prefEl) prefEl.textContent = preferences;
    if (loyaltyEl) loyaltyEl.textContent = loyalty;
    if (personalizationEl) personalizationEl.textContent = personalization;

    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.style.display = 'block';
    }
    closeUserMenuDropdown();
}

function closeCustomerProfileModal() {
    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function goToVendorProducts() {
    // Load current user from localStorage if needed
    try {
        if (!currentUser) {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.warn('Could not read current user for goToVendorProducts', e);
    }

    if (!currentUser || currentUser.role !== 'vendor') {
        showToast('Please login as a vendor first.', 'error');
        return;
    }
    closeUserMenuDropdown();
    window.location.href = 'vendor.html';
}

// Admin "Actions" entry from header dropdown
function openAdminActions() {
    closeUserMenuDropdown();
    // Take admin to the main admin dashboard; they can see pending items there
    window.location.href = 'admin.html';
}

// Logout triggered from dropdown
function logoutFromMenu() {
    closeUserMenuDropdown();
    logout();
}

// Global search bar handler (header search on all pages)
// Compact behavior: when empty, first click just expands the search box.
function handleGlobalSearchSubmit(event) {
    if (event) event.preventDefault();
    const wrapper = document.querySelector('.global-search-wrapper');
    const input = document.getElementById('global-search-input');
    if (!input || !wrapper) return false;

    const raw = input.value || '';
    const query = raw.trim();

    // If no query, toggle open state and focus instead of navigating.
    if (!query) {
        if (!wrapper.classList.contains('global-search-open')) {
            wrapper.classList.add('global-search-open');
            input.focus();
        } else {
            // already open but still empty: just focus
            input.focus();
        }
        return false;
    }

    const params = new URLSearchParams();
    params.set('search', query);

    // Always take user to the products listing page with the search query.
    // This works from index, admin, vendor, product-detail, etc.
    window.location.href = 'products.html?' + params.toString();
    return false;
}

// Initialize cart count, auth state, and checkout form listener on page load
document.addEventListener('DOMContentLoaded', function() {
    // Close user dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('user-menu-dropdown');
        const toggle = document.getElementById('user-menu-toggle');
        if (!dropdown || !toggle) return;
        if (!dropdown.classList.contains('open')) return;
        if (!dropdown.contains(e.target) && e.target !== toggle) {
            dropdown.classList.remove('open');
        }
    });

    // Restore auth from localStorage if available
    try {
        const storedToken = localStorage.getItem('citymart_token');
        const storedUser = localStorage.getItem('citymart_user');
        if (storedToken && storedUser) {
            authToken = storedToken;
            currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.warn('Could not read auth info from localStorage', e);
    }

    // Restore cart from localStorage if available
    try {
        const storedCart = localStorage.getItem('citymart_cart');
        if (storedCart) {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed)) {
                cart = parsed;
            }
        }
    } catch (e) {
        console.warn('Could not read cart from localStorage', e);
    }

    updateCartCount();
    updateCartDisplay();
    updateAuthUI();

    // Add event listener for checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutFormSubmission);
        // Initialize payment method toggle behaviour for checkout modal
        initCheckoutPaymentUI();
    }

    // Add event listener for login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Add event listener for vendor product form (for vendors)
    const vendorProductForm = document.getElementById('vendor-product-form');
    if (vendorProductForm) {
        vendorProductForm.addEventListener('submit', handleVendorProductSubmit);
    }

    // Progressive profiling form (checkout -> small preferences modal)
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileFormSubmit);
    }

    // If we are on the dedicated profile pages, initialize them
    initCustomerProfilePage();
    initCustomerDashboardPage();

    // Orders filters: reload orders list when filters change (if modal is open)
    const statusFilter = document.getElementById('orders-status-filter');
    const fromInput = document.getElementById('orders-from-date');
    const toInput = document.getElementById('orders-to-date');
    const reloader = () => {
        const modal = document.getElementById('orders-modal');
        if (modal && modal.style.display === 'block') {
            loadOrders();
        }
    };
    if (statusFilter) statusFilter.addEventListener('change', reloader);
    if (fromInput) fromInput.addEventListener('change', reloader);
    if (toInput) toInput.addEventListener('change', reloader);

    // Populate sub categories based on main category (vendor add product form)
    const mainCatSelect = document.getElementById('vendor-product-main-category');
    const subCatSelect = document.getElementById('vendor-product-sub-category');
    const clothingExtraFields = document.getElementById('vendor-product-clothing-fields');

    const subCategoryOptions = {
        clothing: ['shoes', 'shirts', 'pants', 'dresses', 'accessories', 'etc'],
        pet: [
            'Dogs  Labrador, Beagle, Pug, German Shepherd, Indian Pariah',
            'Cats  Persian, Siamese, Bengal, Maine Coon',
            'Birds  Parrots, Budgies, Zebra Finch, Conures, Doves, Macaws (Hyacinth, Hahns), Canaries, Sun Conure, Lovebirds, Cockatiels',
            'Rabbits  Angora, Dutch, Lop',
            'Fish  Goldfish, Betta, Guppies, Koi',
            'Hamsters & Guinea Pigs  Popular small pets for kids',
            'Turtles & Exotic Pets  Red-eared sliders, tortoises',
            'etc',
        ],
        food: ['fruits', 'vegetables', 'bakery', 'dairy', 'snacks', 'etc'],
        electronics: ['mobiles', 'laptops', 'accessories', 'appliances', 'etc'],
        household: ['cleaning', 'kitchenware', 'furniture', 'etc'],
        stationery: ['books', 'notebooks', 'pens', 'art supplies', 'etc'],
        services: ['delivery', 'repair', 'cleaning', 'etc'],
    };

    const petSpeciesOptions = [
        // Birds
        'English Budgie', 'Australian Budgie',
        'Peach-faced Lovebird', 'Fischers Lovebird', 'Masked Lovebird',
        'Lutino Cockatiel', 'Pied Cockatiel', 'Grey Cockatiel',
        'Indian Ringneck Parrot', 'African Grey Parrot', 'Sun Conure',
        'Macaw  Blue & Gold', 'Macaw  Scarlet',
        'Zebra Finch', 'Gouldian Finch',
        'Yellow Canary', 'Red Factor Canary',
        // Dogs
        'Labrador Retriever', 'German Shepherd', 'Beagle', 'Pug', 'Indian Pariah Dog',
        // Cats
        'Persian Cat', 'Siamese Cat', 'Bengal Cat', 'Maine Coon',
        // Fish
        'Goldfish', 'Betta Fish', 'Guppy', 'Koi', 'Angelfish',
        // Rabbits
        'Angora Rabbit', 'Dutch Rabbit', 'Lop Rabbit',
        // Small pets
        'Syrian Hamster', 'Dwarf Hamster',
        'Guinea Pig  Abyssinian', 'Guinea Pig  American',
        // Turtles & tortoises
        'Red-eared Slider', 'Indian Star Tortoise',
    ];

    function applyVendorCategoryState() {
        if (!mainCatSelect || !subCatSelect) return;

        const mainVal = mainCatSelect.value;
        subCatSelect.innerHTML = '<option value="">Select sub category</option>';
        const list = subCategoryOptions[mainVal] || [];
        list.forEach(sc => {
            const opt = document.createElement('option');
            opt.value = sc;
            opt.textContent = sc;
            subCatSelect.appendChild(opt);
        });

        // Show clothing-specific fields only when Clothing & Lifestyle is selected
        if (clothingExtraFields) {
            clothingExtraFields.style.display = mainVal === 'clothing' ? 'block' : 'none';
        }

        // When main category is Pet, treat brand field as Species/Breed and populate species list
        const brandInput = document.getElementById('vendor-product-brand');
        const speciesList = document.getElementById('vendor-species-list');
        if (brandInput && speciesList) {
            if (mainVal === 'pet') {
                brandInput.placeholder = 'Species / Breed (e.g. English Budgie, Labrador)';
                speciesList.innerHTML = '';
                petSpeciesOptions.forEach(name => {
                    const opt = document.createElement('option');
                    opt.value = name;
                    speciesList.appendChild(opt);
                });
            } else {
                brandInput.placeholder = 'Brand / Company name';
                speciesList.innerHTML = '';
            }
        }
    }

    if (mainCatSelect && subCatSelect) {
        mainCatSelect.addEventListener('change', applyVendorCategoryState);
        // Initialize state on first load (in case values are already selected)
        applyVendorCategoryState();
    }
});



// Show a professional OTP input dialog instead of using window.prompt
function askForOtpCode(email, statusEl) {
    return new Promise((resolve, reject) => {
        // Remove any existing OTP overlay
        const existing = document.getElementById('otp-verification-overlay');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }

        const overlay = document.createElement('div');
        overlay.id = 'otp-verification-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        const dialog = document.createElement('div');
        dialog.style.backgroundColor = '#fff';
        dialog.style.borderRadius = '8px';
        dialog.style.maxWidth = '400px';
        dialog.style.width = '90%';
        dialog.style.padding = '20px';
        dialog.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

        dialog.innerHTML = `
            <h2 style="margin-top:0;margin-bottom:8px;font-size:20px;">Verify your email</h2>
            <p style="margin:0 0 12px 0;font-size:14px;color:#555;">
                A one-time verification code has been sent to
                <strong>${email}</strong>. Please enter it below to complete your registration.
            </p>
            <label for="otp-code-input" style="display:block;font-size:13px;margin-bottom:4px;">Verification code</label>
            <input id="otp-code-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6"
                   style="width:100%;padding:8px 10px;font-size:16px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;" />
            <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px;">
                <button type="button" id="otp-cancel-btn" style="padding:8px 14px;font-size:14px;border-radius:4px;border:1px solid #ccc;background:#f5f5f5;cursor:pointer;">Cancel</button>
                <button type="button" id="otp-submit-btn" style="padding:8px 14px;font-size:14px;border-radius:4px;border:1px solid transparent;background:#007bff;color:#fff;cursor:pointer;">Verify</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const codeInput = dialog.querySelector('#otp-code-input');
        const cancelBtn = dialog.querySelector('#otp-cancel-btn');
        const submitBtn = dialog.querySelector('#otp-submit-btn');

        const close = () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        cancelBtn.addEventListener('click', () => {
            if (statusEl) statusEl.textContent = 'Verification cancelled.';
            close();
            reject(new Error('cancelled'));
        });

        const handleSubmit = () => {
            const code = codeInput.value.trim();
            if (!code) {
                showToast('Please enter the verification code.', 'error');
                return;
            }
            close();
            resolve(code);
        };

        submitBtn.addEventListener('click', handleSubmit);
        codeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        });

        // Auto-focus the input for better UX
        setTimeout(() => {
            try { codeInput.focus(); } catch (e) {}
        }, 0);
    });
}

// Signup flow with verification code
async function handleSignupFlow(email, password, statusEl) {
    const usernameInput = document.getElementById('login-username');
    const username = usernameInput ? usernameInput.value.trim() : '';

    if (!username) {
        showToast('Please enter a username.', 'error');
        return;
    }

    // Get phone number for Firebase Phone OTP verification
    const phoneInput = document.getElementById('login-phone');
    const phoneNumber = phoneInput ? phoneInput.value.trim() : '';

    if (!phoneNumber) {
        showToast('Please enter a phone number.', 'error');
        return;
    }

    // Validate phone number format (must start with +)
    if (!phoneNumber.startsWith('+')) {
        showToast('Phone number must include country code (e.g., +919876543210).', 'error');
        return;
    }

    const role = loginContext === 'vendor' ? 'vendor' : 'customer';

    // ============================================================================
    // STEP 1: Firebase Phone OTP Verification (NEW - runs before email OTP)
    // ============================================================================
    try {
        if (statusEl) statusEl.textContent = 'Sending phone verification code...';
        
        // Send phone OTP
        await sendPhoneOTP(phoneNumber);
        
        const phoneOtpMsg = `A verification code has been sent to ${phoneNumber}. Please enter it to continue.`;
        showToast(phoneOtpMsg, 'success');
        if (statusEl) statusEl.textContent = phoneOtpMsg;

        // Ask user for phone OTP code
        let phoneOtpCode;
        try {
            phoneOtpCode = await askForPhoneOtpCode(phoneNumber, statusEl);
        } catch (e) {
            // User cancelled phone verification
            if (statusEl) statusEl.textContent = 'Phone verification cancelled.';
            return;
        }

        // Verify phone OTP
        if (statusEl) statusEl.textContent = 'Verifying phone number...';
        await verifyPhoneOTP(phoneOtpCode);
        
        showToast('Phone number verified successfully.', 'success');
    } catch (error) {
        const errorMsg = error.message || 'Phone verification failed. Please try again.';
        showToast(errorMsg, 'error');
        if (statusEl) statusEl.textContent = errorMsg;
        return; // Stop signup if phone verification fails
    }

    // ============================================================================
    // STEP 2: Email OTP Verification (EXISTING FLOW - continues after phone OTP)
    // ============================================================================
    // Step 1: request verification code
    const resp = await fetch('/api/users/request-signup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
    });

    const data = await resp.json();

    if (!resp.ok) {
        const msg = data && data.message ? data.message : 'Signup failed';
        showToast(msg, 'error');
        if (statusEl) statusEl.textContent = msg;
        return;
    }

    // If server auto-verified (dev mode, no email service), skip OTP and go straight to login
    if (data.autoVerified) {
        showToast('Account created successfully. Logging you in...', 'success');
    } else {
        // Production behaviour: do NOT display the OTP; only show a generic message
        const infoMsg = 'A one-time verification code has been sent to your email address. Please check your inbox and enter the code to continue.';
        showToast(infoMsg, 'success');
        if (statusEl) statusEl.textContent = infoMsg;

        // Ask the user for the code they received via email using a dedicated dialog (no OTP is ever shown by the site)
        let userCode;
        try {
            userCode = await askForOtpCode(email, statusEl);
        } catch (e) {
            // User cancelled
            return;
        }

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
    }

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

// Function to checkout
function checkout() {
  // Close cart modal (if open)
  closeCartModal();

  // Populate summary on the right using current cart contents
  try {
    const nameEl       = document.getElementById('checkout-order-name');
    const imgEl        = document.getElementById('checkout-order-image');
    const qtyEl        = document.getElementById('checkout-order-qty');
    const itemsTotalEl = document.getElementById('checkout-items-total');
    const subtotalEl   = document.getElementById('checkout-subtotal');
    const totalEl      = document.getElementById('checkout-total-amount');
    const listEl       = document.getElementById('checkout-items-list');

    if (nameEl && imgEl && qtyEl && itemsTotalEl && subtotalEl && totalEl) {
      let totalQty   = 0;
      let itemsTotal = 0;

      cart.forEach(item => {
        totalQty   += item.quantity;
        itemsTotal += item.price * item.quantity;
      });

      if (listEl) listEl.innerHTML = '';

      // Helper to build a row with thumbnail + text for each cart item
      const buildItemRow = (item) => {
        const row = document.createElement('div');
        row.className = 'checkout-item-row';

        const thumb = document.createElement('img');
        thumb.src = item.image || './images/placeholder.jpg';
        thumb.alt = item.name;
        thumb.onerror = function () { this.src = './images/placeholder.jpg'; };

        const text = document.createElement('div');
        text.className = 'checkout-item-row-text';
        text.textContent = `${item.name} x ${item.quantity} — ₹${(item.price * item.quantity).toFixed(2)}`;

        row.appendChild(thumb);
        row.appendChild(text);
        return row;
      };

      if (cart.length >= 1) {
        const first = cart[0];

        if (cart.length === 1) {
          // Single-product checkout
          nameEl.textContent = first.name;
          qtyEl.textContent  = first.quantity;
        } else {
          // Multiple products: generic header + total quantity
          nameEl.textContent = 'Your items';
          qtyEl.textContent  = `${totalQty} items in cart`;
        }

        imgEl.src = first.image || './images/placeholder.jpg';

        if (listEl) {
          cart.forEach(item => {
            listEl.appendChild(buildItemRow(item));
          });
        }
      } else {
        // Empty cart
        nameEl.textContent = 'Your items';
        imgEl.src          = './images/placeholder.jpg';
        qtyEl.textContent  = '0';

        if (listEl) {
          const row = document.createElement('div');
          row.className = 'checkout-item-row';
          row.textContent = 'No items in cart.';
          listEl.appendChild(row);
        }
      }

      itemsTotalEl.textContent = itemsTotal.toFixed(2);
      subtotalEl.textContent   = itemsTotal.toFixed(2);
      totalEl.textContent      = itemsTotal.toFixed(2); // no extra fees in demo
    }
  } catch (e) {
    console.warn('Could not populate checkout summary', e);
  }

  // Finally show the checkout modal
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) {
    checkoutModal.style.display = 'block';
  }
}

// Close the checkout modal
function closeCheckoutModal() {
  const checkoutModal = document.getElementById('checkout-modal');
  if (checkoutModal) {
    checkoutModal.style.display = 'none';
  }
}
function showOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'block';
        loadOrders();
    }
}

// Function to close orders modal
function closeOrdersModal() {
    const modal = document.getElementById('orders-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to load orders for current user (customer/vendor)
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    const subtitle = document.getElementById('orders-subtitle');
    if (!ordersList) return;

    ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">Loading your orders...</p>';
    if (subtitle) subtitle.textContent = '';

    if (!currentUser) {
        ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">Please login to view your orders.</p>';
        return;
    }

    try {
        // hi
        let url = '';
        let mode = 'customer';

        if (currentUser.role === 'customer') {
            url = API_BASE + '/api/orders/' + encodeURIComponent(currentUser.id || currentUser._id);
            if (subtitle) subtitle.textContent = 'Orders placed from this customer account.';
        } else if (currentUser.role === 'vendor') {
            // Vendors see orders containing their products
            url = API_BASE + '/api/orders';
            if (subtitle) subtitle.textContent = 'Orders that include your products.';
            mode = 'vendor';
        } else {
            ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">Use the admin dashboard to view all orders.</p>';
            return;
        }

        // Include auth token when calling the orders API so protected routes work
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            ordersList.innerHTML = '<p style="padding:1rem; text-align:center; color:red;">Failed to load orders.</p>';
            return;
        }
        let orders = await resp.json();
        if (!Array.isArray(orders)) orders = [];

        if (mode === 'vendor') {
            const vendorId = currentUser.id || currentUser._id;
            orders = orders.filter(o => (o.products || []).some(p => {
                const prod = p.productId;
                return prod && prod.vendorId && String(prod.vendorId) === String(vendorId);
            }));
        }

        // Apply filters (status + date) before rendering
        const statusFilter = document.getElementById('orders-status-filter');
        const fromInput = document.getElementById('orders-from-date');
        const toInput = document.getElementById('orders-to-date');

        if (statusFilter && statusFilter.value !== 'all') {
            const val = statusFilter.value;
            orders = orders.filter(o => (o.status || 'pending') === val);
        }

        if (fromInput && fromInput.value) {
            const fromDate = new Date(fromInput.value);
            orders = orders.filter(o => {
                const t = new Date(o.createdAt || 0).getTime();
                return !Number.isNaN(t) && t >= fromDate.getTime();
            });
        }
        if (toInput && toInput.value) {
            const toDate = new Date(toInput.value);
            toDate.setHours(23, 59, 59, 999);
            orders = orders.filter(o => {
                const t = new Date(o.createdAt || 0).getTime();
                return !Number.isNaN(t) && t <= toDate.getTime();
            });
        }

        if (!orders.length) {
            ordersList.innerHTML = '<p style="padding:1rem; text-align:center;">No orders found for selected filters.</p>';
            return;
        }

        // Sort newest first
        orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        ordersList.innerHTML = '';

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';

            const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : '-';
            const total = Number(order.totalAmount || 0).toFixed(2);
            const status = order.status || 'pending';

            const left = document.createElement('div');
            const header = document.createElement('div');
            header.className = 'order-card-header';
            header.innerHTML = `
                <div>
                    <div class="order-id">Order #${order._id}</div>
                    <div class="order-date">${created}</div>
                </div>
                <span class="order-status-badge order-status-${status}">${status}</span>
            `;
            left.appendChild(header);

            const totalEl = document.createElement('div');
            totalEl.className = 'order-total';
            totalEl.textContent = `Total: ₹${total}`;
            left.appendChild(totalEl);

            const right = document.createElement('div');
            const productsWrap = document.createElement('div');
            productsWrap.className = 'order-products';

            (order.products || []).forEach(p => {
                const prod = p.productId || {};
                const name = prod.name || 'Product';
                const qty = p.quantity || 0;
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'order-product-chip';

                const img = document.createElement('img');
                img.src = prod.image || './images/placeholder.jpg';
                img.alt = name;
                img.onerror = function () { this.src = './images/placeholder.jpg'; };

                const textSpan = document.createElement('span');
                textSpan.textContent = `${name} × ${qty}`;

                chip.appendChild(img);
                chip.appendChild(textSpan);

                chip.addEventListener('click', () => {
                    openProductFromOrder(prod);
                });
                productsWrap.appendChild(chip);
            });

            if (!(order.products || []).length) {
                const none = document.createElement('span');
                none.textContent = 'No items';
                productsWrap.appendChild(none);
            }

            right.appendChild(productsWrap);

            const meta = document.createElement('div');
            meta.className = 'order-meta';
            if (mode === 'vendor' && order.userId) {
                const customerName = order.userId.username || order.userId.email || '';
                meta.textContent = `Customer: ${customerName}`;
            } else {
                meta.textContent = '';
            }
            right.appendChild(meta);

            card.appendChild(left);
            card.appendChild(right);

            ordersList.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading orders:', err);
        ordersList.innerHTML = '<p style="padding:1rem; text-align:center; color:red;">Error loading orders.</p>';
    }
}

// Function to show login options / or open account dropdown when logged in
function showLoginOptions() {
    if (currentUser) {
        // For any logged-in user (admin, vendor, customer), use the header dropdown
        toggleUserMenuDropdown();
        return;
    }
    openLoginOptionsModal();
}

function openLoginOptionsModal() {
    const modal = document.getElementById('login-options-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeLoginOptionsModal() {
    const modal = document.getElementById('login-options-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function startLoginAs(type) {
    loginContext = type; // 'customer' or 'vendor'
    const titleEl = document.getElementById('auth-modal-title');
    if (titleEl) {
        titleEl.textContent = type === 'vendor' ? 'Vendor Login' : 'Customer Login';
    }
    closeLoginOptionsModal();
    openAuthModal();
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Vendor product modal helpers
function openVendorProductModal() {
    const modal = document.getElementById('vendor-product-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeVendorProductModal() {
    const modal = document.getElementById('vendor-product-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleVendorProductSubmit(event) {
    event.preventDefault();

    if (!authToken || !currentUser || currentUser.role !== 'vendor') {
        showToast('Only logged-in vendors can add or edit products.', 'error');
        return;
    }

    const nameInput = document.getElementById('vendor-product-name');
    const priceInput = document.getElementById('vendor-product-price');
    const mainCategoryInput = document.getElementById('vendor-product-main-category');
    const subCategoryInput = document.getElementById('vendor-product-sub-category');
    const brandInput = document.getElementById('vendor-product-brand');
    const descriptionInput = document.getElementById('vendor-product-description');
    const discountInput = document.getElementById('vendor-product-discount');
    const deliveryTimeInput = document.getElementById('vendor-product-delivery-time');
    const featuresInput = document.getElementById('vendor-product-features');
    const imageInput = document.getElementById('vendor-product-image');
    const clothingSizeRow = document.getElementById('vendor-size-row-clothing');
    const shoeSizeRow = document.getElementById('vendor-size-row-shoes');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? parseFloat(priceInput.value) : NaN;
    const mainCategory = mainCategoryInput ? mainCategoryInput.value : '';
    const subCategory = subCategoryInput ? subCategoryInput.value : '';
    const brand = brandInput ? brandInput.value.trim() : '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const discount = discountInput ? discountInput.value.trim() : '';
    const deliveryTime = deliveryTimeInput ? deliveryTimeInput.value.trim() : '';
    const baseFeatures = featuresInput ? featuresInput.value.trim() : '';

    function collectSizesFromRow(rowEl) {
        if (!rowEl) return [];
        const boxes = rowEl.querySelectorAll('input[type="checkbox"]');
        const values = [];
        boxes.forEach(b => { if (b.checked) values.push(b.value); });
        return values;
    }

    let sizeList = [];
    const isClothing = mainCategory === 'clothing';
    const isShoe = isClothing && subCategory && subCategory.toLowerCase().includes('shoe');
    if (isShoe) {
        sizeList = collectSizesFromRow(shoeSizeRow);
    } else if (isClothing) {
        sizeList = collectSizesFromRow(clothingSizeRow);
    }

    if (!name || !mainCategory || !subCategory || !brand || !description || !deliveryTime || isNaN(price)) {
        showToast('Please fill all required fields (name, price, main category, sub category, brand, description, delivery time).', 'error');
        return;
    }

    // For clothing / shoes, fold size info into features so its visible even if backend schema is simple.
    let finalFeatures = baseFeatures;
    if (sizeList.length) {
        const extraText = `Sizes: ${sizeList.join(', ')}`;
        finalFeatures = baseFeatures ? `${baseFeatures} | ${extraText}` : extraText;
    }

    // Map new main/sub categories to legacy long category names used on the website,
    // so that vendor-added products also appear under the correct "Vendor" tiles.
    function mapToLegacyCategory(main, sub) {
        const m = (main || '').toLowerCase();
        const s = (sub || '').toLowerCase();

        if (m === 'pet') {
            return 'Local pet shops (food, toys, accessories)';
        }

        if (m === 'food') {
            if (s.includes('fruit') || s.includes('vegetable')) return 'Fruit & vegetable sellers';
            if (s.includes('bakery')) return 'Bakeries and sweet shops';
            if (s.includes('meat') || s.includes('fish')) return 'Butchers and fishmongers';
            if (s.includes('organic') || s.includes('health')) return 'Organic and health food stores';
            return 'Packaged goods distributors';
        }

        if (m === 'electronics') {
            if (s.includes('mobile') || s.includes('laptop') || s.includes('tablet')) return 'Mobile and laptop dealers';
            if (s.includes('repair') || s.includes('service')) return 'Repair shops and service centers';
            if (s.includes('accessories') || s.includes('headphones')) return 'Accessories retailers (chargers, cases, headphones)';
            if (s.includes('appliance') || s.includes('tv') || s.includes('refrigerator') || s.includes('mixer')) return 'Appliance stores (TVs, refrigerators, mixers)';
            return 'Mobile and laptop dealers';
        }

        if (m === 'household') {
            if (s.includes('clean')) return 'Cleaning supply wholesalers';
            if (s.includes('kitchen')) return 'Kitchenware and utensils shops';
            if (s.includes('furniture') || s.includes('decor')) return 'Furniture and home decor sellers';
            if (s.includes('hardware') || s.includes('tool')) return 'Local hardware stores';
            return 'Cleaning supply wholesalers';
        }

        if (m === 'clothing') {
            if (s.includes('shirt') || s.includes('pant') || s.includes('dress')) return 'Boutique clothing stores';
            if (s.includes('shoe') || s.includes('sandal') || s.includes('footwear')) return 'Shoe and accessories shops';
            if (s.includes('tailor') || s.includes('alteration')) return 'Tailors and alteration services';
            if (s.includes('beauty') || s.includes('skin') || s.includes('makeup')) return 'Beauty and skincare outlets';
            return 'Boutique clothing stores';
        }

        if (m === 'stationery') {
            if (s.includes('book') || s.includes('notebook') || s.includes('pen')) return 'Bookstores and school supply shops';
            if (s.includes('coach') || s.includes('tuition')) return 'Coaching centers (for listing services)';
            if (s.includes('art') || s.includes('craft')) return 'Art and craft supply sellers';
            return 'Bookstores and school supply shops';
        }

        if (m === 'services') {
            if (s.includes('electric') || s.includes('plumb') || s.includes('carpent')) return 'Electricians, plumbers, and carpenters';
            if (s.includes('clean')) return 'Home cleaning services';
            if (s.includes('delivery') || s.includes('logistic') || s.includes('courier')) return 'Delivery partners and logistics providers';
            return 'Delivery partners and logistics providers';
        }

        // Fallback to whatever the vendor selected so at least search/filter works.
        return sub || main || '';
    }

    const legacyCategory = mapToLegacyCategory(mainCategory, subCategory);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', String(price));
    formData.append('mainCategory', mainCategory);
    formData.append('subCategory', subCategory);
    formData.append('brand', brand);
    // keep legacy category for compatibility with seeded data and vendor tiles
    formData.append('category', legacyCategory);
    formData.append('description', description);
    if (discount) formData.append('discount', discount);
    if (finalFeatures) formData.append('features', finalFeatures);
    if (deliveryTime) formData.append('deliveryTime', deliveryTime);
    if (imageInput && imageInput.files && imageInput.files.length) {
        // Allow up to 4 images, all under the same field name "image" so
        // the backend (multer array) can receive them as req.files.
        Array.from(imageInput.files).slice(0, 4).forEach(file => {
            formData.append('image', file);
        });
    }

    try {
        // hi
        const isEditing = !!editingProductId;
        const url = API_BASE + (isEditing ? `/api/products/${editingProductId}` : '/api/products');
        const method = isEditing ? 'PUT' : 'POST';

        const resp = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
        });

        const data = await resp.json();

        if (!resp.ok) {
            const msg = data && data.message ? data.message : 'Failed to add product.';
            showToast(msg, 'error');
            return;
        }

        showToast(isEditing ? 'Product updated successfully.' : 'Product added successfully.', 'success');

        // Reset size checkboxes
        [clothingSizeRow, shoeSizeRow].forEach(row => {
            if (!row) return;
            row.querySelectorAll('input[type="checkbox"]').forEach(b => { b.checked = false; });
        });

        // Reset form and editing state
        event.target.reset();
        editingProductId = null;
        const submitBtn = document.querySelector('.vendor-product-submit');
        if (submitBtn) {
            submitBtn.textContent = 'Save Product';
        }

        // If we are on the vendor dashboard, refresh the list after adding/updating
        if (typeof refreshVendorProductsList === 'function') {
            refreshVendorProductsList();
        }

        // Close modal if it exists (legacy flow)
        const vendorModal = document.getElementById('vendor-product-modal');
        if (vendorModal) {
            closeVendorProductModal();
        }
    } catch (err) {
        console.error('Error adding product:', err);
        showToast('Network error while adding product.', 'error');
    }
}

// Show correct size options when vendor chooses clothing vs shoes
function initVendorSizeOptions() {
    const mainCatSelect = document.getElementById('vendor-product-main-category');
    const subCatSelect = document.getElementById('vendor-product-sub-category');
    const clothingRow = document.getElementById('vendor-size-row-clothing');
    const shoeRow = document.getElementById('vendor-size-row-shoes');
    const extraBlock = document.getElementById('vendor-product-clothing-fields');

    if (!mainCatSelect || !subCatSelect || !extraBlock) return;

    function updateSizeVisibility() {
        const mainVal = mainCatSelect.value || '';
        const subVal = (subCatSelect.value || '').toLowerCase();
        const isClothing = mainVal === 'clothing';
        const isShoe = isClothing && (subVal.includes('shoe') || subVal.includes('sandal') || subVal.includes('footwear'));

        if (!isClothing) {
            extraBlock.style.display = 'none';
            if (clothingRow) clothingRow.style.display = 'none';
            if (shoeRow) shoeRow.style.display = 'none';
            return;
        }

        extraBlock.style.display = '';
        if (isShoe) {
            if (clothingRow) clothingRow.style.display = 'none';
            if (shoeRow) shoeRow.style.display = 'flex';
        } else {
            if (clothingRow) clothingRow.style.display = 'flex';
            if (shoeRow) shoeRow.style.display = 'none';
        }
    }

    mainCatSelect.addEventListener('change', updateSizeVisibility);
    subCatSelect.addEventListener('change', updateSizeVisibility);

    // Run once on load
    updateSizeVisibility();
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const statusEl = document.getElementById('login-status');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
    }

    try {
        if (statusEl) statusEl.textContent = authMode === 'signup' ? 'Signing up...' : 'Logging in...';

        if (authMode === 'signup') {
            await handleSignupFlow(email, password, statusEl);
            return;
        }

        // hi
        const response = await fetch(API_BASE + '/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data && data.message ? data.message : 'Login failed';
            showToast(msg, 'error');
            if (statusEl) statusEl.textContent = msg;
            return;
        }

        // Enforce role based on loginContext, but always allow admin
        const userRole = data.user && data.user.role;
        if (userRole !== 'admin') {
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
        }

        authToken = data.token;
        currentUser = data.user;

        // Persist session
        try {
            localStorage.setItem('citymart_token', authToken);
            localStorage.setItem('citymart_user', JSON.stringify(currentUser));
        } catch (e) {
            console.warn('Could not access localStorage', e);
        }

        updateAuthUI();
        showToast(`Welcome, ${currentUser.username || currentUser.email}`, 'success');
        if (statusEl) statusEl.textContent = '';

        // Redirect based on role
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (loginContext === 'vendor' && currentUser.role === 'vendor') {
            window.location.href = 'vendor.html';
        }

        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error during login.', 'error');
        if (statusEl) statusEl.textContent = 'Network error.';
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    try {
        localStorage.removeItem('citymart_token');
        localStorage.removeItem('citymart_user');
        localStorage.removeItem('citymart_cart');
        localStorage.removeItem('citymart_profile');
    } catch (e) {
        console.warn('Could not clear localStorage', e);
    }
    if (typeof cart !== 'undefined') {
        cart = [];
    }
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    if (typeof updateCartDisplay === 'function') {
        try { updateCartDisplay(); } catch(e) {}
    }
    updateAuthUI();
    showToast('Logged out successfully.', 'success');
}

function updateAuthUI() {
    const loginLinks = document.querySelectorAll('a[onclick=\"showLoginOptions()\"], .login-btn');
    loginLinks.forEach(link => {
        if (!link) return;
        if (currentUser) {
            link.textContent = currentUser.username ? `Hi, ${currentUser.username}` : 'My Account';
        } else {
            link.textContent = 'Login';
        }
    });

    const userMenuToggle = document.getElementById('user-menu-toggle');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    // Configure header user menu behavior
    if (userMenuToggle) {
        userMenuToggle.onclick = function (e) {
            e.preventDefault();
            showLoginOptions();
        };
    }

    // Customize dropdown contents based on role
    if (userMenuDropdown) {
        if (currentUser && currentUser.role === 'admin') {
            const name = currentUser.username || '-';
            const email = currentUser.email || '-';
            const phone = currentUser.phone || 'Not provided';
            userMenuDropdown.innerHTML = `
                <div class="user-menu-profile">
                    <img src="./images/placeholder.jpg" alt="Admin avatar" class="user-menu-avatar">
                    <div class="user-menu-profile-text">
                        <div class="user-menu-name">${name}</div>
                        <div class="user-menu-email">${email}</div>
                        <div class="user-menu-phone">${phone}</div>
                    </div>
                </div>
                <button type="button" class="user-menu-item" onclick="openAdminActions()">
                    <span class="user-menu-item-icon">📊</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Admin actions</span>
                        <span class="user-menu-item-desc">Review orders, vendors, and reports</span>
                    </span>
                </button>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item" onclick="logoutFromMenu()">
                    <span class="user-menu-item-icon">↩</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Logout</span>
                        <span class="user-menu-item-desc">Sign out from this admin account</span>
                    </span>
                </button>
            `;
        } else if (currentUser && currentUser.role === 'vendor') {
            // Keep vendor options for vendors (styled like menu rows)
            userMenuDropdown.innerHTML = `
                <button type="button" class="user-menu-item" onclick="openVendorProfileModal()">
                    <span class="user-menu-item-icon">👤</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Profile</span>
                        <span class="user-menu-item-desc">View your vendor details</span>
                    </span>
                </button>
                <button type="button" class="user-menu-item" onclick="goToVendorProducts()">
                    <span class="user-menu-item-icon">🛍️</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">My products</span>
                        <span class="user-menu-item-desc">Manage items you are selling</span>
                    </span>
                </button>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item" onclick="logoutFromMenu()">
                    <span class="user-menu-item-icon">↩</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Logout</span>
                        <span class="user-menu-item-desc">Sign out from this vendor account</span>
                    </span>
                </button>
            `;
        } else if (currentUser) {
            // Customer (or any non-admin/non-vendor logged-in user)
            const name = currentUser.username || '-';
            userMenuDropdown.innerHTML = `
                <div class="user-menu-profile">
                    <img src="./images/placeholder.jpg" alt="Customer avatar" class="user-menu-avatar">
                    <div class="user-menu-profile-text">
                        <div class="user-menu-name">${name}</div>
                    </div>
                </div>
                <button type="button" class="user-menu-item" onclick="goToCustomerProfilePage()">
                    <span class="user-menu-item-icon">👤</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Profile</span>
                        <span class="user-menu-item-desc">View your details and preferences</span>
                    </span>
                </button>
                <button type="button" class="user-menu-item" onclick="openCartFromMenu()">
                    <span class="user-menu-item-icon">🛒</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Cart</span>
                        <span class="user-menu-item-desc">See items ready to order</span>
                    </span>
                </button>
                <div class="user-menu-divider"></div>
                <button type="button" class="user-menu-item" onclick="logoutFromMenu()">
                    <span class="user-menu-item-icon">↩</span>
                    <span class="user-menu-item-text">
                        <span class="user-menu-item-label">Logout</span>
                        <span class="user-menu-item-desc">Sign out from this account</span>
                    </span>
                </button>
            `;
        } else {
            // Logged out: no dropdown actions
            userMenuDropdown.innerHTML = '';
            userMenuDropdown.classList.remove('open');
        }
    }

    // Show/hide phone input and reCAPTCHA container based on authMode
    const phoneInput = document.getElementById('login-phone');
    const recaptchaContainer = document.getElementById('firebase-recaptcha-container');
    if (phoneInput) {
        phoneInput.style.display = authMode === 'signup' ? 'block' : 'none';
        if (authMode === 'signup') {
            phoneInput.required = true;
        } else {
            phoneInput.required = false;
        }
    }
    if (recaptchaContainer) {
        recaptchaContainer.style.display = authMode === 'signup' ? 'block' : 'none';
    }

    const titleEl = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-button');
    const switchLink = document.querySelector('.auth-switch a');

    if (titleEl) {
        if (authMode === 'signup') {
            titleEl.textContent = loginContext === 'vendor' ? 'Vendor Sign Up' : 'Customer Sign Up';
        } else {
            titleEl.textContent = loginContext === 'vendor' ? 'Vendor Login' : 'Customer Login';
        }
    }
    if (submitBtn) {
        submitBtn.textContent = authMode === 'signup' ? 'Sign Up' : 'Login';
    }
    if (switchLink) {
        switchLink.textContent = authMode === 'signup' ? 'Have an account? Login' : 'New user? Sign up';
    }
}

function switchAuthMode(event) {
    if (event) event.preventDefault();
    authMode = authMode === 'signup' ? 'login' : 'signup';
    updateAuthUI();
}

// Function to navigate to products
// If called with one argument: old behavior using ?category=...
// If called with two arguments: new behavior using ?mainCategory=...&subCategory=...
function navigateToProducts(mainCategoryOrCategory, subCategory) {
    if (subCategory) {
        const params = new URLSearchParams();
        params.set('mainCategory', mainCategoryOrCategory);
        params.set('subCategory', subCategory);
        window.location.href = `products.html?${params.toString()}`;
    } else {
        window.location.href = `products.html?category=${encodeURIComponent(mainCategoryOrCategory)}`;
    }
}

// From an order card, open the product on products page where it is listed
function openProductFromOrder(product) {
    if (!product) return;
    const params = new URLSearchParams();
    if (product._id) params.set('productId', product._id);
    if (product.mainCategory) params.set('mainCategory', product.mainCategory);
    if (product.subCategory) params.set('subCategory', product.subCategory);
    else if (product.category) params.set('category', product.category);
    const qs = params.toString();
    window.location.href = 'products.html' + (qs ? `?${qs}` : '');
}

// Function to close vendor products modal
function closeVendorProductsModal() {
    const modal = document.getElementById('vendor-products-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Vendor Profile from header: for vendors, go straight to dashboard
async function openVendorProfileModal() {
    // Ensure we know who is logged in
    if (!currentUser) {
        try {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.warn('Could not read current user for vendor profile', e);
        }
    }

    if (currentUser && currentUser.role === 'vendor') {
        // Treat "Profile" as "go to vendor dashboard" for vendors
        window.location.href = 'vendor.html';
        return;
    }

    // For non-vendors (future use), fall back to existing vendor-profile modal if present
    const modal = document.getElementById('vendor-profile-modal');
    if (!modal) {
        showToast('Please login as a vendor to view vendor profile.', 'error');
        return;
    }
    modal.style.display = 'block';
}

function closeVendorProfileModal() {
    const modal = document.getElementById('vendor-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeCustomerProfileModal() {
    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function goToVendorProducts() {
    // Navigate vendor to their dashboard
    window.location.href = 'vendor.html';
}

// Initialize payment method UI in checkout modal
function initCheckoutPaymentUI() {
    const radios = document.querySelectorAll('input[name="payment-method"]');
    if (!radios || !radios.length) return;

    const cardSection = document.getElementById('payment-details-card');
    const upiSection = document.getElementById('payment-details-upi');
    const codSection = document.getElementById('payment-details-cod');

    function refresh() {
        const selected = document.querySelector('input[name="payment-method"]:checked');
        const method = selected ? selected.value : 'card';

        if (cardSection) cardSection.style.display = method === 'card' ? '' : 'none';
        if (upiSection) upiSection.style.display = method === 'upi' ? '' : 'none';
        if (codSection) codSection.style.display = method === 'cod' ? '' : 'none';
    }

    radios.forEach(r => {
        r.addEventListener('change', refresh);
    });

    refresh();
}

// Increase quantity of an item in the cart
function increaseQuantity(id, gender = null) {
        const item = cart.find(p => p.id === id && (gender ? p.gender === gender : !p.gender));
    if (item) {
        item.quantity += 1;
        saveCartToStorage();
        updateCartCount();
        updateCartDisplay();
    }
}

// Decrease quantity of an item in the cart
function decreaseQuantity(id, gender = null) {
    const item = cart.find(p => p.id === id && (gender ? p.gender === gender : !p.gender));
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            // Remove item if quantity would go below 1
            cart = cart.filter(p => !(p.id === id && (gender ? p.gender === gender : !p.gender)));
        }
        saveCartToStorage();
        updateCartCount();
        updateCartDisplay();
    }
}

// Remove item entirely from the cart
function removeFromCart(id, gender = null) {
    cart = cart.filter(p => !(p.id === id && (gender ? p.gender === gender : !p.gender)));
    saveCartToStorage();
    updateCartCount();
    updateCartDisplay();
}

// Progressive profiling: preferences / loyalty / personalization (from checkout)
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleProfileFormSubmit(e) {
    e.preventDefault();

    const preferences = document.getElementById('profile-preferences').value.trim();
    const loyalty = document.getElementById('profile-loyalty').value;
    const personalization = document.getElementById('profile-personalization').value.trim();

    // Store locally for now; can be sent to backend later
    try {
        const existing = localStorage.getItem('citymart_profile');
        const prev = existing ? JSON.parse(existing) : {};
        const profile = {
            ...prev,
            preferences,
            loyalty,
            personalization,
        };
        localStorage.setItem('citymart_profile', JSON.stringify(profile));
    } catch (err) {
        console.warn('Could not store profile preferences', err);
    }

    showToast('Preferences saved. Thanks for helping us personalize your experience!', 'success');
    closeProfileModal();
}

// Profile PAGE logic (customer profile.html)
function initCustomerProfilePage() {
    const pageRoot = document.getElementById('customer-profile-page');
    if (!pageRoot) return; // not on profile page

    // Basic header avatar + text
    const nameHeading = document.getElementById('profile-name');
    const emailSpan = document.getElementById('profile-email');
    const mobileSpan = document.getElementById('profile-mobile');
    const avatarImg = document.getElementById('profile-avatar-img');

    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const mobileInput = document.getElementById('profile-mobile-input');
    const addrInput = document.getElementById('profile-shipping-address');
    const prefInput = document.getElementById('profile-preferences-input');
    const loyaltyInput = document.getElementById('profile-loyalty-input');
    const personalizationInput = document.getElementById('profile-personalization-input');
    const payMethodInput = document.getElementById('profile-payment-method');
    const payDetailsInput = document.getElementById('profile-payment-details');

    const avatarInput = document.getElementById('profile-avatar-input');
    const avatarClearBtn = document.getElementById('profile-avatar-clear');

    // Wallet controls
    const walletSummary = document.getElementById('profile-wallet-summary');
    const walletDisplay = document.getElementById('profile-wallet-display');
    const walletAddAmount = document.getElementById('profile-wallet-add-amount');
    const walletAddBtn = document.getElementById('profile-wallet-add-btn');

    // Summary fields in left card
    const shippingSummary = document.getElementById('profile-shipping-summary');
    const preferencesSummary = document.getElementById('profile-preferences-summary');
    const loyaltySummary = document.getElementById('profile-loyalty-summary');
    const paymentSummary = document.getElementById('profile-payment-summary');

    const name = currentUser && currentUser.username ? currentUser.username : 'My Profile';
    const email = currentUser && currentUser.email ? currentUser.email : '-';
    const phone = currentUser && currentUser.phone ? currentUser.phone : '';

    if (nameHeading) nameHeading.textContent = name;
    if (emailSpan) emailSpan.textContent = email;
    if (mobileSpan) mobileSpan.textContent = phone || '-';

    if (nameInput) nameInput.value = name !== 'My Profile' ? name : '';
    if (emailInput) emailInput.value = email !== '-' ? email : '';
    if (mobileInput) mobileInput.value = phone;

    // Populate from stored profile (preferences, address, payment)
    let walletBalance = 0;
    try {
        const stored = localStorage.getItem('citymart_profile');
        if (stored) {
            const profile = JSON.parse(stored);
            if (addrInput && profile.shippingAddress) addrInput.value = profile.shippingAddress;
            if (prefInput && profile.preferences) prefInput.value = profile.preferences;
            if (loyaltyInput && profile.loyalty) loyaltyInput.value = profile.loyalty;
            if (personalizationInput && profile.personalization) personalizationInput.value = profile.personalization;
            if (payMethodInput && profile.paymentMethod) payMethodInput.value = profile.paymentMethod;
            if (payDetailsInput && profile.paymentDetails) payDetailsInput.value = profile.paymentDetails;

            // Avatar
            if (profile.avatarDataUrl && avatarImg) {
                avatarImg.src = profile.avatarDataUrl;
            }

            // Wallet
            walletBalance = typeof profile.walletBalance === 'number' ? profile.walletBalance : Number(profile.walletBalance) || 0;

            // Also reflect in summary card
            if (shippingSummary) shippingSummary.textContent = profile.shippingAddress || '-';
            if (preferencesSummary) preferencesSummary.textContent = profile.preferences || '-';
            if (loyaltySummary) loyaltySummary.textContent = profile.loyalty || '-';
            if (paymentSummary) paymentSummary.textContent = profile.paymentMethod || '-';
            if (walletSummary) walletSummary.textContent = `₹${walletBalance.toFixed(2)}`;
        }
    } catch (e) {
        console.warn('Could not read citymart_profile from localStorage', e);
    }

    const form = document.getElementById('customer-profile-form');
    if (form) {
        form.addEventListener('submit', handleCustomerProfileFormSubmit);
    }

    const locBtn = document.getElementById('profile-use-location-btn');
    if (locBtn) {
        locBtn.addEventListener('click', handleUseCurrentLocationClick);
    }

    // Avatar upload handlers
    if (avatarInput) {
        avatarInput.addEventListener('change', function () {
            const file = avatarInput.files && avatarInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                const dataUrl = ev.target.result;
                if (avatarImg) avatarImg.src = dataUrl;
                try {
                    const existing = localStorage.getItem('citymart_profile');
                    const prev = existing ? JSON.parse(existing) : {};
                    prev.avatarDataUrl = dataUrl;
                    localStorage.setItem('citymart_profile', JSON.stringify(prev));
                } catch (e) {
                    console.warn('Could not persist avatar image', e);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (avatarClearBtn) {
        avatarClearBtn.addEventListener('click', function () {
            if (avatarImg) avatarImg.src = './images/placeholder.jpg';
            if (avatarInput) avatarInput.value = '';
            try {
                const existing = localStorage.getItem('citymart_profile');
                const prev = existing ? JSON.parse(existing) : {};
                delete prev.avatarDataUrl;
                localStorage.setItem('citymart_profile', JSON.stringify(prev));
            } catch (e) {
                console.warn('Could not clear avatar image', e);
            }
        });
    }

    // Wallet add-money handler
    if (walletDisplay) walletDisplay.textContent = `₹${walletBalance.toFixed(2)}`;
    if (walletSummary) walletSummary.textContent = `₹${walletBalance.toFixed(2)}`;
    if (walletAddBtn) {
        walletAddBtn.addEventListener('click', () => {
            const raw = walletAddAmount ? walletAddAmount.value : '';
            const amount = Number(raw);
            if (!amount || amount <= 0) {
                showToast('Enter a valid amount to add to wallet.', 'error');
                return;
            }
            walletBalance += amount;
            if (walletDisplay) walletDisplay.textContent = `₹${walletBalance.toFixed(2)}`;
            if (walletSummary) walletSummary.textContent = `₹${walletBalance.toFixed(2)}`;
            if (walletAddAmount) walletAddAmount.value = '';

            try {
                const existing = localStorage.getItem('citymart_profile');
                const prev = existing ? JSON.parse(existing) : {};
                prev.walletBalance = walletBalance;
                localStorage.setItem('citymart_profile', JSON.stringify(prev));
            } catch (e) {
                console.warn('Could not persist wallet balance', e);
            }

            showToast('Money added to wallet.', 'success');
        });
    }
}

function handleCustomerProfileFormSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const mobileInput = document.getElementById('profile-mobile-input');
    const addrInput = document.getElementById('profile-shipping-address');
    const prefInput = document.getElementById('profile-preferences-input');
    const loyaltyInput = document.getElementById('profile-loyalty-input');
    const personalizationInput = document.getElementById('profile-personalization-input');
    const payMethodInput = document.getElementById('profile-payment-method');
    const payDetailsInput = document.getElementById('profile-payment-details');

    const profile = {
        preferences: prefInput ? prefInput.value.trim() : '',
        loyalty: loyaltyInput ? loyaltyInput.value : '',
        personalization: personalizationInput ? personalizationInput.value.trim() : '',
        shippingAddress: addrInput ? addrInput.value.trim() : '',
        paymentMethod: payMethodInput ? payMethodInput.value : '',
        paymentDetails: payDetailsInput ? payDetailsInput.value.trim() : '',
    };

    try {
        const existing = localStorage.getItem('citymart_profile');
        const prev = existing ? JSON.parse(existing) : {};
        const merged = { ...prev, ...profile };
        localStorage.setItem('citymart_profile', JSON.stringify(merged));
    } catch (err) {
        console.warn('Could not store profile preferences', err);
    }

    // Also update header text & currentUser basics in memory
    if (currentUser) {
        if (nameInput && nameInput.value.trim()) currentUser.username = nameInput.value.trim();
        // email is read-only; do not overwrite from form
        if (mobileInput && mobileInput.value.trim()) currentUser.phone = mobileInput.value.trim();
        try {
            localStorage.setItem('citymart_user', JSON.stringify(currentUser));
        } catch (e) {
            console.warn('Could not persist updated user info', e);
        }
    }

    updateAuthUI();

    // Update summary card immediately
    const shippingSummary = document.getElementById('profile-shipping-summary');
    const preferencesSummary = document.getElementById('profile-preferences-summary');
    const loyaltySummary = document.getElementById('profile-loyalty-summary');
    const paymentSummary = document.getElementById('profile-payment-summary');

    if (shippingSummary && addrInput) shippingSummary.textContent = addrInput.value.trim() || '-';
    if (preferencesSummary && prefInput) preferencesSummary.textContent = prefInput.value.trim() || '-';
    if (loyaltySummary && loyaltyInput) loyaltySummary.textContent = loyaltyInput.value || '-';
    if (paymentSummary && payMethodInput) paymentSummary.textContent = payMethodInput.value || '-';

    showToast('Profile saved successfully.', 'success');
}

function handleUseCurrentLocationClick() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported in this browser.', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            const addrInput = document.getElementById('profile-shipping-address');
            if (addrInput && !addrInput.value) {
                addrInput.value = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
            }

            // Open Google Maps so the customer can confirm/edit the address
            const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            window.open(mapsUrl, '_blank');
        },
        (err) => {
            console.warn('Geolocation error', err);
            showToast('Could not fetch location. Please enter address manually.', 'error');
        }
    );
}

// Toast notification helper
function showToast(message, type = 'success', duration = 3000) {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;

    const msg = document.createElement('div');
    msg.className = 'toast-message';
    msg.textContent = message;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
        toastContainer.removeChild(toast);
    };

    toast.appendChild(msg);
    toast.appendChild(closeBtn);

    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode === toastContainer) {
            toastContainer.removeChild(toast);
        }
    }, duration);
}

function toggleUserMenuDropdown() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (!dropdown) return;
    if (!currentUser) {
        // If somehow called while logged out, just open login options
        openLoginOptionsModal();
        return;
    }
    dropdown.classList.toggle('open');
}

function closeUserMenuDropdown() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) {
        dropdown.classList.remove('open');
    }
}

function openCartFromMenu() {
    closeUserMenuDropdown();
    showCartModal();
}

function goToCustomerProfilePage() {
    // Navigate to dedicated profile page for customers
    window.location.href = 'profile.html';
}

async function openVendorProfileModal() {
    // Load current user from localStorage if needed
    try {
        if (!currentUser) {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.warn('Could not read current user for vendor profile', e);
    }

    // If vendor is logged in, treat Profile as "open vendor dashboard"
    if (currentUser && currentUser.role === 'vendor') {
        closeUserMenuDropdown();
        window.location.href = 'vendor.html';
        return;
    }

    // Otherwise show a simple message
    showToast('Please login as a vendor first.', 'error');
}

function closeVendorProfileModal() {
    const modal = document.getElementById('vendor-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openCustomerProfileModal() {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    const name = currentUser.username || '-';
    const email = currentUser.email || '-';
    const phone = currentUser.phone || 'Not provided';

    let preferences = '-';
    let loyalty = '-';
    let personalization = '-';
    try {
        const stored = localStorage.getItem('citymart_profile');
        if (stored) {
            const profile = JSON.parse(stored);
            preferences = profile.preferences || '-';
            loyalty = profile.loyalty || '-';
            personalization = profile.personalization || '-';
        }
    } catch (e) {
        console.warn('Could not read profile preferences', e);
    }

    const nameEl = document.getElementById('customer-profile-name');
    const emailEl = document.getElementById('customer-profile-email');
    const phoneEl = document.getElementById('customer-profile-phone');
    const prefEl = document.getElementById('customer-profile-preferences');
    const loyaltyEl = document.getElementById('customer-profile-loyalty');
    const personalizationEl = document.getElementById('customer-profile-personalization');

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (phoneEl) phoneEl.textContent = phone;
    if (prefEl) prefEl.textContent = preferences;
    if (loyaltyEl) loyaltyEl.textContent = loyalty;
    if (personalizationEl) personalizationEl.textContent = personalization;

    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.style.display = 'block';
    }
    closeUserMenuDropdown();
}

function closeCustomerProfileModal() {
    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function goToVendorProducts() {
    // Load current user from localStorage if needed
    try {
        if (!currentUser) {
            const storedUser = localStorage.getItem('citymart_user');
            if (storedUser) currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.warn('Could not read current user for goToVendorProducts', e);
    }

    if (!currentUser || currentUser.role !== 'vendor') {
        showToast('Please login as a vendor first.', 'error');
        return;
    }
    closeUserMenuDropdown();
    window.location.href = 'vendor.html';
}

// Admin "Actions" entry from header dropdown
function openAdminActions() {
    closeUserMenuDropdown();
    // Take admin to the main admin dashboard; they can see pending items there
    window.location.href = 'admin.html';
}

// Logout triggered from dropdown
function logoutFromMenu() {
    closeUserMenuDropdown();
    logout();
}

// Global search bar handler (header search on all pages)
// Mobile: icon toggles a bar below navbar. Desktop: behavior unchanged.
function handleGlobalSearchSubmit(event) {
    if (event) event.preventDefault();

    const wrapper = document.querySelector('.global-search-wrapper');
    const input = document.getElementById('global-search-input');
    if (!wrapper || !input) return false;

    const raw = input.value || '';
    const query = raw.trim();
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // No text: treat as toggle of the search UI, not a navigation
    if (!query) {
        if (isMobile) {
            const isOpen = wrapper.classList.contains('global-search-open');

            if (isOpen) {
                wrapper.classList.remove('global-search-open');
                document.documentElement.classList.remove('mobile-search-open');
            } else {
                wrapper.classList.add('global-search-open');
                document.documentElement.classList.add('mobile-search-open');
                input.focus();
            }
        } else {
            // Desktop: keep original behavior (only expand, no close-on-click)
            if (!wrapper.classList.contains('global-search-open')) {
                wrapper.classList.add('global-search-open');
                input.focus();
            } else {
                input.focus();
            }
        }
        return false;
    }

    // With a query: navigate to products page as before
    wrapper.classList.add('global-search-open');
    if (isMobile) {
        document.documentElement.classList.remove('mobile-search-open');
    }

    const params = new URLSearchParams();
    params.set('search', query);

    // Always take user to the products listing page with the search query.
    // This works from index, admin, vendor, product-detail, etc.
    window.location.href = 'products.html?' + params.toString();
    return false;
}

// Initialize cart count, auth state, and checkout form listener on page load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure trolley/cart overlay starts hidden on every page load
    const trolleyModal = document.getElementById('vendors-cart-modal');
    if (trolleyModal) {
        trolleyModal.style.display = 'none';
    }

    // Mobile hamburger: toggle mobile menu
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Close mobile menu when any link is clicked (better UX)
        mobileMenu.addEventListener('click', function (e) {
            const target = e.target;
            if (target && target.tagName === 'A') {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    }

    // Close user dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('user-menu-dropdown');
        const toggle = document.getElementById('user-menu-toggle');
        if (!dropdown || !toggle) return;
        if (!dropdown.classList.contains('open')) return;
        if (!dropdown.contains(e.target) && e.target !== toggle) {
            dropdown.classList.remove('open');
        }
    });

    // Restore auth from localStorage if available
    try {
        const storedToken = localStorage.getItem('citymart_token');
        const storedUser = localStorage.getItem('citymart_user');
        if (storedToken && storedUser) {
            authToken = storedToken;
            currentUser = JSON.parse(storedUser);
        }
    } catch (e) {
        console.warn('Could not read auth info from localStorage', e);
    }

    // Restore cart from localStorage if available
    try {
        const storedCart = localStorage.getItem('citymart_cart');
        if (storedCart) {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed)) {
                cart = parsed;
            }
        }
    } catch (e) {
        console.warn('Could not read cart from localStorage', e);
    }

    updateCartCount();
    updateCartDisplay();
    updateAuthUI();

    // Add event listener for checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutFormSubmission);
        // Initialize payment method toggle behaviour for checkout modal
        initCheckoutPaymentUI();
    }

    // Add event listener for login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Add event listener for vendor product form (for vendors)
    const vendorProductForm = document.getElementById('vendor-product-form');
    if (vendorProductForm) {
        vendorProductForm.addEventListener('submit', handleVendorProductSubmit);
    }

    // Progressive profiling form (checkout -> small preferences modal)
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileFormSubmit);
    }

    // If we are on the dedicated profile page, initialize it
    initCustomerProfilePage();

    // Orders filters: reload orders list when filters change (if modal is open)
    const statusFilter = document.getElementById('orders-status-filter');
    const fromInput = document.getElementById('orders-from-date');
    const toInput = document.getElementById('orders-to-date');
    const reloader = () => {
        const modal = document.getElementById('orders-modal');
        if (modal && modal.style.display === 'block') {
            loadOrders();
        }
    };
    if (statusFilter) statusFilter.addEventListener('change', reloader);
    if (fromInput) fromInput.addEventListener('change', reloader);
    if (toInput) toInput.addEventListener('change', reloader);

    // Populate sub categories based on main category
    const mainCatSelect = document.getElementById('vendor-product-main-category');
    const subCatSelect = document.getElementById('vendor-product-sub-category');
    const clothingExtraFields = document.getElementById('vendor-product-clothing-fields');
    const subCategoryOptions = {
        clothing: ['shoes', 'shirts', 'pants', 'dresses', 'accessories', 'etc'],
        // Detailed pet sub-categories
        pet: [
            'Dogs – Labrador, Beagle, Pug, German Shepherd, Indian Pariah',
            'Cats – Persian, Siamese, Bengal, Maine Coon',
            'Birds – Parrots, Budgies, Zebra Finch, Conures, Doves, Macaws (Hyacinth, Hahn’s), Canaries, Sun Conure, Lovebirds, Cockatiels',
            'Rabbits – Angora, Dutch, Lop',
            'Fish – Goldfish, Betta, Guppies, Koi',
            'Hamsters & Guinea Pigs – Popular small pets for kids',
            'Turtles & Exotic Pets – Red-eared sliders, tortoises',
            'etc',
        ],
        food: ['fruits', 'vegetables', 'bakery', 'dairy', 'snacks', 'etc'],
        electronics: ['mobiles', 'laptops', 'accessories', 'appliances', 'etc'],
        household: ['cleaning', 'kitchenware', 'furniture', 'etc'],
        stationery: ['books', 'notebooks', 'pens', 'art supplies', 'etc'],
        services: ['delivery', 'repair', 'cleaning', 'etc'],
    };

    // Species suggestions for pet category (used via datalist on brand field)
    const petSpeciesOptions = [
        // Birds
        'English Budgie', 'Australian Budgie',
        'Peach-faced Lovebird', 'Fischer’s Lovebird', 'Masked Lovebird',
        'Lutino Cockatiel', 'Pied Cockatiel', 'Grey Cockatiel',
        'Indian Ringneck Parrot', 'African Grey Parrot', 'Sun Conure',
        'Macaw – Blue & Gold', 'Macaw – Scarlet',
        'Zebra Finch', 'Gouldian Finch',
        'Yellow Canary', 'Red Factor Canary',
        // Dogs
        'Labrador Retriever', 'German Shepherd', 'Beagle', 'Pug', 'Indian Pariah Dog',
        // Cats
        'Persian Cat', 'Siamese Cat', 'Bengal Cat', 'Maine Coon',
        // Fish
        'Goldfish', 'Betta Fish', 'Guppy', 'Koi', 'Angelfish',
        // Rabbits
        'Angora Rabbit', 'Dutch Rabbit', 'Lop Rabbit',
        // Small pets
        'Syrian Hamster', 'Dwarf Hamster',
        'Guinea Pig – Abyssinian', 'Guinea Pig – American',
        // Turtles & tortoises
        'Red-eared Slider', 'Indian Star Tortoise',
    ];

    if (mainCatSelect && subCatSelect) {
        mainCatSelect.addEventListener('change', () => {
            const val = mainCatSelect.value;
            subCatSelect.innerHTML = '<option value="">Select sub category</option>';
            const list = subCategoryOptions[val] || [];
            list.forEach(sc => {
                const opt = document.createElement('option');
                opt.value = sc;
                opt.textContent = sc; // keep full label for pet subcategories
                subCatSelect.appendChild(opt);
            });

            // Show clothing-specific fields only when Clothing & Lifestyle is selected
            if (clothingExtraFields) {
                clothingExtraFields.style.display = val === 'clothing' ? 'block' : 'none';
            }

            // When main category is Pet, treat brand field as Species/Breed
            const brandInput = document.getElementById('vendor-product-brand');
            const speciesList = document.getElementById('vendor-species-list');
            if (brandInput) {
                if (val === 'pet') {
                    brandInput.placeholder = 'Species / Breed (e.g. English Budgie, Labrador)';
                    if (speciesList) {
                        speciesList.innerHTML = '';
                        petSpeciesOptions.forEach(name => {
                            const opt = document.createElement('option');
                            opt.value = name;
                            speciesList.appendChild(opt);
                        });
                    }
                } else {
                    brandInput.placeholder = 'Brand / Company name';
                    if (speciesList) {
                        speciesList.innerHTML = '';
                    }
                }
            }
        });

        // Initialize state on first load (in case a value is preselected)
        if (clothingExtraFields) {
            clothingExtraFields.style.display = mainCatSelect.value === 'clothing' ? 'block' : 'none';
        }

        // Also initialize species suggestions if Pet is already selected on load
        const initialVal = mainCatSelect.value;
        const brandInput = document.getElementById('vendor-product-brand');
        const speciesList = document.getElementById('vendor-species-list');
        if (brandInput && speciesList && initialVal === 'pet') {
            brandInput.placeholder = 'Species / Breed (e.g. English Budgie, Labrador)';
            speciesList.innerHTML = '';
            petSpeciesOptions.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                speciesList.appendChild(opt);
            });
        }
    }
});

// Signup flow with verification code
async function handleSignupFlow(email, password, statusEl) {
    const usernameInput = document.getElementById('login-username');
    const username = usernameInput ? usernameInput.value.trim() : '';

    if (!username) {
        showToast('Please enter a username.', 'error');
        return;
    }

    const phoneInput = document.getElementById('login-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';

    const role = loginContext === 'vendor' ? 'vendor' : 'customer';

    // Step 1: request verification code
    const resp = await fetch(API_BASE + '/api/users/request-signup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role, phone }),
    });

    const data = await resp.json();

    if (!resp.ok) {
        const msg = data && data.message ? data.message : 'Signup failed';
        showToast(msg, 'error');
        if (statusEl) statusEl.textContent = msg;
        return;
    }

    // If server auto-verified (dev mode, no email service), skip OTP and go straight to login
    if (data.autoVerified) {
        showToast('Account created successfully. Logging you in...', 'success');
    } else {
        // Production behaviour: do NOT display the OTP; only show a generic message
        const infoMsg = 'A one-time verification code has been sent to your email address. Please check your inbox and enter the code to continue.';
        showToast(infoMsg, 'success');
        if (statusEl) statusEl.textContent = infoMsg;

        // Ask the user for the code they received via email using a dedicated dialog (no OTP is ever shown by the site)
        let userCode;
        try {
            userCode = await askForOtpCode(email, statusEl);
        } catch (e) {
            // User cancelled
            return;
        }

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
    }

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

