const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const isAuth = require('../middleware/auth');
const Cart = require('../models/cart.model');

// Dashboard Route (Cart View) - Protected
router.get('/dashboard', isAuth, async (req, res) => {
    try {
        let cartItems = [];
        let total = 0;

        // For authenticated users
        let cart = await Cart.findOne({ user: req.session.user.id }).populate('items.product');
        
        if (!cart) {
            cart = new Cart({ user: req.session.user.id, items: [] });
            await cart.save();
        }

        cartItems = cart.items;
        total = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        res.render('dashboard', {
            cart: cartItems,
            total,
            formatPrice: (price) => price.toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to Cart - requiring authentication
router.post('/add', isAuth, async (req, res) => {
    try {
        const productId = req.body.productId;
        const quantity = parseInt(req.body.quantity) || 1;
        
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // If user is logged in, use their cart
        // Since isAuth middleware ensures user is logged in, no need for if (req.session.user && req.session.user._id)
        let cart = await Cart.findOne({ user: req.session.user.id });
        if (!cart) {
            cart = new Cart({ user: req.session.user.id, items: [] });
        }

        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();
        
        res.json({ 
            success: true, 
            message: 'Product added to cart successfully!',
            productName: product.title
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update Cart Item Quantity
router.put('/update', isAuth, async (req, res) => {
    try {
        const { productId, action } = req.body;
        
        if (!productId || !action) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Since isAuth middleware ensures user is logged in, no need for if (req.session.user && req.session.user._id)
        const cart = await Cart.findOne({ user: req.session.user.id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity = Math.max(1, item.quantity - 1);
        }

        await cart.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from Cart
router.delete('/remove', isAuth, async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Since isAuth middleware ensures user is logged in, no need for if (req.session.user && req.session.user._id)
        const cart = await Cart.findOne({ user: req.session.user.id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Checkout Route - Protected
router.get('/checkout', isAuth, async (req, res) => {
    try {
        let cartItems = [];
        let total = 0;

        
        let cart = await Cart.findOne({ user: req.session.user.id }).populate('items.product');
        if (!cart) {
            cart = new Cart({ user: req.session.user.id, items: [] });
            await cart.save();
        }
        cartItems = cart.items;
        total = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        res.render('checkout', {
            cart: cartItems,
            total,
            formatPrice: (price) => price.toFixed(2),
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error in checkout:', error);
        res.status(500).json({ error: 'Failed to load checkout page' });
    }
});

// Place order - Protected
router.post('/place-order', isAuth, async (req, res) => {
    try {
        let cartItems = [];
        let total = 0;

        // For authenticated users
        const cart = await Cart.findOne({ user: req.session.user.id }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        cartItems = cart.items;
        total = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        // Log cart.items for authenticated users AFTER population
        console.log('Authenticated User Cart Items (from DB, populated):', cartItems);

        // Log incoming request body for debugging
        console.log('Request Body:', req.body);
        console.log('Cart Items AFTER processing (before Order Creation):', cartItems);

        // Create order
        const order = new Order({
            user: req.session.user.id,
            items: cartItems.map(item => {
                // Ensure item.product has the necessary properties
                const productId = item.product._id || item.product; // Handle both populated object and just ID
                const productPrice = item.product.price; 
                
                return {
                    product: productId,
                    quantity: item.quantity,
                    price: productPrice
                };
            }),
            totalAmount: total,
            customerDetails: {
                name: req.session.user.name || req.body.name, // Fallback to form data if session name is missing
                phone: req.body.phone,
                email: req.session.user.email || req.body.email // Fallback to form data if session email is missing
            },
            shippingAddress: {
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                zipCode: req.body.zipCode,
                country: req.body.country
            },
            status: 'pending',
            paymentMethod: 'cash',
            orderDate: new Date()
        });

        // Validate required fields before saving
        if (!order.customerDetails.name) {
            throw new Error('Customer name is required');
        }
        if (!order.customerDetails.phone) {
            throw new Error('Customer phone is required');
        }
        if (!order.customerDetails.email) {
            throw new Error('Customer email is required');
        }

        await order.save();

        // Log the saved order for debugging
        console.log('Order Saved Successfully:', order);

        // Clear the cart
        const userCart = await Cart.findOne({ user: req.session.user.id });
        if (userCart) {
            userCart.items = [];
            await userCart.save();
        }

        // Render place_order page with order details
        res.render('place_order', {
            order: order,
            formatPrice: (price) => price.toFixed(2),
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).render('error', { 
            message: 'Failed to place order. Please try again.',
            error: error.message
        });
    }
});

// My Orders Route
router.get('/my-orders', isAuth, async (req, res) => {
    try {
        // For authenticated users, get orders from database
        const orders = await Order.find({ user: req.session.user.id })
            .populate('items.product')
            .sort({ orderDate: -1 });

        res.render('my-orders', {
            orders: orders,
            formatPrice: (price) => (price / 100).toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router; 