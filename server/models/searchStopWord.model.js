import mongoose from "mongoose";
import { normalizeSearchText } from "../utils/searchEngine.js";

const searchStopWordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      unique: true,
    },
    normalizedWord: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    language: {
      type: String,
      enum: ["english", "hindi", "roman-hindi", "mixed"],
      default: "english",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    frequency: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

searchStopWordSchema.pre("validate", function setNormalized(next) {
  this.normalizedWord = normalizeSearchText(this.word);
  next();
});

searchStopWordSchema.index({ language: 1, isActive: 1 });

export default mongoose.model("SearchStopWord", searchStopWordSchema);
