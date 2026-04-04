// server.js — Mangalyam Store · G. Anandan · ALL-IN-ONE
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');

// ══════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ══════════════════════════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// ══════════════════════════════════════════════════════════
// MODELS
// ══════════════════════════════════════════════════════════

// User Model
const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, unique: true, trim: true },
  city:        { type: String, default: '' },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['customer','wholesale','admin'], default: 'customer' },
  totalOrders: { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};
const User = mongoose.model('User', userSchema);

// Product Model
const productSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  tamilName:       { type: String, default: '' },
  brand:           { type: String, default: 'Mangalyam · G. Anandan' },
  type:            { type: String, default: '' },
  categories:      [String],
  badge:           { type: String, default: '' },
  badgeColor:      { type: String, default: 'm' },
  emoji:           { type: String, default: '🧵' },
  images:          [String],
  retailPrice:     { type: Number, required: true },
  wholesalePrice:  { type: Number, required: true },
  wholesaleMinQty: { type: Number, default: 20 },
  rating:          { type: Number, default: 4.5 },
  reviewCount:     { type: Number, default: 0 },
  specs:           { type: Map, of: String },
  stock:           { type: Number, default: 100 },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

// Order Model
const orderSchema = new mongoose.Schema({
  orderId:      { type: String, unique: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  phone:        { type: String, required: true },
  address:      { type: String, default: '' },
  city:         { type: String, default: '' },
  items: [{
    productId:   String,
    productName: String,
    qty:         Number,
    unitPrice:   Number,
    total:       Number,
  }],
  totalAmount: { type: Number, required: true },
  status:      { type: String, enum: ['placed','confirmed','packed','out_for_delivery','delivered'], default: 'placed' },
  timeline: [{
    status:    String,
    message:   String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `MG-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});
const Order = mongoose.model('Order', orderSchema);

// ══════════════════════════════════════════════════════════
// MIDDLEWARE HELPERS
// ══════════════════════════════════════════════════════════
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'mangalyam_secret', { expiresIn: '30d' });

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Login செய்யவும்' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mangalyam_secret');
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin மட்டும்' });
};

// ══════════════════════════════════════════════════════════
// EXPRESS APP
// ══════════════════════════════════════════════════════════
const app = express();
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname)));

// ══════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, city, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ success: false, message: 'பெயர், phone, password கொடுக்கவும்' });
    if (await User.findOne({ phone }))
      return res.status(400).json({ success: false, message: 'இந்த phone already registered' });
    const user = await User.create({ name, phone, city, password });
    res.status(201).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, phone: user.phone, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ success: false, message: 'Phone & password கொடுக்கவும்' });
    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Phone அல்லது password தப்பு' });
    res.json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, phone: user.phone, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ══════════════════════════════════════════════════════════
// PRODUCT ROUTES
// ══════════════════════════════════════════════════════════
app.get('/api/products', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category && req.query.category !== 'all') filter.categories = req.query.category;
    const products = await Product.find(filter);
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product இல்லை' });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/products', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.put('/api/products/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, product });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.delete('/api/products/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product removed' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════════════════
// ORDER ROUTES
// ══════════════════════════════════════════════════════════
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, city, items, totalAmount, deliveryAddress, paymentMethod, guestPhone } = req.body;

    // Support both formats: direct fields OR deliveryAddress object (from script.js)
    const name   = customerName || (deliveryAddress && deliveryAddress.name);
    const mobile = phone || guestPhone || (deliveryAddress && deliveryAddress.phone);
    const street = address || (deliveryAddress && deliveryAddress.street) || '';
    const town   = city || (deliveryAddress && deliveryAddress.city) || '';
    const total  = totalAmount || (items && items.reduce((s, i) => s + ((i.unitPrice || i.retail || 0) * (i.qty || 1)), 0)) || 0;

    if (!name || !mobile || !items || !items.length)
      return res.status(400).json({ success: false, message: 'தேவையான details கொடுக்கவும்' });

    const order = await Order.create({
      customerName: name,
      phone: mobile,
      address: street,
      city: town,
      items,
      totalAmount: total,
      user: req.user ? req.user._id : undefined,
      timeline: [{ status: 'placed', message: 'G. Anandan உங்கள் order பெற்றார் · Poonamalle, Chennai' }],
    });
    res.status(201).json({ success: true, order, orderId: order.orderId });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.get('/api/orders/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order கிடைக்கவில்லை' });
    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/orders/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/orders', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/orders/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order இல்லை' });
    order.status = status;
    order.timeline.push({ status, message: message || `Status: ${status}` });
    await order.save();
    res.json({ success: true, order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.get('/api/orders/stats/summary', protect, adminOnly, async (req, res) => {
  try {
    const total   = await Order.countDocuments();
    const revenue = await Order.aggregate([{ $group: { _id: null, sum: { $sum: '$totalAmount' } } }]);
    res.json({ success: true, totalOrders: total, totalRevenue: revenue[0]?.sum || 0 });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ══════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌸 Mangalyam Store API running',
    owner: 'G. Anandan · Poonamalle, Chennai',
    phone: ['9710835979', '7305775184'],
    time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
  });
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/robots.txt',  (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API route இல்லை' });
  }
});

app.use((err, req, res, next) => {
  console.error('💥 Error:', err.message);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' });
});

// ══════════════════════════════════════════════════════════
// AUTO SEED — Admin + Products (runs on every start, skips if exists)
// ══════════════════════════════════════════════════════════
async function autoSeed() {
  try {
    // Admin user
    const admin = await User.findOne({ phone: '9710835979' });
    if (!admin) {
      await User.create({
        name: 'G. Anandan',
        phone: '9710835979',
        city: 'Poonamalle, Chennai',
        password: 'mangalyam@2025',
        role: 'admin',
      });
      console.log('✅ Admin user created → 9710835979 / mangalyam@2025');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Products
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        { name:'Classic Manjal Thali Kayiru', tamilName:'கைவினை முறை மஞ்சள் தாலி கயிறு', brand:'Mangalyam · G. Anandan', type:'Natural Turmeric · Pure Cotton · 24 inch', categories:['all','yellow'], badge:'BESTSELLER', badgeColor:'m', emoji:'🟡', images:['/images/product1.jpg','/images/product4.jpg'], retailPrice:22, wholesalePrice:10, wholesaleMinQty:20, rating:4.9, reviewCount:521, stock:500 },
        { name:'Bulk Bundle — 10 pcs', tamilName:'10 நூல் தொகுப்பு', brand:'Mangalyam · G. Anandan', type:'Set of 10 · Ready Dispatch · Plastic Packed', categories:['all','bulk','wholesale'], badge:'BULK', badgeColor:'g', emoji:'📦', images:['/images/product2.jpg','/images/product3.jpg'], retailPrice:220, wholesalePrice:100, wholesaleMinQty:1, rating:4.8, reviewCount:342, stock:200 },
        { name:'Wholesale Pack — 50 pcs', tamilName:'50 நூல் மொத்த தொகுப்பு', brand:'Mangalyam · G. Anandan', type:'50 pcs · Plastic Sealed · GST Invoice', categories:['all','wholesale'], badge:'WHOLESALE', badgeColor:'m', emoji:'🏷️', images:['/images/product3.jpg','/images/product2.jpg'], retailPrice:1100, wholesalePrice:500, wholesaleMinQty:1, rating:4.9, reviewCount:187, stock:100 },
        { name:'Temple Grade Premium Kayiru', tamilName:'கோவில் தர தாலி கயிறு', brand:'Mangalyam · G. Anandan', type:'Premium Cotton · Double Dyed · 24 inch', categories:['all','temple'], badge:'TEMPLE', badgeColor:'m', emoji:'🛕', images:['/images/product4.jpg','/images/product1.jpg'], retailPrice:25, wholesalePrice:13, wholesaleMinQty:20, rating:5.0, reviewCount:289, stock:300 },
        { name:'Mega Pack — 100 pcs', tamilName:'100 நூல் மொத்த விலை', brand:'Mangalyam · G. Anandan', type:'100 pcs · Factory Direct · Best Rate', categories:['all','wholesale'], badge:'BEST VALUE', badgeColor:'g', emoji:'🏭', images:['/images/product5.png','/images/product3.jpg'], retailPrice:2200, wholesalePrice:1000, wholesaleMinQty:1, rating:4.8, reviewCount:94, stock:50 },
        { name:'Short Thali Kayiru — 18 inch', tamilName:'குறுகிய தாலி கயிறு', brand:'Mangalyam · G. Anandan', type:'Compact · 18 inch · Natural Dye', categories:['all','yellow'], badge:'NEW', badgeColor:'g', emoji:'✨', images:['/images/product1.jpg','/images/product4.jpg'], retailPrice:20, wholesalePrice:10, wholesaleMinQty:20, rating:4.7, reviewCount:67, stock:400 },
      ]);
      console.log('✅ 6 products seeded');
    } else {
      console.log(`ℹ️  ${count} products already exist`);
    }
  } catch(err) {
    console.error('❌ Seed error:', err.message);
  }
}

// ══════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     🌸  MANGALYAM STORE — SERVER STARTED  🌸     ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🚀  Port: ${PORT}                                   ║`);
  console.log(`║  👨‍💼  Owner: G. Anandan · Poonamalle, Chennai    ║`);
  console.log(`║  📞  9710835979 | 7305775184                     ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  await autoSeed();
});

module.exports = app;
