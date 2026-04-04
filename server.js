// server.js — Mangalyam Store · G. Anandan · Main Server
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const connectDB   = require('./config/db');

// ── Connect Database ──────────────────────────────────────
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests — சிறிது நேரம் கழித்து try செய்யவும்' },
});
app.use('/api/', limiter);

// ── Static Files — Serve Frontend ─────────────────────────
// Serves index.html, style.css, script.js from same folder
app.use(express.static(path.join(__dirname)));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));


// ── Sitemap & Robots ──────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌸 Mangalyam Store API running',
    owner: 'G. Anandan · Poonamalle, Chennai',
    phone: ['9710835979', '7305775184'],
    time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  });
});

// ── Serve Frontend for all non-API routes ─────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API route கிடைக்கவில்லை' });
  }
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error — மீண்டும் try செய்யவும்',
  });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     🌸  MANGALYAM STORE — SERVER STARTED  🌸     ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🚀  http://localhost:${PORT}                        ║`);
  console.log(`║  📦  API: http://localhost:${PORT}/api/health         ║`);
  console.log(`║  👨‍💼  Owner: G. Anandan · Poonamalle, Chennai    ║`);
  console.log(`║  📞  9710835979 | 7305775184                     ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
