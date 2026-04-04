// seed.js — Insert initial products & admin user into MongoDB
// Run: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('./models/Product');
const User     = require('./models/User');

const PRODUCTS = [
  {
    name: 'Classic Manjal Thali Kayiru',
    tamilName: 'கைவினை முறை மஞ்சள் தாலி கயிறு',
    brand: 'Mangalyam · G. Anandan',
    type: 'Natural Turmeric · Pure Cotton · 24 inch',
    categories: ['all', 'yellow'],
    badge: 'BESTSELLER',
    badgeColor: 'm',
    emoji: '🟡',
    images: ['/images/product1.jpg', '/images/product4.jpg'],
    retailPrice: 38,
    wholesalePrice: 12,
    wholesaleMinQty: 20,
    rating: 4.9,
    reviewCount: 521,
    specs: new Map([
      ['Material', 'Pure Cotton'],
      ['Length', '24 inches'],
      ['Dye', 'Natural Haldi'],
      ['Twist', '3-ply'],
      ['Owner', 'G. Anandan'],
      ['Origin', 'Poonamalle, Chennai'],
    ]),
    stock: 500,
  },
  {
    name: 'Bulk Bundle — 10 pcs',
    tamilName: '10 நூல் தொகுப்பு',
    brand: 'Mangalyam · G. Anandan',
    type: 'Set of 10 · Ready Dispatch · Plastic Packed',
    categories: ['all', 'bulk', 'wholesale'],
    badge: 'BULK',
    badgeColor: 'g',
    emoji: '📦',
    images: ['/images/product2.jpg', '/images/product3.jpg'],
    retailPrice: 370,
    wholesalePrice: 130,
    wholesaleMinQty: 1,
    rating: 4.8,
    reviewCount: 342,
    specs: new Map([
      ['Quantity', '10 pcs'],
      ['Material', 'Pure Cotton'],
      ['Price', '₹37/pc retail'],
      ['WSPrice', '₹13/pc wholesale'],
      ['Dispatch', 'Same day'],
      ['Origin', 'Poonamalle, Chennai'],
    ]),
    stock: 200,
  },
  {
    name: 'Wholesale Pack — 50 pcs',
    tamilName: '50 நூல் மொத்த தொகுப்பு',
    brand: 'Mangalyam · G. Anandan',
    type: '50 pcs · Plastic Sealed · GST Invoice',
    categories: ['all', 'wholesale'],
    badge: 'WHOLESALE',
    badgeColor: 'm',
    emoji: '🏷️',
    images: ['/images/product3.jpg', '/images/product2.jpg'],
    retailPrice: 1900,
    wholesalePrice: 650,
    wholesaleMinQty: 1,
    rating: 4.9,
    reviewCount: 187,
    specs: new Map([
      ['Quantity', '50 pcs'],
      ['Price', '₹38/pc retail'],
      ['WSPrice', '₹13/pc wholesale'],
      ['GST', 'Invoice incl.'],
      ['Dispatch', 'Priority 24hrs'],
      ['Origin', 'Poonamalle, Chennai'],
    ]),
    stock: 100,
  },
  {
    name: 'Temple Grade Premium Kayiru',
    tamilName: 'கோவில் தர தாலி கமிற',
    brand: 'Mangalyam · G. Anandan',
    type: 'Premium Cotton · Double Dyed · 24 inch',
    categories: ['all', 'temple'],
    badge: 'TEMPLE',
    badgeColor: 'm',
    emoji: '🛕',
    images: ['/images/product4.jpg', '/images/product1.jpg'],
    retailPrice: 40,
    wholesalePrice: 15,
    wholesaleMinQty: 20,
    rating: 5.0,
    reviewCount: 289,
    specs: new Map([
      ['Material', 'Premium Cotton'],
      ['Length', '24 inches'],
      ['Dye', 'Double Haldi'],
      ['Grade', 'Temple Grade'],
      ['Owner', 'G. Anandan'],
      ['Origin', 'Poonamalle, Chennai'],
    ]),
    stock: 300,
  },
  {
    name: 'Mega Pack — 100 pcs',
    tamilName: '100 நூல் மொத்த விலை',
    brand: 'Mangalyam · G. Anandan',
    type: '100 pcs · Factory Direct · Best Rate',
    categories: ['all', 'wholesale'],
    badge: 'BEST VALUE',
    badgeColor: 'g',
    emoji: '🏭',
    images: ['/images/product3.jpg', '/images/product2.jpg'],
    retailPrice: 3800,
    wholesalePrice: 1200,
    wholesaleMinQty: 1,
    rating: 4.8,
    reviewCount: 94,
    specs: new Map([
      ['Quantity', '100 pcs'],
      ['RetailRate', '₹38/pc'],
      ['WSRate', '₹12/pc'],
      ['Savings', '₹2,600 saved'],
      ['Dispatch', 'Priority'],
      ['Origin', 'Poonamalle, Chennai'],
    ]),
    stock: 50,
  },
  {
    name: 'Short Thali Kayiru — 18 inch',
    tamilName: 'குறுகிய தாலி கமிற',
    brand: 'Mangalyam · G. Anandan',
    type: 'Compact · 18 inch · Natural Dye',
    categories: ['all', 'yellow'],
    badge: 'NEW',
    badgeColor: 'g',
    emoji: '✨',
    images: ['/images/product1.jpg', '/images/product4.jpg'],
    retailPrice: 35,
    wholesalePrice: 12,
    wholesaleMinQty: 20,
    rating: 4.7,
    reviewCount: 67,
    specs: new Map([
      ['Material', 'Pure Cotton'],
      ['Length', '18 inches'],
      ['Dye', 'Natural Haldi'],
      ['Twist', '3-ply'],
      ['Owner', 'G. Anandan'],
      ['Origin', 'Poonamalle, Chennai'],
    ]),
    stock: 400,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing
    await Product.deleteMany({});
    console.log('🗑️  Old products cleared');

    // Insert products
    const inserted = await Product.insertMany(PRODUCTS);
    console.log(`✅ ${inserted.length} products inserted`);

    // Create admin user (skip if exists)
    const existingAdmin = await User.findOne({ phone: '9710835979' });
    if (!existingAdmin) {
      await User.create({
        name: 'G. Anandan',
        phone: '9710835979',
        city: 'Poonamalle, Chennai',
        password: 'mangalyam@2025',
        role: 'admin',
      });
      console.log('✅ Admin user created → Phone: 9710835979 | Password: mangalyam@2025');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n🎉 Seed complete! Server start பண்ணலாம்: npm start');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
