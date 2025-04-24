const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const generateOTP = require('../utils/otpGenerator');
const { sendOTP } = require('../utils/nodemailer');
const { storeOTP, verifyOTP, logger } = require('../middleware/auth');

// Apply logger middleware to all routes
router.use(logger);

// Login page
router.get('/login', (req, res) => {
    res.render('login', { content: '' });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', { content: '' });
});

// Handle registration
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    
    // Validate input
    if (!username || !email || !password || !role) {
        return res.status(400).send('All fields are required');
    }

    // Read existing users
    const usersPath = path.join(__dirname, '../data/users.json');
    let users = [];
    if (fs.existsSync(usersPath)) {
        users = JSON.parse(fs.readFileSync(usersPath));
    }

    // Check if user already exists
    if (users.some(user => user.email === email)) {
        return res.status(400).send('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Add new user
    users.push({
        username,
        email,
        password: hashedPassword,
        role
    });

    // Save users
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    res.redirect('/login');
});

// Handle login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Read users
    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).send('Invalid credentials');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).send('Invalid credentials');
    }

    // Generate and send OTP
    const otp = generateOTP();
    storeOTP(email, otp);
    await sendOTP(email, otp);

    // Store user email in session for OTP verification
    req.session.tempUser = { email };
    
    res.redirect('/verify-otp');
});

// OTP verification page
router.get('/verify-otp', (req, res) => {
    if (!req.session.tempUser) {
        return res.redirect('/login');
    }
    res.render('verify-otp', { content: '' });
});

// Handle OTP verification
router.post('/verify-otp', async (req, res) => {
    const { otp } = req.body;
    const email = req.session.tempUser?.email;

    if (!email || !otp) {
        return res.status(400).send('Invalid request');
    }

    if (verifyOTP(email, otp)) {
        // Read users to get full user data
        const usersPath = path.join(__dirname, '../data/users.json');
        const users = JSON.parse(fs.readFileSync(usersPath));
        const user = users.find(u => u.email === email);

        // Set up session
        req.session.user = {
            email: user.email,
            username: user.username,
            role: user.role
        };

        // Clear temp session
        delete req.session.tempUser;

        // Redirect based on role
        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/user');
        }
    } else {
        res.status(401).send('Invalid OTP');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router; 