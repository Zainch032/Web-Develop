let express = require("express");
let router = express.Router();
let Product = require("../../models/product.model");
const isAdminAuth = require('../../middleware/isAdminAuth');

// List Products
router.get("/", isAdminAuth, async (req, res) => {
  try {
    console.log('Admin products route accessed by:', req.session.user);
    const products = await Product.find().lean();
    res.render("admin/products/list", { 
      products,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching products for admin:", err);
    res.status(500).render("error", { message: "Failed to fetch products." });
  }
});

// Add Product - Display Form
router.get("/create", isAdminAuth, (req, res) => {
  res.render("admin/products/create", {
    user: req.session.user
  });
});

// Add Product - Handle Submission
router.post("/add", isAdminAuth, async (req, res) => {
  try {
    let p = new Product({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
    });
    await p.save();
    res.redirect("/admin/products"); // Redirect to product list after adding
  } catch (err) {
    console.error("Error inserting product:", err);
    res.render("admin/products/create", { 
      error: "Error adding product",
      user: req.session.user
    });
  }
});

// Edit Product - Display Form
router.get("/edit/:id", isAdminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).render("error", { message: "Product not found" });
    }
    res.render("admin/products/edit", { 
      product,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching product for edit:", err);
    res.status(500).render("error", { message: "Failed to fetch product for editing." });
  }
});

// Edit Product - Handle Submission
router.post("/update/:id", isAdminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render("error", { message: "Product not found" });
    }
    product.title = req.body.title;
    product.description = req.body.description;
    product.price = req.body.price;
    await product.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error updating product:", err);
    res.render("admin/products/edit", { 
      error: "Error updating product", 
      product: req.body,
      user: req.session.user
    });
  }
});

// Delete Product
router.post("/delete/:id", isAdminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).render("error", { message: "Failed to delete product." });
  }
});

module.exports = router; 