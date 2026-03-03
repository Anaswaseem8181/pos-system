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


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'admin-dashboard.html'));
});

app.get('/pos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'pos.html'));
});

// Init Database
initDB();

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Serve HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/views/login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/views/admin-dashboard.html')));
app.get('/pos', (req, res) => res.sendFile(path.join(__dirname, 'public/views/pos.html')));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));