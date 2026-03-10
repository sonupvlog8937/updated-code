import { Router } from "express";
import {
  addReview, authWithGoogle, changePasswordController, deleteMultiple,
  deleteUser, forgotPasswordController, getAllReviews, getAllUsers,
  getReviews, loginUserController, logoutController, refreshToken,
  registerUserController, removeImageFromCloudinary, resetpassword,
  resendOtpController, updateUserDetails, userAvatarController,
  userDetails, verifyEmailController, verifyForgotPasswordOtp
} from "../controllers/user.controller.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { handleMulterError } from "../middlewares/multer.js";
import {
  registerValidator, loginValidator, otpValidator,
  forgotPasswordValidator, resetPasswordValidator, validate
} from "../middlewares/Validators.js";

const userRouter = Router();

// ─── Auth (no auth needed) ────────────────────────────────────────────────────
userRouter.post("/register", registerValidator, validate, registerUserController);
userRouter.post("/verify-email", otpValidator, validate, verifyEmailController);
userRouter.post("/resend-otp", forgotPasswordValidator, validate, resendOtpController);
userRouter.post("/login", loginValidator, validate, loginUserController);
userRouter.post("/authWithGoogle", authWithGoogle);
userRouter.post("/forgot-password", forgotPasswordValidator, validate, forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", otpValidator, validate, verifyForgotPasswordOtp);
userRouter.post("/reset-password", resetPasswordValidator, validate, resetpassword);
userRouter.post("/forgot-password/change-password", changePasswordController);
userRouter.post("/refresh-token", refreshToken);

// ─── Auth required ────────────────────────────────────────────────────────────
userRouter.get("/logout", auth, logoutController);
userRouter.get("/user-details", auth, userDetails);
userRouter.put("/:id", auth, updateUserDetails);

// Avatar upload
userRouter.put("/user-avatar", auth, upload.array("avatar", 1), handleMulterError, userAvatarController);
userRouter.delete("/deteleImage", auth, removeImageFromCloudinary);

// Reviews
userRouter.post("/addReview", auth, addReview);
userRouter.get("/getReviews", getReviews);
userRouter.get("/getAllReviews", getAllReviews);

// Admin
userRouter.get("/getAllUsers", auth, getAllUsers);
userRouter.delete("/deleteMultiple", auth, deleteMultiple);
userRouter.delete("/deleteUser/:id", auth, deleteUser);

export default userRouter;