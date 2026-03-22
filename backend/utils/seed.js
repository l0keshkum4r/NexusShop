const dotenv = require("dotenv");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();
const mongoose = require("mongoose");
const { User } = require("../models/User");
const { Product } = require("../models/Product");
const { Interaction } = require("../models/Interaction");

const SAMPLE_PRODUCTS = [
  // Electronics
  {
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Industry-leading noise canceling headphones with 30-hour battery life, crystal clear hands-free calling, and multipoint connection.",
    category: "Electronics",
    price: 349.99,
    originalPrice: 399.99,
    discount: 12,
    tags: ["headphones", "wireless", "noise-canceling", "sony", "audio"],
    brand: "Sony",
    stock: 45,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/headphones/400/300",
    stats: { views: 1520, purchases: 89, cartAdds: 210 },
  },
  {
    name: "Apple MacBook Air M2",
    description:
      "The remarkably thin MacBook Air with the Apple M2 chip, up to 18 hours of battery life, and a stunning Liquid Retina display.",
    category: "Electronics",
    price: 1099.99,
    tags: ["laptop", "apple", "macbook", "m2", "portable"],
    brand: "Apple",
    stock: 30,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/macbook/400/300",
    stats: { views: 2310, purchases: 145, cartAdds: 380 },
  },
  {
    name: 'Samsung 4K OLED TV 55"',
    description:
      "Experience breathtaking picture quality with Samsung OLED technology featuring self-illuminating pixels for perfect blacks.",
    category: "Electronics",
    price: 1299.99,
    originalPrice: 1599.99,
    discount: 18,
    tags: ["tv", "samsung", "oled", "4k", "smart-tv"],
    brand: "Samsung",
    stock: 15,
    thumbnail: "https://picsum.photos/seed/tv/400/300",
    stats: { views: 980, purchases: 42, cartAdds: 95 },
  },
  {
    name: 'iPad Pro 12.9" M2',
    description:
      "The ultimate iPad experience. Superfast M2 chip, stunning Liquid Retina XDR display, Thunderbolt connectivity.",
    category: "Electronics",
    price: 1099.0,
    tags: ["tablet", "apple", "ipad", "m2", "portable"],
    brand: "Apple",
    stock: 22,
    thumbnail: "https://picsum.photos/seed/ipad/400/300",
    stats: { views: 1750, purchases: 98, cartAdds: 220 },
  },
  {
    name: "Logitech MX Master 3S Mouse",
    description:
      "Advanced wireless mouse with ultra-fast MagSpeed scrolling, 8K DPI tracking, and ergonomic design for power users.",
    category: "Electronics",
    price: 99.99,
    tags: ["mouse", "wireless", "logitech", "productivity", "ergonomic"],
    brand: "Logitech",
    stock: 80,
    thumbnail: "https://picsum.photos/seed/mouse/400/300",
    stats: { views: 760, purchases: 210, cartAdds: 340 },
  },
  {
    name: "DJI Mini 3 Pro Drone",
    description:
      "Lightweight foldable drone under 249g, 4K/60fps video, tri-directional obstacle sensing, 47-min max flight time.",
    category: "Electronics",
    price: 759.0,
    tags: ["drone", "dji", "camera", "4k", "photography"],
    brand: "DJI",
    stock: 20,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/drone/400/300",
    stats: { views: 1100, purchases: 55, cartAdds: 130 },
  },

  // Clothing
  {
    name: "Nike Air Max 270",
    description:
      "The Nike Air Max 270 delivers visible cushioning under every step with the tallest Air unit yet for Max comfort.",
    category: "Clothing",
    price: 150.0,
    originalPrice: 180.0,
    discount: 17,
    tags: ["shoes", "nike", "sneakers", "running", "air-max"],
    brand: "Nike",
    stock: 60,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/nike/400/300",
    stats: { views: 2100, purchases: 320, cartAdds: 560 },
  },
  {
    name: "Levi's 501 Original Jeans",
    description:
      "The original straight fit jean. Sits at waist, straight through hip and thigh, straight leg. The OG since 1873.",
    category: "Clothing",
    price: 69.5,
    tags: ["jeans", "levis", "denim", "casual", "straight-fit"],
    brand: "Levi's",
    stock: 100,
    thumbnail: "https://picsum.photos/seed/jeans/400/300",
    stats: { views: 890, purchases: 185, cartAdds: 290 },
  },
  {
    name: "Patagonia Down Sweater Jacket",
    description:
      "A versatile midlayer jacket, light enough to stuff into its own pocket, with premium 800-fill-power RDS-certified down insulation.",
    category: "Clothing",
    price: 229.0,
    tags: ["jacket", "patagonia", "down", "outdoor", "winter"],
    brand: "Patagonia",
    stock: 35,
    thumbnail: "https://picsum.photos/seed/jacket/400/300",
    stats: { views: 640, purchases: 88, cartAdds: 145 },
  },
  {
    name: "Adidas Ultraboost 23",
    description:
      "Responsive cushioning meets style. The Ultraboost returns energy with every stride, perfect for running or all-day wear.",
    category: "Clothing",
    price: 190.0,
    tags: ["shoes", "adidas", "running", "boost", "sneakers"],
    brand: "Adidas",
    stock: 55,
    thumbnail: "https://picsum.photos/seed/adidas/400/300",
    stats: { views: 1450, purchases: 210, cartAdds: 380 },
  },

  // Books
  {
    name: "Atomic Habits by James Clear",
    description:
      "An easy and proven way to build good habits and break bad ones. Tiny changes, remarkable results.",
    category: "Books",
    price: 16.99,
    tags: ["self-help", "habits", "productivity", "bestseller", "james-clear"],
    brand: "Penguin",
    stock: 200,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/atomichabits/400/300",
    stats: { views: 3200, purchases: 890, cartAdds: 1100 },
  },
  {
    name: "The Pragmatic Programmer",
    description:
      "Your journey to mastery. A handbook that describes the philosophy of software development, written by two legendary programmers.",
    category: "Books",
    price: 49.99,
    tags: ["programming", "software", "technical", "career", "development"],
    brand: "Addison-Wesley",
    stock: 150,
    thumbnail: "https://picsum.photos/seed/pragprog/400/300",
    stats: { views: 1800, purchases: 420, cartAdds: 600 },
  },
  {
    name: "Dune by Frank Herbert",
    description:
      "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
    category: "Books",
    price: 14.99,
    tags: ["sci-fi", "fiction", "classic", "dune", "frank-herbert"],
    brand: "Ace Books",
    stock: 180,
    thumbnail: "https://picsum.photos/seed/dune/400/300",
    stats: { views: 2100, purchases: 650, cartAdds: 820 },
  },

  // Home & Kitchen
  {
    name: "Instant Pot Duo 7-in-1",
    description:
      "The world's #1 multi-cooker. Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker & warmer in one.",
    category: "Home & Kitchen",
    price: 89.95,
    tags: [
      "instant-pot",
      "pressure-cooker",
      "kitchen",
      "cooking",
      "multi-cooker",
    ],
    brand: "Instant Pot",
    stock: 75,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/instantpot/400/300",
    stats: { views: 1680, purchases: 445, cartAdds: 620 },
  },
  {
    name: "Dyson V15 Detect Vacuum",
    description:
      "Laser reveals invisible dust. The most powerful, intelligent cordless vacuum ever made. Automatically adapts suction across all floors.",
    category: "Home & Kitchen",
    price: 699.99,
    originalPrice: 749.99,
    discount: 7,
    tags: ["vacuum", "dyson", "cordless", "cleaning", "laser"],
    brand: "Dyson",
    stock: 25,
    thumbnail: "https://picsum.photos/seed/dyson/400/300",
    stats: { views: 920, purchases: 120, cartAdds: 190 },
  },
  {
    name: "IKEA KALLAX Shelf Unit",
    description:
      "A clean-lined open storage solution that works anywhere in the home. Perfect for organizing books, plants, and décor.",
    category: "Home & Kitchen",
    price: 69.99,
    tags: ["shelf", "ikea", "storage", "furniture", "minimalist"],
    brand: "IKEA",
    stock: 40,
    thumbnail: "https://picsum.photos/seed/kallax/400/300",
    stats: { views: 540, purchases: 95, cartAdds: 148 },
  },

  // Sports
  {
    name: "Peloton Bike+",
    description:
      'The most immersive cycling experience at home. Auto-Follow resistance, rotating screen for off-bike training, and 24" HD touchscreen.',
    category: "Sports",
    price: 2495.0,
    tags: ["peloton", "cycling", "fitness", "indoor-bike", "cardio"],
    brand: "Peloton",
    stock: 10,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/peloton/400/300",
    stats: { views: 1100, purchases: 28, cartAdds: 65 },
  },
  {
    name: "Hydro Flask 32oz Water Bottle",
    description:
      "TempShield double-wall vacuum insulation keeps beverages cold up to 24 hours and hot up to 12 hours. BPA-free.",
    category: "Sports",
    price: 49.95,
    tags: ["water-bottle", "hydro-flask", "hydration", "outdoor", "insulated"],
    brand: "Hydro Flask",
    stock: 120,
    thumbnail: "https://picsum.photos/seed/hydroflask/400/300",
    stats: { views: 760, purchases: 310, cartAdds: 490 },
  },
  {
    name: "Yoga Mat Premium 6mm",
    description:
      "Non-slip yoga mat with alignment lines. Extra thick 6mm cushioning for joints. Eco-friendly TPE material, carry strap included.",
    category: "Sports",
    price: 34.99,
    tags: ["yoga", "mat", "fitness", "exercise", "non-slip"],
    brand: "Manduka",
    stock: 90,
    thumbnail: "https://picsum.photos/seed/yogamat/400/300",
    stats: { views: 580, purchases: 195, cartAdds: 280 },
  },

  // Beauty
  {
    name: "La Mer Moisturizing Cream",
    description:
      "The legendary moisturizer with Miracle Broth. Helps transform skin with a surge of hydration, visibly reducing the look of lines.",
    category: "Beauty",
    price: 190.0,
    tags: ["skincare", "moisturizer", "la-mer", "luxury", "anti-aging"],
    brand: "La Mer",
    stock: 30,
    thumbnail: "https://picsum.photos/seed/lamer/400/300",
    stats: { views: 840, purchases: 65, cartAdds: 120 },
  },
  {
    name: "Dyson Airwrap Multi-Styler",
    description:
      "Style and dry simultaneously with no extreme heat. Creates curls, waves, and smooth styles with Coanda airflow.",
    category: "Beauty",
    price: 599.99,
    tags: ["dyson", "hair", "styler", "airwrap", "beauty"],
    brand: "Dyson",
    stock: 18,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/airwrap/400/300",
    stats: { views: 1920, purchases: 142, cartAdds: 310 },
  },
];

const SAMPLE_USERS = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Carol White",
    email: "carol@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "David Lee",
    email: "david@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Interaction.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    // Create users
    const users = await User.create(SAMPLE_USERS);
    console.log(`✅ Created ${users.length} users`);

    // Create products
    const products = await Product.create(SAMPLE_PRODUCTS);
    console.log(`✅ Created ${products.length} products`);

    // Generate sample interactions
    const actions = ["view", "view", "view", "cart", "purchase", "wishlist"];
    const interactions = [];

    for (const user of users.filter((u) => u.role !== "admin")) {
      // Each user interacts with 8-15 random products
      const count = Math.floor(Math.random() * 8) + 8;
      const shuffled = [...products]
        .sort(() => 0.5 - Math.random())
        .slice(0, count);

      for (const product of shuffled) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        interactions.push({
          userId: user._id,
          productId: product._id,
          action,
          timestamp: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
        });
      }
    }

    await Interaction.create(interactions);
    console.log(`✅ Created ${interactions.length} interactions`);

    console.log("\n📋 Sample Login Credentials:");
    console.log("  User:  alice@example.com / password123");
    console.log("  Admin: admin@example.com / admin123\n");

    await mongoose.connection.close();
    console.log("✅ Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seed();
