import { body, param, query, validationResult } from "express-validator";

// ─── Validation Error Handler ─────────────────────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      success: false,
      message: errors.array()[0].msg, // First error message
      errors: errors.array(),
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
export const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must have uppercase, lowercase and number"),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

export const otpValidator = [
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
    .isNumeric().withMessage("OTP must be numeric"),
];

export const forgotPasswordValidator = [
  body("email").trim().isEmail().withMessage("Valid email required"),
];

export const resetPasswordValidator = [
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// ─── Product Validators ───────────────────────────────────────────────────────
export const createProductValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Product name is required")
    .isLength({ max: 200 }).withMessage("Product name too long"),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required"),

  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

  body("countInStock")
    .notEmpty().withMessage("Stock count is required")
    .isInt({ min: 0 }).withMessage("Stock must be 0 or more"),

  body("discount")
    .notEmpty().withMessage("Discount is required")
    .isFloat({ min: 0, max: 100 }).withMessage("Discount must be 0-100"),
];

// ─── Seller Validators ────────────────────────────────────────────────────────
export const sellerRegisterValidator = [
  body("storeName")
    .trim()
    .notEmpty().withMessage("Store name is required")
    .isLength({ min: 3, max: 60 }).withMessage("Store name must be 3-60 characters")
    .matches(/^[a-zA-Z0-9\s\-_&.]+$/).withMessage("Store name has invalid characters"),

  body("mobile")
    .optional()
    .isMobilePhone("en-IN").withMessage("Invalid Indian mobile number"),

  body("bankDetails.accountNumber")
    .optional()
    .isLength({ min: 9, max: 18 }).withMessage("Invalid account number"),

  body("bankDetails.ifscCode")
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage("Invalid IFSC code format"),
];

// ─── Order Validators ─────────────────────────────────────────────────────────
export const createOrderValidator = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("products").isArray({ min: 1 }).withMessage("Products array is required"),
  body("totalAmt")
    .notEmpty().withMessage("Total amount is required")
    .isFloat({ min: 1 }).withMessage("Total amount must be positive"),
  body("delivery_address").notEmpty().withMessage("Delivery address is required"),
];

// ─── Payout Validators ────────────────────────────────────────────────────────
export const payoutRequestValidator = [
  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 100 }).withMessage("Minimum payout amount is ₹100"),
  body("paymentMethod")
    .optional()
    .isIn(["bank", "upi"]).withMessage("Payment method must be 'bank' or 'upi'"),
];

// ─── ID Param Validator ───────────────────────────────────────────────────────
export const mongoIdValidator = (paramName = "id") => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
];