const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from the backend directory
dotenv.config({ path: 'd:/Technology/MERN/E-commerce/backend/.env' });

// Use direct path to the model since we are running from backend cwd
const User = require('./src/models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { level: 'Plastic' },
      { $set: { level: 'Bronze' } }
    );

    console.log(`Updated ${result.modifiedCount} users from Plastic to Bronze`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
