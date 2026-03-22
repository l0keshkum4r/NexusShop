const Redis = require('ioredis');

let redis = null;

const connectRedis = () => {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) return true;
        return false;
      },
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.error('❌ Redis error:', err.message));
    redis.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

    return redis;
  } catch (error) {
    console.error('❌ Redis initialization error:', error.message);
    return null;
  }
};

const getRedis = () => redis;

// Helper: Get cached value (parsed JSON)
const getCache = async (key) => {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    console.warn('Redis get error:', e.message);
    return null;
  }
};

// Helper: Set cache with TTL
const setCache = async (key, value, ttl = process.env.CACHE_TTL || 3600) => {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (e) {
    console.warn('Redis set error:', e.message);
  }
};

// Helper: Delete cache key
const delCache = async (key) => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (e) {
    console.warn('Redis del error:', e.message);
  }
};

// Helper: Increment trending score for a product
const incrementTrending = async (productId, points = 1) => {
  if (!redis) return;
  try {
    const key = 'trending:products';
    await redis.zincrby(key, points, productId);
    // Expire the trending set after TTL
    await redis.expire(key, process.env.TRENDING_TTL || 300);
  } catch (e) {
    console.warn('Redis trending error:', e.message);
  }
};

// Helper: Get top trending products
const getTrending = async (limit = 10) => {
  if (!redis) return [];
  try {
    // Get top N products with scores (descending)
    const results = await redis.zrevrangebyscore(
      'trending:products',
      '+inf',
      '-inf',
      'WITHSCORES',
      'LIMIT',
      0,
      limit
    );

    // Parse pairs [id, score, id, score, ...]
    const trending = [];
    for (let i = 0; i < results.length; i += 2) {
      trending.push({
        productId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }
    return trending;
  } catch (e) {
    console.warn('Redis getTrending error:', e.message);
    return [];
  }
};

module.exports = {
  connectRedis,
  getRedis,
  getCache,
  setCache,
  delCache,
  incrementTrending,
  getTrending,
};
