const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');
const isAuth = require('../middleware/auth');

// Get all orders for the current user
router.get('/', isAuth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.session.user._id })
            .populate('items.product')
            .sort({ orderDate: -1 }); // Sort by most recent first

        res.render('orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get user's orders (protected)
router.get('/my-orders', isAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.render('my-orders', {
      orders,
      formatPrice: (price) => (price / 100).toFixed(.2),
      formatDate: (date) => new Date(date).toLocaleDateString(),
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).render('error', { 
      message: 'Failed to fetch orders',
      user: req.session.user
    });
  }
});

// Get single order details (protected)
router.get('/order/:orderId', isAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.session.user._id
    }).lean();

    if (!order) {
      return res.status(404).render('error', {
        message: 'Order not found',
        user: req.session.user
      });
    }

    res.render('order-detail', {
      order,
      formatPrice: (price) => (price / 100).toFixed(2),
      formatDate: (date) => new Date(date).toLocaleDateString(),
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).render('error', {
      message: 'Failed to fetch order details',
      user: req.session.user
    });
  }
});

module.exports = router; 