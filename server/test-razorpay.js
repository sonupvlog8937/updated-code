// Test script to verify Razorpay integration
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

async function testRazorpayConnection() {
  console.log("🧪 Testing Razorpay Integration...\n");

  // Check credentials
  console.log("1️⃣ Checking Razorpay Credentials:");
  console.log("   Key ID:", razorpayInstance.key_id ? "✅ Present" : "❌ Missing");
  console.log("   Key Secret:", razorpayInstance.key_secret ? "✅ Present" : "❌ Missing");
  console.log();

  if (!razorpayInstance.key_id || !razorpayInstance.key_secret) {
    console.error("❌ Razorpay credentials not configured!");
    console.log("\n📝 Add these to your .env file:");
    console.log('RAZORPAY_KEY_ID="your_key_id"');
    console.log('RAZORPAY_KEY_SECRET="your_key_secret"');
    process.exit(1);
  }

  // Test order creation
  try {
    console.log("2️⃣ Testing Order Creation:");
    const options = {
      amount: 100, // ₹1.00 in paise
      currency: "INR",
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        description: "Test order",
        test: true,
      },
    };

    console.log("   Creating test order...");
    const order = await razorpayInstance.orders.create(options);

    console.log("   ✅ Order created successfully!");
    console.log("   Order ID:", order.id);
    console.log("   Amount:", order.amount, "paise (₹" + order.amount / 100 + ")");
    console.log("   Currency:", order.currency);
    console.log("   Status:", order.status);
    console.log();

    console.log("✅ All tests passed! Razorpay is configured correctly.");
    console.log("\n🎉 You can now use Razorpay in your application!");
  } catch (error) {
    console.error("❌ Order creation failed!");
    console.error("   Error:", error.message);
    console.log("\n🔍 Possible issues:");
    console.log("   - Invalid Razorpay credentials");
    console.log("   - Network connectivity issues");
    console.log("   - Razorpay API is down");
    process.exit(1);
  }
}

testRazorpayConnection();
