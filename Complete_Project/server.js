const mongoose = require("mongoose");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const server = express();
const Product = require("./models/product.model");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Thought")
  .then(() => console.log("✅ Connected to MongoDB (Thought database)"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
server.use(express.static("public"));
server.use(expressLayouts);
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");
server.set("layout", "layout");

// 🔐 Session middleware (for cart)
server.use(session({
  secret: "your_secret_key", 
  resave: false,
  saveUninitialized: true,
}));


server.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const authRouter = require("./routes/auth");
const cartRouter = require("./routes/cart");
const staticRouter = require("./routes/static");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const adminProductsRouter = require("./controllers/admin/admin.products.controller");
const adminOrdersRouter = require("./controllers/admin/admin.orders.controller");


server.use("/admin/products", adminProductsRouter);
server.use("/", authRouter);
server.use("/", staticRouter);
server.use("/cart", cartRouter);
server.use("/products", productsRouter);
server.use("/orders", ordersRouter);
server.use("/admin/orders", adminOrdersRouter);

// Error handler
server.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});


server.use((req, res) => {
  res.status(404).json({ error: "Page not found!" });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
