const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAuthenticated, isAdmin, isUser, logger } = require('../middleware/auth');

// Apply authentication and logger middleware
router.use(isAuthenticated);
router.use(logger);

// Admin dashboard
router.get('/admin', isAdmin, (req, res) => {
    res.render('admin-dashboard', { user: req.session.user });
});

// User dashboard
router.get('/user', isUser, (req, res) => {
    res.render('user-dashboard', { user: req.session.user });
});

// Admin: View all users
router.get('/admin/users', isAdmin, (req, res) => {
    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));
    res.render('admin/users', { users, user: req.session.user });
});

// Admin: Delete user
router.delete('/admin/users/:email', isAdmin, (req, res) => {
    const usersPath = path.join(__dirname, '../data/users.json');
    let users = JSON.parse(fs.readFileSync(usersPath));
    
    // Don't allow deleting the current admin
    if (req.params.email === req.session.user.email) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Filter out the user to delete
    users = users.filter(user => user.email !== req.params.email);
    
    // Save updated users
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    
    // Log the deletion
    const logEntry = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        email: req.session.user.email,
        action: 'delete_user',
        status: 'success'
    };

    const logsPath = path.join(__dirname, '../data/logs.json');
    let logs = [];
    if (fs.existsSync(logsPath)) {
        logs = JSON.parse(fs.readFileSync(logsPath));
    }
    logs.push(logEntry);
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

    res.json({ success: true });
});

// Admin: View system logs
router.get('/admin/logs', isAdmin, (req, res) => {
    const logsPath = path.join(__dirname, '../data/logs.json');
    const logs = JSON.parse(fs.readFileSync(logsPath));
    res.render('admin/logs', { logs, user: req.session.user });
});

// User: View profile
router.get('/user/profile', isUser, (req, res) => {
    const usersPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath));
    const userProfile = users.find(u => u.email === req.session.user.email);
    res.render('user/profile', { userProfile, user: req.session.user });
});

module.exports = router; 