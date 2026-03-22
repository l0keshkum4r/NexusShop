const neo4j = require('neo4j-driver');

let driver = null;

const connectNeo4j = async () => {
  try {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    );

    await driver.verifyConnectivity();
    console.log('✅ Neo4j connected');

    // Create constraints and indexes
    await createNeo4jSchema();
  } catch (error) {
    console.error('❌ Neo4j connection error:', error.message);
    // Don't exit — app can work without Neo4j (degraded mode)
  }
};

const createNeo4jSchema = async () => {
  const session = driver.session();
  try {
    // Constraints ensure uniqueness
    await session.run(`
      CREATE CONSTRAINT user_id IF NOT EXISTS
      FOR (u:User) REQUIRE u.userId IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT product_id IF NOT EXISTS
      FOR (p:Product) REQUIRE p.productId IS UNIQUE
    `);
    // Indexes for faster lookups
    await session.run(`
      CREATE INDEX product_category IF NOT EXISTS
      FOR (p:Product) ON (p.category)
    `);
    console.log('✅ Neo4j schema created');
  } catch (error) {
    console.warn('⚠️  Neo4j schema warning:', error.message);
  } finally {
    await session.close();
  }
};

const getDriver = () => {
  if (!driver) throw new Error('Neo4j driver not initialized');
  return driver;
};

const getSession = () => {
  if (!driver) return null;
  return driver.session();
};

const closeNeo4j = async () => {
  if (driver) {
    await driver.close();
    console.log('Neo4j connection closed');
  }
};

module.exports = { connectNeo4j, getDriver, getSession, closeNeo4j };
