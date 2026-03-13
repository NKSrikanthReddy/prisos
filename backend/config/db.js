// server.js — starts the Express app
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

// Route imports
const authRoutes    = require('./routes/auth');
const cafeRoutes    = require('./routes/cafes');
const itemRoutes    = require('./routes/items');
const orderRoutes   = require('./routes/orders');
const reviewRoutes  = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const adminRoutes   = require('./routes/admin');

const app = express();
connectDB();   // connect to MongoDB Atlas
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes — all prefixed with /api
app.use('/api/auth',     authRoutes);
app.use('/api/cafes',    cafeRoutes);
app.use('/api/items',    itemRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin',    adminRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Prisos API running — too good to waste 🌿' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
