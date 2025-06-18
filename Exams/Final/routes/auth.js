const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Product = require('../models/product.model');
const isAuth = require('../middleware/auth');
const Order = require('../models/order.model');
const Complain = require('../models/complaint.model');

// Root route - show landing page
router.get('/', (req, res) => {
  res.render('landing');
});

// Website browsing route (no auth required)
router.get('/website', (req, res) => {
  res.render('Website');
});

// Register routes
router.get('/register', (req, res) => res.render("register"));

router.post("/register", async (req, res) => {
  try {
    console.log('Received registration data:', req.body);

    const { fullName, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email: email });
    if (user) {
      return res.render("login", { error: "Email already registered" });
    }

    // Create new user
    user = new User({
      name: fullName,
      email: email,
      password: password,
    });
    
    console.log('User object before hash:', user);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    console.log('User object before save:', user);

    await user.save();
    // Redirect to login page after successful registration
    res.redirect("/login");
  } catch (error) {
    console.error("Registration error:", error);
    res.render("register", { error: "Registration failed. Please try again." });
  }
});

// Login routes
router.get('/login', (req, res) => res.render("login"));

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).render('login', { 
        error: 'Invalid email or password USER doest exist',
        email: req.body.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', { 
        error: 'Invalid email or password',
        email: req.body.email
      });
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role
    });

    // Set user session with role
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.isAdmin ? 'admin' : (user.role || 'user') // Use isAdmin if true, otherwise use role
    };

    console.log('Session after login:', {
      user: req.session.user,
      isAdmin: req.session.user.role === 'admin'
    });

    // Redirect based on user role
    if (req.session.user.role === 'admin') {
      console.log('Redirecting to admin products page');
      res.redirect('/admin/products');
    } else {
      console.log('Redirecting to shop page');
      res.redirect('/shop');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', { 
      error: 'An error occurred during login',
      email: req.body.email
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Static pages
router.get('/cv', (req, res) => res.render("cv"));
router.get('/form', (req, res) => res.render("form"));

// Debug route to check products
router.get('/debug/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json({ count: products.length, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Shop route - protected by authentication
router.get('/shop', isAuth, async (req, res) => {
  try {
    const products = await Product.find().lean();
    console.log("Products fetched for shop page:", products.length, "products.");
    res.render('shop', {
      products,
      formatPrice: (price) => (price / 100).toFixed(2),
      user: req.session.user,
      isBrowsingOnly: false
    });
  } catch (error) {
    console.error("Error fetching products or rendering shop page:", error);
    throw error;
  }
});

// Admin Dashboard Route
router.get('/admin/dashboard', isAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).render('error', { message: 'Access Denied: Admins only.' });
    }

    // Get some basic stats
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.find()
      .populate('user', 'email name')
      .sort({ orderDate: -1 })
      .limit(5)
      .lean();

    res.render('admin/dashboard', {
      totalProducts,
      totalOrders,
      recentOrders,
      formatPrice: (price) => (price / 100).toFixed(2),
      formatDate: (date) => new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load admin dashboard.' });
  }
});

// Debug route to check user session
router.get('/debug/session', (req, res) => {
  res.json({
    session: req.session,
    user: req.session.user,
    isAdmin: req.session.user && req.session.user.role === 'admin'
  });
});

// Contact Us route (only for authenticated users)
router.get('/contact', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('contact');
});

// Handle complaint submission
router.post('/contact', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const { orderId, message } = req.body;
    const complaint = await Complain.create({
      userID: req.session.user.id,
      orderId,
      message
    });
    // Populate user info for display
    await complaint.populate({ path: 'userID', select: 'name email' });
    res.render('complaint_placed', {
      complaint: {
        orderId: complaint.orderId,
        message: complaint.message,
        timestamp: complaint.timestamp,
        user: complaint.userID ? { name: complaint.userID.name, email: complaint.userID.email } : null
      }
    });
  } catch (error) {
    console.error('Complaint submission error:', error);
    res.render('contact', { error: 'Failed to submit complaint. Please try again.' });
  }
});

// User complaints history
router.get('/my-complaints', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const complaints = await Complain.find({ userID: req.session.user.id }).sort({ timestamp: -1 }).lean();
    res.render('my_complaints', { complaints });
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.render('my_complaints', { complaints: [], error: 'Failed to load complaints.' });
  }
});

module.exports = router; 