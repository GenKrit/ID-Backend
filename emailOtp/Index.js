

const nodemailer = require('nodemailer');
require('dotenv').config();

const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // You can use any other service or SMTP
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS, // Your email password or app password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
};

module.exports = sendOtpEmail;
