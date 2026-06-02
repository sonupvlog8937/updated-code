import mongoose from "mongoose";
import dotenv from "dotenv";
import GroceryProduct from "./models/groceryProduct.model.js";
import RestaurantItem from "./models/restaurantItem.model.js";

dotenv.config();

const removeDeliveryAreaFromSpecs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Remove "Delivery area" from grocery products
    const groceryResult = await GroceryProduct.updateMany(
      { "specifications.key": "Delivery area" },
      { $pull: { specifications: { key: "Delivery area" } } }
    );
    console.log(`✅ Updated ${groceryResult.modifiedCount} grocery products`);

    // Remove "Delivery area" from restaurant items (if any)
    const restaurantResult = await RestaurantItem.updateMany(
      { "specifications.key": "Delivery area" },
      { $pull: { specifications: { key: "Delivery area" } } }
    );
    console.log(`✅ Updated ${restaurantResult.modifiedCount} restaurant items`);

    console.log("\n✅ Successfully removed all 'Delivery area' specifications!");
    
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

removeDeliveryAreaFromSpecs();
