/**
 * productSeeder-runner.js
 * Standalone script — run: node src/utils/productSeeder-runner.js
 * Seeds sample products using the approved seller account
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');

    const User = require('../models/User');
    const Product = require('../models/Product');

    // Find or create seller
    let seller = await User.findOne({ role: 'seller', isSellerApproved: true });
    if (!seller) {
      // Try finding any seller
      seller = await User.findOne({ role: 'seller' });
    }
    if (!seller) {
      // Fallback: use admin
      seller = await User.findOne({ role: 'admin' });
    }
    if (!seller) {
      console.error('❌ No seller/admin found. Run `npm run seed` first!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`📦 Seeding products for: ${seller.name} (${seller.email})`);

    // const products = [
    //   {
    //     name: "Cartoon Astronaut T-Shirt",
    //     description: "Pure cotton comfortable summer t-shirt with astronaut print. Perfect for casual wear. Soft fabric, great for everyday use.",
    //     shortDescription: "Cotton astronaut print t-shirt",
    //     sellingPrice: 499, purchasePrice: 350, price: 499, mrp: 799,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    //     category: "Clothing", subcategory: "T-Shirts", brand: "Fashionista",
    //     stock: 50, lowStockThreshold: 5,
    //     tags: ["cotton", "summer", "casual", "t-shirt"],
    //     isFeatured: true, isNewArrival: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Wireless Bluetooth Headphones",
    //     description: "Premium wireless headphones with active noise cancellation and 30-hour battery life. Crystal clear sound quality.",
    //     shortDescription: "Wireless noise-cancelling headphones",
    //     sellingPrice: 2499, purchasePrice: 1800, price: 2499, mrp: 3499,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    //     category: "Electronics", subcategory: "Headphones", brand: "SoundMaster",
    //     stock: 15, lowStockThreshold: 3,
    //     tags: ["headphones", "wireless", "bluetooth", "audio"],
    //     isFeatured: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Smart Watch Fitness Tracker",
    //     description: "Track your fitness goals, heart rate, sleep quality, and notifications with this advanced smart watch. Water resistant.",
    //     shortDescription: "Advanced fitness smart watch",
    //     sellingPrice: 3499, purchasePrice: 2500, price: 3499, mrp: 4999,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    //     category: "Electronics", subcategory: "Watches", brand: "FitTech",
    //     stock: 20, lowStockThreshold: 3,
    //     tags: ["smartwatch", "fitness", "health", "wearable"],
    //     isFeatured: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Premium Backpack 30L",
    //     description: "Durable waterproof backpack with laptop compartment. Perfect for travel, hiking, and daily commute.",
    //     shortDescription: "Waterproof travel backpack",
    //     sellingPrice: 1299, purchasePrice: 900, price: 1299, mrp: 1999,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    //     category: "Bags", subcategory: "Backpacks", brand: "TravelPro",
    //     stock: 25, lowStockThreshold: 5,
    //     tags: ["backpack", "travel", "waterproof", "laptop"],
    //     isFeatured: false, isNewArrival: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Organic Green Tea 100g",
    //     description: "Premium quality organic green tea sourced directly from tea gardens. Rich in antioxidants, boosts metabolism.",
    //     shortDescription: "Premium organic green tea",
    //     sellingPrice: 299, purchasePrice: 180, price: 299, mrp: 450,
    //     unit: "প্যাকেট", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    //     category: "Food & Beverage", subcategory: "Tea", brand: "GreenLeaf",
    //     stock: 100, lowStockThreshold: 20,
    //     tags: ["tea", "organic", "green", "health"],
    //     isFeatured: false, isBestSeller: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Running Shoes (Unisex)",
    //     description: "Lightweight breathable running shoes with cushioned sole. Perfect for jogging, gym and everyday wear.",
    //     shortDescription: "Lightweight running shoes",
    //     sellingPrice: 1999, purchasePrice: 1400, price: 1999, mrp: 2999,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    //     category: "Footwear", subcategory: "Sports", brand: "SpeedRun",
    //     stock: 30, lowStockThreshold: 5,
    //     tags: ["shoes", "running", "sports", "gym"],
    //     isFeatured: true, isBestSeller: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Ceramic Coffee Mug Set (4pcs)",
    //     description: "Beautiful handcrafted ceramic mugs set. Microwave and dishwasher safe. Great gift option.",
    //     shortDescription: "Handcrafted ceramic mug set",
    //     sellingPrice: 599, purchasePrice: 380, price: 599, mrp: 899,
    //     unit: "হালি", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
    //     category: "Home & Kitchen", subcategory: "Kitchenware", brand: "CeramicArt",
    //     stock: 40, lowStockThreshold: 8,
    //     tags: ["mug", "ceramic", "kitchen", "gift"],
    //     isFeatured: false, isNewArrival: true, liveStatus: "live"
    //   },
    //   {
    //     name: "LED Desk Lamp with USB",
    //     description: "Modern LED desk lamp with 5 brightness levels, USB charging port, and flexible neck. Eye-care technology.",
    //     shortDescription: "LED desk lamp with USB charger",
    //     sellingPrice: 899, purchasePrice: 600, price: 899, mrp: 1299,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    //     category: "Home & Kitchen", subcategory: "Lighting", brand: "BrightHome",
    //     stock: 35, lowStockThreshold: 5,
    //     tags: ["lamp", "LED", "desk", "office"],
    //     isFeatured: false, liveStatus: "live"
    //   },
    //   {
    //     name: "Yoga Mat Non-Slip 6mm",
    //     description: "Eco-friendly non-slip yoga mat with alignment lines. Extra thick 6mm for joint protection. Includes carry strap.",
    //     shortDescription: "Eco-friendly non-slip yoga mat",
    //     sellingPrice: 799, purchasePrice: 500, price: 799, mrp: 1199,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    //     category: "Sports & Fitness", subcategory: "Yoga", brand: "FlexFit",
    //     stock: 45, lowStockThreshold: 8,
    //     tags: ["yoga", "fitness", "mat", "exercise"],
    //     isFeatured: false, isBestSeller: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Vitamin C Serum 30ml",
    //     description: "Brightening vitamin C serum with hyaluronic acid and niacinamide. Reduces dark spots, boosts collagen.",
    //     shortDescription: "Brightening vitamin C serum",
    //     sellingPrice: 649, purchasePrice: 400, price: 649, mrp: 999,
    //     unit: "মিলিলিটার", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
    //     category: "Beauty & Health", subcategory: "Skincare", brand: "GlowUp",
    //     stock: 60, lowStockThreshold: 10,
    //     tags: ["serum", "vitamin-c", "skincare", "brightening"],
    //     isFeatured: true, isNewArrival: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Stainless Steel Water Bottle 1L",
    //     description: "Double-wall insulated stainless steel bottle. Keeps drinks cold 24hr, hot 12hr. BPA-free and leak-proof.",
    //     shortDescription: "Insulated stainless steel bottle",
    //     sellingPrice: 449, purchasePrice: 280, price: 449, mrp: 699,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
    //     category: "Sports & Fitness", subcategory: "Accessories", brand: "HydroLife",
    //     stock: 80, lowStockThreshold: 15,
    //     tags: ["bottle", "water", "insulated", "eco"],
    //     isBestSeller: true, liveStatus: "live"
    //   },
    //   {
    //     name: "Mechanical Keyboard TKL",
    //     description: "Tenkeyless mechanical keyboard with blue switches. RGB backlit, compact design, durable ABS keycaps.",
    //     shortDescription: "TKL RGB mechanical keyboard",
    //     sellingPrice: 3999, purchasePrice: 2800, price: 3999, mrp: 5499,
    //     unit: "পিস", image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400",
    //     category: "Electronics", subcategory: "Computer Accessories", brand: "TypeMaster",
    //     stock: 12, lowStockThreshold: 3,
    //     tags: ["keyboard", "mechanical", "gaming", "RGB"],
    //     isFeatured: true, liveStatus: "live"
    //   }
    // ];

    // let created = 0;
    // let skipped = 0;

    // for (const p of products) {
    //   const existing = await Product.findOne({ name: p.name });
    //   if (!existing) {
    //     await Product.create({ ...p, user: seller._id });
    //     created++;
    //     process.stdout.write(`✅ Created: ${p.name}\n`);
    //   } else {
    //     skipped++;
    //     process.stdout.write(`⏭️  Exists:  ${p.name}\n`);
    //   }
    // }

    console.log('\n🎉 Product seeding complete!');
    console.log(`   Created: ${created} | Skipped: ${skipped} | Total: ${products.length}`);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  })
  .finally(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });