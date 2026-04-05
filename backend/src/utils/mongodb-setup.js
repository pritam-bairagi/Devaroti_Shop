/**
 * ============================================================
 * mongodb-setup.js  —  COMPLETE FRESH SETUP
 * ============================================================
 * Drops ALL data, recreates indexes, seeds:
 *   - 6 user accounts (admin, 2 sellers, courier, 2 customers)
 *   - 15 products across 7 categories
 *   - 8 demo transactions
 *
 * Run: node src/utils/mongodb-setup.js
 * ============================================================
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('\n❌ MONGODB_URI not found in .env file!');
  process.exit(1);
}

const log = (m) => process.stdout.write(m + '\n');
const ok = (m) => log(`   ✅ ${m}`);
const skip = (m) => log(`   ⏭️  ${m}`);
const step = (n, m) => log(`\n[${n}] ${m}`);

const setup = async () => {
  log('\n' + '═'.repeat(55));
  log('  🚀  DEVAROTI SHOP — MONGODB FRESH SETUP');
  log('═'.repeat(55));
  log(`  URI: ${process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@')}`);
  log('═'.repeat(55));

  // ── STEP 1: CONNECT ──────────────────────────────────────
  step(1, 'Connecting...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  ok(`Connected: ${mongoose.connection.host} / ${mongoose.connection.name}`);

  const db = mongoose.connection.db;

  // ── STEP 2: DROP ALL COLLECTIONS ─────────────────────────
  step(2, 'Dropping existing collections...');
  const existing = (await db.listCollections().toArray()).map(c => c.name);
  const toDrop = ['users', 'products', 'orders', 'sales', 'purchases', 'transactions', 'reviews'];
  for (const name of toDrop) {
    if (existing.includes(name)) { await db.collection(name).drop(); ok(`Dropped: ${name}`); }
    else { skip(`Not found: ${name}`); }
  }

  // ── STEP 3: CREATE INDEXES ───────────────────────────────
  step(3, 'Creating indexes...');

  await db.createCollection('users');
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true, sparse: false });
  await users.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
  await users.createIndex({ role: 1 });
  await users.createIndex({ createdAt: -1 });
  await users.createIndex({ isActive: 1, role: 1 });
  ok('users — 5 indexes');

  await db.createCollection('products');
  const products = db.collection('products');
  await products.createIndex({ name: 'text', description: 'text', category: 'text', tags: 'text' },
    { weights: { name: 10, tags: 5, category: 3, description: 1 } });
  await products.createIndex({ category: 1, liveStatus: 1 });
  await products.createIndex({ user: 1, liveStatus: 1 });
  await products.createIndex({ sellingPrice: 1 });
  await products.createIndex({ soldCount: -1 });
  await products.createIndex({ isFeatured: 1, liveStatus: 1 });
  await products.createIndex({ createdAt: -1 });
  // FIX: sparse:true so documents without sku/slug don't conflict on unique index
  await products.createIndex({ slug: 1 }, { unique: true, sparse: true });
  await products.createIndex({ sku: 1 }, { unique: true, sparse: true });
  ok('products — 9 indexes');

  await db.createCollection('orders');
  const orders = db.collection('orders');
  await orders.createIndex({ orderNumber: 1 }, { unique: true });
  await orders.createIndex({ user: 1, createdAt: -1 });
  await orders.createIndex({ status: 1, createdAt: -1 });
  await orders.createIndex({ paymentStatus: 1 });
  await orders.createIndex({ 'sellers.sellerId': 1 });
  ok('orders — 5 indexes');

  await db.createCollection('transactions');
  const transactions = db.collection('transactions');
  await transactions.createIndex({ user: 1, date: -1 });
  await transactions.createIndex({ type: 1, date: -1 });
  await transactions.createIndex({ status: 1 });
  ok('transactions — 3 indexes');

  for (const col of ['sales', 'purchases', 'reviews']) {
    await db.createCollection(col);
  }
  ok('sales, purchases, reviews — created');

  // ── STEP 4: SEED USERS ───────────────────────────────────
  step(4, 'Seeding user accounts...');
  const salt = await bcrypt.genSalt(10);

  const userDocs = [
    {
      name: 'System Administrator',
      email: 'admin@devaroti.com',
      password: await bcrypt.hash('Admin@123456', salt),
      phoneNumber: '01700000000',
      role: 'admin',
      isVerified: true, isEmailVerified: true, isActive: true,
      level: 'VIP', levelColor: '#8B4513',
      totalSpent: 0, orderCount: 0, loginCount: 0,
      cart: [], favorites: [],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      name: 'Rahim Electronics',
      email: 'seller@devaroti.com',
      password: await bcrypt.hash('Seller@123456', salt),
      phoneNumber: '01711111111',
      role: 'seller',
      shopName: 'Rahim Electronics',
      shopDescription: 'Best electronics at best prices in Bangladesh',
      shopLocation: 'Dhaka, Mirpur',
      isVerified: true, isEmailVerified: true,
      isSellerApproved: true, isActive: true,
      level: 'Gold', levelColor: '#FFD700',
      totalSpent: 0, orderCount: 0, loginCount: 0,
      totalEarnings: 0, cashBox: 0,
      cart: [], favorites: [],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      name: 'Karim Fashion House',
      email: 'seller2@devaroti.com',
      password: await bcrypt.hash('Seller@123456', salt),
      phoneNumber: '01733333333',
      role: 'seller',
      shopName: 'Karim Fashion House',
      shopDescription: 'Trendy fashion for everyone',
      shopLocation: 'Chittagong, Agrabad',
      isVerified: true, isEmailVerified: true,
      isSellerApproved: true, isActive: true,
      level: 'Silver', levelColor: '#C0C0C0',
      totalSpent: 0, orderCount: 0, loginCount: 0,
      cart: [], favorites: [],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      name: 'Alam Courier',
      email: 'courier@devaroti.com',
      password: await bcrypt.hash('Courier@123456', salt),
      phoneNumber: '01755555555',
      role: 'courier',
      isVerified: true, isEmailVerified: true, isActive: true,
      level: 'Plastic', levelColor: '#ff5500',
      totalSpent: 0, orderCount: 0, loginCount: 0,
      cart: [], favorites: [],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      name: 'Sadia Customer',
      email: 'user@devaroti.com',
      password: await bcrypt.hash('User@123456', salt),
      phoneNumber: '01722222222',
      role: 'user',
      isVerified: true, isEmailVerified: true, isActive: true,
      level: 'Bronze', levelColor: '#CD7F32',
      totalSpent: 5500, orderCount: 3, loginCount: 0,
      addresses: [{
        label: 'Home', name: 'Sadia Rahman', phone: '01722222222',
        addressLine1: '45/A, Mirpur Road', city: 'Dhaka',
        postalCode: '1216', country: 'Bangladesh', isDefault: true
      }],
      cart: [], favorites: [],
      createdAt: new Date(), updatedAt: new Date()
    },
    {
      name: 'Rakib Customer',
      email: 'user2@devaroti.com',
      password: await bcrypt.hash('User@123456', salt),
      phoneNumber: '01744444444',
      role: 'user',
      isVerified: true, isEmailVerified: true, isActive: true,
      level: 'Plastic', levelColor: '#ff5500',
      totalSpent: 1200, orderCount: 1, loginCount: 0,
      cart: [], favorites: [],
      createdAt: new Date(), updatedAt: new Date()
    }
  ];

  const createdUsers = {};
  for (const u of userDocs) {
    const r = await users.insertOne(u);
    createdUsers[u.email] = { ...u, _id: r.insertedId };
    ok(`${u.role.padEnd(7)} → ${u.email}`);
  }

  // ── STEP 5: SEED PRODUCTS ────────────────────────────────
  step(5, 'Seeding products...');
  const s1 = createdUsers['seller@devaroti.com']._id;
  const s2 = createdUsers['seller2@devaroti.com']._id;
  const now = new Date();
  const d = (days) => new Date(now - days * 86400000);

  // const productList = [
  //   // ── Electronics (Seller 1)
  //   {
  //     name: 'Wireless Bluetooth Headphones Pro',
  //     description: 'Premium wireless headphones with Active Noise Cancellation. 30-hour battery life, crystal clear sound. Foldable design for easy travel.',
  //     shortDescription: 'ANC wireless headphones, 30hr battery',
  //     sellingPrice: 2499, purchasePrice: 1700, price: 2499, mrp: 3999, discount: 37,
  //     unit: 'পিস', stock: 25, lowStockThreshold: 5,
  //     image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  //     images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
  //     category: 'Electronics', brand: 'SoundMaster',
  //     tags: ['headphones', 'wireless', 'bluetooth', 'ANC'],
  //     liveStatus: 'live', isFeatured: true, isBestSeller: true,
  //     averageRating: 4.5, reviewCount: 12, soldCount: 45, views: 320,
  //     user: s1, createdAt: d(20), updatedAt: now
  //   },
  //   {
  //     name: 'Smart Watch Series 5',
  //     description: 'Advanced fitness smart watch with heart rate monitor, SpO2 sensor, GPS. IP68 waterproof. 7-day battery life.',
  //     shortDescription: 'GPS smart watch, 7-day battery, IP68',
  //     sellingPrice: 3999, purchasePrice: 2800, price: 3999, mrp: 5999, discount: 33,
  //     unit: 'পিস', stock: 18, lowStockThreshold: 3,
  //     image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  //     images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
  //     category: 'Electronics', brand: 'FitTech',
  //     tags: ['smartwatch', 'fitness', 'GPS', 'waterproof'],
  //     liveStatus: 'live', isFeatured: true,
  //     averageRating: 4.3, reviewCount: 8, soldCount: 28, views: 210,
  //     user: s1, createdAt: d(15), updatedAt: now
  //   },
  //   {
  //     name: 'Mechanical Gaming Keyboard RGB',
  //     description: 'Tenkeyless mechanical keyboard with Blue switches, per-key RGB. N-key rollover, double-shot PBT keycaps.',
  //     shortDescription: 'TKL RGB mechanical keyboard',
  //     sellingPrice: 4299, purchasePrice: 3000, price: 4299, mrp: 5999, discount: 28,
  //     unit: 'পিস', stock: 10, lowStockThreshold: 3,
  //     image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500',
  //     images: ['https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500'],
  //     category: 'Electronics', brand: 'TypeMaster',
  //     tags: ['keyboard', 'mechanical', 'gaming', 'RGB'],
  //     liveStatus: 'live', isFeatured: true,
  //     averageRating: 4.7, reviewCount: 15, soldCount: 22, views: 190,
  //     user: s1, createdAt: d(10), updatedAt: now
  //   },
  //   {
  //     name: 'USB-C Fast Charger 65W GaN',
  //     description: 'GaN technology 65W USB-C fast charger. Charges laptop, phone, and tablet simultaneously. Supports PD 3.0 and QC 4.0.',
  //     shortDescription: '65W GaN USB-C fast charger',
  //     sellingPrice: 899, purchasePrice: 580, price: 899, mrp: 1299, discount: 30,
  //     unit: 'পিস', stock: 40, lowStockThreshold: 10,
  //     image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
  //     images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500'],
  //     category: 'Electronics', brand: 'PowerMax',
  //     tags: ['charger', 'USB-C', 'fast-charging', 'GaN'],
  //     liveStatus: 'live', isNewArrival: true,
  //     averageRating: 4.4, reviewCount: 6, soldCount: 38, views: 155,
  //     user: s1, createdAt: d(5), updatedAt: now
  //   },
  //   {
  //     name: 'Portable Bluetooth Speaker IPX7',
  //     description: 'Waterproof portable speaker with 360° surround sound. 20-hour playtime, built-in microphone.',
  //     shortDescription: 'Waterproof speaker, 20hr playtime',
  //     sellingPrice: 1799, purchasePrice: 1200, price: 1799, mrp: 2499, discount: 28,
  //     unit: 'পিস', stock: 20, lowStockThreshold: 5,
  //     image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
  //     images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
  //     category: 'Electronics', brand: 'SoundMax',
  //     tags: ['speaker', 'bluetooth', 'waterproof', 'portable'],
  //     liveStatus: 'live', isBestSeller: true,
  //     averageRating: 4.2, reviewCount: 9, soldCount: 31, views: 140,
  //     user: s1, createdAt: d(12), updatedAt: now
  //   },
  //   // ── Clothing (Seller 2)
  //   {
  //     name: 'Premium Cotton T-Shirt Unisex',
  //     description: '100% organic cotton comfortable t-shirt. Pre-shrunk, colorfast. Perfect for casual everyday wear.',
  //     shortDescription: '100% organic cotton t-shirt',
  //     sellingPrice: 549, purchasePrice: 350, price: 549, mrp: 799, discount: 31,
  //     unit: 'পিস', stock: 80, lowStockThreshold: 10,
  //     image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  //     images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
  //     category: 'Clothing', brand: 'StyleCo',
  //     tags: ['t-shirt', 'cotton', 'casual', 'unisex'],
  //     liveStatus: 'live', isFeatured: true, isNewArrival: true,
  //     averageRating: 4.1, reviewCount: 20, soldCount: 95, views: 430,
  //     user: s2, createdAt: d(25), updatedAt: now
  //   },
  //   {
  //     name: 'Slim Fit Formal Shirt',
  //     description: 'Premium slim-fit formal shirt, 60% cotton + 40% polyester blend. Wrinkle-resistant. Perfect for office.',
  //     shortDescription: 'Slim-fit wrinkle-resistant formal shirt',
  //     sellingPrice: 849, purchasePrice: 550, price: 849, mrp: 1199, discount: 29,
  //     unit: 'পিস', stock: 45, lowStockThreshold: 8,
  //     image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=500',
  //     images: ['https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=500'],
  //     category: 'Clothing', brand: 'FormalEdge',
  //     tags: ['shirt', 'formal', 'office', 'slim-fit'],
  //     liveStatus: 'live', isBestSeller: true,
  //     averageRating: 4.0, reviewCount: 14, soldCount: 67, views: 280,
  //     user: s2, createdAt: d(18), updatedAt: now
  //   },
  //   // ── Footwear
  //   {
  //     name: 'Running Shoes Lightweight',
  //     description: 'Ultra-lightweight mesh running shoes with cushioned midsole. Breathable upper, non-slip outsole.',
  //     shortDescription: 'Lightweight breathable running shoes',
  //     sellingPrice: 1999, purchasePrice: 1350, price: 1999, mrp: 2999, discount: 33,
  //     unit: 'পিস', stock: 30, lowStockThreshold: 5,
  //     image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  //     images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
  //     category: 'Footwear', brand: 'SpeedRun',
  //     tags: ['shoes', 'running', 'gym', 'sports'],
  //     liveStatus: 'live', isFeatured: true, isBestSeller: true,
  //     averageRating: 4.6, reviewCount: 18, soldCount: 78, views: 390,
  //     user: s2, createdAt: d(22), updatedAt: now
  //   },
  //   // ── Home & Kitchen
  //   {
  //     name: 'Non-Stick Cookware Set 5pc',
  //     description: '5-piece granite non-stick cookware. PFOA-free, oven safe 230°C. Works on all stovetops including induction.',
  //     shortDescription: 'PFOA-free granite cookware set',
  //     sellingPrice: 2199, purchasePrice: 1500, price: 2199, mrp: 3499, discount: 37,
  //     unit: 'সেট', stock: 15, lowStockThreshold: 3,
  //     image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
  //     images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
  //     category: 'Home & Kitchen', brand: 'ChefPro',
  //     tags: ['cookware', 'non-stick', 'kitchen', 'induction'],
  //     liveStatus: 'live', isFeatured: true,
  //     averageRating: 4.4, reviewCount: 11, soldCount: 24, views: 175,
  //     user: s1, createdAt: d(8), updatedAt: now
  //   },
  //   {
  //     name: 'LED Desk Lamp with Wireless Charger',
  //     description: 'LED lamp with built-in 10W wireless Qi charger and USB-A port. 5 brightness levels, touch control.',
  //     shortDescription: 'LED lamp + 10W wireless charger',
  //     sellingPrice: 1299, purchasePrice: 850, price: 1299, mrp: 1799, discount: 27,
  //     unit: 'পিস', stock: 22, lowStockThreshold: 5,
  //     image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
  //     images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'],
  //     category: 'Home & Kitchen', brand: 'BrightHome',
  //     tags: ['lamp', 'LED', 'wireless-charger', 'desk'],
  //     liveStatus: 'live', isNewArrival: true,
  //     averageRating: 4.3, reviewCount: 7, soldCount: 19, views: 130,
  //     user: s1, createdAt: d(3), updatedAt: now
  //   },
  //   // ── Sports & Fitness
  //   {
  //     name: 'Yoga Mat Premium Anti-Slip 6mm',
  //     description: 'Eco-friendly TPE yoga mat with alignment lines. 6mm thick for joint protection. Includes carry strap.',
  //     shortDescription: 'Eco-friendly 6mm anti-slip yoga mat',
  //     sellingPrice: 899, purchasePrice: 580, price: 899, mrp: 1299, discount: 30,
  //     unit: 'পিস', stock: 35, lowStockThreshold: 8,
  //     image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
  //     images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
  //     category: 'Sports & Fitness', brand: 'FlexFit',
  //     tags: ['yoga', 'mat', 'fitness', 'eco'],
  //     liveStatus: 'live', isBestSeller: true,
  //     averageRating: 4.5, reviewCount: 16, soldCount: 52, views: 260,
  //     user: s2, createdAt: d(16), updatedAt: now
  //   },
  //   {
  //     name: 'Stainless Steel Water Bottle 1L',
  //     description: 'Double-wall vacuum insulated bottle. Cold 24hr, hot 12hr. BPA-free, leak-proof lid.',
  //     shortDescription: 'Vacuum insulated, cold 24hr / hot 12hr',
  //     sellingPrice: 599, purchasePrice: 380, price: 599, mrp: 899, discount: 33,
  //     unit: 'পিস', stock: 60, lowStockThreshold: 12,
  //     image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
  //     images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
  //     category: 'Sports & Fitness', brand: 'HydroLife',
  //     tags: ['bottle', 'insulated', 'water', 'BPA-free'],
  //     liveStatus: 'live', isBestSeller: true,
  //     averageRating: 4.6, reviewCount: 24, soldCount: 112, views: 520,
  //     user: s2, createdAt: d(30), updatedAt: now
  //   },
  //   // ── Beauty & Health
  //   {
  //     name: 'Vitamin C Brightening Serum 30ml',
  //     description: '20% Vitamin C with Hyaluronic Acid and Niacinamide. Fades dark spots, boosts collagen. For all skin types.',
  //     shortDescription: '20% Vitamin C + Hyaluronic Acid serum',
  //     sellingPrice: 749, purchasePrice: 480, price: 749, mrp: 1099, discount: 31,
  //     unit: 'মিলিলিটার', stock: 50, lowStockThreshold: 10,
  //     image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
  //     images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
  //     category: 'Beauty & Health', brand: 'GlowUp',
  //     tags: ['serum', 'vitamin-c', 'skincare', 'brightening'],
  //     liveStatus: 'live', isFeatured: true, isNewArrival: true,
  //     averageRating: 4.4, reviewCount: 13, soldCount: 41, views: 310,
  //     user: s1, createdAt: d(7), updatedAt: now
  //   },
  //   // ── Food & Beverage
  //   {
  //     name: 'Organic Green Tea Premium 100g',
  //     description: 'Single-origin organic green tea from Sylhet gardens. Hand-picked, rich in antioxidants. 50 cups per pack.',
  //     shortDescription: 'Single-origin organic green tea, 50 cups',
  //     sellingPrice: 349, purchasePrice: 200, price: 349, mrp: 499, discount: 30,
  //     unit: 'প্যাকেট', stock: 120, lowStockThreshold: 25,
  //     image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500',
  //     images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500'],
  //     category: 'Food & Beverage', brand: 'SylhetGold',
  //     tags: ['tea', 'green-tea', 'organic', 'antioxidants'],
  //     liveStatus: 'live', isBestSeller: true,
  //     averageRating: 4.7, reviewCount: 31, soldCount: 148, views: 620,
  //     user: s2, createdAt: d(35), updatedAt: now
  //   },
  //   {
  //     name: 'Protein Powder Chocolate 1kg',
  //     description: 'Whey protein isolate, 25g protein per serving. Low fat, low sugar. Contains BCAAs and digestive enzymes.',
  //     shortDescription: '25g protein per serving, chocolate flavor',
  //     sellingPrice: 2799, purchasePrice: 1900, price: 2799, mrp: 3999, discount: 30,
  //     unit: 'কেজি', stock: 28, lowStockThreshold: 5,
  //     image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500',
  //     images: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500'],
  //     category: 'Sports & Fitness', brand: 'MuscleMax',
  //     tags: ['protein', 'whey', 'gym', 'supplement'],
  //     liveStatus: 'live', isNewArrival: true,
  //     averageRating: 4.3, reviewCount: 9, soldCount: 33, views: 180,
  //     user: s1, createdAt: d(2), updatedAt: now
  //   }
  // ];

  // for (const p of productList) {
  //   await products.insertOne(p);
  //   ok(`${p.category.padEnd(20)} → ${p.name.substring(0, 38)}`);
  // }

  // ── STEP 6: SEED TRANSACTIONS ────────────────────────────
  step(6, 'Seeding demo transactions...');
  const adminId = createdUsers['admin@devaroti.com']._id;

  const txnList = [
    { type: 'Cash In', amount: 15000, description: 'Monthly platform revenue', category: 'sales', paymentMethod: 'Bank', status: 'completed', date: d(28) },
    { type: 'Cash In', amount: 8500, description: 'Product sales income', category: 'sales', paymentMethod: 'bKash', status: 'completed', date: d(21) },
    { type: 'Cash Out', amount: 3000, description: 'Server hosting cost', category: 'expenses', paymentMethod: 'Bank', status: 'completed', date: d(20) },
    { type: 'Cash In', amount: 12000, description: 'E-commerce sales week 2', category: 'sales', paymentMethod: 'Nagad', status: 'completed', date: d(14) },
    { type: 'Cash Out', amount: 1500, description: 'Office supplies', category: 'expenses', paymentMethod: 'Cash', status: 'completed', date: d(12) },
    { type: 'Cash In', amount: 9800, description: 'Weekend sale revenue', category: 'sales', paymentMethod: 'bKash', status: 'completed', date: d(7) },
    { type: 'Cash Out', amount: 2500, description: 'Marketing expenses', category: 'expenses', paymentMethod: 'Bank', status: 'completed', date: d(5) },
    { type: 'Cash In', amount: 6700, description: 'Daily sales', category: 'sales', paymentMethod: 'Card', status: 'completed', date: d(2) },
  ];

  for (let i = 0; i < txnList.length; i++) {
    const t = txnList[i];
    const yy = t.date.getFullYear().toString().slice(-2);
    const mm = String(t.date.getMonth() + 1).padStart(2, '0');
    const dd = String(t.date.getDate()).padStart(2, '0');
    await transactions.insertOne({
      ...t,
      transactionNumber: `TXN-${yy}${mm}${dd}-${String(i + 1).padStart(4, '0')}`,
      user: adminId,
      createdAt: t.date, updatedAt: t.date
    });
  }
  ok(`${txnList.length} transactions`);

  // ── STEP 7: VERIFY ───────────────────────────────────────
  step(7, 'Verification...');
  for (const col of ['users', 'products', 'transactions', 'orders', 'sales', 'purchases', 'reviews']) {
    const count = await db.collection(col).countDocuments();
    ok(`${col.padEnd(14)}: ${count} documents`);
  }

  // ── DONE ─────────────────────────────────────────────────
  log('\n' + '═'.repeat(55));
  log('  ✅  SETUP COMPLETE!');
  log('═'.repeat(55));
  log('');
  log('  Login Credentials:');
  log('  ┌──────────┬───────────────────────────┬─────────────────┐');
  log('  │ Role     │ Email                     │ Password        │');
  log('  ├──────────┼───────────────────────────┼─────────────────┤');
  log('  │ Admin    │ admin@devaroti.com         │ Admin@123456    │');
  log('  │ Seller 1 │ seller@devaroti.com        │ Seller@123456   │');
  log('  │ Seller 2 │ seller2@devaroti.com       │ Seller@123456   │');
  log('  │ Courier  │ courier@devaroti.com       │ Courier@123456  │');
  log('  │ User 1   │ user@devaroti.com          │ User@123456     │');
  log('  │ User 2   │ user2@devaroti.com         │ User@123456     │');
  log('  └──────────┴───────────────────────────┴─────────────────┘');
  log('');
  log('  Run order:');
  log('  1. node src/utils/mongodb-setup.js   ← fresh DB');
  log('  2. npm run dev                        ← start server');
  log('  3. Open http://localhost:5173         ← frontend');
  log('');
  log('═'.repeat(55) + '\n');
};

setup()
  .catch(e => { console.error('\n❌ Setup failed:', e.message, '\n', e.stack); })
  .finally(async () => { await mongoose.connection.close(); process.exit(0); });