const express = require('express');
const router = express.Router();
const Order = require('../../models/order.model');
const isAdminAuth = require('../../middleware/isAdminAuth');

// Get all orders for admin view
router.get('/', isAdminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'email name') // Populate user details, only email and name
            .populate('items.product', 'title price') // Populate product details, only title and price
            .sort({ orderDate: -1 }) // Sort by most recent first
            .lean();

        res.render('admin/orders/list', {
            orders,
            formatPrice: (price) => (price / 100).toFixed(2),
            formatDate: (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error('Error fetching orders for admin:', error);
        res.status(500).render('error', { message: 'Failed to fetch orders for admin.' });
    }
});

// Update Order Status
router.post('/update-status/:id', isAdminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found.' });
        }

        order.status = status;
        await order.save();

        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).render('error', { message: 'Failed to update order status.' });
    }
});

// View Single Order Details
router.get('/view/:orderId', isAdminAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'email name')
            .populate('items.product', 'title price')
            .lean();

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found.' });
        }

        res.render('admin/orders/detail', {
            order,
            formatPrice: (price) => (price / 100).toFixed(2),
            formatDate: (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error('Error fetching order details for admin:', error);
        res.status(500).render('error', { message: 'Failed to fetch order details.' });
    }
});

module.exports = router; 