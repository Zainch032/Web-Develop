const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const isAuth = require('../middleware/auth');

// GET all products - Protected
router.get('/', isAuth, async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render("shop", {
            products,
            formatPrice: (price) => (price / 100).toFixed(2),
            user: req.session.user
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// GET single product - Protected
router.get('/:id', isAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.render("product-detail", { 
            product,
            formatPrice: (price) => (price / 100).toFixed(2),
            user: req.session.user
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

// PUT to update (protected)
router.put('/:id', isAuth, async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        product.title = req.body.title;
        product.price = req.body.price;
        product.description = req.body.description;
        product.imageUrl = req.body.imageUrl;
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// POST to insert (protected)
router.post('/', isAuth, async (req, res) => {
    try {
        const product = new Product({
            title: req.body.title,
            price: req.body.price,
            description: req.body.description,
            imageUrl: req.body.imageUrl
        });
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to create product" });
    }
});

module.exports = router;
