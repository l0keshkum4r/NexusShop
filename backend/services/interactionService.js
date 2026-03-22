const { Interaction } = require('../models/Interaction');
const { User } = require('../models/User');
const { incrementStat } = require('./productService');
const { getSession } = require('../config/neo4j');
const { incrementTrending } = require('../config/redis');

/**
 * Record a user interaction with a product
 */
const recordInteraction = async (userId, productId, action, metadata = {}) => {
  // Save to MongoDB
  const interaction = await Interaction.create({
    userId,
    productId,
    action,
    metadata,
  });

  // Run async updates (don't block response)
  Promise.all([
    updateProductStats(productId, action),
    updateNeo4jGraph(userId, productId, action),
    updateRedisCounters(productId, action),
    updateUserViewHistory(userId, productId, action),
  ]).catch((err) => console.error('Async interaction update error:', err));

  return interaction;
};

/**
 * Update product statistics in MongoDB
 */
const updateProductStats = async (productId, action) => {
  const statMap = {
    view: 'views',
    purchase: 'purchases',
    cart: 'cartAdds',
    wishlist: 'wishlistAdds',
  };
  if (statMap[action]) {
    await incrementStat(productId, statMap[action]);
  }
};

/**
 * Update Neo4j graph with user-product relationship
 */
const updateNeo4jGraph = async (userId, productId, action) => {
  const session = getSession();
  if (!session) return;

  try {
    // Map action to Neo4j relationship type
    const relTypes = {
      view: 'VIEWED',
      purchase: 'PURCHASED',
      cart: 'ADDED_TO_CART',
      wishlist: 'WISHLISTED',
    };

    const relType = relTypes[action];
    if (!relType) return;

    // Merge nodes and relationship (upsert pattern)
    await session.run(
      `
      MERGE (u:User {userId: $userId})
      MERGE (p:Product {productId: $productId})
      MERGE (u)-[r:${relType}]->(p)
      ON CREATE SET r.count = 1, r.firstAt = datetime()
      ON MATCH SET r.count = r.count + 1, r.lastAt = datetime()
      `,
      { userId: userId.toString(), productId: productId.toString() }
    );

    // If purchased, create SIMILAR relationships with other purchased products
    if (action === 'purchase') {
      await session.run(
        `
        MATCH (u:User {userId: $userId})-[:PURCHASED]->(p1:Product)
        MATCH (u)-[:PURCHASED]->(p2:Product)
        WHERE p1.productId <> p2.productId
        MERGE (p1)-[s:SIMILAR]->(p2)
        ON CREATE SET s.weight = 1
        ON MATCH SET s.weight = s.weight + 1
        `,
        { userId: userId.toString() }
      );
    }
  } catch (error) {
    console.warn('Neo4j update warning:', error.message);
  } finally {
    await session.close();
  }
};

/**
 * Update Redis trending counters
 */
const updateRedisCounters = async (productId, action) => {
  // Different actions have different trending weights
  const trendingPoints = {
    view: 1,
    cart: 3,
    purchase: 5,
    wishlist: 2,
  };
  const points = trendingPoints[action] || 1;
  await incrementTrending(productId.toString(), points);
};

/**
 * Update user's viewed products history
 */
const updateUserViewHistory = async (userId, productId, action) => {
  if (action === 'view') {
    await User.findByIdAndUpdate(userId, {
      $push: {
        viewedProducts: {
          $each: [{ productId, viewedAt: new Date() }],
          $position: 0,
          $slice: 20, // Keep last 20
        },
      },
    });
  }
};

/**
 * Get user interaction history from MongoDB
 */
const getUserInteractions = async (userId, limit = 50) => {
  return Interaction.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('productId', 'name category tags thumbnail price');
};

/**
 * Get admin interaction stats (activity over time)
 */
const getInteractionStats = async (days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [activityOverTime, actionBreakdown, topProducts] = await Promise.all([
    Interaction.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
    Interaction.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]),
    Interaction.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          category: '$product.category',
          thumbnail: '$product.thumbnail',
          count: 1,
        },
      },
    ]),
  ]);

  return { activityOverTime, actionBreakdown, topProducts };
};

module.exports = {
  recordInteraction,
  getUserInteractions,
  getInteractionStats,
};
