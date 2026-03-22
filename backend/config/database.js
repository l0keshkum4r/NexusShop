const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Create indexes after connection
    await createIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const { Product } = require('../models/Product');
    const { Interaction } = require('../models/Interaction');

    // Product indexes for search and filtering
    await Product.collection.createIndex({ name: 'text', description: 'text', tags: 'text' });
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ price: 1 });
    await Product.collection.createIndex({ 'stats.views': -1 });
    await Product.collection.createIndex({ createdAt: -1 });

    // Interaction indexes
    await Interaction.collection.createIndex({ userId: 1, productId: 1 });
    await Interaction.collection.createIndex({ userId: 1, action: 1 });
    await Interaction.collection.createIndex({ timestamp: -1 });
    await Interaction.collection.createIndex({ productId: 1, action: 1 });

    console.log('✅ MongoDB indexes created');
  } catch (error) {
    console.warn('⚠️  Index creation warning:', error.message);
  }
};

module.exports = { connectMongoDB };
