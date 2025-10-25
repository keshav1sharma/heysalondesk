const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["hours", "services", "pricing", "location", "booking", "other"],
      default: "other",
      index: true,
    },
    tags: [String],
    source: {
      type: String,
      enum: ["initial", "learned"],
      default: "learned",
    },
    sourceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpRequest",
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    memoryId: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
knowledgeBaseSchema.index({ category: 1, isActive: 1 });
knowledgeBaseSchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
