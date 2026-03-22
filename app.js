require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const ejsMate = require('ejs-mate');
const db = require('./config/database');

// Native lightweight CSRF implementation
const csurf = () => (req, res, next) => {
    if (!req.session.csrfSecret) {
        req.session.csrfSecret = Math.random().toString(36).substring(2, 15);
    }
    req.csrfToken = () => req.session.csrfSecret;
    if (req.method === 'POST') {
        const token = req.body._csrf || req.headers['csrf-token'];
        if (!token || token !== req.session.csrfSecret) {
            const err = new Error('Invalid CSRF Token');
            err.code = 'EBADCSRFTOKEN';
            return next(err);
        }
    }
    next();
};

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 1000;

// ==================== SECURITY & MIDDLEWARE ====================

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Request Logging (Native)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CORS Configuration
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Native CSRF Protection
app.use(csurf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    next();
});

// ==================== STATIC FILES ====================

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ==================== VIEW ENGINE ====================

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== ROUTES ====================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res, next) => {
    res.status(404).render('404', { url: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        res.status(403).send('<h1>403 Forbidden</h1><p>Form tampered with or session expired. Please hit back and refresh.</p>');
        return;
    }
    console.error('SERVER ERROR:', err);
    res.status(err.status || 500);
    res.send(`<h1>500 - Server Error</h1><pre>${err.stack || err.message || err}</pre>`);
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log('============================================================');
    console.log('   📰 ONNIEONE NEWS - COMPLETE WEBSITE');
    console.log('============================================================');
    console.log('   📍 Website: http://localhost:' + PORT);
    console.log('   🔐 Admin Login: http://localhost:' + PORT + '/admin/login');
    console.log('============================================================');
});

module.exports = app;
