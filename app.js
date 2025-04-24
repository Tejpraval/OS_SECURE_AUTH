app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Changed from 'strict' to 'lax' to allow multiple tabs
    },
    store: new session.MemoryStore({
        checkPeriod: 86400000 // Clean up expired sessions every 24 hours
    })
})); 