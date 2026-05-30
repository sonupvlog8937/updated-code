// Simple verification script for Razorpay credentials
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Verifying Razorpay Credentials...\n");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log("Key ID from .env:", keyId);
console.log("Key Secret from .env:", keySecret ? "***" + keySecret.slice(-4) : "MISSING");
console.log();

if (!keyId || !keySecret) {
  console.error("❌ Razorpay credentials are missing in .env file!");
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

console.log("📝 Testing Razorpay API...");

razorpay.orders
  .create({
    amount: 100, // ₹1 in paise
    currency: "INR",
    receipt: "test_" + Date.now(),
  })
  .then((order) => {
    console.log("✅ SUCCESS! Razorpay credentials are valid!");
    console.log("Order ID:", order.id);
    console.log("Amount:", order.amount, "paise");
    console.log("\n🎉 You can now use Razorpay in your app!");
  })
  .catch((error) => {
    console.error("❌ FAILED! Razorpay authentication error!");
    console.error("Error:", error.error);
    console.log("\n🔧 Possible solutions:");
    console.log("1. Check if your Razorpay Key ID and Secret are correct");
    console.log("2. Login to https://dashboard.razorpay.com/");
    console.log("3. Go to Settings > API Keys");
    console.log("4. Generate new test keys if needed");
    console.log("5. Update your .env file with correct credentials");
  });
