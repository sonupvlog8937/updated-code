import { Router } from 'express'
import {addReview, approveWalletRequest, authWithGoogle, changePasswordController, createSellerByAdminController, createWalletRequest, deleteMultiple, deleteUser, forgotPasswordController, getAllReviews, getAllUsers, getCommissionOverview, getReviews, getSellerStoreProfile, loginUserController, logoutController, refreshToken, registerUserController, removeImageFromCloudinary, resetpassword, resendOtpController, updateUserAccessByAdminController, updateUserDetails, upsertSellerStoreProfile, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp, registerSellerController} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.js';
import auth from '../middlewares/auth.js';
import authorizeRole from '../middlewares/authorizeRole.js';

const userRouter = Router()
userRouter.post('/register',registerUserController)
userRouter.post('/verify-email', verifyEmailController)
userRouter.post('/resend-otp',resendOtpController)
userRouter.post('/login',loginUserController)
userRouter.post('/authWithGoogle',authWithGoogle)
userRouter.get('/logout',auth,logoutController);
userRouter.put('/user-avatar',auth,upload.array('avatar'),userAvatarController);
userRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
userRouter.put('/:id',auth,updateUserDetails);
userRouter.post('/forgot-password',forgotPasswordController)
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp)
userRouter.post('/reset-password',resetpassword)
userRouter.post('/forgot-password/change-password',changePasswordController)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/user-details',auth,userDetails);
userRouter.post('/create-seller',auth,authorizeRole('ADMIN'),createSellerByAdminController);
userRouter.put('/admin/user-access',auth,authorizeRole('ADMIN'),updateUserAccessByAdminController);
userRouter.post('/addReview',auth,addReview);
userRouter.get('/getReviews',getReviews);
userRouter.get('/getAllReviews',auth,authorizeRole('ADMIN','SELLER'),getAllReviews);
userRouter.get('/getAllUsers',auth,authorizeRole('ADMIN'),getAllUsers);
userRouter.delete('/deleteMultiple',auth,authorizeRole('ADMIN'),deleteMultiple);
userRouter.delete('/deleteUser/:id',auth,authorizeRole('ADMIN'),deleteUser);

userRouter.put('/seller/store-profile',auth,authorizeRole('SELLER','USER'),upsertSellerStoreProfile);
userRouter.get('/seller/store-profile',auth,authorizeRole('SELLER','USER'),getSellerStoreProfile);
userRouter.get('/seller/store-profile/:sellerId',getSellerStoreProfile);
userRouter.get('/wallet/overview',auth,authorizeRole('ADMIN','SELLER'),getCommissionOverview);
userRouter.get('/seller/commission',auth,authorizeRole('SELLER'),getCommissionOverview);
userRouter.post('/wallet/request',auth,authorizeRole('SELLER'),createWalletRequest);
userRouter.put('/wallet/request/approve',auth,authorizeRole('ADMIN'),approveWalletRequest);
userRouter.post('/register-seller', registerSellerController);

export default userRouter