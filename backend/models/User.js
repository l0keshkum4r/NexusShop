const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    // Cart: array of { productId, quantity }
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    // Wishlist: array of product IDs
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Recently viewed products (last 20)
    viewedProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    // Search history
    searchHistory: [
      {
        query: String,
        searchedAt: { type: Date, default: Date.now },
      },
    ],
    preferences: {
      categories: [String],
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100000 },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add to viewed products (keep last 20, no duplicates)
userSchema.methods.addViewedProduct = function (productId) {
  const pid = productId.toString();
  // Remove if already exists
  this.viewedProducts = this.viewedProducts.filter(
    (v) => v.productId.toString() !== pid,
  );
  // Add to beginning
  this.viewedProducts.unshift({ productId, viewedAt: new Date() });
  // Keep only last 20
  if (this.viewedProducts.length > 20) {
    this.viewedProducts = this.viewedProducts.slice(0, 20);
  }
};

// Safe JSON representation (no password)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);

module.exports = { User };
