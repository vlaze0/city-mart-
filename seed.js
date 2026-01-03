require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Product schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String },
  discount: { type: String },
  features: { type: String }
});

const Product = mongoose.model('Product', productSchema);

// User schema (same shape as in server.js)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'vendor', 'customer'], default: 'customer' },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);

// Vendor products data from script.js
const vendorProducts = {
  "Local pet shops (food, toys, accessories)": [
    { name: "Cockatiel", image: "./images/local-pet-shops/birds/parakeet/cockatiel/everything-you-need-to-know-about-pet-cockatiels.jpg", price: 2000.00, discount: "Up to 5% Off", features: "Talks, Friendly" },
    { name: "Lovebird", image: "./images/local-pet-shops/birds/parakeet/lovebird/1000_F_1769251356_2AHunk8yIGIvOvgQAYiJY9udn4S8AKRV.webp", price: 1000.00, discount: "Up to 2.5% Off", features: "Social, Colorful" },
    { name: "Macaw", image: "./images/local-pet-shops/birds/parakeet/macaw/1000_F_87296483_KtvgYb56pDFGU0pKNi3zDeqHaEVN7t8H.jpg", price: 200000.00, discount: "Up to 1% Off", features: "Exotic, Intelligent" },
    { name: "African Grey", image: "./images/local-pet-shops/birds/parakeet/african grey/African+Gray+Parrot+-+crop-1920w.webp", price: 150000.00, discount: "Up to 3% Off", features: "Talks, Highly intelligent" },
    { name: "Budgies", image: "./images/pets/close-up-of-budgerigars-perching-on-branch-909976322-5b4bf18746e0fb005bc62377.webp", price: 500.00, discount: "Up to 5% Off", features: "- Highly Intelligent" },
    { name: "Chicken", image: "./images/local-pet-shops/birds/birds/chicken/1000_F_69872266_UqL8TyXuoJDHp1ZxOvQDWRQSpo0EeOZy.jpg", price: 50.00, discount: "Up to 5% Off", features: "Farm bird, Lays eggs" },
    { name: "Duck", image: "./images/local-pet-shops/birds/birds/duck/1000_F_307148172_Fkjyh38cUr4X7YDRrfmFCv8YrQGOTceZ.jpg", price: 50.00, discount: "Up to 4% Off", features: "Farm bird, Friendly" },
    { name: "Turkey", image: "./images/local-pet-shops/birds/birds/turkey/1000_F_90140336_slz1ualjLRZXAzWvEBr0tQ0QZQ1KncXW.jpg", price: 300.00, discount: "Up to 3% Off", features: "Farm bird, Large" },
    { name: "Finch", image: "./images/local-pet-shops/birds/birds/finch/1000_F_1632345048_Gpg6ZHoWVBX1ogJTiudcWxlCza7PX0Z2.jpg", price: 500.00, discount: "Up to 6% Off", features: "Wild bird, Colorful" },
    { name: "Sparrow", image: "./images/local-pet-shops/birds/birds/sparrow/1000_F_1638122431_HUYwQl7jBveEZ0PJ8dlyLTg7JBpjXcOI.webp", price: 1000.00, discount: "Up to 7% Off", features: "Wild bird, Common" },
    { name: "Robin", image: "./images/local-pet-shops/birds/birds/robin/American_robin_(71307).jpg", price: 600.00, discount: "Up to 5% Off", features: "Wild bird, Songbird" }
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

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/citymart');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Prepare products array
    const products = [];
    for (const [category, items] of Object.entries(vendorProducts)) {
      items.forEach(item => {
        products.push({
          name: item.name,
          price: item.price,
          category: category,
          image: item.image,
          discount: item.discount,
          features: item.features
        });
      });
    }

    // Insert products
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);

    // Create demo vendor user if it doesn't exist
    const demoEmail = 'demo.vendor@citymart.com';
    const existingDemo = await User.findOne({ email: demoEmail });
    const hashedPassword = await bcrypt.hash('Vendor123!', 10);

    if (!existingDemo) {
      await User.create({
        username: 'demo_vendor',
        email: demoEmail,
        password: hashedPassword,
        role: 'vendor',
        isVerified: true,
      });
      console.log('Created demo vendor user: demo.vendor@citymart.com / Vendor123!');
    } else {
      existingDemo.username = 'demo_vendor';
      existingDemo.password = hashedPassword;
      existingDemo.role = 'vendor';
      existingDemo.isVerified = true;
      await existingDemo.save();
      console.log('Updated existing demo vendor user password and role.');
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
