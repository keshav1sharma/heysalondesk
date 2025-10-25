const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerContext: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "unresolved"],
      default: "pending",
    },
    answer: String,
    supervisorNotes: String,
    timeoutAt: {
      type: Date,
    },
    resolvedAt: Date,
    memoryId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
helpRequestSchema.index({ status: 1, createdAt: -1 });
helpRequestSchema.index({ timeoutAt: 1 });

module.exports = mongoose.model("HelpRequest", helpRequestSchema);
