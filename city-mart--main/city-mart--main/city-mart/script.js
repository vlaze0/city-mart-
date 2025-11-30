// Initialize the page
console.log('Script loaded successfully');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    initializeCart();
    updateCartCount();

    // Check if we're on the products page
    if (window.location.pathname.includes('products.html')) {
        loadProductsFromURL();
    }

    // Handle checkout form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const address = document.getElementById('address').value;
            const phone = document.getElementById('phone').value;

            // Here you would typically send the order to a server
            alert(`Order placed successfully!\n\nName: ${name}\nEmail: ${email}\nAddress: ${address}\nPhone: ${phone}\n\nTotal: ₹${document.getElementById('cart-total').textContent}`);

            // Clear cart
            cart = [];
            saveCart();
            updateCartCount();
            updateCartDisplay();
            closeCheckoutModal();
        });
    }
});

// Function to show the vendors modal
function showVendorsModal() {
    console.log('showVendorsModal called');
    const modal = document.getElementById('vendors-modal');
    console.log('Vendors modal element:', modal);
    modal.style.display = 'block';
}

// Function to close the vendors modal
function closeVendorsModal() {
    const modal = document.getElementById('vendors-modal');
    modal.style.display = 'none';
}



// Close modal when clicking outside of it
window.onclick = function(event) {
    const vendorsModal = document.getElementById('vendors-modal');
    const cartModal = document.getElementById('cart-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    const addProductModal = document.getElementById('add-product-modal');
    const servicesModal = document.getElementById('services-modal');
    const vendorProductsModal = document.getElementById('vendor-products-modal');
    const budgiesModal = document.getElementById('budgies-modal');
    if (event.target == vendorsModal) {
        vendorsModal.style.display = 'none';
    }
    if (event.target == cartModal) {
        cartModal.style.display = 'none';
    }
    if (event.target == checkoutModal) {
        checkoutModal.style.display = 'none';
    }
    if (event.target == addProductModal) {
        addProductModal.style.display = 'none';
    }
    if (event.target == servicesModal) {
        servicesModal.style.display = 'none';
    }
    if (event.target == vendorProductsModal) {
        vendorProductsModal.style.display = 'none';
    }
    if (event.target == budgiesModal) {
        budgiesModal.style.display = 'none';
    }
}

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initializeCart() {
    // Add event listeners to all "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Load cart from localStorage
    updateCartDisplay();

    // Add event listeners to vendor products modal add to cart buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-to-cart')) {
            addToCart(event);
        }
    });
}

function addToCart(event) {
    const productCard = event.target.closest('.product-card') || event.target.closest('.service-card');
    const productName = productCard.querySelector('h3').textContent;

    if (productName === 'Budgies') {
        showBudgiesModal();
        return;
    }

    const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('₹', ''));
    const productImage = productCard.querySelector('img').src;

    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    updateCartDisplay();
    alert(`${productName} added to cart!`);
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function showCartModal() {
    updateCartDisplay();
    document.getElementById('cart-modal').style.display = 'block';
}

function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px;">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)} each</p>
                    <div class="quantity-controls">
                        <button onclick="changeQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <p>₹${itemTotal.toFixed(2)}</p>
                    <button onclick="removeItem(${index})">Remove</button>
                </div>
            `;
            cartItems.appendChild(itemElement);
        });
    }

    cartTotal.textContent = total.toFixed(2);
}

function changeQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    updateCartCount();
    updateCartDisplay();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    closeCartModal();
    document.getElementById('checkout-modal').style.display = 'block';
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// Budgies variants data
const budgiesVariants = [
    { name: "Green Budgie", color: "Green", size: "Small", price: 300.00 },
    { name: "Blue Budgie", color: "Blue", size: "Small", price: 320.00 },
    { name: "Yellow Budgie", color: "Yellow", size: "Small", price: 310.00 },
    { name: "White Budgie", color: "White", size: "Small", price: 330.00 }
];

// Create Budgies variants modal
let budgiesModal;

// Function to show Budgies variants modal
function showBudgiesModal() {
    console.log('showBudgiesModal called');
    if (document.getElementById('vendor-products-modal')) {
        closeVendorProductsModal(); // Close the vendor products modal first
    }

    budgiesModal = document.getElementById('budgies-modal');
    if (budgiesModal) {
        const grid = document.getElementById('budgies-variants-grid');
        if (grid) {
            grid.innerHTML = '';

            budgiesVariants.forEach(variant => {
                const variantCard = document.createElement('div');
                variantCard.className = 'product-card';
                variantCard.innerHTML = `
                    <img src="./images/pets/close-up-of-budgerigars-perching-on-branch-909976322-5b4bf18746e0fb005bc62377.webp" alt="${variant.name}" onerror="this.style.display='none'">
                    <div class="product-info">
                        <h3>${variant.name}</h3>
                        <p class="price">₹${variant.price.toFixed(2)}</p>
                        <p class="features">Color: ${variant.color}, Size: ${variant.size}</p>
                        <button class="add-to-cart" onclick="addBudgieVariantToCart('${variant.name}', ${variant.price})">Add to Cart</button>
                    </div>
                `;
                grid.appendChild(variantCard);
            });
        }

        budgiesModal.style.display = 'block';
        budgiesModal.style.zIndex = '1001';
        console.log('Budgies modal displayed');
    } else {
        console.log('Budgies modal not found');
    }
}

// Function to close Budgies variants modal
function closeBudgiesModal() {
    document.getElementById('budgies-modal').style.display = 'none';
}

// Function to add Budgie variant to cart
function addBudgieVariantToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            image: "./images/pets/close-up-of-budgerigars-perching-on-branch-909976322-5b4bf18746e0fb005bc62377.webp",
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    updateCartDisplay();
    alert(`${name} added to cart!`);
    closeBudgiesModal();
}

// Vendor products data
const vendorProducts = {
    "Local pet shops (food, toys, accessories)": [
        { name: "Premium Dog Food", image: "./images/pet-food.jpg", price: 29.99 },
        { name: "Pet Accessories", image: "./images/pet-accessories.jpg", price: 15.99 },
        { name: "Dog Toys", image: "./images/dog-toys.jpg", price: 9.99 },
        { name: "Parakeet", image: "./images/pets/parakeet.jpg", price: 50.00, discount: "Up to 20% Off", features: "Colorful feathers, Easy to care for" },
        { name: "Cockatiel", image: "./images/pets/cockatiel.jpg", price: 60.00, discount: "Up to 15% Off", features: "Talks, Friendly" },
        { name: "Lovebird", image: "./images/pets/lovebird.jpg", price: 40.00, discount: "Up to 25% Off", features: "Social, Colorful" },
        { name: "Macaw", image: "./images/pets/macaw.jpg", price: 200.00, discount: "Up to 10% Off", features: "Exotic, Intelligent" },
        { name: "African Grey", image: "./images/pets/african-grey.jpg", price: 150.00, discount: "Up to 30% Off", features: "Talks, Highly intelligent" },
        { name: "Eclectus", image: "./images/pets/eclectus.jpg", price: 180.00, discount: "Up to 20% Off", features: "Colorful, Quiet" },
        { name: "Chicken", image: "./images/pets/chicken.jpg", price: 20.00, discount: "Up to 50% Off", features: "Farm bird, Lays eggs" },
        { name: "Duck", image: "./images/pets/duck.jpg", price: 25.00, discount: "Up to 40% Off", features: "Farm bird, Friendly" },
        { name: "Turkey", image: "./images/pets/turkey.jpg", price: 30.00, discount: "Up to 35% Off", features: "Farm bird, Large" },
        { name: "Finch", image: "./images/pets/finch.jpg", price: 15.00, discount: "Up to 60% Off", features: "Wild bird, Colorful" },
        { name: "Sparrow", image: "./images/pets/sparrow.jpg", price: 10.00, discount: "Up to 70% Off", features: "Wild bird, Common" },
        { name: "Robin", image: "./images/pets/robin.jpg", price: 12.00, discount: "Up to 65% Off", features: "Wild bird, Songbird" },
        { name: "Budgies", image: "./images/pets/close-up-of-budgerigars-perching-on-branch-909976322-5b4bf18746e0fb005bc62377.webp", price: 300.00, discount: "Up to 25% Off", features: "Key Benefits and Facts About Budgie" }
    ],
    "Veterinary clinics (medicines, grooming)": [
        { name: "Pet Medicine", image: "./images/pet-medicine.jpg", price: 19.99 },
        { name: "Grooming Kit", image: "./images/grooming-kit.jpg", price: 24.99 },
        { name: "Vaccination Package", image: "./images/vaccination.jpg", price: 49.99 }
    ],
    "Pet grooming salons": [
        { name: "Grooming Services", image: "./images/grooming-services.jpg", price: 39.99 },
        { name: "Pet Shampoo", image: "./images/pet-shampoo.jpg", price: 12.99 },
        { name: "Nail Clippers", image: "./images/nail-clippers.jpg", price: 7.99 }
    ],
    "Fruit & vegetable sellers": [
        { name: "Fresh Vegetables", image: "./images/fresh-vegetables.jpg", price: 12.99 },
        { name: "Organic Fruits", image: "./images/organic-fruits.jpg", price: 18.99 },
        { name: "Seasonal Produce", image: "./images/seasonal-produce.jpg", price: 14.99 }
    ],
    "Local dairy farms": [
        { name: "Fresh Milk", image: "./images/fresh-milk.jpg", price: 4.99 },
        { name: "Cheese", image: "./images/cheese.jpg", price: 8.99 },
        { name: "Butter", image: "./images/butter.jpg", price: 6.99 }
    ],
    "Bakeries and sweet shops": [
        { name: "Bakery Items", image: "./images/bakery.jpg", price: 8.99 },
        { name: "Cakes", image: "./images/cakes.jpg", price: 25.99 },
        { name: "Pastries", image: "./images/pastries.jpg", price: 5.99 }
    ],
    "Butchers and fishmongers": [
        { name: "Chicken", image: "./images/chicken.jpg", price: 9.99 },
        { name: "Fish", image: "./images/fish.jpg", price: 14.99 },
        { name: "Beef", image: "./images/beef.jpg", price: 12.99 }
    ],
    "Packaged goods distributors": [
        { name: "Snacks", image: "./images/snacks.jpg", price: 3.99 },
        { name: "Beverages", image: "./images/beverages.jpg", price: 2.99 },
        { name: "Canned Goods", image: "./images/canned-goods.jpg", price: 4.99 }
    ],
    "Organic and health food stores": [
        { name: "Quinoa", image: "./images/quinoa.jpg", price: 7.99 },
        { name: "Almonds", image: "./images/almonds.jpg", price: 9.99 },
        { name: "Organic Honey", image: "./images/organic-honey.jpg", price: 11.99 }
    ],
    "Mobile and laptop dealers": [
        { name: "Latest Smartphone", image: "./images/smartphone.jpg", price: 499.99 },
        { name: "Laptop", image: "./images/laptop.jpg", price: 799.99 },
        { name: "Tablet", image: "./images/tablet.jpg", price: 299.99 }
    ],
    "Repair shops and service centers": [
        { name: "Phone Repair", image: "./images/phone-repair.jpg", price: 49.99 },
        { name: "Laptop Repair", image: "./images/laptop-repair.jpg", price: 79.99 },
        { name: "Screen Replacement", image: "./images/screen-replacement.jpg", price: 99.99 }
    ],
    "Accessories retailers (chargers, cases, headphones)": [
        { name: "Wireless Headphones", image: "./images/headphones.jpg", price: 99.99 },
        { name: "Phone Cases", image: "./images/phone-cases.jpg", price: 14.99 },
        { name: "Chargers", image: "./images/chargers.jpg", price: 19.99 }
    ],
    "Appliance stores (TVs, refrigerators, mixers)": [
        { name: "Refrigerator", image: "./images/refrigerator.jpg", price: 599.99 },
        { name: "TV", image: "./images/tv.jpg", price: 399.99 },
        { name: "Mixer", image: "./images/mixer.jpg", price: 49.99 }
    ],
    "Cleaning supply wholesalers": [
        { name: "Cleaning Supplies", image: "./images/cleaning-supplies.jpg", price: 19.99 },
        { name: "Detergents", image: "./images/detergents.jpg", price: 9.99 },
        { name: "Disinfectants", image: "./images/disinfectants.jpg", price: 7.99 }
    ],
    "Kitchenware and utensils shops": [
        { name: "Kitchenware", image: "./images/kitchenware.jpg", price: 34.99 },
        { name: "Utensils", image: "./images/utensils.jpg", price: 12.99 },
        { name: "Cookware", image: "./images/cookware.jpg", price: 49.99 }
    ],
    "Furniture and home decor sellers": [
        { name: "Furniture", image: "./images/furniture.jpg", price: 199.99 },
        { name: "Home Decor", image: "./images/home-decor.jpg", price: 29.99 },
        { name: "Lighting", image: "./images/lighting.jpg", price: 39.99 }
    ],
    "Local hardware stores": [
        { name: "Tools", image: "./images/tools.jpg", price: 24.99 },
        { name: "Hardware", image: "./images/hardware.jpg", price: 14.99 },
        { name: "Paint", image: "./images/paint.jpg", price: 19.99 }
    ],
    "Boutique clothing stores": [
        { name: "Shirts", image: "./images/shirts.jpg", price: 29.99 },
        { name: "Pants", image: "./images/pants.jpg", price: 39.99 },
        { name: "Dresses", image: "./images/dresses.jpg", price: 49.99 }
    ],
    "Shoe and accessories shops": [
        { name: "Shoes", image: "./images/shoes.jpg", price: 59.99 },
        { name: "Bags", image: "./images/bags.jpg", price: 39.99 },
        { name: "Jewelry", image: "./images/jewelry.jpg", price: 19.99 }
    ],
    "Tailors and alteration services": [
        { name: "Tailoring Services", image: "./images/tailoring.jpg", price: 49.99 },
        { name: "Alterations", image: "./images/alterations.jpg", price: 14.99 },
        { name: "Custom Clothing", image: "./images/custom-clothing.jpg", price: 79.99 }
    ],
    "Beauty and skincare outlets": [
        { name: "Skincare Products", image: "./images/skincare.jpg", price: 24.99 },
        { name: "Makeup", image: "./images/makeup.jpg", price: 19.99 },
        { name: "Hair Care", image: "./images/hair-care.jpg", price: 14.99 }
    ],
    "Bookstores and school supply shops": [
        { name: "Books", image: "./images/books.jpg", price: 12.99 },
        { name: "Notebooks", image: "./images/notebooks.jpg", price: 4.99 },
        { name: "Pens", image: "./images/pens.jpg", price: 2.99 }
    ],
    "Coaching centers (for listing services)": [
        { name: "Tutoring Services", image: "./images/tutoring.jpg", price: 29.99 },
        { name: "Online Courses", image: "./images/online-courses.jpg", price: 49.99 },
        { name: "Study Materials", image: "./images/study-materials.jpg", price: 19.99 }
    ],
    "Art and craft supply sellers": [
        { name: "Art Supplies", image: "./images/art-supplies.jpg", price: 14.99 },
        { name: "Craft Kits", image: "./images/craft-kits.jpg", price: 24.99 },
        { name: "Paintbrushes", image: "./images/paintbrushes.jpg", price: 7.99 }
    ],
    "Electricians, plumbers, and carpenters": [
        { name: "Electrical Services", image: "./images/electrical.jpg", price: 59.99 },
        { name: "Plumbing Services", image: "./images/plumbing.jpg", price: 49.99 },
        { name: "Carpentry Services", image: "./images/carpentry.jpg", price: 39.99 }
    ],
    "Home cleaning services": [
        { name: "Cleaning Services", image: "./images/cleaning-services.jpg", price: 29.99 },
        { name: "Deep Cleaning", image: "./images/deep-cleaning.jpg", price: 49.99 },
        { name: "Window Cleaning", image: "./images/window-cleaning.jpg", price: 19.99 }
    ],
    "Delivery partners and logistics providers": [
        { name: "Delivery Services", image: "./images/delivery.jpg", price: 9.99 },
        { name: "Logistics", image: "./images/logistics.jpg", price: 14.99 },
        { name: "Courier Services", image: "./images/courier.jpg", price: 7.99 }
    ]
};

// Function to show vendor products modal
function showVendorProducts(category) {
    console.log('showVendorProducts called with category:', category);
    closeVendorsModal(); // Close the vendors modal first
    const modal = document.getElementById('vendor-products-modal');
    console.log('Modal element:', modal);
    const title = document.getElementById('vendor-products-title');
    const grid = document.getElementById('vendor-products-grid');

    title.textContent = category;
    grid.innerHTML = '';

    if (vendorProducts[category]) {
        console.log('Products found for category:', vendorProducts[category].length);
        vendorProducts[category].forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">₹${product.price.toFixed(2)}</p>
                    ${product.discount ? `<p class="discount">${product.discount}</p>` : ''}
                    ${product.features ? `<p class="features">${product.features}</p>` : ''}
                    <button class="add-to-cart">Add to Cart</button>
                </div>
            `;
            if (product.name === 'Budgies') {
                productCard.onclick = () => showBudgiesModal();
            }
            grid.appendChild(productCard);
        });
    } else {
        console.log('No products found for category:', category);
        grid.innerHTML = '<p>No products available for this category.</p>';
    }

    modal.style.display = 'block';
    console.log('Modal display set to block');
}

// Function to close vendor products modal
function closeVendorProductsModal() {
    document.getElementById('vendor-products-modal').style.display = 'none';
}

// Function to navigate to products page with category
function navigateToProducts(category) {
    window.location.href = 'products.html?category=' + encodeURIComponent(category);
}

// Function to load products based on URL parameter
function loadProductsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        loadProducts(category);
    }
}

// Function to load products for a category
function loadProducts(category) {
    const title = document.getElementById('category-title');
    const grid = document.getElementById('product-grid');

    if (title) title.textContent = category;
    if (grid) {
        grid.innerHTML = '';

        if (vendorProducts[category]) {
            vendorProducts[category].forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">₹${product.price.toFixed(2)}</p>
                        ${product.discount ? `<p class="discount">${product.discount}</p>` : ''}
                        ${product.features ? `<p class="features">${product.features}</p>` : ''}
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                `;
                if (product.name === 'Budgies') {
                    productCard.onclick = () => showBudgiesModal();
                }
                grid.appendChild(productCard);
            });
        } else {
            grid.innerHTML = '<p>No products available for this category.</p>';
        }
    }
}
