const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "SECRET_KEY_ACCESS_TOKEN",
  "SECRET_KEY_REFRESH_TOKEN",
  "PORT",
  "cloudinary_Config_Cloud_Name",
  "cloudinary_Config_api_key",
  "cloudinary_Config_api_secret",
  "RESEND_API_KEY",   // ✅ Added - sendEmail.js uses this
];

const PRODUCTION_ONLY_REQUIRED = [
  "STORE_NAME",
  "FRONTEND_URL",
  "SMTP_USER",        // ✅ Fixed: was EMAIL - matches actual .env key
  "SMTP_PASS",        // ✅ Fixed: was EMAIL_PASS - matches actual .env key
];

// ✅ NEW: Warn about weak JWT secrets
function checkJwtStrength() {
  const accessSecret = process.env.SECRET_KEY_ACCESS_TOKEN || "";
  const refreshSecret = process.env.SECRET_KEY_REFRESH_TOKEN || "";

  const warnings = [];
  if (accessSecret.length < 32) {
    warnings.push("SECRET_KEY_ACCESS_TOKEN is too weak! Use: openssl rand -base64 32");
  }
  if (refreshSecret.length < 32) {
    warnings.push("SECRET_KEY_REFRESH_TOKEN is too weak! Use: openssl rand -base64 32");
  }

  if (warnings.length > 0 && process.env.NODE_ENV === "production") {
    console.error("⚠️  WEAK JWT SECRETS DETECTED:");
    warnings.forEach((w) => console.error(`   - ${w}`));
    process.exit(1); // Refuse to start in production with weak secrets
  } else if (warnings.length > 0) {
    console.warn("⚠️  WARNING: Weak JWT secrets detected. Fix before deploying to production.");
  }
}

export function validateEnv() {
  const missing = [];
  const isProduction = process.env.NODE_ENV === "production";

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (isProduction) {
    for (const key of PRODUCTION_ONLY_REQUIRED) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nPlease add these to your .env file and restart.");
    process.exit(1);
  }

  checkJwtStrength();
  console.log("✅ Environment variables validated");
}