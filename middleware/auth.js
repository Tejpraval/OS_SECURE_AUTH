const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// In-memory storage for OTPs
const otpStore = new Map();

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied');
};

// Check if user is regular user
const isUser = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'user') {
        return next();
    }
    res.status(403).send('Access denied');
};

// Store OTP
const storeOTP = (email, otp) => {
    otpStore.set(email, {
        otp,
        timestamp: Date.now()
    });
};

// Verify OTP
const verifyOTP = (email, otp) => {
    const stored = otpStore.get(email);
    if (!stored) return false;
    
    // Check if OTP is expired (5 minutes)
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
        otpStore.delete(email);
        return false;
    }
    
    if (stored.otp === otp) {
        otpStore.delete(email);
        return true;
    }
    return false;
};

// Logger middleware
const logger = (req, res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        email: req.body.email || req.session?.user?.email || 'unknown',
        action: req.path,
        status: res.statusCode
    };

    const logPath = path.join(__dirname, '../data/logs.json');
    let logs = [];
    
    if (fs.existsSync(logPath)) {
        logs = JSON.parse(fs.readFileSync(logPath));
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isUser,
    storeOTP,
    verifyOTP,
    logger
}; 