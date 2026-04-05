const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Product = require('./src/models/Product');
    const User = require('./src/models/User');

    try {
        const seller = await User.findOne({ email: 'seller@devaroti.com' });
        const product = new Product({
            name: 'Test',
            description: 'Test',
            sellingPrice: 100,
            purchasePrice: 50,
            price: 100,
            unit: 'পিস',
            category: 'General',
            stock: 10,
            image: 'http://test',
            user: seller._id,
        });
        await product.save();
        console.log("Success!", product.name);
    } catch(e) {
        console.error("Error creating product:", e.message);
    }
    process.exit(0);
});
