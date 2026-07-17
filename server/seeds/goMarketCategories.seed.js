import mongoose from "mongoose";
import GoMarketCategory from "../models/goMarketCategory.model.js";
import GoMarketSubCategory from "../models/goMarketSubCategory.model.js";
import GoMarketSubSubCategory from "../models/goMarketSubSubCategory.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/zeedaddy";

const groceryCategories = [
  {
    name: "Fruits & Vegetables",
    type: "grocery",
    subcategories: [
      {
        name: "Fresh Fruits",
        subSubCategories: ["Apples", "Bananas", "Citrus Fruits", "Berries", "Mangoes", "Melons", "Tropical Fruits", "Seasonal Fruits"]
      },
      {
        name: "Fresh Vegetables",
        subSubCategories: ["Leafy Greens", "Root Vegetables", "Cruciferous Vegetables", "Nightshade Vegetables", "Squash & Gourds", "Fresh Herbs", "Exotic Vegetables"]
      },
      {
        name: "Frozen & Dried",
        subSubCategories: ["Frozen Vegetables", "Frozen Fruits", "Dried Fruits", "Dehydrated Vegetables"]
      }
    ]
  },
  {
    name: "Dairy & Eggs",
    type: "grocery",
    subcategories: [
      {
        name: "Milk & Milk Products",
        subSubCategories: ["Fresh Milk", "Flavored Milk", "Buttermilk", "Condensed Milk", "Cream", "Milk Powder"]
      },
      {
        name: "Cheese",
        subSubCategories: ["Cheddar Cheese", "Mozzarella Cheese", "Processed Cheese", "Cream Cheese", "Parmesan", "Cottage Cheese"]
      },
      {
        name: "Yogurt & Curd",
        subSubCategories: ["Greek Yogurt", "Regular Yogurt", "Flavored Yogurt", "Curd", "Probiotic Drinks"]
      },
      {
        name: "Eggs",
        subSubCategories: ["Chicken Eggs", "Duck Eggs", "Quail Eggs", "Organic Eggs", "Free Range Eggs"]
      },
      {
        name: "Butter & Ghee",
        subSubCategories: ["Salted Butter", "Unsalted Butter", "Clarified Butter", "Ghee", "Margarine"]
      }
    ]
  },
  {
    name: "Bakery & Cakes",
    type: "grocery",
    subcategories: [
      {
        name: "Bread & Buns",
        subSubCategories: ["White Bread", "Whole Wheat Bread", "Multigrain Bread", "Burger Buns", "Dinner Rolls", "Pita Bread"]
      },
      {
        name: "Cookies & Biscuits",
        subSubCategories: ["Chocolate Cookies", "Butter Cookies", "Digestive Biscuits", "Cream Biscuits", "Marie Biscuits", "Oatmeal Cookies"]
      },
      {
        name: "Cakes & Pastries",
        subSubCategories: ["Chocolate Cake", "Vanilla Cake", "Fruit Cake", "Cheesecake", "Pastries", "Muffins"]
      },
      {
        name: "Bakery Snacks",
        subSubCategories: ["Croissants", "Donuts", "Bagels", "Puffs", "Scones", "Brownies"]
      }
    ]
  },
  {
    name: "Staples",
    type: "grocery",
    subcategories: [
      {
        name: "Rice & Rice Products",
        subSubCategories: ["Basmati Rice", "Brown Rice", "White Rice", "Parboiled Rice", "Rice Flour", "Poha"]
      },
      {
        name: "Flour & Grains",
        subSubCategories: ["Wheat Flour", "All Purpose Flour", "Besan", "Corn Flour", "Oats", "Quinoa", "Millets"]
      },
      {
        name: "Dals & Pulses",
        subSubCategories: ["Toor Dal", "Moong Dal", "Chana Dal", "Urad Dal", "Masoor Dal", "Rajma", "Chickpeas"]
      },
      {
        name: "Edible Oil",
        subSubCategories: ["Sunflower Oil", "Olive Oil", "Mustard Oil", "Coconut Oil", "Ghee", "Peanut Oil"]
      },
      {
        name: "Salt & Sugar",
        subSubCategories: ["Table Salt", "Rock Salt", "Black Salt", "White Sugar", "Brown Sugar", "Jaggery", "Honey"]
      }
    ]
  },
  {
    name: "Snacks & Beverages",
    type: "grocery",
    subcategories: [
      {
        name: "Chips & Namkeen",
        subSubCategories: ["Potato Chips", "Banana Chips", "Namkeen", "Puffs", "Popcorn", "Pretzels"]
      },
      {
        name: "Biscuits & Cookies",
        subSubCategories: ["Cream Biscuits", "Marie Biscuits", "Cookies", "Crackers", "Digestive Biscuits"]
      },
      {
        name: "Tea & Coffee",
        subSubCategories: ["Green Tea", "Black Tea", "Herbal Tea", "Instant Coffee", "Ground Coffee", "Chai Masala"]
      },
      {
        name: "Soft Drinks & Juices",
        subSubCategories: ["Cola", "Orange Juice", "Apple Juice", "Energy Drinks", "Soda", "Mocktails"]
      },
      {
        name: "Health Drinks",
        subSubCategories: ["Protein Shakes", "Energy Drinks", "Health Supplements", "Malt Drinks", "Smoothies"]
      }
    ]
  },
  {
    name: "Personal Care",
    type: "grocery",
    subcategories: [
      {
        name: "Hair Care",
        subSubCategories: ["Shampoo", "Conditioner", "Hair Oil", "Hair Serum", "Hair Masks", "Dandruff Treatment"]
      },
      {
        name: "Skin Care",
        subSubCategories: ["Face Wash", "Moisturizer", "Sunscreen", "Face Cream", "Body Lotion", "Face Masks"]
      },
      {
        name: "Oral Care",
        subSubCategories: ["Toothpaste", "Toothbrush", "Mouthwash", "Dental Floss", "Teeth Whitening"]
      },
      {
        name: "Bath & Body",
        subSubCategories: ["Body Wash", "Soap", "Shower Gel", "Body Scrub", "Bath Salts", "Loofah"]
      }
    ]
  },
  {
    name: "Household Supplies",
    type: "grocery",
    subcategories: [
      {
        name: "Cleaning Supplies",
        subSubCategories: ["Detergent", "Dish Soap", "Floor Cleaner", "Toilet Cleaner", "Glass Cleaner", "Disinfectant"]
      },
      {
        name: "Paper Products",
        subSubCategories: ["Toilet Paper", "Paper Towels", "Tissues", "Napkins", "Facial Tissue"]
      },
      {
        name: "Kitchen Supplies",
        subSubCategories: ["Aluminum Foil", "Cling Wrap", "Kitchen Towels", "Sponges", "Trash Bags"]
      },
      {
        name: "Pest Control",
        subSubCategories: ["Insect Repellent", "Mosquito Nets", "Rat Traps", "Ant Control", "Cockroach Control"]
      }
    ]
  }
];

const restaurantCategories = [
  {
    name: "Appetizers & Starters",
    type: "restaurant",
    subcategories: [
      {
        name: "Cold Starters",
        subSubCategories: ["Salads", "Cold Cuts", "Dips & Spreads", "Bruschetta", "Canapés", "Cheese Platters"]
      },
      {
        name: "Hot Starters",
        subSubCategories: ["Soups", "Spring Rolls", "Samosas", "Chicken Wings", "Fried Snacks", "Grilled Items"]
      },
      {
        name: "Seafood Starters",
        subSubCategories: ["Shrimp Cocktails", "Calamari", "Fish Bites", "Crab Cakes", "Oysters", "Scallops"]
      }
    ]
  },
  {
    name: "Main Course",
    type: "restaurant",
    subcategories: [
      {
        name: "Indian Curries",
        subSubCategories: ["Butter Chicken", "Paneer Tikka Masala", "Dal Makhani", "Rogan Josh", "Palak Paneer", "Biryani"]
      },
      {
        name: "Chinese Dishes",
        subSubCategories: ["Fried Rice", "Noodles", "Manchurian", "Chilli Chicken", "Spring Rolls", "Dim Sums"]
      },
      {
        name: "Italian Cuisine",
        subSubCategories: ["Pasta", "Pizza", "Risotto", "Lasagna", "Carbonara", "Bruschetta"]
      },
      {
        name: "Continental",
        subSubCategories: ["Steak", "Grilled Chicken", "Fish & Chips", "Roasted Lamb", "Mashed Potatoes", "Vegetable Gratin"]
      },
      {
        name: "Thai Cuisine",
        subSubCategories: ["Pad Thai", "Tom Yum Soup", "Green Curry", "Red Curry", "Spring Rolls", "Satay"]
      },
      {
        name: "Mexican Food",
        subSubCategories: ["Tacos", "Burritos", "Quesadillas", "Nachos", "Enchiladas", "Guacamole"]
      }
    ]
  },
  {
    name: "Breads & Rice",
    type: "restaurant",
    subcategories: [
      {
        name: "Indian Breads",
        subSubCategories: ["Naan", "Roti", "Paratha", "Kulcha", "Puri", "Bhatura"]
      },
      {
        name: "Rice Dishes",
        subSubCategories: ["Biryani", "Pulao", "Fried Rice", "Steamed Rice", "Jeera Rice", "Ghee Rice"]
      },
      {
        name: "International Breads",
        subSubCategories: ["Garlic Bread", "Baguette", "Focaccia", "Ciabatta", "Sourdough", "Pita"]
      }
    ]
  },
  {
    name: "Desserts",
    type: "restaurant",
    subcategories: [
      {
        name: "Indian Sweets",
        subSubCategories: ["Gulab Jamun", "Rasgulla", "Kheer", "Jalebi", "Barfi", "Rasmalai"]
      },
      {
        name: "Cakes & Pastries",
        subSubCategories: ["Chocolate Cake", "Cheesecake", "Tiramisu", "Brownies", "Mousse", "Pastries"]
      },
      {
        name: "Ice Creams",
        subSubCategories: ["Vanilla", "Chocolate", "Strawberry", "Butterscotch", "Mango", "Special Flavors"]
      },
      {
        name: "Frozen Desserts",
        subSubCategories: ["Sorbets", "Gelato", "Frozen Yogurt", "Ice Cream Sundaes", "Parfaits"]
      }
    ]
  },
  {
    name: "Beverages",
    type: "restaurant",
    subcategories: [
      {
        name: "Hot Beverages",
        subSubCategories: ["Coffee", "Tea", "Hot Chocolate", "Masala Chai", "Green Tea", "Herbal Tea"]
      },
      {
        name: "Cold Beverages",
        subSubCategories: ["Fresh Juices", "Smoothies", "Milkshakes", "Iced Tea", "Sodas", "Mocktails"]
      },
      {
        name: "Alcoholic Beverages",
        subSubCategories: ["Beer", "Wine", "Cocktails", "Whisky", "Vodka", "Rum"]
      },
      {
        name: "Special Drinks",
        subSubCategories: ["Lassi", "Buttermilk", "Coconut Water", "Sharbats", "Energy Drinks"]
      }
    ]
  },
  {
    name: "Fast Food",
    type: "restaurant",
    subcategories: [
      {
        name: "Burgers",
        subSubCategories: ["Veg Burgers", "Chicken Burgers", "Cheese Burgers", "Double Patty", "Mini Burgers"]
      },
      {
        name: "Pizza",
        subSubCategories: ["Veg Pizza", "Non-Veg Pizza", "Thin Crust", "Pan Pizza", "Stuffed Crust", "Specialty Pizza"]
      },
      {
        name: "Sandwiches & Wraps",
        subSubCategories: ["Club Sandwich", "Grilled Sandwich", "Wraps", "Rolls", "Subs", "Panini"]
      },
      {
        name: "Fried Chicken",
        subSubCategories: ["Chicken Wings", "Chicken Nuggets", "Fried Chicken Bucket", "Popcorn Chicken", "Tenders"]
      }
    ]
  },
  {
    name: "Healthy Options",
    type: "restaurant",
    subcategories: [
      {
        name: "Salads",
        subSubCategories: ["Caesar Salad", "Greek Salad", "Garden Salad", "Fruit Salad", "Protein Salad"]
      },
      {
        name: "Low Calorie",
        subSubCategories: ["Grilled Items", "Steamed Dishes", "Low Carb Options", "Sugar Free Desserts", "Diet Drinks"]
      },
      {
        name: "Vegan Options",
        subSubCategories: ["Vegan Burgers", "Plant Based Meals", "Vegan Desserts", "Tofu Dishes", "Vegan Cheese"]
      }
    ]
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await GoMarketCategory.deleteMany({});
    await GoMarketSubCategory.deleteMany({});
    await GoMarketSubSubCategory.deleteMany({});
    console.log("🗑️ Cleared existing category data");

    // Seed Grocery Categories
    console.log("\n🛒 Seeding Grocery Categories...");
    for (const category of groceryCategories) {
      const newCategory = await GoMarketCategory.create({
        name: category.name,
        type: category.type,
        status: "active"
      });
      console.log(`  ✓ Created category: ${category.name}`);

      for (const sub of category.subcategories) {
        const newSubCategory = await GoMarketSubCategory.create({
          categoryId: newCategory._id,
          parentId: newCategory._id,
          name: sub.name,
          type: category.type,
          status: "active"
        });
        console.log(`    ✓ Created subcategory: ${sub.name}`);

        for (const subSub of sub.subSubCategories) {
          await GoMarketSubSubCategory.create({
            categoryId: newCategory._id,
            subCategoryId: newSubCategory._id,
            name: subSub,
            type: category.type,
            status: "active"
          });
          console.log(`      ✓ Created sub-subcategory: ${subSub}`);
        }
      }
    }

    // Seed Restaurant Categories
    console.log("\n🍽️ Seeding Restaurant Categories...");
    for (const category of restaurantCategories) {
      const newCategory = await GoMarketCategory.create({
        name: category.name,
        type: category.type,
        status: "active"
      });
      console.log(`  ✓ Created category: ${category.name}`);

      for (const sub of category.subcategories) {
        const newSubCategory = await GoMarketSubCategory.create({
          categoryId: newCategory._id,
          parentId: newCategory._id,
          name: sub.name,
          type: category.type,
          status: "active"
        });
        console.log(`    ✓ Created subcategory: ${sub.name}`);

        for (const subSub of sub.subSubCategories) {
          await GoMarketSubSubCategory.create({
            categoryId: newCategory._id,
            subCategoryId: newSubCategory._id,
            name: subSub,
            type: category.type,
            status: "active"
          });
          console.log(`      ✓ Created sub-subcategory: ${subSub}`);
        }
      }
    }

    console.log("\n✅ Category seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`  - Grocery Categories: ${groceryCategories.length}`);
    console.log(`  - Restaurant Categories: ${restaurantCategories.length}`);
    console.log(`  - Total Categories: ${groceryCategories.length + restaurantCategories.length}`);

  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedCategories();
