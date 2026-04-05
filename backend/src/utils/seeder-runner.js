/**
 * seeder-runner.js
 * Standalone script — run: node src/utils/seeder-runner.js
 * Seeds admin, seller, and sample user accounts
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load .env from project root
dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');

    // Require models AFTER connection
    const User = require('../models/User');

    const accounts = [
      {
        label: 'Admin',
        data: {
          name: 'System Administrator',
          email: 'admin@devaroti.com',
          password: 'Admin@123456',
          phoneNumber: '01700000000',
          role: 'admin',
          isVerified: true,
          isEmailVerified: true,
          isActive: true
        }
      },
      {
        label: 'Seller',
        data: {
          name: 'Sample Seller',
          email: 'seller@devaroti.com',
          password: 'Seller@123456',
          phoneNumber: '01711111111',
          role: 'seller',
          shopName: 'Devaroti Store',
          shopDescription: 'Quality products at affordable prices',
          isVerified: true,
          isEmailVerified: true,
          isSellerApproved: true,
          isActive: true
        }
      },
      {
        label: 'User',
        data: {
          name: 'Sample Customer',
          email: 'user@devaroti.com',
          password: 'User@123456',
          phoneNumber: '01722222222',
          role: 'user',
          isVerified: true,
          isEmailVerified: true,
          isActive: true
        }
      }
    ];

    for (const account of accounts) {
      const existing = await User.findOne({ email: account.data.email });
      if (!existing) {
        await User.create(account.data);
        console.log(`✅ ${account.label} created: ${account.data.email} / ${account.data.password}`);
      } else {
        // Reset password
        existing.password = account.data.password;
        existing.isVerified = true;
        existing.isEmailVerified = true;
        existing.isActive = true;
        await existing.save();
        console.log(`🔄 ${account.label} already exists — password reset: ${account.data.email}`);
      }
    }

    console.log('\n🎉 Seeding complete!');
    console.log('─'.repeat(40));
    console.log('Admin:  admin@devaroti.com  / Admin@123456');
    console.log('Seller: seller@devaroti.com / Seller@123456');
    console.log('User:   user@devaroti.com   / User@123456');
    console.log('─'.repeat(40));
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
  })
  .finally(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });