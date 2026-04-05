/**
 * test-db.js
 * Tests MongoDB Atlas connection
 * Run: npm test  OR  node config/test-db.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env from project root
dotenv.config();

const testConnection = async () => {
  console.log('\n🔍 Testing MongoDB Atlas Connection...\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env file');
    process.exit(1);
  }

  // Mask password in log
  const maskedURI = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
  console.log('📡 URI:', maskedURI);

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ Connected to:', mongoose.connection.host);
    console.log('📊 Database:', mongoose.connection.name);

    // Test write
    const db = mongoose.connection.db;
    const col = db.collection('__connection_test__');

    const writeResult = await col.insertOne({ test: true, ts: new Date() });
    console.log('✅ Write OK — ID:', writeResult.insertedId);

    // Test read
    const doc = await col.findOne({ _id: writeResult.insertedId });
    console.log('✅ Read OK —', doc ? 'Document found' : 'Not found');

    // Cleanup
    await col.deleteOne({ _id: writeResult.insertedId });
    console.log('✅ Delete OK');

    // List collections
    const collections = await db.listCollections().toArray();
    if (collections.length) {
      console.log('\n📋 Existing collections:');
      collections.forEach(c => console.log('   -', c.name));
    } else {
      console.log('\n📋 No collections yet (fresh database)');
    }

    console.log('\n🎉 All tests passed! MongoDB Atlas is working.\n');

  } catch (err) {
    console.error('\n❌ Connection FAILED:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check MONGODB_URI in .env');
    console.error('   2. Whitelist your IP in Atlas → Network Access');
    console.error('   3. Check username/password in connection string');
    console.error('   4. Make sure cluster is running\n');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testConnection();