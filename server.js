// Force trigger Render auto-deploy
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto'); 
const Razorpay = require('razorpay');
//const nodemailer = require('nodemailer');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { authenticateToken, requireAdmin, requireVendor, requireCustomer, requireAdminOrVendor } = require('./middleware');
require('dotenv').config();

const app = express();
app.get('/api/debug-env', (req, res) => {
  res.json({ keys: Object.keys(process.env).filter(k => k.includes('GEMINI')) });
});
const PORT = process.env.PORT || 3000;

// Middleware
// configure CORS with explicit settings to avoid cross‑device/browser problems
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'https://www.citymart.net.in',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS request from disallowed origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/citymart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Razorpay client (credentials are read from environment variables)
// Initialize only if credentials are provided (for development mode)
let razorpayInstance = null;
const rzpKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
console.log('Razorpay env vars:', 'KEY_ID length=', rzpKeyId.length || 'none',
            'SECRET length=', rzpKeySecret.length || 'none');
if (rzpKeyId && rzpKeySecret && rzpKeyId !== 'your_razorpay_key_id') {
  if (!rzpKeyId.startsWith('rzp_test_') && !rzpKeyId.startsWith('rzp_live_')) {
    console.warn('⚠️  RAZORPAY_KEY_ID does not start with rzp_test_ or rzp_live_ — credentials may be invalid.');
  }
  razorpayInstance = new Razorpay({
    key_id: rzpKeyId,
    key_secret: rzpKeySecret,
  });
  console.log('Razorpay payment gateway initialized (' + (rzpKeyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST') + ' mode)');
} else {
  console.warn('⚠️  Razorpay credentials not configured. Payment features will be disabled.');
}

// Nodemailer SMTP transporter for sending OTP emails
// This is configured via environment variables so that the same code
// works in development, staging, and production without changes.
	// const mailTransporter = nodemailer.createTransport({
	  // host: process.env.SMTP_HOST,
	  // port: Number(process.env.SMTP_PORT) || 587,
	  // secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
	  // auth: {
		// user: process.env.SMTP_USER,
		// pass: process.env.SMTP_PASS,
	  // },
	// });
async function sendOTPEmail(email, otp) {
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.BREVO_SENDER,
          name: 'CityMart'
        },
        to: [{ email }],
        subject: 'CityMart Verification Code',
        htmlContent: `
          <h2>CityMart OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    console.error('Brevo email error:', err.response?.data || err.message);
    throw err;
  }
}



// const isEmailServiceConfigured = !!(
  // process.env.SMTP_HOST &&
  // process.env.SMTP_USER &&
  // process.env.SMTP_PASS
//);

async function sendVerificationEmail(email, otp) {
  if (!email) {
    throw new Error('Email address is required');
  }

  await sendOTPEmail(email, otp);
}


// async function sendVerificationEmail(to, code) {
  // if (!to) {
    // throw new Error('Email address is required to send verification code');
  // }

  // const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@citymart.local';
  // const appName = process.env.APP_NAME || 'CityMart';

  // if (!isEmailServiceConfigured) {
    // // Fail fast with a clear error so that the caller can surface a
    // // proper 5xx instead of a misleading 4xx to the frontend.
    // throw new Error('Email service is not configured. Please set SMTP_* environment variables.');
  // }

  // await mailTransporter.sendMail({
    // from,
    // to,
    // subject: `${appName} - Your verification code`,
    // text: `Your ${appName} verification code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this, you can safely ignore this email.`,
  // });
  
  //await sendOTPEmail(email, otp);

//}

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,      // legacy/general category
  mainCategory: String,  // e.g. 'clothing'
  subCategory: String,   // e.g. 'shoes'
  brand: String,         // company/brand name
  description: String,
  image: String,         // primary image (for backward compatibility)
  images: [String],      // gallery images (0–4 URLs)
  discount: String,
  features: String,
  deliveryTime: String,
  city: String,          // Added for location-based filtering
  // The vendor who created this product (null/undefined for legacy seeded products)
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Product = mongoose.model('Product', productSchema);

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'vendor', 'customer'], default: 'customer' },
  phone: { type: String },
  city: { type: String },

  // Stores a bcrypt hash of the one-time verification code (never the raw code)
  verificationCode: { type: String },
  // Expiry timestamp for the verification code (e.g. 5 minutes from generation)
  verificationCodeExpiresAt: { type: Date },
  isVerified: { type: Boolean, default: false },
  // Governance fields for admin control and auditing
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

const User = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number,
  }],
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

// Function to send email to a vendor about new order
async function sendVendorOrderNotificationEmail(vendorEmail, vendorName, orderId, productsList, customerInfo) {
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key') {
    console.log(`[DEV] Skipping vendor email for ${vendorEmail} (Email service not configured)`);
    return;
  }

  try {
    const productsHtml = productsList.map(p => `
      <li>
        <strong>${p.name}</strong><br/>
        Quantity: ${p.quantity}<br/>
        Price: ₹${p.price}
      </li>
    `).join('');

    const customerHtml = customerInfo ? `
      <h3>Customer Details:</h3>
      <p>Name: ${customerInfo.username || 'N/A'}</p>
      <p>Email: ${customerInfo.email || 'N/A'}</p>
      <p>Phone: ${customerInfo.phone || 'N/A'}</p>
    ` : '';

    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.BREVO_SENDER || 'no-reply@citymart.net.in',
          name: 'CityMart Orders'
        },
        to: [{ email: vendorEmail, name: vendorName }],
        subject: `New Order Received - Order #${orderId}`,
        htmlContent: `
          <h2>Hello ${vendorName},</h2>
          <p>Great news! A customer just placed an order for your products.</p>
          <h3>Order Details:</h3>
          <ul>
            ${productsHtml}
          </ul>
          ${customerHtml}
          <p>Please check your vendor dashboard to process this order.</p>
          <p>Thank you,<br/>The CityMart Team</p>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`Order notification email sent to vendor: ${vendorEmail}`);
  } catch (err) {
    console.error('Brevo vendor email error:', err.response?.data || err.message);
  }
}

async function notifyVendors(order) {
  try {
    const vendorGroups = {};
    const populatedOrder = await Order.findById(order._id).populate('products.productId').populate('userId');

    if (!populatedOrder) return;

    for (const item of populatedOrder.products) {
      if (!item.productId) continue;
      
      const vendorId = item.productId.vendorId;
      if (!vendorId) continue;

      if (!vendorGroups[vendorId]) {
        vendorGroups[vendorId] = [];
      }
      vendorGroups[vendorId].push({
        name: item.productId.name,
        quantity: item.quantity,
        price: item.price || 0
      });
    }

    const customerInfo = populatedOrder.userId;

    for (const vendorId in vendorGroups) {
      const vendor = await User.findById(vendorId);
      if (vendor && vendor.email) {
        await sendVendorOrderNotificationEmail(
          vendor.email, 
          vendor.username, 
          order._id, 
          vendorGroups[vendorId],
          customerInfo
        );
      }
    }
  } catch (error) {
    console.error('Error notifying vendors:', error);
  }
}

// Routes

// Products
app.get('/api/products', async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) {
      filter.city = new RegExp(`^${req.query.city}$`, 'i');
    }
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vendor product management
// Accept up to 4 images under the same field name "image" (so the frontend can send multiple files)
app.post('/api/products', authenticateToken, requireAdminOrVendor, upload.array('image', 4), async (req, res) => {
  try {
    const { name, price, category, description, discount, features, deliveryTime, mainCategory, subCategory, brand } = req.body;

    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    const imageUrls = files.map(f => `/uploads/${f.filename}`);
    const image = imageUrls[0] || '';

    // If the creator is a vendor, attach their user id so we can show
    // and manage only their own products on the vendor dashboard.
    const vendorId = req.user.role === 'vendor' ? req.user.userId : undefined;

    let city = '';
    if (vendorId) {
      const vendorUser = await User.findById(vendorId);
      if (vendorUser && vendorUser.city) city = vendorUser.city;
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      category: category || subCategory || mainCategory || '',
      mainCategory,
      subCategory,
      brand,
      description,
      image,
      images: imageUrls,
      discount,
      features,
      deliveryTime,
      vendorId,
      city,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, requireAdminOrVendor, upload.array('image', 4), async (req, res) => {
  try {
    const { name, price, category, description, discount, features, deliveryTime, mainCategory, subCategory, brand } = req.body;

    const updateData = {
      name,
      price: parseFloat(price),
      category: category || subCategory || mainCategory || '',
      mainCategory,
      subCategory,
      brand,
      description,
      discount,
      features,
      deliveryTime,
    };

    const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    if (files.length) {
      const imageUrls = files.map(f => `/uploads/${f.filename}`);
      updateData.image = imageUrls[0];
      updateData.images = imageUrls;
    }

    let product;
    if (req.user.role === 'admin') {
      // Admin can update any product
      product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    } else {
      // Vendors can update only their own products
      product = await Product.findOneAndUpdate(
        { _id: req.params.id, vendorId: req.user.userId },
        updateData,
        { new: true }
      );
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/products/:id', authenticateToken, requireAdminOrVendor, async (req, res) => {
  try {
    let product;
    if (req.user.role === 'admin') {
      // Admin can delete any product
      product = await Product.findByIdAndDelete(req.params.id);
    } else {
      // Vendors can delete only their own products
      product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user.userId });
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List products belonging to the currently logged-in vendor
app.get('/api/vendor/products', authenticateToken, requireVendor, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user.userId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Users
// Direct register (without code) can still be used by admin tools if needed
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, role, phone, city } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'customer',
      phone,
      city,
      isVerified: true,
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Step 1: Request verification code for signup
app.post('/api/users/request-signup-code', async (req, res) => {
  try {
    const { username, email, password, role, phone, city } = req.body;
    if (!email || !password || !username) {
      return res.status(422).json({ message: 'Username, email, and password are required' });
    }

    let user = await User.findOne({ email });

    // If a fully verified account already exists for this email, do not allow re-signup
    if (user && user.isVerified) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a cryptographically secure 6-digit code
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const verificationCodeHash = await bcrypt.hash(verificationCode, 10);
    const verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (user && !user.isVerified) {
      // Reuse existing unverified user record  update details and OTP
      user.username = username;
      user.password = hashedPassword;
      user.role = role || 'customer';
      user.phone = phone;
      user.city = city;
      user.verificationCode = verificationCodeHash;
      user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    } else {
      // Create a new unverified user record
      user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || 'customer',
        phone,
        city,
        verificationCode: verificationCodeHash,
        verificationCodeExpiresAt,
        isVerified: false,
      });
    }

    // If email service is not configured, auto-verify the user (dev mode)
    const isEmailConfigured = process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key';

    if (!isEmailConfigured) {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();
      return res.status(201).json({
        message: 'Account created successfully (email verification skipped in dev mode).',
        autoVerified: true,
      });
    }

    await user.save();
    await sendOTPEmail(email, verificationCode);

    res.status(201).json({
      message: 'Verification code sent to your email. Please enter it to complete signup.',
    });
  } catch (error) {
    console.error('Error generating signup verification code:', error);

    // Map low-level errors to appropriate HTTP status codes so the
    // frontend can distinguish between validation issues and true
    // server-side failures.
    if (error && error.code === 11000) {
      // Mongo duplicate key (username/email already taken)
      return res.status(409).json({
        message: 'An account with this email or username already exists.',
      });
    }

    if (error && error.message && error.message.includes('Email service is not configured')) {
      return res.status(503).json({
        message: 'Signup temporarily unavailable. Email service is not configured.',
      });
    }

    res.status(500).json({
      message: 'Could not send verification code. Please try again later.',
    });
  }
});

// Step 2: Verify the signup code
app.post('/api/users/verify-signup', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (!user.verificationCode || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ message: 'No active verification code. Please request a new one.' });
    }

    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      // Invalidate the old code
      user.verificationCode = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const isCodeValid = await bcrypt.compare(code, user.verificationCode);
    if (!isCodeValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    res.json({
      message: 'Account verified successfully',
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Error verifying signup code:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Special-case admin login: if the known admin credentials are used,
    // ensure there is an admin user for this email and log in as admin.
    const adminEmail = 'ash99coc@gmail.com';
    const adminPlainPassword = '00570Ashar';
    const adminUsername = 'Ashar';

    let user;

    if (email === adminEmail && password === adminPlainPassword) {
      user = await User.findOne({ email: adminEmail });

      if (!user) {
        const hashedPassword = await bcrypt.hash(adminPlainPassword, 10);
        user = new User({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isVerified: true,
        });
        await user.save();
      } else {
        // Ensure this account always behaves as an admin and is verified.
        let updated = false;
        if (user.role !== 'admin') {
          user.role = 'admin';
          updated = true;
        }
        if (!user.isVerified) {
          user.isVerified = true;
          updated = true;
        }
        if (updated) {
          await user.save();
        }
      }
    } else {
      user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'User not found' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      if (!user.isVerified) {
        return res.status(400).json({ message: 'Account not verified. Please complete signup.' });
      }
    }

    // Do not allow blocked users (any role) to log in
    if (user.isBlocked) {
      return res.status(403).json({ message: 'This account has been blocked by an administrator.' });
    }

    // Track last login time for admin analytics
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, 'secretkey', { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Orders
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, products, totalAmount } = req.body;
    const order = new Order({ userId, products, totalAmount });
    await order.save();
    
    // Notify vendors about the new order asynchronously
    notifyVendors(order);

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).populate('products.productId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('products.productId').populate('userId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vendor profile: basic info + the products and orders related to this vendor
app.get('/api/vendor/profile', authenticateToken, requireVendor, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.userId).select('username email phone role');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: req.user.userId });

    // Count how many customer orders include at least one of this vendor's products
    const productIds = products.map(p => p._id);
    let orderCount = 0;
    if (productIds.length > 0) {
      const orders = await Order.find({ 'products.productId': { $in: productIds } });
      orderCount = orders.length;
    }

    res.json({ vendor, products, orderCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only: aggregate basic stats per vendor (orders, revenue, products)
app.get('/api/admin/vendor-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('username email phone');

    // Optional date range filters
    const { from, to } = req.query;
    let fromDate = from ? new Date(from) : null;
    let toDate = to ? new Date(to) : null;
    if (toDate) {
      // include entire end day
      toDate.setHours(23, 59, 59, 999);
    }

    const stats = [];

    for (const vendor of vendors) {
      // All products created by this vendor
      const products = await Product.find({ vendorId: vendor._id }).select('_id price');
      const productIds = products.map(p => p._id);

      let orderCount = 0;
      let revenue = 0;

      if (productIds.length > 0) {
        const orderFilter = { 'products.productId': { $in: productIds } };
        if (fromDate || toDate) {
          orderFilter.createdAt = {};
          if (fromDate) orderFilter.createdAt.$gte = fromDate;
          if (toDate) orderFilter.createdAt.$lte = toDate;
        }

        const orders = await Order.find(orderFilter);
        orderCount = orders.length;

        // Compute revenue by summing price * quantity for this vendor's products only
        for (const order of orders) {
          for (const item of order.products || []) {
            if (productIds.some(id => String(id) === String(item.productId))) {
              const linePrice = Number(item.price) || 0;
              const qty = Number(item.quantity) || 0;
              revenue += linePrice * qty;
            }
          }
        }
      }

      stats.push({
        vendorId: vendor._id,
        name: vendor.username,
        email: vendor.email,
        phone: vendor.phone,
        productsCount: products.length,
        ordersCount: orderCount,
        revenue,
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error computing vendor stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin dashboard summary metrics
app.get('/api/admin/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalProducts,
      orders,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Product.countDocuments({}),
      Order.find({}),
    ]);

    let pendingOrders = 0;
    let confirmedOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;

    orders.forEach(o => {
      if (o.status === 'pending') pendingOrders += 1;
      else if (o.status === 'confirmed') confirmedOrders += 1;
      else if (o.status === 'cancelled') cancelledOrders += 1;

      if (o.status === 'confirmed') {
        const amount = Number(o.totalAmount) || 0;
        totalRevenue += amount;
      }
    });

    res.json({
      totalUsers,
      totalCustomers,
      totalVendors,
      totalProducts,
      totalOrders: orders.length,
      pendingOrders,
      confirmedOrders,
      cancelledOrders,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error computing admin summary:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: list all users for governance
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email role phone isVerified isBlocked createdAt lastLogin');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/users/:id/block', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/users/:id/unblock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: customer stats (orders & spending)
app.get('/api/admin/customer-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' });
    const customerIds = customers.map(c => c._id);

    if (!customerIds.length) {
      return res.json([]);
    }

    const aggregates = await Order.aggregate([
      { $match: { userId: { $in: customerIds } } },
      {
        $group: {
          _id: '$userId',
          ordersCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalAmount', 0] } },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const byId = new Map();
    aggregates.forEach(a => {
      byId.set(String(a._id), a);
    });

    const result = customers.map(c => {
      const agg = byId.get(String(c._id));
      return {
        userId: c._id,
        name: c.username,
        email: c.email,
        phone: c.phone,
        isBlocked: !!c.isBlocked,
        ordersCount: agg ? agg.ordersCount : 0,
        totalSpent: agg ? agg.totalSpent : 0,
        lastOrderAt: agg ? agg.lastOrderAt : null,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error computing customer stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reviews
// Customer: create a review for a product
app.post('/api/reviews', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || typeof rating === 'undefined') {
      return res.status(400).json({ message: 'productId and rating are required' });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Optional: ensure the customer has an order containing this product
    const hasOrdered = await Order.exists({
      userId: req.user.userId,
      'products.productId': productId,
    });

    if (!hasOrdered) {
      return res.status(400).json({ message: 'You can only review products you have ordered.' });
    }

    const review = new Review({
      productId,
      userId: req.user.userId,
      rating: numericRating,
      comment,
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Public: list reviews for a single product
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: list reviews with optional filters
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId, userId } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;

    const reviews = await Review.find(filter)
      .populate('productId', 'name')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: delete a review
app.delete('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---- Payments: Razorpay integration ----

// Create a Razorpay order for the payable amount (in INR)
app.post('/api/payments/create-order', async (req, res) => {
  console.log('[create-order] HIT — body:', JSON.stringify(req.body));
  try {
    if (!razorpayInstance) {
      console.error('[create-order] Razorpay instance is NULL');
      return res.status(503).json({ message: 'Online payment is currently unavailable. Please use Cash on Delivery.' });
    }

    const { amount } = req.body;
    const numericAmount = Number(amount);
    console.log('[create-order] amount:', amount, 'numericAmount:', numericAmount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required to create order' });
    }

    const options = {
      amount: Math.round(numericAmount * 100), // amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    console.log('[create-order] Calling Razorpay API with options:', JSON.stringify(options));
    const order = await razorpayInstance.orders.create(options);
    console.log('[create-order] Razorpay order created:', order.id);

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: rzpKeyId,
    });
  } catch (error) {
    console.error('[create-order] ERROR:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    const razorpayError = error?.error || {};
    const statusCode = razorpayError.code === 'BAD_REQUEST_ERROR' ? 400 : 500;
    const detail = razorpayError.description || error?.message || 'Unknown error';
    const code = razorpayError.code || error?.code || undefined;
    return res.status(statusCode).json({ message: 'Failed to create payment order', detail, code });
  }
});

// Verify Razorpay payment signature and create confirmed Order in MongoDB
app.post('/api/payments/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      products,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment details' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', rzpKeySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    // Create confirmed order in MongoDB
    const safeProducts = Array.isArray(products)
      ? products.map(p => ({
          productId: p.productId,
          quantity: Number(p.quantity) || 1,
          price: Number(p.price) || 0,
        }))
      : [];

    const numericAmount = Number(amount) || 0;

    const order = new Order({
      userId: userId || undefined,
      products: safeProducts,
      totalAmount: numericAmount,
      status: 'confirmed',
    });

    await order.save();

    // Notify vendors about the new order asynchronously
    notifyVendors(order);

    return res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      orderId: order._id,
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
});

app.put('/api/orders/:id/confirm', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Confirming order:', req.params.id);
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'confirmed' }, { new: true });
    console.log('Updated order:', order);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.log('Error confirming order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Vendor: confirm an order that contains only this vendor's products
app.put('/api/vendor/orders/:id/confirm', authenticateToken, requireVendor, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.productId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentVendorId = String(req.user.userId);
    const vendorIdsInOrder = new Set();

    for (const item of order.products || []) {
      const prod = item.productId;
      if (prod && prod.vendorId) {
        vendorIdsInOrder.add(String(prod.vendorId));
      }
    }

    if (!vendorIdsInOrder.size) {
      return res.status(400).json({ message: 'This order does not contain any vendor-owned products.' });
    }

    // For now, allow a vendor to confirm the order only if all items belong to them.
    if (vendorIdsInOrder.size > 1 || !vendorIdsInOrder.has(currentVendorId)) {
      return res.status(403).json({ message: 'You can only confirm orders that contain only your own products.' });
    }

    order.status = 'confirmed';
    await order.save();
    res.json(order);
  } catch (error) {
    console.log('Error confirming vendor order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Allow admin to cancel an order (used by admin dashboard)
app.put('/api/orders/:id/cancel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Admin cancelling order:', req.params.id, 'by user', req.user.userId);
    const order = await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.log('Error cancelling order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Customers: cancel their own order (separate path so it never hits admin-only middleware)
app.put('/api/customer/orders/:id/cancel', authenticateToken, requireCustomer, async (req, res) => {
  try {
    console.log('Customer cancelling order:', req.params.id, 'by user', req.user.userId);
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You can only cancel your own orders.' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error cancelling customer order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Customers: cancel their own order
app.put('/api/my-orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You can only cancel your own orders.' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    // For now allow cancelling pending or confirmed orders
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error cancelling customer order:', error);
    res.status(500).json({ message: error.message });
  }
});

// --- AI Chatbot Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);

    // Fetch product catalog to build context
    const products = await Product.find({}, 'name price description category discount brand features').lean();
    
    // Create a compact catalog text
    let catalogText = "Available Store Products:\\n";
    products.forEach(p => {
      catalogText += `- ${p.name} (Price: ₹${p.price}, Category: ${p.category || 'N/A'}). Desc: ${p.description || ''}. Discount: ${p.discount || 'None'}\\n`;
    });

    const systemPrompt = `You are the City Mart AI Shopping Assistant. 
You are helpful, polite, and enthusiastic. Use the following product database to answer customer questions. 
If a user asks for recommendations, suggest items based on these products. If they ask about delivery, the default is 3-5 days unless specified.
If a user asks something completely unrelated to shopping or the store, politely steer them back.
Format your responses keeping them concise and friendly.
DO NOT hallucinate products that are not in the database below.

Database:
${catalogText}
`;

    // Extract the very last message from the user
    const latestMessage = messages[messages.length - 1].content;
    
    // Format the previous messages into the exact history format Gemini 1.5 expects
    let history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // CRITICAL FIX: Gemini 1.5 Flash STRICTLY requires that the history starts with a 'user' message!
    if (history.length > 0 && history[0].role !== 'user') {
      history.unshift({ role: 'user', parts: [{ text: 'Hello, please act as my City Mart shopping assistant.' }] });
    }

    try {
      const advancedModel = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt 
      });
      
      const chat = advancedModel.startChat({ history });
      const result = await chat.sendMessage(latestMessage);
      const responseText = result.response.text();

      res.json({ reply: responseText });
    } catch (e) {
      console.error("Gemini API Sub-Error:", e);
      // Directly throw the internal error so it is caught by the master catch block below
      throw new Error(`Google API Rejected Request: ${e.message}`);
    }

  } catch (error) {
    console.error('Master Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate response.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
