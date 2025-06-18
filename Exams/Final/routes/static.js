const express = require('express');
const router = express.Router();

// Root route - redirects to shop
router.get('/', (req, res) => {
    res.redirect('/shop');
});

// Static pages
router.get('/website', (req, res) => res.render("website"));
router.get('/cv', (req, res) => res.render("cv"));
router.get('/form', (req, res) => res.render("form"));

module.exports = router; 