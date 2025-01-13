const mongoose = require("mongoose");

// Define the schema for user sign-in
const signinSchema = new mongoose.Schema({
  email: { type: String, required: true },
  mobileNo: { type: String},
  name: { type: String},
  password: { type: String, required: true },
  datelastlog: { type: String },
  otp: { type: Number },  // Optional field for storing OTP (if needed)
  otpExpiration: { type: Date },
});

// Create a model for the signin schema
const SigninDb = mongoose.model('Signin', signinSchema, 'Auth');

module.exports = SigninDb;
