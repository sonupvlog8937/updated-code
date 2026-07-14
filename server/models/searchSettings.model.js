import mongoose from "mongoose";

const searchSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ["number", "string", "boolean", "object", "array"],
      required: true,
    },
    category: {
      type: String,
      enum: ["ranking", "performance", "features", "limits", "caching"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

searchSettingsSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("SearchSettings", searchSettingsSchema);
