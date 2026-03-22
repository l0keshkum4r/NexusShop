const { getSession } = require('../config/neo4j');
const { getCache, setCache, getTrending } = require('../config/redis');
const { Product } = require('../models/Product');
const { Interaction } = require('../models/Interaction');
const { User } = require('../models/User');
const fetch = require('node-fetch');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;

// Scoring weights — must sum to 1.0
const WEIGHTS = {
  graph:         0.30,
  ml:            0.25,
  content:       0.20,
  popularity:    0.15,
  collaborative: 0.10,
};

/**
 * MAIN: Get hybrid recommendations for a user
 */
const getRecommendations = async (userId, limit = 12) => {
  const cacheKey = `rec:${userId}`;

  // 1. Check Redis cache
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`Cache HIT for user ${userId}`);
    return cached;
  }

  console.log(`Cache MISS for user ${userId}, computing...`);

  // 2. Get user data
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  // 3. Get user's interaction history
  const interactions = await Interaction.find({ userId })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  const interactedProductIds = [...new Set(interactions.map((i) => i.productId.toString()))];
  const viewedIds = interactions
    .filter((i) => i.action === 'view')
    .map((i) => i.productId.toString());
  const purchasedIds = interactions
    .filter((i) => i.action === 'purchase')
    .map((i) => i.productId.toString());

  if (interactedProductIds.length === 0) {
    // Cold start: return trending + featured products
    return getColdStartRecommendations(limit);
  }

  // 4. Run all recommendation sources in parallel
  const [graphRecs, contentRecs, collaborativeRecs, mlRecs, trendingRecs] =
    await Promise.allSettled([
      getGraphRecommendations(userId, interactedProductIds, 20),
      getContentRecommendations(interactedProductIds, purchasedIds, 20),
      getCollaborativeRecommendations(userId, interactedProductIds, 20),
      getMLRecommendations(viewedIds.slice(0, 5), interactedProductIds, 20),
      getTrendingRecommendations(interactedProductIds, 20),
    ]);

  // Extract values (use empty array on failure)
  const extract = (result) => (result.status === 'fulfilled' ? result.value : []);

  // 5. Merge and score all candidates
  const allCandidates = mergeAndScore(
    extract(graphRecs),
    extract(mlRecs),
    extract(contentRecs),
    extract(trendingRecs),
    extract(collaborativeRecs),
    interactedProductIds
  );

  // 6. Fetch product details for top candidates
  const topCandidates = allCandidates.slice(0, limit);
  const productIds = topCandidates.map((c) => c.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .select('-featureVector -reviews')
    .lean();

  // Map products by ID
  const productMap = {};
  products.forEach((p) => {
    productMap[p._id.toString()] = p;
  });

  // 7. Build final recommendation list
  const recommendations = topCandidates
    .filter((c) => productMap[c.productId])
    .map((c) => ({
      product: productMap[c.productId],
      score: +c.score.toFixed(4),
      explanation: c.explanation,
      sources: c.sources,
    }));

  // 8. Cache the result
  await setCache(cacheKey, recommendations, CACHE_TTL);

  return recommendations;
};

/**
 * A. Graph-Based Recommendations (Neo4j)
 * "Users similar to you also viewed/purchased these"
 */
const getGraphRecommendations = async (userId, interactedIds, limit) => {
  const session = getSession();
  if (!session) return [];

  try {
    // Find users who interacted with same products, then get their other interactions
    const result = await session.run(
      `
      MATCH (u:User {userId: $userId})-[:VIEWED|PURCHASED]->(p:Product)<-[:VIEWED|PURCHASED]-(similar:User)
      WHERE similar.userId <> $userId
      MATCH (similar)-[:VIEWED|PURCHASED]->(rec:Product)
      WHERE NOT rec.productId IN $interactedIds
      WITH rec.productId AS productId, COUNT(*) AS score, 'graph' AS source
      RETURN productId, score
      ORDER BY score DESC
      LIMIT $limit
      `,
      {
        userId: userId.toString(),
        interactedIds,
        limit: neo4j_int(limit),
      }
    );

    return result.records.map((r) => ({
      productId: r.get('productId'),
      score: r.get('score').toNumber ? r.get('score').toNumber() : r.get('score'),
      source: 'graph',
      explanation: 'Users similar to you viewed this',
    }));
  } catch (error) {
    console.warn('Graph recommendations error:', error.message);
    return [];
  } finally {
    await session.close();
  }
};

/**
 * B. Content-Based Recommendations (MongoDB)
 * "Similar to items you've viewed"
 */
const getContentRecommendations = async (interactedIds, purchasedIds, limit) => {
  if (interactedIds.length === 0) return [];

  // Get features of recently interacted products
  const recentProducts = await Product.find({
    _id: { $in: interactedIds.slice(0, 10) },
  })
    .select('category tags')
    .lean();

  if (recentProducts.length === 0) return [];

  // Aggregate categories and tags
  const categories = [...new Set(recentProducts.map((p) => p.category))];
  const tags = [...new Set(recentProducts.flatMap((p) => p.tags || []))];

  // Find similar products (not already interacted)
  const products = await Product.find({
    _id: { $nin: interactedIds },
    isActive: true,
    $or: [
      { category: { $in: categories } },
      { tags: { $in: tags } },
    ],
  })
    .sort({ 'stats.views': -1 })
    .limit(limit)
    .select('_id category tags stats')
    .lean();

  return products.map((p) => {
    // Calculate overlap score
    const catMatch = categories.includes(p.category) ? 2 : 0;
    const tagMatch = (p.tags || []).filter((t) => tags.includes(t)).length;
    const rawScore = catMatch + tagMatch;

    return {
      productId: p._id.toString(),
      score: rawScore,
      source: 'content',
      explanation: catMatch > 0 ? 'Popular in your category' : 'Similar to items you viewed',
    };
  });
};

/**
 * C. Collaborative Filtering (MongoDB)
 * "Users with similar purchase history also bought..."
 */
const getCollaborativeRecommendations = async (userId, interactedIds, limit) => {
  if (interactedIds.length === 0) return [];

  const mongoose = require('mongoose');
  const toObjId = (id) => new mongoose.Types.ObjectId(id.toString());

  // Find users who interacted with the same products
  const similarUsers = await Interaction.aggregate([
    {
      $match: {
        productId: { $in: interactedIds.map(toObjId) },
        userId: { $ne: toObjId(userId) },
      },
    },
    { $group: { _id: '$userId', overlap: { $sum: 1 } } },
    { $sort: { overlap: -1 } },
    { $limit: 20 },
  ]);

  if (similarUsers.length === 0) return [];

  const similarUserIds = similarUsers.map((u) => u._id);

  // Get products those users interacted with
  const recommendations = await Interaction.aggregate([
    {
      $match: {
        userId: { $in: similarUserIds },
        productId: { $nin: interactedIds.map(toObjId) },
        action: { $in: ['purchase', 'cart'] },
      },
    },
    { $group: { _id: '$productId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  return recommendations.map((r) => ({
    productId: r._id.toString(),
    score: r.count,
    source: 'collaborative',
    explanation: 'Frequently bought by users like you',
  }));
};

/**
 * D. ML-Based Recommendations (Python microservice)
 * "Cosine similarity on product features"
 */
const getMLRecommendations = async (seedProductIds, excludeIds, limit) => {
  if (seedProductIds.length === 0) return [];

  try {
    const response = await fetch(`${ML_SERVICE_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_ids: seedProductIds,
        exclude_ids: excludeIds,
        top_n: limit,
      }),
      timeout: 3000, // 3s timeout
    });

    if (!response.ok) throw new Error(`ML service returned ${response.status}`);

    const data = await response.json();
    return (data.recommendations || []).map((r) => ({
      productId: r.product_id,
      score: r.similarity_score,
      source: 'ml',
      explanation: 'Highly similar to items you viewed',
    }));
  } catch (error) {
    console.warn('ML service error (degraded mode):', error.message);
    return [];
  }
};

/**
 * E. Trending Recommendations (Redis)
 * "Popular right now"
 */
const getTrendingRecommendations = async (excludeIds, limit) => {
  const trending = await getTrending(limit + excludeIds.length);
  return trending
    .filter((t) => !excludeIds.includes(t.productId))
    .slice(0, limit)
    .map((t) => ({
      productId: t.productId,
      score: t.score,
      source: 'trending',
      explanation: 'Trending right now',
    }));
};

/**
 * Cold start: new users with no history
 */
const getColdStartRecommendations = async (limit) => {
  const [featured, trending] = await Promise.all([
    Product.find({ isActive: true, isFeatured: true })
      .sort({ 'stats.views': -1 })
      .limit(limit / 2)
      .select('-featureVector -reviews')
      .lean(),
    Product.find({ isActive: true })
      .sort({ 'stats.views': -1 })
      .limit(limit / 2)
      .select('-featureVector -reviews')
      .lean(),
  ]);

  const combined = [...featured, ...trending];
  const seen = new Set();
  const unique = combined.filter((p) => {
    const id = p._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return unique.slice(0, limit).map((p) => ({
    product: p,
    score: 0.5,
    explanation: 'Popular product',
    sources: ['trending'],
  }));
};

/**
 * Merge all candidate sources and apply weighted scoring
 */
const mergeAndScore = (graphRecs, mlRecs, contentRecs, trendingRecs, collaborativeRecs, excludeIds) => {
  // Normalize scores within each source to [0, 1]
  const normalize = (recs) => {
    if (recs.length === 0) return recs;
    const maxScore = Math.max(...recs.map((r) => r.score), 1);
    return recs.map((r) => ({ ...r, normalizedScore: r.score / maxScore }));
  };

  const sources = {
    graph: normalize(graphRecs),
    ml: normalize(mlRecs),
    content: normalize(contentRecs),
    popularity: normalize(trendingRecs),
    collaborative: normalize(collaborativeRecs),
  };

  // Collect all unique candidates
  const candidates = {};

  for (const [sourceName, recs] of Object.entries(sources)) {
    const weight = WEIGHTS[sourceName] || WEIGHTS.content;
    for (const rec of recs) {
      if (excludeIds.includes(rec.productId)) continue;
      if (!candidates[rec.productId]) {
        candidates[rec.productId] = {
          productId: rec.productId,
          score: 0,
          explanation: rec.explanation,
          sources: [],
        };
      }
      candidates[rec.productId].score += weight * (rec.normalizedScore || 0);
      candidates[rec.productId].sources.push(sourceName);
    }
  }

  // Sort by score descending
  return Object.values(candidates).sort((a, b) => b.score - a.score);
};

/**
 * Get trending products (for the /trending endpoint)
 */
const getTrendingProducts = async (limit = 12) => {
  const cacheKey = 'trending:products:details';
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const trending = await getTrending(limit * 2);

  if (trending.length > 0) {
    const productIds = trending.map((t) => t.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select('-featureVector -reviews')
      .lean();

    const productMap = {};
    products.forEach((p) => { productMap[p._id.toString()] = p; });

    const result = trending
      .filter((t) => productMap[t.productId])
      .slice(0, limit)
      .map((t) => ({
        product: productMap[t.productId],
        trendingScore: t.score,
        explanation: 'Trending right now',
      }));

    await setCache(cacheKey, result, 300); // 5 min TTL
    return result;
  }

  // Fallback: most viewed from MongoDB
  const products = await Product.find({ isActive: true })
    .sort({ 'stats.views': -1 })
    .limit(limit)
    .select('-featureVector -reviews')
    .lean();

  return products.map((p) => ({
    product: p,
    trendingScore: p.stats.views,
    explanation: 'Most viewed product',
  }));
};

// Helper for Neo4j integer type
const neo4j_int = (n) => {
  try {
    const neo4j = require('neo4j-driver');
    return neo4j.int(n);
  } catch {
    return n;
  }
};

module.exports = {
  getRecommendations,
  getTrendingProducts,
  getColdStartRecommendations,
};
