import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import ReviewModel from '../models/reviews.model.js';
import ProductModel from '../models/product.modal.js';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});


// ─── Register Controller ──────────────────────────────────────────────────────
export async function registerUserController(request, response) {
    try {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Please provide name, email and password",
                error: true,
                success: false
            });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            // Agar user hai but verify nahi kiya → naya OTP bhejo
            if (existingUser.verify_email === false) {
                const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                existingUser.otp = newOtp;
                existingUser.otpExpires = Date.now() + 10 * 60 * 1000;
                await existingUser.save();

                sendEmailFun({
                    sendTo: email,
                    subject: `Verify your email – ${process.env.STORE_NAME || 'MyStore'}`,
                    text: `Your OTP is: ${newOtp}. It expires in 10 minutes.`,
                    html: VerificationEmail(existingUser.name, newOtp)
                }).catch((err) => console.error('Verification email error:', err));

                return response.status(200).json({
                    success: true,
                    error: false,
                    message: "OTP resent! Please check your email to verify your account.",
                });
            }

            return response.json({
                message: "User already registered with this email",
                error: true,
                success: false
            });
        }

        // Generate 6-digit OTP
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const user = new UserModel({
            email,
            password: hashPassword,
            name,
            otp: verifyCode,
            otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
            verify_email: false,
        });

        await user.save();

        // Send verification email (non-blocking)
        sendEmailFun({
            sendTo: email,
            subject: `Verify your email – ${process.env.STORE_NAME || 'MyStore'}`,
            text: `Your OTP is: ${verifyCode}. It expires in 10 minutes.`,
            html: VerificationEmail(name, verifyCode)
        }).catch((err) => console.error('Verification email error:', err));

        return response.status(200).json({
            success: true,
            error: false,
            message: "Registered successfully! Please check your email to verify your account.",
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


// ─── Verify Email Controller ──────────────────────────────────────────────────
// Route: POST /api/user/verify-email   ← frontend dono jagah yahi call karta hai
export async function verifyEmailController(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Email and OTP are required"
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({ error: true, success: false, message: "User not found" });
        }

        if (user.verify_email === true) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Email is already verified. Please login."
            });
        }

        const isCodeValid  = user.otp === otp;
        const isNotExpired = user.otpExpires > Date.now();

        if (isCodeValid && isNotExpired) {
            user.verify_email = true;
            user.otp          = null;
            user.otpExpires   = null;
            await user.save();

            // Auto-login after verification
            const accesstoken    = await generatedAccessToken(user._id);
            const refreshToken   = await generatedRefreshToken(user._id);

            await UserModel.findByIdAndUpdate(user._id, { last_login_date: new Date() });

            const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
            response.cookie('accessToken', accesstoken, cookiesOption);
            response.cookie('refreshToken', refreshToken, cookiesOption);

            return response.status(200).json({
                error: false,
                success: true,
                message: "Email verified successfully! You are now logged in.",
                data: { accesstoken, refreshToken }
            });

        } else if (!isCodeValid) {
            return response.status(400).json({ error: true, success: false, message: "Invalid OTP" });
        } else {
            return response.status(400).json({ error: true, success: false, message: "OTP expired. Please request a new one." });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


// ─── Resend OTP Controller ────────────────────────────────────────────────────
// Route: POST /api/user/resend-otp
export async function resendOtpController(request, response) {
    try {
        const { email } = request.body;

        if (!email) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Email is required"
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(404).json({
                error: true,
                success: false,
                message: "User not found with this email"
            });
        }

        if (user.verify_email === true) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Email is already verified"
            });
        }

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp        = newOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        sendEmailFun({
            sendTo: email,
            subject: `Your new OTP – ${process.env.STORE_NAME || 'MyStore'}`,
            text: `Your new OTP is: ${newOtp}. It expires in 10 minutes.`,
            html: VerificationEmail(user.name, newOtp)
        }).catch((err) => console.error('Resend OTP email error:', err));

        return response.status(200).json({
            error: false,
            success: true,
            message: "New OTP sent to your email!"
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


// ─── Google Auth ──────────────────────────────────────────────────────────────
export async function authWithGoogle(request, response) {
    const { name, email, password, avatar, mobile, role } = request.body;

    try {
        const existingUser = await UserModel.findOne({ email });

        if (!existingUser) {
            const user = await UserModel.create({
                name, mobile, email,
                password: "null",
                avatar, role,
                verify_email: true,
                signUpWithGoogle: true
            });

            await user.save();

            const accesstoken  = await generatedAccessToken(user._id);
            const refreshToken = await generatedRefreshToken(user._id);
            await UserModel.findByIdAndUpdate(user._id, { last_login_date: new Date() });

            const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
            response.cookie('accessToken', accesstoken, cookiesOption);
            response.cookie('refreshToken', refreshToken, cookiesOption);

            return response.json({
                message: "Login successfully",
                error: false, success: true,
                data: { accesstoken, refreshToken }
            });

        } else {
            const accesstoken  = await generatedAccessToken(existingUser._id);
            const refreshToken = await generatedRefreshToken(existingUser._id);
            await UserModel.findByIdAndUpdate(existingUser._id, { last_login_date: new Date() });

            const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
            response.cookie('accessToken', accesstoken, cookiesOption);
            response.cookie('refreshToken', refreshToken, cookiesOption);

            return response.json({
                message: "Login successfully",
                error: false, success: true,
                data: { accesstoken, refreshToken }
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Login Controller ─────────────────────────────────────────────────────────
export async function loginUserController(request, response) {
    try {
        const { email, password } = request.body;

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "User not registered",
                error: true, success: false
            });
        }

        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Contact to admin",
                error: true, success: false
            });
        }

        if (user.verify_email !== true) {
            return response.status(400).json({
                message: "Your email is not verified yet. Please verify your email first.",
                error: true, success: false
            });
        }

        const checkPassword = await bcryptjs.compare(password, user.password);
        if (!checkPassword) {
            return response.status(400).json({
                message: "Incorrect password",
                error: true, success: false
            });
        }

        const accesstoken  = await generatedAccessToken(user._id);
        const refreshToken = await generatedRefreshToken(user._id);
        await UserModel.findByIdAndUpdate(user._id, { last_login_date: new Date() });

        const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
        response.cookie('accessToken', accesstoken, cookiesOption);
        response.cookie('refreshToken', refreshToken, cookiesOption);

        return response.json({
            message: "Login successfully",
            error: false, success: true,
            data: { accesstoken, refreshToken }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}

export async function createSellerByAdminController(request, response) {
    try {
        const { name, email, password, mobile } = request.body;

        if (!name || !email || !password) {
            return response.status(400).json({
                message: "Please provide name, email and password",
                error: true,
                success: false,
            });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return response.status(400).json({
                message: "User already registered with this email",
                error: true,
                success: false,
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const seller = await UserModel.create({
            name,
            email,
            mobile: mobile || null,
            password: hashPassword,
            role: "SELLER",
            verify_email: true,
            status: "Active",
        });

        return response.status(200).json({
            message: "Seller created successfully",
            error: false,
            success: true,
            seller,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function updateUserAccessByAdminController(request, response) {
    try {
        const { userId, status, role } = request.body;

        if (!userId) {
            return response.status(400).json({
                message: "userId is required",
                error: true,
                success: false,
            });
        }

        const payload = {};
        if (status) payload.status = status;
        if (role) payload.role = role;

        if (!Object.keys(payload).length) {
            return response.status(400).json({
                message: "status or role is required",
                error: true,
                success: false,
            });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, payload, { new: true });

        if (!updatedUser) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false,
            });
        }

        return response.status(200).json({
            message: "User access updated successfully",
            error: false,
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}



// ─── Logout Controller ────────────────────────────────────────────────────────
export async function logoutController(request, response) {
    try {
        const userid = request.userId;

        const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
        response.clearCookie("accessToken", cookiesOption);
        response.clearCookie("refreshToken", cookiesOption);

        await UserModel.findByIdAndUpdate(userid, { refresh_token: "" });

        return response.json({
            message: "Logout successfully",
            error: false, success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true, success: false
            });
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp        = verifyCode;
        user.otpExpires = Date.now() + 600000;
        await user.save();

        await sendEmailFun({
            sendTo: email,
            subject: `Password Reset OTP – ${process.env.STORE_NAME || 'MyStore'}`,
            text: `Your OTP is: ${verifyCode}`,
            html: VerificationEmail(user.name, verifyCode)
        });

        return response.json({
            message: "OTP sent to your email",
            error: false, success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Verify Forgot Password OTP ──────────────────────────────────────────────
// Route: POST /api/user/verify-forgot-password-otp
export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                message: "Provide required field email, otp.",
                error: true, success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true, success: false
            });
        }

        if (otp !== user.otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true, success: false
            });
        }

        if (user.otpExpires < Date.now()) {
            return response.status(400).json({
                message: "OTP is expired",
                error: true, success: false
            });
        }

        user.otp        = "";
        user.otpExpires = "";
        await user.save();

        return response.status(200).json({
            message: "OTP verified successfully",
            error: false, success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetpassword(request, response) {
    try {
        const { email, oldPassword, newPassword, confirmPassword } = request.body;

        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                error: true, success: false,
                message: "Provide required fields email, newPassword, confirmPassword"
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "Email is not available",
                error: true, success: false
            });
        }

        if (user?.signUpWithGoogle === false) {
            const checkPassword = await bcryptjs.compare(oldPassword, user.password);
            if (!checkPassword) {
                return response.status(400).json({
                    message: "Your old password is wrong",
                    error: true, success: false,
                });
            }
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "newPassword and confirmPassword must be same.",
                error: true, success: false,
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(confirmPassword, salt);

        user.password        = hashPassword;
        user.signUpWithGoogle = false;
        await user.save();

        return response.json({
            message: "Password updated successfully.",
            error: false, success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Change Password ──────────────────────────────────────────────────────────
export async function changePasswordController(request, response) {
    try {
        const { email, newPassword, confirmPassword } = request.body;

        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                error: true, success: false,
                message: "Provide required fields email, newPassword, confirmPassword"
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return response.status(400).json({
                message: "Email is not available",
                error: true, success: false
            });
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "newPassword and confirmPassword must be same.",
                error: true, success: false,
            });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(confirmPassword, salt);

        user.password        = hashPassword;
        user.signUpWithGoogle = false;
        await user.save();

        return response.json({
            message: "Password updated successfully.",
            error: false, success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Refresh Token ────────────────────────────────────────────────────────────
export async function refreshToken(request, response) {
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1];

        if (!refreshToken) {
            return response.status(401).json({
                message: "Invalid token",
                error: true, success: false
            });
        }

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
        if (!verifyToken) {
            return response.status(401).json({
                message: "Token is expired",
                error: true, success: false
            });
        }

        const userId       = verifyToken?._id;
        const newAccessToken = await generatedAccessToken(userId);

        const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
        response.cookie('accessToken', newAccessToken, cookiesOption);

        return response.json({
            message: "New Access token generated",
            error: false, success: true,
            data: { accessToken: newAccessToken }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── User Details ─────────────────────────────────────────────────────────────
export async function userDetails(request, response) {
    try {
        const userId = request.userId;
        const user   = await UserModel.findById(userId).select('-password -refresh_token').populate('address_details');

        return response.json({
            message: 'user details',
            data: user,
            error: false, success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: "Something is wrong",
            error: true, success: false
        });
    }
}


// ─── Avatar Upload ────────────────────────────────────────────────────────────
var imagesArr = [];
export async function userAvatarController(request, response) {
    try {
        imagesArr = [];
        const userId = request.userId;
        const image  = request.files;

        const user = await UserModel.findOne({ _id: userId });
        if (!user) {
            return response.status(500).json({
                message: "User not found",
                error: true, success: false
            });
        }

        const imgUrl      = user.avatar;
        const urlArr      = imgUrl.split("/");
        const avatar_image = urlArr[urlArr.length - 1];
        const imageName   = avatar_image.split(".")[0];

        if (imageName) {
            await cloudinary.uploader.destroy(imageName);
        }

        const options = { use_filename: true, unique_filename: false, overwrite: false };

        for (let i = 0; i < image?.length; i++) {
            await cloudinary.uploader.upload(image[i].path, options, function (error, result) {
                imagesArr.push(result.secure_url);
                fs.unlinkSync(`uploads/${request.files[i].filename}`);
            });
        }

        user.avatar = imagesArr[0];
        await user.save();

        return response.status(200).json({ _id: userId, avtar: imagesArr[0] });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


export async function removeImageFromCloudinary(request, response) {
    const imgUrl    = request.query.img;
    const urlArr    = imgUrl.split("/");
    const image     = urlArr[urlArr.length - 1];
    const imageName = image.split(".")[0];

    if (imageName) {
        const res = await cloudinary.uploader.destroy(imageName);
        if (res) response.status(200).send(res);
    }
}


// ─── Update User Details ──────────────────────────────────────────────────────
export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId;
        const { name, email, mobile } = request.body;

        const userExist = await UserModel.findById(userId);
        if (!userExist) return response.status(400).send('The user cannot be Updated!');

        const updateUser = await UserModel.findByIdAndUpdate(
            userId,
            { name, mobile, email },
            { new: true }
        );

        return response.json({
            message: "User Updated successfully",
            error: false, success: true,
            user: {
                name:   updateUser?.name,
                _id:    updateUser?._id,
                email:  updateUser?.email,
                mobile: updateUser?.mobile,
                avatar: updateUser?.avatar
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function addReview(request, response) {
    try {
        const { image, userName, review, rating, userId, productId } = request.body;

        const userReview = new ReviewModel({ image, userName, review, rating, userId, productId });
        await userReview.save();

        return response.json({ message: "Review added successfully", error: false, success: true });

    } catch (error) {
        return response.status(500).json({ message: "Something is wrong", error: true, success: false });
    }
}

export async function getReviews(request, response) {
    try {
        const productId = request.query.productId;
        const reviews   = await ReviewModel.find({ productId });

        return response.status(200).json({ error: false, success: true, reviews });

    } catch (error) {
        return response.status(500).json({ message: "Something is wrong", error: true, success: false });
    }
}

export async function getAllReviews(request, response) {
    try {
        const page = Math.max(parseInt(request.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(request.query.limit || '10', 10), 1);
        const skip = (page - 1) * limit;

        let reviewFilter = {};
        let productMeta = [];

        if (request.currentUser?.role === 'SELLER') {
            productMeta = await ProductModel.find({ seller: request.userId })
                .select('_id name images')
                .lean();

            const sellerProductIds = productMeta.map((product) => String(product._id));

            if (sellerProductIds.length === 0) {
                return response.status(200).json({
                    error: false,
                    success: true,
                    reviews: [],
                    pagination: { page, limit, total: 0, totalPages: 0 }
                });
            }

            reviewFilter = { productId: { $in: sellerProductIds } };
        }

        const total = await ReviewModel.countDocuments(reviewFilter);
        const reviews = await ReviewModel.find(reviewFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const reviewProductIds = [...new Set(reviews.map((item) => item.productId).filter(Boolean))];
        if (request.currentUser?.role !== 'SELLER' && reviewProductIds.length > 0) {
            productMeta = await ProductModel.find({ _id: { $in: reviewProductIds } })
                .select('_id name images seller')
                .lean();
        }

        const productMap = new Map(productMeta.map((item) => [String(item._id), item]));
        const reviewsWithProduct = reviews.map((item) => ({
            ...item,
            productName: productMap.get(item.productId)?.name || 'Product',
            productImage: productMap.get(item.productId)?.images?.[0] || ''
        }));

        return response.status(200).json({
            error: false,
            success: true,
            reviews: reviewsWithProduct,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });


    } catch (error) {
        return response.status(500).json({ message: "Something is wrong", error: true, success: false });
    }
}

export async function upsertSellerStoreProfile(request, response) {
    try {
        if (request.currentUser?.role !== "SELLER") {
            return response.status(403).json({ error: true, success: false, message: "Only seller can update store profile" });
        }

        const payload = {
            "storeProfile.storeName": request.body.storeName || "",
            "storeProfile.description": request.body.description || "",
            "storeProfile.image": request.body.image || "",
            "storeProfile.location": request.body.location || "",
            "storeProfile.contactNo": request.body.contactNo || "",
            "storeProfile.moreInfo": request.body.moreInfo || "",
        };

        const user = await UserModel.findByIdAndUpdate(request.userId, { $set: payload }, { new: true })
            .select("name email role storeProfile");

        return response.status(200).json({ error: false, success: true, message: "Store profile updated", user });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}


export async function getSellerStoreProfile(request, response) {
    try {
        const sellerId = request.params.sellerId || request.userId;
        const seller = await UserModel.findById(sellerId).select("name role storeProfile status");

        if (!seller || seller.role !== "SELLER") {
            return response.status(404).json({ error: true, success: false, message: "Seller not found" });
        }

        return response.status(200).json({ error: false, success: true, seller });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export async function getCommissionOverview(request, response) {
    try {
        const userId = request.userId;
        const user = await UserModel.findById(userId).select("role wallet walletTransactions");
        if (!user) {
            return response.status(404).json({ error: true, success: false, message: "User not found" });
        }

        const transactions = (user.walletTransactions || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return response.status(200).json({
            error: false,
            success: true,
            role: user.role,
            wallet: user.wallet,
            commissionRate: 10,
            transactions
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export async function createWalletRequest(request, response) {
    try {
        const { type, amount, note } = request.body;
        if (!["DEPOSIT", "WITHDRAW"].includes(type)) {
            return response.status(400).json({ error: true, success: false, message: "Invalid request type" });
        }

        const parsedAmount = Number(amount || 0);
        if (parsedAmount <= 0) {
            return response.status(400).json({ error: true, success: false, message: "Amount must be greater than 0" });
        }

        const user = await UserModel.findById(request.userId);
        if (!user) {
            return response.status(404).json({ error: true, success: false, message: "User not found" });
        }

        user.walletTransactions.push({
            type,
            amount: parsedAmount,
            note: note || "",
            status: "PENDING",
            createdBy: request.userId,
        });

        await user.save();

        return response.status(200).json({ error: false, success: true, message: `${type} request submitted` });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export async function approveWalletRequest(request, response) {
    try {
        const { sellerId, transactionId, status } = request.body;
        if (!["APPROVED", "REJECTED"].includes(status)) {
            return response.status(400).json({ error: true, success: false, message: "Invalid status" });
        }

        const seller = await UserModel.findById(sellerId);
        if (!seller || seller.role !== "SELLER") {
            return response.status(404).json({ error: true, success: false, message: "Seller not found" });
        }

        const trx = seller.walletTransactions.id(transactionId);
        if (!trx) {
            return response.status(404).json({ error: true, success: false, message: "Transaction not found" });
        }
        if (trx.status !== "PENDING") {
            return response.status(400).json({ error: true, success: false, message: "Transaction already processed" });
        }

        trx.status = status;
        trx.approvedBy = request.userId;

        if (status === "APPROVED") {
            if (trx.type === "DEPOSIT") {
                seller.wallet.availableBalance += trx.amount;
                seller.wallet.totalDeposited += trx.amount;
            }
            if (trx.type === "WITHDRAW") {
                if ((seller.wallet.availableBalance || 0) < trx.amount) {
                    return response.status(400).json({ error: true, success: false, message: "Insufficient balance" });
                }
                seller.wallet.availableBalance -= trx.amount;
                seller.wallet.totalWithdrawn += trx.amount;
            }
        }

        await seller.save();

        return response.status(200).json({ error: false, success: true, message: `Request ${status.toLowerCase()}` });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// ─── Users CRUD ───────────────────────────────────────────────────────────────
export async function getAllUsers(request, response) {
    try {
        const { page, limit } = request.query;

        const totalUsers = await UserModel.find();
        const users      = await UserModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        const total      = await UserModel.countDocuments(users);

        return response.status(200).json({
            error: false, success: true,
            users, total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalUsersCount: totalUsers?.length,
            totalUsers
        });

    } catch (error) {
        return response.status(500).json({ message: "Something is wrong", error: true, success: false });
    }
}

export async function deleteUser(request, response) {
    const user = await UserModel.findById(request.params.id);
    if (!user) {
        return response.status(404).json({ message: "User Not found", error: true, success: false });
    }

    const deletedUser = await UserModel.findByIdAndDelete(request.params.id);
    if (!deletedUser) {
        return response.status(404).json({ message: "User not deleted!", success: false, error: true });
    }

    return response.status(200).json({ success: true, error: false, message: "User Deleted!" });
}

export async function deleteMultiple(request, response) {
    const { ids } = request.body;
    if (!ids || !Array.isArray(ids)) {
        return response.status(400).json({ error: true, success: false, message: 'Invalid input' });
    }

    try {
        await UserModel.deleteMany({ _id: { $in: ids } });
        return response.status(200).json({ message: "Users deleted successfully", error: false, success: true });

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}