import mongoose from "mongoose";
import { normalizeSearchText } from "../utils/searchEngine.js";

const searchSynonymSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    terms: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 2 && v.length <= 50;
        },
        message: "Terms must be an array with 2-50 items",
      },
    },
    normalizedTerms: {
      type: [String],
      required: true,
    },
    language: {
      type: String,
      enum: ["english", "hindi", "roman-hindi", "mixed"],
      default: "english",
      index: true,
    },
    category: {
      type: String,
      enum: ["product", "brand", "category", "general"],
      default: "general",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

searchSynonymSchema.pre("validate", function setNormalized(next) {
  this.normalizedTerms = this.terms.map((term) => normalizeSearchText(term));
  next();
});

searchSynonymSchema.index({ group: 1, isActive: 1 });
searchSynonymSchema.index({ language: 1, isActive: 1 });
searchSynonymSchema.index({ category: 1, isActive: 1 });
searchSynonymSchema.index({ normalizedTerms: 1 });

export default mongoose.model("SearchSynonym", searchSynonymSchema);
