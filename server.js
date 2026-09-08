require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDB } = require('./config/database');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));


app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Serve HTML with server-side route guards
const { isAuthenticated, isAdmin } = require('./middleware/authMiddleware');

const redirectToLogin = (req, res) => res.redirect('/');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/views/login.html')));

app.get('/admin', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const role = req.session.user.role;
    if (role !== 'ADMIN' && role !== 'MANAGER') return res.redirect('/pos');
    res.sendFile(path.join(__dirname, 'public/views/admin-dashboard.html'));
});

app.get('/pos', (req, res) => {
    if (!req.session.user) return redirectToLogin(req, res);
    res.sendFile(path.join(__dirname, 'public/views/pos.html'));
});

app.use(errorHandler);

// Init Database and Start Server
const startServer = async () => {
    try {
        await initDB();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();