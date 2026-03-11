import { Router } from 'express'
import {addReview, authWithGoogle, changePasswordController, createSellerByAdminController, deleteMultiple, deleteUser, forgotPasswordController, getAllReviews, getAllUsers, getReviews, loginUserController, logoutController, refreshToken, registerUserController, removeImageFromCloudinary, resetpassword, resendOtpController, updateUserAccessByAdminController, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../controllers/user.controller.js';
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
userRouter.get('/getAllReviews',getAllReviews);
userRouter.get('/getAllUsers',auth,authorizeRole('ADMIN'),getAllUsers);
userRouter.delete('/deleteMultiple',auth,authorizeRole('ADMIN'),deleteMultiple);
userRouter.delete('/deleteUser/:id',auth,authorizeRole('ADMIN'),deleteUser);


export default userRouter