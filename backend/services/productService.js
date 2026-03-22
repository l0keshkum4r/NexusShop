const { Product } = require('../models/Product');

const CATEGORIES = [
  'Electronics', 'Clothing', 'Books', 'Home & Kitchen',
  'Sports', 'Beauty', 'Toys', 'Automotive', 'Food', 'Other',
];

/**
 * Get paginated products with search and filters
 */
const getProducts = async ({ page = 1, limit = 12, search, category, minPrice, maxPrice, sort = '-createdAt' }) => {
  const query = { isActive: true };

  if (search) {
    query.$text = { $search: search };
  }
  if (category && CATEGORIES.includes(category)) {
    query.category = category;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-featureVector -reviews'),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single product with full details
 */
const getProductById = async (id) => {
  const product = await Product.findById(id).select('-featureVector');
  if (!product || !product.isActive) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

/**
 * Create new product (admin)
 */
const createProduct = async (data) => {
  const product = await Product.create(data);
  return product;
};

/**
 * Update product (admin)
 */
const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

/**
 * Delete product (admin) - soft delete
 */
const deleteProduct = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

/**
 * Increment product stat (views, purchases, etc.)
 */
const incrementStat = async (productId, field) => {
  await Product.findByIdAndUpdate(productId, {
    $inc: { [`stats.${field}`]: 1 },
  });
};

/**
 * Get products by IDs (for recommendations)
 */
const getProductsByIds = async (ids) => {
  return Product.find({
    _id: { $in: ids },
    isActive: true,
  }).select('-featureVector -reviews');
};

/**
 * Get products by category and tags (content filtering)
 */
const getProductsByFeatures = async (category, tags, excludeIds = [], limit = 10) => {
  return Product.find({
    _id: { $nin: excludeIds },
    isActive: true,
    $or: [
      { category },
      { tags: { $in: tags } },
    ],
  })
    .sort({ 'stats.views': -1 })
    .limit(limit)
    .select('-featureVector -reviews');
};

/**
 * Add review to product
 */
const addReview = async (productId, userId, userName, rating, comment) => {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // Remove existing review from this user
  product.reviews = product.reviews.filter(
    (r) => r.userId.toString() !== userId.toString()
  );

  product.reviews.push({ userId, userName, rating, comment });
  product.updateRating();
  await product.save();

  return product;
};

/**
 * Admin stats
 */
const getAdminStats = async () => {
  const [
    totalProducts,
    totalByCategory,
    mostViewed,
    lowStock,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
    ]),
    Product.find({ isActive: true })
      .sort({ 'stats.views': -1 })
      .limit(10)
      .select('name stats.views stats.purchases category thumbnail'),
    Product.find({ isActive: true, stock: { $lt: 10 } })
      .limit(10)
      .select('name stock category'),
  ]);

  return { totalProducts, totalByCategory, mostViewed, lowStock };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  incrementStat,
  getProductsByIds,
  getProductsByFeatures,
  addReview,
  getAdminStats,
};
