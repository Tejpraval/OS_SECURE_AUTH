const nodemailer = require('nodemailer');
// require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',        // Correct Gmail SMTP server
    port: 587,                     //  Port for STARTTLS
    secure: false,                 // false for port 587
    auth: {
        user: process.env.EMAIL_USER,  // Your Gmail address
        pass: process.env.EMAIL_PASS   // Your App Password (16 chars)
    }
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Secure Authentication',
        text: `Your OTP is: ${otp}. This OTP will expire in 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your OTP for Secure Authentication</h2>
                <p>Your One-Time Password (OTP) is:</p>
                <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px;">
                    <strong>${otp}</strong>
                </div>
                <p>This OTP will expire in 5 minutes.</p>
                <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw new Error('Failed to send OTP email. Please try again later.');
    }
};

module.exports = { sendOTP };
