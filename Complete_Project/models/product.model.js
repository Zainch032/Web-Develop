// models/product.model.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  imageUrl: String, // consistent and descriptive
}, { collection: 'Product' });

module.exports = mongoose.model('Product', productSchema);
