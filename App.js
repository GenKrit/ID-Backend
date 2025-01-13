const express = require('express');
const cors = require('cors');
const multer = require('multer');
const AddProduct = require('./mongo');
const feedbackModel = require('./feedback');
const SigninDb = require('./Signin'); // Signin model
require('dotenv').config()
const sendOtpEmail = require('./emailOtp/Index');

const crypto = require('crypto');


const app = express();
const upload = multer();
const PORT = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
app.use(express.json());
app.use(cors());

app.get('/', async (req, res) => {
    try {
        const { category = '', page = 1 } = req.query;
        const limit = 6;
        const skip = (page - 1) * limit;
        const query = {};
        if (category) query.categories = category;

        // Fetch products with pagination
        const products = await AddProduct.find(query).limit(limit).skip(skip);

        // Return the products as a response
        res.status(200).json(products);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).send('An error occurred while fetching products');
    }
});

console.log();


app.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await AddProduct.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).send('Product not found');
        }

        res.status(200).send('Product deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('An error occurred');
    }
});

app.post('/feedback', async (req, res) => {
    try {
        const newFeedback = new feedbackModel({
            Name: req.body.Name,
            Email: req.body.Email,
            Message: req.body.Message,
        });
        const savedFeedback = await newFeedback.save();
        res.status(201).send(savedFeedback);
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).send('Failed to save feedback');
    }
});
app.get('/feedback', async (req, res) => {
    try {
        const feedback = await feedbackModel.find({});
        res.status(200).send(feedback);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).send('An error occurred while fetching feedbackModel');
    }
})
// DELETE endpoint to remove feedback by ID
app.delete('/feedback/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await feedbackModel.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).send('Feedback not found');
        }

        res.status(200).send('Feedback deleted successfully');
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).send('An error occurred');
    }
});
app.post('/addproduct', upload.single('ProductImage'), async (req, res) => {
    try {
        // const check = await AddProduct.findOne({ ProductName: req.body.ProductName });
        // console.log("Received product data:", req.body);
        // console.log("Check for existing product:", check);
        if (!req.file) {
            console.error("ProductImage not found in the request.");
            return res.status(400).send("Product image is required.");
        }
        // if (!check) {
            const newData = new AddProduct({
                ProductName: req.body.ProductName,
                Description: req.body.Description,
                Price: req.body.Price,
                categories: req.body.categories,
                Quantity: req.body.Quantity,
                ProductImage: req.file.buffer.toString('base64'), // Save file content as base64
            });
            const result = await newData.save();
            console.log(result, ">>>>> Saved");
            res.status(201).send(result); // Send a 201 Created status code
        // } else {
        //     res.status(400).send("Product Already Exists"); // Send a 400 Bad Request status code
        // }
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await SigninDb.findOne({ email });
        console.log(password);
        

        if (!user) {
            return res.status(401).send("Email is incorrect");

        }
        const isMatch = await bcrypt.compare(password, user.password);

       
        if (!isMatch) {
            return res.status(401).send("Invalid password");

        }

        const newDateLastLog = new Date().toISOString();


        await SigninDb.updateOne({ _id: user._id }, { $set: { datelastlog: newDateLastLog } });

        console.log("User signed in successfully");

        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30m' }
        );


        res.status(200).json({ user: { ...user.toObject(), password: undefined }, token });
    } catch (error) {
        console.error("Error in signin:", error);
        res.status(500).send("An error occurred");
    }
});

app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);

        const user = await SigninDb.findOne({ email });

        if (!user) {
            return res.status(401).send("Email not found");
        }

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999);
//
        // Store OTP and expiration in user document or in-memory (Redis, etc.)
        user.otp = otp;
        user.otpExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes validity
        await user.save();

        // Send OTP via email
        await sendOtpEmail(email, otp);

        res.status(200).send("OTP sent to your email");
    } catch (error) {
        console.error("Error in sending OTP:", error);
        res.status(500).send("An error occurred");
    }
});

app.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).send("Email and OTP are required.");
        }

        const user = await SigninDb.findOne({ email });

        // Check if the user exists
        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Validate OTP and check expiration
        const isOtpValid = user.otp === parseInt(otp);
        const isOtpExpired = user.otpExpiration < Date.now();

        if (!isOtpValid || isOtpExpired) {
            return res.status(400).send("Invalid or expired OTP.");
        }

        // OTP is valid, clear the OTP fields
        user.otp = undefined;
        user.otpExpiration = undefined;
        await user.save();

        res.status(200).send("OTP verified successfully.");
    } catch (error) {
        console.error("Error in verifying OTP:", error);
        res.status(500).send("An error occurred during OTP verification.");
    }
});

app.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).send("Email and OTP are required.");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await SigninDb.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );
        res.status(200).send("Password reset successfully.");
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).send("An error occurred while resetting the password.");
    }
})

app.post("/profile",async(req,res)=>{
    try {

        const {name,email,phone,_id} = req.body;
        const user = await SigninDb.findOne({ _id });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Update user details
        await SigninDb.updateOne(
            { _id },
            { $set: { email:email,name: name, mobileNo: phone } } 
        );        res.status(200).send({
            message: 'Profile updated successfully',
            user: user
          });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("An error occurred while updating the profile.");
    }

})


app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});
