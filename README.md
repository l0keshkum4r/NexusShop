# NexusShop — AI-Powered E-Commerce with Hybrid Recommendation Engine

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-Aura-008CC1?style=flat&logo=neo4j&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=flat&logo=redis&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat&logo=fastapi&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-13%20passing-brightgreen?style=flat)

---

## Installation and Setup

### Prerequisites

Install the following before starting:

| Tool    | Version          | Download                         |
| ------- | ---------------- | -------------------------------- |
| Node.js | 18 LTS or higher | https://nodejs.org               |
| Python  | 3.9 or higher    | https://www.python.org/downloads |
| Git     | any              | https://git-scm.com              |

Verify installation:

```bash
node --version    # should print v18.x or higher
npm --version     # should print 9.x or higher
python --version  # should print Python 3.9 or higher
```

---

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nexusshop.git
cd nexusshop
```

---

### 2. Set Up MongoDB Atlas

MongoDB Atlas is the cloud-hosted document database. The free tier (M0) is sufficient.

1. Go to **https://cloud.mongodb.com** and create a free account
2. Click **"Build a Database"** → Select **M0 Free** → Choose your nearest region → Click **Create**
3. Under **"How would you like to authenticate?"** → choose **Username and Password**
   - Enter a username (e.g. `nexusadmin`)
   - Enter a password — use letters and numbers only, avoid special characters
   - Click **Create User**
4. Under **"Where would you like to connect from?"** → Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to the IP whitelist
   - Click **Add Entry** → **Finish and Close**
5. Click **"Go to Database"** → Click **Connect** on your cluster → **Drivers**
6. Copy the connection string. It looks like:
   ```
   mongodb+srv://nexusadmin:yourpassword@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```
7. Add the database name — insert `/ecommerce` before the `?`:
   ```
   mongodb+srv://nexusadmin:yourpassword@cluster0.abc123.mongodb.net/ecommerce?retryWrites=true&w=majority
   ```
   Save this string for the next step.

---

### 3. Set Up Neo4j Aura

Neo4j Aura is the cloud-hosted graph database. The free tier is sufficient.

1. Go to **https://neo4j.com/cloud/aura** and create a free account
2. Click **"Create a free instance"**
3. A popup shows your **generated password** — **copy it immediately**, it is shown only once
4. Wait approximately 2 minutes for the status to change to **Running**
5. Click your instance → copy the **Connection URI**. It looks like:
   ```
   neo4j+s://xxxxxxxx.databases.neo4j.io
   ```
   Save the URI and the password.

---

### 4. Set Up Redis Cloud

Redis Cloud provides a free hosted Redis instance.

1. Go to **https://redis.io/cloud** and create a free account
2. Click **"Create free database"** → choose any cloud provider and region → **Let's start free**
3. Click on your new database
4. Scroll to the **Security** section → copy the **Default user password**
5. At the top of the page, copy the **Public endpoint**. It looks like:
   ```
   redis-12345.c1.us-east-1-4.ec2.cloud.redislabs.com:12345
   ```
6. Build your Redis URL:
   ```
   redis://:yourpassword@redis-12345.c1.us-east-1-4.ec2.cloud.redislabs.com:12345
   ```
   Save this URL.

---

### 5. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in all values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas — paste your full URI with /ecommerce before the ?
MONGODB_URI=mongodb+srv://nexusadmin:yourpassword@cluster0.abc123.mongodb.net/ecommerce?retryWrites=true&w=majority

# JWT — any long random string
JWT_SECRET=replace-this-with-any-long-random-string-abc123xyz789
JWT_EXPIRES_IN=7d

# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-generated-password

# Redis Cloud
REDIS_URL=redis://:yourpassword@redis-12345.c1.us-east-1-4.ec2.cloud.redislabs.com:12345

# ML Service (leave as-is for local development)
ML_SERVICE_URL=http://localhost:8000

# Cache settings (seconds)
CACHE_TTL=3600
TRENDING_TTL=300
FRONTEND_URL=http://localhost:3000
```

Then configure the ML service:

```bash
cd ../ml-service
cp .env.example .env
```

Open `ml-service/.env` and add the same MongoDB URI:

```env
MONGODB_URI=mongodb+srv://nexusadmin:yourpassword@cluster0.abc123.mongodb.net/ecommerce?retryWrites=true&w=majority
```

---

### 6. Install Backend Dependencies

```bash
cd backend
npm install
```

This installs: Express, Mongoose, neo4j-driver, ioredis, jsonwebtoken, bcryptjs, express-validator, and all other backend packages.

---

### 7. Install ML Service Dependencies

**macOS / Linux:**

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows (Command Prompt):**

```cmd
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

This installs: FastAPI, uvicorn, scikit-learn, numpy, pandas, pymongo.

---

### 8. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs: React, React Router, Chart.js, react-chartjs-2, and react-scripts.

---

### 9. Seed the Database

```bash
cd backend
node utils/seed.js
```

Expected output:

```
✅ Connected to MongoDB
🗑️  Cleared existing data
✅ Created 5 users
✅ Created 20 products
✅ Created 48 interactions

📋 Sample Login Credentials:
  User:  alice@example.com / password123
  Admin: admin@example.com / admin123

✅ Seed complete!
```

This creates 20 products across 7 categories, 5 user accounts, and approximately 50 randomised interactions to seed the recommendation engine.

---

### 10. Run the Project

You need **three separate terminal windows** running simultaneously.

**Terminal 1 — Backend API:**

```bash
cd backend
npm run dev
```

Expected output:

```
✅ MongoDB connected: cluster0.abc123.mongodb.net
✅ Neo4j connected
✅ Redis connected
🚀 Server running on http://localhost:5000
```

**Terminal 2 — ML Service:**

_macOS / Linux:_

```bash
cd ml-service
source venv/bin/activate
uvicorn app:app --reload --port 8000
```

_Windows:_

```cmd
cd ml-service
venv\Scripts\activate
uvicorn app:app --reload --port 8000
```

Expected output:

```
✅ ML model warmed up with 20 products
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Terminal 3 — Frontend:**

```bash
cd frontend
npm start
```

Your browser will open automatically at **http://localhost:3000**

---

---

NexusShop is a full-stack, multi-user e-commerce platform built to demonstrate how **multiple NoSQL databases** can be combined to power a **hybrid AI recommendation engine**. Instead of relying on a single database, NexusShop uses three different NoSQL technologies — each chosen because it is the best tool for a specific part of the recommendation problem.

> **The core idea:** Every time a user browses, adds to cart, or purchases a product, that signal is captured across three databases simultaneously. When recommendations are requested, all three are queried in parallel, their results are scored and merged, and the final personalised list is returned — all in under 200ms thanks to Redis caching.

## Live Demo Credentials

After seeding the database you can log in with these accounts:

| Role  | Email             | Password    |
| ----- | ----------------- | ----------- |
| User  | alice@example.com | password123 |
| User  | bob@example.com   | password123 |
| Admin | admin@example.com | admin123    |

---

## Feature Overview

### For Shoppers

- **Personalised recommendations** — AI-driven suggestions that improve with every interaction
- **Trending products** — real-time popularity ranking updated on every view and purchase
- **Recently viewed** — instant access to your browsing history
- **Search history** — one-click repeat searches
- **Product reviews and ratings** — community feedback with average score display
- **Shopping cart** — persistent cart with quantity controls and GST calculation
- **Wishlist** — save products for later
- **Product search** — full-text search with category and price filters

### For Administrators

- **Analytics dashboard** — bar, pie, and line charts powered by Chart.js
  - Most viewed products
  - Category distribution
  - Activity over time (30-day window)
  - Interaction type breakdown
- **Product management** — create, update, and delete products
- **User management** — view all users, manage roles and status
- **Low stock alerts** — products below threshold are highlighted

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser (React 18)                            │
│                                                                      │
│  Home  ProductDetail  Cart  Wishlist  AdminDashboard  Login/Signup   │
│                                                                      │
│  Components: Navbar · ProductCard · RecommendationList               │
│              SearchHistory · RecentlyViewed · Toast                  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTP REST (JSON)
                             │ Bearer JWT token
┌────────────────────────────▼─────────────────────────────────────────┐
│                    Backend  (Node.js + Express)                       │
│                                                                      │
│  /api/auth          JWT signup · login · profile                     │
│  /api/products      CRUD · search · pagination · reviews             │
│  /api/interactions  view · cart · wishlist · recommendations         │
│  /api/admin         stats · users · product management               │
│                                                                      │
│  Middleware: express-validator · JWT auth · rate limiting            │
│  Services:   authService · productService · interactionService       │
│              recommendationService  ← the hybrid engine              │
└──────┬──────────────────┬────────────────────────┬───────────────────┘
       │                  │                        │
┌──────▼──────┐  ┌────────▼───────┐  ┌────────────▼──────────────────┐
│  MongoDB    │  │  Neo4j Aura    │  │  Redis Cloud                  │
│  Atlas      │  │                │  │                               │
│             │  │  (User)        │  │  rec:{userId}  → JSON cache   │
│  users      │  │     │          │  │                               │
│  products   │  │  [:VIEWED]     │  │  trending:products            │
│  interactions│  │  [:PURCHASED]  │  │  → sorted set by score       │
│             │  │     │          │  │                               │
│  Full-text  │  │  (Product)     │  │  TTL: 1 hour (recs)           │
│  indexes    │  │     │          │  │  TTL: 5 min  (trending)       │
│  on tags,   │  │  [:SIMILAR]    │  │                               │
│  category   │  │                │  └───────────────────────────────┘
└─────────────┘  └────────────────┘
                          │
           ┌──────────────▼──────────────┐
           │     ML Service (FastAPI)     │
           │                             │
           │  POST /recommend            │
           │  ContentRecommender class   │
           │  scikit-learn cosine sim    │
           │  Feature vector:            │
           │    category (one-hot)       │
           │    tags (binary vocab)      │
           │    price (log-normalised)   │
           └─────────────────────────────┘
```

---

## The Hybrid Recommendation Engine

### Why Hybrid?

No single recommendation algorithm works well in all situations:

| Algorithm               | Strength                      | Weakness                           |
| ----------------------- | ----------------------------- | ---------------------------------- |
| Collaborative filtering | Finds non-obvious connections | Fails for new users (cold start)   |
| Content-based           | Works from first interaction  | Gets stuck recommending same types |
| Graph-based             | Captures community behaviour  | Computationally expensive at scale |
| ML similarity           | Objective feature matching    | Ignores social signals             |
| Popularity/trending     | Always has something to show  | Not personalised                   |

By combining all five and weighting them, NexusShop gets the benefits of each while cancelling out their individual weaknesses. A new user who has only viewed one product still gets reasonable recommendations (trending + content). A power user with hundreds of interactions gets highly personalised results (graph + collaborative).

---

### The Five Sources

#### A. Graph-Based Recommendations (Neo4j — weight: 0.30)

**"Users similar to you also viewed this"**

Neo4j stores every user-product interaction as a directed graph edge. To generate recommendations, it traverses the graph:

```cypher
MATCH (u:User {userId: $userId})-[:VIEWED|PURCHASED]->(p:Product)
      <-[:VIEWED|PURCHASED]-(similarUser:User)
WHERE similarUser.userId <> $userId
MATCH (similarUser)-[:VIEWED|PURCHASED]->(rec:Product)
WHERE NOT rec.productId IN $alreadySeen
WITH rec.productId AS productId, COUNT(*) AS score
RETURN productId, score
ORDER BY score DESC
LIMIT 20
```

This query finds users who share viewing/purchase history with the current user, then surfaces products those users also interacted with. The `COUNT(*)` naturally ranks products that appear across many similar users higher.

This gets the highest weight (0.30) because it captures the richest signal — the collective behaviour of the entire user community.

#### B. ML-Based Recommendations (Python / scikit-learn — weight: 0.25)

**"Highly similar to items you viewed"**

Each product is converted into a numeric feature vector:

- **Category** — one-hot encoded (10 dimensions, one per category)
- **Tags** — binary presence in a shared vocabulary (~80 dimensions)
- **Price** — log-normalised to [0, 1]

```python
def build_feature_vector(product, tag_vocab):
    # One-hot category
    cat_vec = [1.0 if product['category'] == c else 0.0 for c in CATEGORIES]
    # Binary tag presence
    tags = [t.lower() for t in product.get('tags', [])]
    tag_vec = [1.0 if tag in tags else 0.0 for tag in tag_vocab]
    # Log-normalised price
    price_vec = [math.log1p(product['price']) / math.log1p(10000)]
    return cat_vec + tag_vec + price_vec
```

The backend sends recently viewed product IDs to the FastAPI service. It averages their feature vectors and computes **cosine similarity** against all products in the catalogue, returning the closest matches.

```python
avg_seed_vector = np.mean(seed_vectors, axis=0, keepdims=True)
similarities = cosine_similarity(avg_seed_vector, self._feature_matrix)[0]
```

#### C. Content-Based Recommendations (MongoDB — weight: 0.20)

**"Popular in your category"**

MongoDB aggregates the user's interaction history to extract preferred categories and tags, then finds products that share those attributes:

```js
const products = await Product.find({
  _id: { $nin: alreadySeen },
  isActive: true,
  $or: [
    { category: { $in: preferredCategories } },
    { tags: { $in: frequentTags } },
  ],
})
  .sort({ "stats.views": -1 })
  .limit(20);
```

The overlap score is calculated per candidate (category match = 2 points, each matching tag = 1 point), then normalised before applying the weight.

#### D. Collaborative Filtering (MongoDB — weight: 0.10)

**"Frequently bought by users like you"**

Uses MongoDB's aggregation pipeline to find users with overlapping interaction history, then surfaces what those users bought:

```js
// Step 1: find users who interacted with same products
const similarUsers = await Interaction.aggregate([
  { $match: { productId: { $in: myProductIds }, userId: { $ne: myId } } },
  { $group: { _id: "$userId", overlap: { $sum: 1 } } },
  { $sort: { overlap: -1 } },
  { $limit: 20 },
]);

// Step 2: get what those users purchased
const recs = await Interaction.aggregate([
  {
    $match: {
      userId: { $in: similarUserIds },
      action: { $in: ["purchase", "cart"] },
    },
  },
  { $group: { _id: "$productId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```

#### E. Trending (Redis — weight: 0.15)

**"Trending right now"**

Redis maintains a **sorted set** called `trending:products`. Every user interaction increments the score for that product's ID:

```js
// On each interaction, add points based on action weight
const points = { view: 1, wishlist: 2, cart: 3, purchase: 5 }[action];
await redis.zincrby("trending:products", points, productId);
```

The top products are retrieved with a single Redis command:

```js
await redis.zrevrangebyscore(
  "trending:products",
  "+inf",
  "-inf",
  "WITHSCORES",
  "LIMIT",
  0,
  20,
);
```

This sorted set expires every 5 minutes so trending reflects **recent** activity, not all-time totals.

---

### The Scoring Formula

All five sources return candidate products with raw scores. These scores are normalised to [0, 1] within each source, then multiplied by their weights and summed:

```
final_score =  0.30 × graph_score
             + 0.25 × ml_score
             + 0.20 × content_score
             + 0.15 × popularity_score
             + 0.10 × collaborative_score
```

The weights sum to exactly 1.0. A product appearing in multiple sources accumulates contributions from each, naturally rising to the top of the list.

```js
// Normalise scores within each source
const normalize = (recs) => {
  const max = Math.max(...recs.map((r) => r.score), 1);
  return recs.map((r) => ({ ...r, normalizedScore: r.score / max }));
};

// Merge all sources
for (const [source, recs] of Object.entries(sources)) {
  const weight = WEIGHTS[source];
  for (const rec of recs) {
    candidates[rec.productId].score += weight * rec.normalizedScore;
    candidates[rec.productId].sources.push(source);
  }
}
```

Each recommendation in the response includes a human-readable explanation:

```json
{
  "product": { "name": "Sony WH-1000XM5", "price": 349.99, ... },
  "score": 0.847,
  "explanation": "Users similar to you viewed this",
  "sources": ["graph", "ml", "content"]
}
```

---

### The Full Data Flow

```
User views a product page
         │
         ├──▶  MongoDB   — Interaction document saved { userId, productId, action: 'view' }
         │                 Product stats.views incremented
         │                 User.viewedProducts array updated (last 20)
         │
         ├──▶  Neo4j     — MERGE (User)-[:VIEWED]->(Product)
         │                 If purchase: MERGE (Product)-[:SIMILAR]->(Product)
         │                 for all co-purchased products
         │
         └──▶  Redis     — ZINCRBY trending:products 1 {productId}


User opens homepage → GET /api/interactions/recommendations/:userId
         │
         ├── Redis:  GET rec:{userId}
         │       └── HIT  ──────────────────────────────▶  return cached (< 1ms)
         │
         └── MISS: run all 5 sources in parallel (Promise.allSettled)
                   │
                   ├── Neo4j graph traversal      → up to 20 candidates
                   ├── ML service HTTP POST        → up to 20 candidates
                   ├── MongoDB content query       → up to 20 candidates
                   ├── Redis trending zrevrange    → up to 20 candidates
                   └── MongoDB collaborative agg   → up to 20 candidates
                             │
                             ▼
                   Merge all candidates, normalise per source,
                   apply weights, sort descending
                             │
                             ▼
                   Fetch full product documents for top N
                             │
                             ▼
                   SET rec:{userId} in Redis (TTL: 1 hour)
                             │
                             └──────────────────────────▶  return to frontend
```

---

## How NoSQL Databases Power Recommendations

### MongoDB Atlas — Document Store

MongoDB is the **primary database** for the entire application. It stores users, products, and interactions as flexible JSON documents.

**Why MongoDB for this?**

Unlike a relational database, MongoDB does not require a fixed schema. A product document can have any number of tags, images, or custom attributes without altering a table definition. The `Interaction` collection can store metadata that varies by action type — a `view` might include session duration, while a `purchase` might include order value.

**How it powers recommendations:**

The `Interaction` collection is the raw input for both content-based filtering and collaborative filtering. MongoDB's aggregation pipeline makes it straightforward to compute overlap scores between users:

```js
// Count how many products two users have in common
{ $group: { _id: '$userId', overlap: { $sum: 1 } } }
```

MongoDB also maintains denormalised counters on each Product document (`stats.views`, `stats.purchases`) for fast sorting without expensive joins.

**Indexes used:**

```js
Product.createIndex({ name: "text", description: "text", tags: "text" }); // full-text search
Product.createIndex({ category: 1 });
Product.createIndex({ "stats.views": -1 });
Interaction.createIndex({ userId: 1, productId: 1, action: 1 });
Interaction.createIndex({ timestamp: -1 });
```

---

### Neo4j Aura — Graph Database

Neo4j stores the **social graph** of user-product interactions as nodes and edges (called relationships in graph terminology).

**Graph model:**

```
(User)-[:VIEWED]->(Product)
(User)-[:PURCHASED]->(Product)
(User)-[:ADDED_TO_CART]->(Product)
(Product)-[:SIMILAR]->(Product)
```

**Why a graph database for this?**

The key recommendation question is: _"What did users similar to me buy?"_ In a relational database this requires a self-join on a large interactions table — joining it to itself to find users in common, then joining again to find their other interactions. This becomes extremely slow as the user base grows.

In Neo4j, this is a natural graph traversal. The database engine is optimised for exactly this kind of multi-hop query — it follows edges directly rather than scanning tables. The query that would take seconds in SQL takes milliseconds in Neo4j:

```cypher
-- Find what users-like-me have interacted with, in 2 hops:
MATCH (me:User)-[:VIEWED]->(shared:Product)<-[:VIEWED]-(similar:User)
MATCH (similar)-[:VIEWED]->(recommendation:Product)
WHERE NOT (me)-[:VIEWED]->(recommendation)
RETURN recommendation.productId, COUNT(*) AS relevance
ORDER BY relevance DESC
```

**MERGE for upsert — no duplicate edges:**

```cypher
MERGE (u:User {userId: $userId})
MERGE (p:Product {productId: $productId})
MERGE (u)-[r:VIEWED]->(p)
ON CREATE SET r.count = 1, r.firstAt = datetime()
ON MATCH  SET r.count = r.count + 1, r.lastAt = datetime()
```

---

### Redis Cloud — In-Memory Cache

Redis serves two distinct purposes in NexusShop: **recommendation caching** and **real-time trending**.

**Purpose 1 — Recommendation Cache**

Computing recommendations requires querying three databases and calling an external HTTP service. Even with optimised queries this takes 50–200ms. For a user refreshing the homepage this would be noticeable.

Redis stores the computed result as a JSON string with a 1-hour TTL:

```js
// Cache miss: compute and store
await redis.setex(`rec:${userId}`, 3600, JSON.stringify(recommendations));

// Cache hit: return instantly
const cached = await redis.get(`rec:${userId}`);
return JSON.parse(cached); // ~0.5ms
```

When a user makes a significant action (purchase, add to cart, wishlist) their cache key is deleted so the next request recomputes with fresh data:

```js
await redis.del(`rec:${userId}`);
```

**Purpose 2 — Trending Sorted Set**

Redis's `ZSET` (sorted set) data structure is a perfect fit for trending. Each product ID is a member, and its score accumulates interaction points:

```
trending:products
  "product_abc123"  →  score: 47.0   (many views + purchases)
  "product_def456"  →  score: 31.0
  "product_ghi789"  →  score: 12.0
```

The entire sorted set expires every 5 minutes (`EXPIRE trending:products 300`), so trending always reflects the last 5 minutes of activity rather than all-time history. Retrieving the top 10 trending products is a single O(log N) command:

```js
redis.zrevrangebyscore(
  "trending:products",
  "+inf",
  "-inf",
  "WITHSCORES",
  "LIMIT",
  0,
  10,
);
```

---

### Why Not a Relational Database?

A traditional SQL database (PostgreSQL, MySQL) could handle some of these use cases, but would struggle with others:

| Requirement                       | SQL approach                          | NoSQL approach               |
| --------------------------------- | ------------------------------------- | ---------------------------- |
| Flexible product attributes       | ALTER TABLE for every new field       | Schema-free MongoDB document |
| Graph traversal (similar users)   | Expensive recursive self-joins        | Native Neo4j traversal in ms |
| Sub-millisecond cache             | Not designed for this                 | Redis in-memory O(1) reads   |
| Real-time leaderboard             | Requires sorting full table           | Redis sorted set ZREVRANGE   |
| Horizontal scaling                | Complex sharding                      | MongoDB Atlas auto-sharding  |
| Unstructured interaction metadata | Needs nullable columns for every type | Embedded BSON subdocument    |

The combination of three purpose-built NoSQL databases, each solving the part of the problem it is best suited for, is what makes the recommendation engine both fast and accurate.

---

## Tech Stack

| Layer      | Technology        | Version | Purpose                         |
| ---------- | ----------------- | ------- | ------------------------------- |
| Frontend   | React             | 18.x    | UI framework                    |
| Frontend   | React Router      | 6.x     | Client-side routing             |
| Frontend   | Chart.js          | 4.x     | Admin analytics charts          |
| Frontend   | Plain CSS         | —       | Custom dark theme (no Tailwind) |
| Backend    | Node.js           | 20.x    | JavaScript runtime              |
| Backend    | Express           | 4.x     | REST API framework              |
| Backend    | Mongoose          | 8.x     | MongoDB ODM                     |
| Backend    | neo4j-driver      | 5.x     | Neo4j client                    |
| Backend    | ioredis           | 5.x     | Redis client                    |
| Backend    | jsonwebtoken      | 9.x     | JWT authentication              |
| Backend    | bcryptjs          | 2.x     | Password hashing                |
| Backend    | express-validator | 7.x     | Request validation              |
| ML Service | Python            | 3.11    | Runtime                         |
| ML Service | FastAPI           | 0.109   | REST API framework              |
| ML Service | scikit-learn      | 1.4     | Cosine similarity               |
| ML Service | NumPy             | 1.26    | Matrix operations               |
| ML Service | PyMongo           | 4.6     | MongoDB client                  |
| Database   | MongoDB Atlas     | 7.x     | Document store                  |
| Database   | Neo4j Aura        | 5.x     | Graph database                  |
| Database   | Redis Cloud       | 7.x     | In-memory cache                 |
| DevOps     | Docker            | —       | Containerisation                |
| DevOps     | docker-compose    | —       | Local stack orchestration       |
| Testing    | Jest              | 29.x    | Backend unit tests              |

---

## Project Structure

```
nexusshop/
│
├── backend/                        Node.js + Express API
│   ├── config/
│   │   ├── database.js             MongoDB Atlas connection + index creation
│   │   ├── neo4j.js                Neo4j Aura driver + schema constraints
│   │   └── redis.js                Redis Cloud client + helper functions
│   │
│   ├── controllers/
│   │   ├── authController.js       signup, login, profile
│   │   ├── productController.js    CRUD, search, reviews, admin stats
│   │   └── interactionController.js  view, cart, wishlist, recommendations
│   │
│   ├── middleware/
│   │   ├── auth.js                 JWT verification, role guards
│   │   ├── errorHandler.js         Central error handling + 404
│   │   └── validators.js           express-validator rule sets
│   │
│   ├── models/
│   │   ├── User.js                 schema: profile, cart, wishlist, viewedProducts
│   │   ├── Product.js              schema: details, stats, reviews, featureVector
│   │   └── Interaction.js          schema: userId, productId, action, weight, metadata
│   │
│   ├── routes/
│   │   ├── auth.js                 POST /signup  POST /login  GET /profile
│   │   ├── products.js             GET/POST/PUT/DELETE /products
│   │   ├── interactions.js         POST /interactions  GET /recommendations
│   │   └── admin.js                GET /stats  GET /users  PUT /users/:id/role
│   │
│   ├── services/
│   │   ├── authService.js          signup/login business logic
│   │   ├── productService.js       product CRUD, pagination, content filtering
│   │   ├── interactionService.js   write to MongoDB + Neo4j + Redis atomically
│   │   └── recommendationService.js  ← the hybrid engine (5 sources + scoring)
│   │
│   ├── tests/
│   │   └── recommendation.test.js  13 unit tests for scoring logic
│   │
│   ├── utils/
│   │   └── seed.js                 sample products, users, interactions
│   │
│   ├── Dockerfile
│   ├── server.js                   Express app entry point
│   ├── package.json
│   └── .env.example
│
├── ml-service/                     Python FastAPI microservice
│   ├── app.py                      endpoints: /recommend /similarity /health
│   ├── recommender.py              ContentRecommender class (cosine similarity)
│   ├── utils.py                    feature vectorization helpers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                       React single-page application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js           navigation + search + live cart count
│   │   │   ├── ProductCard.js      card with add-to-cart + wishlist toggle
│   │   │   ├── RecommendationList.js  AI recommendation strip
│   │   │   ├── RecentlyViewed.js   horizontal scroll of viewed products
│   │   │   └── SearchHistory.js    clickable recent search pills
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.js             hero + trending + recommendations + catalogue
│   │   │   ├── ProductDetail.js    images, reviews, similar products
│   │   │   ├── Cart.js             cart with quantity controls + checkout
│   │   │   ├── Wishlist.js         saved products grid
│   │   │   ├── Login.js            JWT login with demo fill buttons
│   │   │   ├── Signup.js           registration form
│   │   │   ├── AdminDashboard.js   Chart.js analytics + product/user management
│   │   │   └── NotFound.js         404 page
│   │   │
│   │   ├── services/
│   │   │   ├── api.js              all HTTP calls to backend (single source of truth)
│   │   │   ├── AuthContext.js      global auth state + JWT storage
│   │   │   ├── useCart.js          global cart state via React Context
│   │   │   └── ToastContext.js     lightweight toast notification system
│   │   │
│   │   └── styles/                 12 CSS files (dark design system)
│   │       ├── global.css          CSS variables, resets, utilities
│   │       └── *.css               per-component stylesheets
│   │
│   ├── Dockerfile
│   ├── nginx.conf                  SPA routing + API proxy
│   └── package.json
│
├── docker-compose.yml              full local stack (MongoDB + Neo4j + Redis + services)
├── Makefile                        Unix dev commands
├── dev.bat                         Windows Command Prompt dev commands
├── dev.ps1                         Windows PowerShell dev commands
└── README.md
```

## API Reference

### Authentication

| Method | Endpoint            | Auth | Body                        |
| ------ | ------------------- | ---- | --------------------------- |
| POST   | `/api/auth/signup`  | —    | `{ name, email, password }` |
| POST   | `/api/auth/login`   | —    | `{ email, password }`       |
| GET    | `/api/auth/profile` | ✅   | —                           |
| PUT    | `/api/auth/profile` | ✅   | `{ name, preferences }`     |

### Products

| Method | Endpoint                    | Auth  | Notes                              |
| ------ | --------------------------- | ----- | ---------------------------------- |
| GET    | `/api/products`             | —     | `?page&limit&search&category&sort` |
| GET    | `/api/products/:id`         | —     | Full product with reviews          |
| POST   | `/api/products`             | Admin | Create product                     |
| PUT    | `/api/products/:id`         | Admin | Update product                     |
| DELETE | `/api/products/:id`         | Admin | Soft delete                        |
| POST   | `/api/products/:id/reviews` | ✅    | `{ rating, comment }`              |

### Interactions & Recommendations

| Method | Endpoint                                    | Auth | Notes                                             |
| ------ | ------------------------------------------- | ---- | ------------------------------------------------- |
| POST   | `/api/interactions`                         | ✅   | `{ productId, action }` — triggers all DB updates |
| GET    | `/api/interactions/trending`                | —    | `?limit` — from Redis sorted set                  |
| GET    | `/api/interactions/recommendations/:userId` | ✅   | Hybrid engine result                              |
| GET    | `/api/interactions/cart`                    | ✅   | Populated cart items                              |
| POST   | `/api/interactions/cart`                    | ✅   | `{ productId, quantity }`                         |
| PATCH  | `/api/interactions/cart/:productId`         | ✅   | `{ quantity }` — set absolute quantity            |
| DELETE | `/api/interactions/cart/:productId`         | ✅   | Remove item                                       |
| GET    | `/api/interactions/wishlist`                | ✅   | Populated wishlist                                |
| POST   | `/api/interactions/wishlist`                | ✅   | `{ productId }` — toggle                          |

### Admin

| Method | Endpoint                        | Auth  | Notes                        |
| ------ | ------------------------------- | ----- | ---------------------------- |
| GET    | `/api/admin/stats`              | Admin | Product stats + most viewed  |
| GET    | `/api/admin/interactions/stats` | Admin | `?days` — activity over time |
| GET    | `/api/admin/users`              | Admin | All users paginated          |
| PUT    | `/api/admin/users/:id/role`     | Admin | `{ role }`                   |

### ML Service

| Method | Endpoint           | Body                                      |
| ------ | ------------------ | ----------------------------------------- |
| GET    | `/health`          | —                                         |
| POST   | `/recommend`       | `{ product_ids[], exclude_ids[], top_n }` |
| POST   | `/similarity`      | `{ product, candidates[], top_n }`        |
| POST   | `/batch-vectorize` | `[products]`                              |

---

## Running Tests

```bash
cd backend
npm test
```

Output:

```
PASS tests/recommendation.test.js
  Hybrid Recommendation Scoring
    ✓ weights sum to 1.0
    ✓ normalizes scores to [0, 1]
    ✓ normalize handles empty array
    ✓ normalize handles single item
    ✓ mergeAndScore excludes already-seen products
    ✓ graph source has highest weight (0.30)
    ✓ product appearing in multiple sources scores higher
    ✓ scores are sorted descending
    ✓ returns empty array when all sources empty
    ✓ sources array records contributing sources
    ✓ score is bounded between 0 and 1 for single-source products
    ✓ full hybrid score cannot exceed 1.0 (sum of all weights)
  Normalize edge cases
    ✓ all-zero scores normalize to 0

Tests: 13 passed, 13 total
```

The tests validate the core scoring logic without requiring any database connections — they test the pure mathematical functions: normalisation, weight application, candidate merging, exclusion filtering, and boundary conditions.

---

## Sample Data

The seed script creates the following data:

### Products (20 total across 7 categories)

| Category       | Example Products                                                                    |
| -------------- | ----------------------------------------------------------------------------------- |
| Electronics    | Sony WH-1000XM5, Apple MacBook Air M2, Samsung 4K OLED TV, iPad Pro, DJI Mini 3 Pro |
| Clothing       | Nike Air Max 270, Levi's 501 Jeans, Patagonia Down Jacket, Adidas Ultraboost        |
| Books          | Atomic Habits, The Pragmatic Programmer, Dune                                       |
| Home & Kitchen | Instant Pot Duo, Dyson V15 Vacuum, IKEA KALLAX Shelf                                |
| Sports         | Peloton Bike+, Hydro Flask, Yoga Mat                                                |
| Beauty         | La Mer Moisturizing Cream, Dyson Airwrap                                            |

### Users (5 total)

| Name          | Email             | Password    | Role  |
| ------------- | ----------------- | ----------- | ----- |
| Alice Johnson | alice@example.com | password123 | user  |
| Bob Smith     | bob@example.com   | password123 | user  |
| Carol White   | carol@example.com | password123 | user  |
| David Lee     | david@example.com | password123 | user  |
| Admin User    | admin@example.com | admin123    | admin |

### Interactions

Approximately 50 randomised interactions are seeded across all users and products, covering view, cart, purchase, and wishlist actions spread across the last 30 days. This gives the recommendation engine enough signal to produce meaningful results from the first login.
