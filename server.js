const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000 // 5 minutes
    }
}));

// Initialize data files if they don't exist
const dataPath = path.join(__dirname, 'data');

if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

if (!fs.existsSync(path.join(dataPath, 'users.json'))) {
    fs.writeFileSync(path.join(dataPath, 'users.json'), '[]');
}

if (!fs.existsSync(path.join(dataPath, 'logs.json'))) {
    fs.writeFileSync(path.join(dataPath, 'logs.json'), '[]');
}

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Use routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 