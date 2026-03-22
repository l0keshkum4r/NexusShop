const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["view", "cart", "purchase", "wishlist", "review", "search_click"],
    },
    // Weight for recommendation scoring
    weight: {
      type: Number,
      default: 1,
    },
    metadata: {
      // For search_click: the query used
      searchQuery: String,
      // For review: the rating
      rating: Number,
      // For purchase: order value
      orderValue: Number,
      // Session info
      sessionId: String,
      duration: Number, // time spent viewing (seconds)
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for user-product interaction lookup
interactionSchema.index({ userId: 1, productId: 1, action: 1 });
interactionSchema.index({ productId: 1, action: 1, timestamp: -1 });

// Assign weight based on action type
interactionSchema.pre("save", function (next) {
  const weights = {
    view: 1,
    search_click: 2,
    wishlist: 3,
    cart: 4,
    review: 4,
    purchase: 5,
  };
  this.weight = weights[this.action] || 1;
  next();
});

const Interaction = mongoose.model("Interaction", interactionSchema);

module.exports = { Interaction };
