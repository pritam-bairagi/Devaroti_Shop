/**
 * resetDb-runner.js
 * Deletes ALL data and re-seeds the 4 specified demo accounts only
 * Run: node src/utils/resetDb-runner.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  console.error('Cannot reset database in PRODUCTION mode!');
  process.exit(1);
}

console.log('DATABASE RESET STARTING...');
console.log('URI:', process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected\n');

    const User = require('../models/User');
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Sale = require('../models/Sale');
    const Purchase = require('../models/Purchase');
    const Transaction = require('../models/Transaction');
    const Review = require('../models/Review');

    // Clear ALL collections
    const pairs = [
      [User, 'Users'], [Product, 'Products'], [Order, 'Orders'],
      [Sale, 'Sales'], [Purchase, 'Purchases'], [Transaction, 'Transactions'], [Review, 'Reviews']
    ];
    for (const [Model, name] of pairs) {
      await Model.deleteMany({});
      console.log('Cleared: ' + name);
    }

    // Seed ONLY the 4 specified accounts
    console.log('\nSeeding accounts...');
    const accounts = [
      {
        name: 'System Administrator',
        email: 'admin@devaroti.com',
        password: 'Admin@123456',
        phoneNumber: '01700000000',
        role: 'admin',
        isVerified: true,
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Rahim Electronics',
        email: 'seller@devaroti.com',
        password: 'Seller@123456',
        phoneNumber: '01711111111',
        role: 'seller',
        shopName: 'Rahim Electronics',
        isVerified: true,
        isEmailVerified: true,
        isSellerApproved: true,
        isActive: true
      },
      {
        name: 'Courier Service',
        email: 'courier@devaroti.com',
        password: 'Courier@123456',
        phoneNumber: '01733333333',
        role: 'courier',
        isVerified: true,
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Sadia Customer',
        email: 'user@devaroti.com',
        password: 'User@123456',
        phoneNumber: '01722222222',
        role: 'user',
        isVerified: true,
        isEmailVerified: true,
        isActive: true
      }
    ];

    for (const acc of accounts) {
      await User.create(acc);
      console.log('Created ' + acc.role + ': ' + acc.email + ' / ' + acc.password);
    }

    console.log('\nReset complete - only 4 demo accounts remain.');
    console.log('Admin:   admin@devaroti.com   / Admin@123456');
    console.log('Seller:  seller@devaroti.com  / Seller@123456');
    console.log('Courier: courier@devaroti.com / Courier@123456');
    console.log('User:    user@devaroti.com    / User@123456');
  })
  .catch(err => { console.error('Reset failed:', err.message); })
  .finally(async () => { await mongoose.connection.close(); process.exit(0); });