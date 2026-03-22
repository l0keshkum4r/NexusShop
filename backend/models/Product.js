const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Electronics",
        "Clothing",
        "Books",
        "Home & Kitchen",
        "Sports",
        "Beauty",
        "Toys",
        "Automotive",
        "Food",
        "Other",
      ],
    },
    subcategory: String,
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: Number,
    discount: { type: Number, default: 0, min: 0, max: 100 },
    images: [String],
    thumbnail: String,
    tags: [String], // Used for content-based filtering
    brand: String,
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },

    // Statistics for recommendations
    stats: {
      views: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
      cartAdds: { type: Number, default: 0 },
      wishlistAdds: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },

    reviews: [reviewSchema],

    // Feature vector (set by ML service)
    featureVector: [Number],

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Virtual: effective price after discount
productSchema.virtual("effectivePrice").get(function () {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Update average rating when reviews change
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.stats.averageRating = 0;
    this.stats.reviewCount = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.stats.averageRating = +(total / this.reviews.length).toFixed(1);
    this.stats.reviewCount = this.reviews.length;
  }
};

const Product = mongoose.model("Product", productSchema);

module.exports = { Product };
