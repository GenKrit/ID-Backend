const mongoose = require("mongoose");
// Define the schema for products
const productSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Email: { type: String ,required:true},
    Message: { type: String, required: true },
});

// Create a model for the product schema
const feedback = mongoose.model('feedback', productSchema, 'feedback');

// Connect to MongoDB

module.exports = feedback;
