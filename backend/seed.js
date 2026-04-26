const mongoose = require("mongoose");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();

const { User } = require("./models/User");
const { Product } = require("./models/Product");
const { Interaction } = require("./models/Interaction");

const SAMPLE_PRODUCTS = [
  // Electronics — Mobiles
  {
    name: "Apple iPhone 15 Pro",
    description:
      "6.1-inch Super Retina XDR display with ProMotion. A17 Pro chip, 48MP main camera with 5x optical zoom, USB-C, titanium design.",
    category: "Electronics",
    price: 999.99,
    originalPrice: 1099.99,
    discount: 9,
    tags: ["smartphone", "apple", "ios", "5g", "camera", "premium"],
    brand: "Apple",
    stock: 20,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/iphone15pro/400/300",
    stats: { views: 3100, purchases: 210, cartAdds: 480 },
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description:
      "6.8-inch Dynamic AMOLED 2X, 200MP camera, built-in S Pen, Snapdragon 8 Gen 3, 5000mAh battery.",
    category: "Electronics",
    price: 1299.99,
    originalPrice: 1399.99,
    discount: 7,
    tags: ["smartphone", "samsung", "android", "5g", "spen", "camera"],
    brand: "Samsung",
    stock: 18,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/s24ultra/400/300",
    stats: { views: 2800, purchases: 165, cartAdds: 390 },
  },
  {
    name: "Google Pixel 8 Pro",
    description:
      "Google Tensor G3 chip, 6.7-inch LTPO OLED, 50MP triple camera, 7 years of OS updates, temperature sensor.",
    category: "Electronics",
    price: 999.0,
    tags: ["smartphone", "google", "android", "pixel", "ai", "camera"],
    brand: "Google",
    stock: 25,
    thumbnail: "https://picsum.photos/seed/pixel8pro/400/300",
    stats: { views: 1450, purchases: 98, cartAdds: 210 },
  },
  {
    name: "OnePlus 12",
    description:
      "Snapdragon 8 Gen 3, 6.82-inch 120Hz LTPO AMOLED, Hasselblad 50MP triple camera, 100W SUPERVOOC charging.",
    category: "Electronics",
    price: 799.99,
    originalPrice: 899.99,
    discount: 11,
    tags: ["smartphone", "oneplus", "android", "5g", "fast-charging"],
    brand: "OnePlus",
    stock: 30,
    thumbnail: "https://picsum.photos/seed/oneplus12/400/300",
    stats: { views: 1100, purchases: 88, cartAdds: 195 },
  },
  // Electronics — Audio
  {
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Industry-leading noise canceling headphones with 30-hour battery life, crystal clear hands-free calling, and multipoint connection.",
    category: "Electronics",
    price: 279.99,
    originalPrice: 349.99,
    discount: 20,
    tags: ["headphones", "wireless", "noise-canceling", "sony", "audio"],
    brand: "Sony",
    stock: 45,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/headphones/400/300",
    stats: { views: 1520, purchases: 89, cartAdds: 210 },
  },
  {
    name: "Apple AirPods Pro (2nd Gen)",
    description:
      "H2 chip, Active Noise Cancellation, Adaptive Transparency, Personalised Spatial Audio, MagSafe charging case.",
    category: "Electronics",
    price: 249.0,
    tags: ["earbuds", "apple", "anc", "wireless", "spatial-audio"],
    brand: "Apple",
    stock: 60,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/airpodspro/400/300",
    stats: { views: 2900, purchases: 345, cartAdds: 610 },
  },
  {
    name: "JBL Charge 5 Bluetooth Speaker",
    description:
      "IP67 waterproof, 20-hour playtime, built-in power bank, PartyBoost to pair multiple speakers.",
    category: "Electronics",
    price: 179.99,
    originalPrice: 199.99,
    discount: 10,
    tags: ["speaker", "bluetooth", "jbl", "waterproof", "portable"],
    brand: "JBL",
    stock: 55,
    thumbnail: "https://picsum.photos/seed/jblcharge/400/300",
    stats: { views: 980, purchases: 210, cartAdds: 340 },
  },
  {
    name: "Bose QuietComfort 45",
    description:
      "High-fidelity audio, world-class noise cancellation, 24-hour battery, lightweight design, Aware Mode.",
    category: "Electronics",
    price: 329.99,
    originalPrice: 379.99,
    discount: 13,
    tags: ["headphones", "bose", "noise-canceling", "wireless", "premium"],
    brand: "Bose",
    stock: 35,
    thumbnail: "https://picsum.photos/seed/boseqc45/400/300",
    stats: { views: 1240, purchases: 120, cartAdds: 265 },
  },
  // Electronics — Computers
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
    name: "Dell XPS 15 (2024)",
    description:
      "15.6-inch OLED display, Intel Core i9-13900H, 32GB RAM, 1TB SSD, NVIDIA RTX 4060, premium build quality.",
    category: "Electronics",
    price: 1799.99,
    originalPrice: 1999.99,
    discount: 10,
    tags: ["laptop", "dell", "xps", "oled", "i9", "gaming", "premium"],
    brand: "Dell",
    stock: 15,
    thumbnail: "https://picsum.photos/seed/dellxps/400/300",
    stats: { views: 1670, purchases: 72, cartAdds: 198 },
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
    name: "Champion Reverse Weave Hoodie",
    description:
      "Iconic reverse weave construction reduces shrinkage. Heavy 12oz fleece, ribbed cuffs and waistband, kangaroo pocket.",
    category: "Clothing",
    price: 65.0,
    originalPrice: 80.0,
    discount: 19,
    tags: ["hoodie", "champion", "casual", "fleece", "streetwear"],
    brand: "Champion",
    stock: 90,
    thumbnail: "https://picsum.photos/seed/hoodie/400/300",
    stats: { views: 720, purchases: 195, cartAdds: 310 },
  },
  {
    name: "Uniqlo Ultra Light Down Jacket",
    description:
      "Packable down jacket weighing just 190g. 90/10 down fill, water-repellent finish, packs into its own pocket.",
    category: "Clothing",
    price: 89.9,
    tags: ["jacket", "uniqlo", "down", "packable", "lightweight", "travel"],
    brand: "Uniqlo",
    stock: 75,
    thumbnail: "https://picsum.photos/seed/uniqlodown/400/300",
    stats: { views: 980, purchases: 265, cartAdds: 410 },
  },
  {
    name: "New Balance 990v6",
    description:
      "Made in USA. Premium pigskin suede and mesh upper, ENCAP midsole technology, durable rubber outsole.",
    category: "Clothing",
    price: 184.99,
    tags: ["shoes", "new-balance", "sneakers", "made-in-usa", "premium"],
    brand: "New Balance",
    stock: 40,
    thumbnail: "https://picsum.photos/seed/nb990/400/300",
    stats: { views: 860, purchases: 145, cartAdds: 240 },
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
  {
    name: "The Psychology of Money",
    description:
      "Timeless lessons on wealth, greed, and happiness. Why smart people make bad financial decisions.",
    category: "Books",
    price: 18.99,
    tags: ["finance", "money", "investing", "psychology", "bestseller"],
    brand: "Harriman House",
    stock: 220,
    thumbnail: "https://picsum.photos/seed/psychmoney/400/300",
    stats: { views: 2450, purchases: 710, cartAdds: 930 },
  },
  {
    name: "Clean Code by Robert Martin",
    description:
      "A handbook of agile software craftsmanship. Learn to write code that works, is readable, and is maintainable.",
    category: "Books",
    price: 39.99,
    tags: ["programming", "clean-code", "software", "java", "best-practices"],
    brand: "Prentice Hall",
    stock: 130,
    thumbnail: "https://picsum.photos/seed/cleancode/400/300",
    stats: { views: 1560, purchases: 380, cartAdds: 520 },
  },
  {
    name: "Deep Work by Cal Newport",
    description:
      "Rules for focused success in a distracted world. Develop a deep work habit and produce at an elite level.",
    category: "Books",
    price: 17.99,
    tags: ["productivity", "focus", "self-help", "career", "cal-newport"],
    brand: "Grand Central",
    stock: 175,
    thumbnail: "https://picsum.photos/seed/deepwork/400/300",
    stats: { views: 1890, purchases: 560, cartAdds: 740 },
  },
  {
    name: "The Lean Startup by Eric Ries",
    description:
      "How today's entrepreneurs use continuous innovation to create radically successful businesses.",
    category: "Books",
    price: 19.99,
    tags: ["startup", "business", "entrepreneurship", "agile", "innovation"],
    brand: "Crown Business",
    stock: 160,
    thumbnail: "https://picsum.photos/seed/leanstartup/400/300",
    stats: { views: 1340, purchases: 420, cartAdds: 580 },
  },
  // Home & Kitchen
  {
    name: "Instant Pot Duo 7-in-1",
    description:
      "The world's #1 multi-cooker. Pressure cooker, slow cooker, rice cooker, steamer, saute pan, yogurt maker & warmer in one.",
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
      "Laser reveals invisible dust. The most powerful, intelligent cordless vacuum ever made.",
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
      "A clean-lined open storage solution that works anywhere in the home. Perfect for organizing books, plants, and decor.",
    category: "Home & Kitchen",
    price: 69.99,
    tags: ["shelf", "ikea", "storage", "furniture", "minimalist"],
    brand: "IKEA",
    stock: 40,
    thumbnail: "https://picsum.photos/seed/kallax/400/300",
    stats: { views: 540, purchases: 95, cartAdds: 148 },
  },
  {
    name: "Vitamix 5200 Blender",
    description:
      "Professional-grade blender with variable speed control, hardened stainless steel blades, self-cleaning in 60 seconds.",
    category: "Home & Kitchen",
    price: 449.95,
    originalPrice: 549.95,
    discount: 18,
    tags: ["blender", "vitamix", "kitchen", "smoothie", "professional"],
    brand: "Vitamix",
    stock: 30,
    thumbnail: "https://picsum.photos/seed/vitamix/400/300",
    stats: { views: 870, purchases: 135, cartAdds: 240 },
  },
  {
    name: "Le Creuset Dutch Oven 5.5qt",
    description:
      "Enameled cast iron Dutch oven. Even heat distribution, self-basting lid, oven safe to 500F, lifetime warranty.",
    category: "Home & Kitchen",
    price: 399.95,
    tags: ["dutch-oven", "le-creuset", "cast-iron", "cooking", "premium"],
    brand: "Le Creuset",
    stock: 20,
    thumbnail: "https://picsum.photos/seed/lecreuset/400/300",
    stats: { views: 760, purchases: 88, cartAdds: 165 },
  },
  {
    name: "Nespresso Vertuo Next Coffee Machine",
    description:
      "One-touch brewing, five cup sizes from espresso to alto, centrifusion extraction, 12 second heat-up time.",
    category: "Home & Kitchen",
    price: 179.0,
    originalPrice: 229.0,
    discount: 22,
    tags: ["coffee", "nespresso", "espresso", "machine", "kitchen"],
    brand: "Nespresso",
    stock: 45,
    thumbnail: "https://picsum.photos/seed/nespresso/400/300",
    stats: { views: 1340, purchases: 310, cartAdds: 490 },
  },
  // Sports
  {
    name: "Peloton Bike+",
    description:
      "The most immersive cycling experience at home. Auto-Follow resistance, rotating screen for off-bike training.",
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
  {
    name: "Garmin Forerunner 265 GPS Watch",
    description:
      "AMOLED display, advanced running dynamics, HRV Status, Training Readiness, up to 15 days battery life.",
    category: "Sports",
    price: 449.99,
    tags: ["watch", "garmin", "gps", "running", "fitness-tracker"],
    brand: "Garmin",
    stock: 28,
    thumbnail: "https://picsum.photos/seed/garmin/400/300",
    stats: { views: 1120, purchases: 145, cartAdds: 260 },
  },
  {
    name: "Bowflex SelectTech 552 Dumbbells",
    description:
      "Adjusts from 5 to 52.5 lbs. Replaces 15 sets of weights. Dial system changes resistance in seconds.",
    category: "Sports",
    price: 429.0,
    originalPrice: 549.0,
    discount: 22,
    tags: ["dumbbells", "bowflex", "weights", "home-gym", "adjustable"],
    brand: "Bowflex",
    stock: 18,
    thumbnail: "https://picsum.photos/seed/bowflex/400/300",
    stats: { views: 940, purchases: 112, cartAdds: 210 },
  },
  {
    name: "Theragun Prime Massage Gun",
    description:
      "Quiet Force Technology, 5 built-in speeds, 16mm amplitude, 150-minute battery, compatible with Therabody app.",
    category: "Sports",
    price: 299.0,
    tags: ["massage-gun", "theragun", "recovery", "muscle", "fitness"],
    brand: "Theragun",
    stock: 35,
    thumbnail: "https://picsum.photos/seed/theragun/400/300",
    stats: { views: 870, purchases: 165, cartAdds: 290 },
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
  {
    name: "Charlotte Tilbury Pillow Talk Lipstick",
    description:
      "The iconic cult nude-pink lipstick. Buildable color, moisturizing formula, satin-matte finish, all-day wear.",
    category: "Beauty",
    price: 39.0,
    tags: ["lipstick", "charlotte-tilbury", "makeup", "nude", "cult-product"],
    brand: "Charlotte Tilbury",
    stock: 80,
    thumbnail: "https://picsum.photos/seed/lipstick/400/300",
    stats: { views: 1560, purchases: 430, cartAdds: 680 },
  },
  {
    name: "The Ordinary Niacinamide 10% + Zinc 1%",
    description:
      "High-strength vitamin and mineral blemish formula. Reduces appearance of blemishes and congestion. Brightens skin tone.",
    category: "Beauty",
    price: 8.9,
    tags: ["skincare", "niacinamide", "serum", "blemish", "the-ordinary"],
    brand: "The Ordinary",
    stock: 200,
    thumbnail: "https://picsum.photos/seed/theordinary/400/300",
    stats: { views: 3400, purchases: 1200, cartAdds: 1800 },
  },
  {
    name: "Olaplex No. 3 Hair Perfector",
    description:
      "At-home treatment that reduces breakage and strengthens hair. Apply before shampooing for best results.",
    category: "Beauty",
    price: 30.0,
    tags: ["hair-care", "olaplex", "treatment", "repair", "bond-building"],
    brand: "Olaplex",
    stock: 110,
    thumbnail: "https://picsum.photos/seed/olaplex/400/300",
    stats: { views: 1890, purchases: 540, cartAdds: 820 },
  },
  {
    name: "NARS Radiant Creamy Concealer",
    description:
      "Full coverage, lightweight formula, 24-hour wear, controls oil, suitable for all skin types. 30 shades.",
    category: "Beauty",
    price: 32.0,
    tags: ["concealer", "nars", "makeup", "coverage", "longwear"],
    brand: "NARS",
    stock: 90,
    thumbnail: "https://picsum.photos/seed/narsconceal/400/300",
    stats: { views: 1340, purchases: 380, cartAdds: 560 },
  },
  // Toys & Gaming
  {
    name: "PlayStation 5 Console",
    description:
      "Play has no limits. Lightning-fast loading, haptic feedback, adaptive triggers, and stunning 4K gaming.",
    category: "Toys & Gaming",
    price: 499.99,
    tags: ["playstation", "ps5", "gaming", "console", "4k"],
    brand: "Sony",
    stock: 12,
    isFeatured: true,
    thumbnail:
      "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.Zczg1gW4wdrmXCan5I7vugHaE8%3Fpid%3DApi&f=1&ipt=1c9279ccfad2ebaedb7057da8cdcf0b434373014276ea34c112482181ad7fcfc&ipo=images",
    stats: { views: 4200, purchases: 98, cartAdds: 320 },
  },
  {
    name: "Nintendo Switch OLED",
    description:
      "7-inch OLED screen, enhanced audio, wide adjustable stand, 64GB internal storage. Play at home or on the go.",
    category: "Toys & Gaming",
    price: 349.99,
    tags: ["nintendo", "switch", "gaming", "portable", "oled"],
    brand: "Nintendo",
    stock: 25,
    isFeatured: true,
    thumbnail: "https://picsum.photos/seed/switcholed/400/300",
    stats: { views: 2890, purchases: 210, cartAdds: 480 },
  },
  {
    name: "LEGO Technic Bugatti Chiron (42083)",
    description:
      "3599 pieces, 1:8 scale, moving W16 engine, functional gearbox, working steering, display stand.",
    category: "Toys & Gaming",
    price: 369.99,
    originalPrice: 449.99,
    discount: 18,
    tags: ["lego", "technic", "bugatti", "building", "collectible"],
    brand: "LEGO",
    stock: 8,
    thumbnail: "https://picsum.photos/seed/legobugatti/400/300",
    stats: { views: 1560, purchases: 45, cartAdds: 185 },
  },
  {
    name: "Razer DeathAdder V3 Pro Mouse",
    description:
      "Ultra-lightweight 63g, 30K DPI Focus Pro sensor, 90-hour battery, HyperSpeed wireless, 5 programmable buttons.",
    category: "Toys & Gaming",
    price: 149.99,
    tags: ["gaming-mouse", "razer", "wireless", "esports", "lightweight"],
    brand: "Razer",
    stock: 45,
    thumbnail: "https://picsum.photos/seed/razermouse/400/300",
    stats: { views: 1120, purchases: 210, cartAdds: 380 },
  },
  // Food & Supplements
  {
    name: "Optimum Nutrition Gold Standard Whey",
    description:
      "24g of blended protein per serving, 5.5g of naturally occurring BCAAs, 4g of glutamine, low sugar, 30 servings.",
    category: "Food & Supplements",
    price: 54.99,
    originalPrice: 64.99,
    discount: 15,
    tags: ["protein", "whey", "gym", "muscle", "nutrition", "supplement"],
    brand: "Optimum Nutrition",
    stock: 90,
    thumbnail: "https://picsum.photos/seed/wheyprotein/400/300",
    stats: { views: 2100, purchases: 680, cartAdds: 950 },
  },
  {
    name: "AG1 by Athletic Greens",
    description:
      "75 vitamins, minerals and whole-food sourced nutrients in one daily serving. Foundational nutrition for overall health.",
    category: "Food & Supplements",
    price: 99.0,
    tags: ["greens", "vitamins", "health", "nutrition", "supplement"],
    brand: "Athletic Greens",
    stock: 60,
    thumbnail: "https://picsum.photos/seed/ag1/400/300",
    stats: { views: 1340, purchases: 310, cartAdds: 520 },
  },
  {
    name: "Bulletproof Original Ground Coffee",
    description:
      "Lab-tested for mycotoxins, single origin, medium roast, works with all brewing methods including French press.",
    category: "Food & Supplements",
    price: 19.95,
    tags: ["coffee", "bulletproof", "ground", "medium-roast", "clean"],
    brand: "Bulletproof",
    stock: 150,
    thumbnail: "https://picsum.photos/seed/bulletproof/400/300",
    stats: { views: 890, purchases: 320, cartAdds: 490 },
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
    name: "Eva Martinez",
    email: "eva@example.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Frank Chen",
    email: "frank@example.com",
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
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Interaction.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    const users = await User.create(SAMPLE_USERS);
    console.log(`✅ Created ${users.length} users`);

    const products = await Product.create(SAMPLE_PRODUCTS);
    console.log(`✅ Created ${products.length} products`);

    // Realistic interactions with category affinity per user
    const actions = [
      "view",
      "view",
      "view",
      "view",
      "cart",
      "cart",
      "purchase",
      "wishlist",
    ];

    const userAffinities = {
      "alice@example.com": ["Electronics", "Beauty"],
      "bob@example.com": ["Electronics", "Sports", "Toys & Gaming"],
      "carol@example.com": ["Books", "Home & Kitchen", "Beauty"],
      "david@example.com": ["Sports", "Food & Supplements", "Clothing"],
      "eva@example.com": ["Beauty", "Clothing", "Books"],
      "frank@example.com": ["Toys & Gaming", "Electronics", "Books"],
    };

    const interactions = [];

    for (const user of users.filter((u) => u.role !== "admin")) {
      const affinity = userAffinities[user.email] || [];
      const preferred = products.filter((p) => affinity.includes(p.category));
      const others = products.filter((p) => !affinity.includes(p.category));

      const preferredSample = preferred
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(preferred.length, 12));
      const randomSample = others.sort(() => 0.5 - Math.random()).slice(0, 5);
      const combined = [...preferredSample, ...randomSample];

      for (const product of combined) {
        const numInteractions = affinity.includes(product.category)
          ? Math.floor(Math.random() * 3) + 1
          : 1;

        for (let i = 0; i < numInteractions; i++) {
          interactions.push({
            userId: user._id,
            productId: product._id,
            action: actions[Math.floor(Math.random() * actions.length)],
            timestamp: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
          });
        }
      }
    }

    await Interaction.create(interactions);
    console.log(`✅ Created ${interactions.length} interactions`);

    const categories = [...new Set(SAMPLE_PRODUCTS.map((p) => p.category))];
    console.log(
      `\n📦 ${products.length} products across ${categories.length} categories:`,
    );
    categories.forEach((cat) => {
      const count = SAMPLE_PRODUCTS.filter((p) => p.category === cat).length;
      console.log(`   ${cat}: ${count} products`);
    });

    console.log("\n📋 Login Credentials:");
    console.log("  User:  alice@example.com  / password123");
    console.log("  User:  bob@example.com    / password123");
    console.log("  Admin: admin@example.com  / admin123");

    await mongoose.connection.close();
    console.log("\n✅ Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seed();
