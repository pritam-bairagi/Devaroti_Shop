const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const Product = require('./src/models/Product.js');
    const User = require('./src/models/User.js');
    console.log('Connected to MongoDB.');
    
    // Delete explicit static products (often added without user or with specific seed data)
    const staticProducts = await Product.find({ user: { $exists: false } });
    console.log('Orphaned products found:', staticProducts.length);
    if(staticProducts.length > 0) {
        await Product.deleteMany({ user: { $exists: false } });
        console.log('Deleted orphaned products');
    }
    
    // Find valid users
    const validUsers = await User.find({}, '_id');
    const validUserIds = validUsers.map(u => u._id);
    console.log('Valid users in DB:', validUserIds.length);
    
    // Delete any products whose user is not in the validUsers array
    // This removes dummy products that belonged to a deleted seeder user
    const invalidProducts = await Product.find({ user: { $nin: validUserIds } });
    console.log('Products with invalid users:', invalidProducts.length);
    if (invalidProducts.length > 0) {
      await Product.deleteMany({ user: { $nin: validUserIds } });
      console.log('Deleted products with invalid users.');
    }
    
    // Some products are just sample data (e.g. from a dummy DB dump)
    // We can also delete all products entirely if the user requested "delete all static products"
    // and they only want new dynamic ones. Based on "static sob product delete kore deo",
    // let's delete any products that were created before a certain timestamp or from known seed data.
    // For now, removing invalid user products should clean up most of it.
    
    const remainingProducts = await Product.countDocuments();
    console.log('Total remaining products:', remainingProducts);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
