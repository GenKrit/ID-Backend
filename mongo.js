const mongoose = require("mongoose");
require('dotenv').config()

// Define the MongoDB URL
const url = process.env.URL || "mongodb://localhost:27017/Productlist";

// Define the schema for products
const productSchema = new mongoose.Schema({
  ProductName: { type: String, required: true },
  Description: { type: String },
  categories: { type: String },
  Price: { type: Number, required: true },
  page: { type: Number },
  ProductImage: { type: String },
});

// Create a model for the product schema
const AddProduct = mongoose.model('AddProduct', productSchema, 'Product');

// Connect to MongoDB
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDb Connected', url);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

module.exports = AddProduct;
