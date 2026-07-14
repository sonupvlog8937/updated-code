import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import AddressModel from '../models/address.model.js';
import CartProductModel from '../models/cartProduct.modal.js';
import MyListModel from '../models/myList.modal.js';
import OrderModel from '../models/order.model.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import ReviewModel from '../models/reviews.model.js';
import ProductModel from '../models/product.modal.js';
import Market from '../models/market.model.js';
import ShopOwner from '../models/shopOwner.model.js';
import GroceryShop from '../models/groceryShop.model.js';
import Restaurant from '../models/restaurant.model.js';
import GroceryProduct from '../models/groceryProduct.model.js';
import RestaurantItem from '../models/restaurantItem.model.js';

// All seller roles (13 types total)
const SELLER_ROLES = [
    'SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER', 
    'FASHION_SELLER', 'ELECTRONICS_SELLER', 'MEDICAL_SELLER', 
    'BEAUTY_SELLER', 'HOME_KITCHEN_SELLER', 'GIFTS_TOYS_SELLER', 
    'BOOKS_STATIONERY_SELLER', 'JEWELLERY_SELLER', 'HARDWARE_SELLER', 
    'AUTOMOBILE_SELLER'
];

// All allowed panel roles (16 types: 13 sellers + ADMIN + USER + DELIVERY_RIDER)
const ALL_PANEL_ROLES = ['ADMIN', 'USER', 'DELIVERY_RIDER', ...SELLER_ROLES];

// Roles allowed for public signup
const PUBLIC_SIGNUP_SELLER_ROLES = [...SELLER_ROLES, 'DELIVERY_RIDER'];
const GO_MARKET_SHOP_SELLER_ROLES = SELLER_ROLES.filter((role) => role !== 'SELLER' && role !== 'RESTAURANT_SELLER');

const isSellerRole = (role) => SELLER_ROLES.includes(role);

const normalizePanelRole = (role, fallback = 'SELLER') => {
    const normalized = String(role || fallback).trim().toUpperCase();
    return ALL_PANEL_ROLES.includes(normalized) ? normalized : fallback;
};
const normalizePublicSellerRole = (role) => {
    const normalized = String(role || 'SELLER').trim().toUpperCase();
    return PUBLIC_SIGNUP_SELLER_ROLES.includes(normalized) ? normalized : 'SELLER';
};

// Map seller role to the shopType value used in GroceryShop model
const getShopTypeFromRole = (role) => {
    const map = {
        GROCERY_SELLER: 'grocery',
        FASHION_SELLER: 'fashion',
        ELECTRONICS_SELLER: 'electronics',
        MEDICAL_SELLER: 'medical',
        BEAUTY_SELLER: 'beauty',
        HOME_KITCHEN_SELLER: 'home_kitchen',
        GIFTS_TOYS_SELLER: 'gifts_toys',
        BOOKS_STATIONERY_SELLER: 'books_stationery',
        JEWELLERY_SELLER: 'jewellery',
        HARDWARE_SELLER: 'hardware',
        AUTOMOBILE_SELLER: 'automobile',
    };
    return map[role] || 'grocery';
};

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

async function deleteUserAssociatedData(userId) {
    const userIdString = String(userId);

    const orders = await OrderModel.find({ userId }).select('_id delivery_address');
    const orderIds = orders.map((order) => order._id);
    const addressIds = [
        ...new Set([
            ...orders.map((order) => order.delivery_address).filter(Boolean).map((id) => String(id)),
            ...(await AddressModel.find({ userId: userIdString }).select('_id')).map((address) => String(address._id)),
        ]),
    ];

    await Promise.all([
        AddressModel.deleteMany({ _id: { $in: addressIds } }),
        CartProductModel.deleteMany({ userId: userIdString }),
        MyListModel.deleteMany({ userId: userIdString }),
        ReviewModel.deleteMany({ userId: userIdString }),
        OrderModel.deleteMany({ _id: { $in: orderIds } }),
        ProductModel.updateMany(
            { 'reviews.userId': userIdString },
            { $pull: { reviews: { userId: userIdString } } }
        ),
    ]);
}

async function createDefaultGoMarketStore({ seller, role, marketId, storeName, storeLocation, storeContact, storeDescription, shopBanner }) {
    if (!marketId) return null;

    const market = await Market.findOne({ _id: marketId, status: 'active' });
    if (!market) {
        const error = new Error('Please select a valid active market');
        error.statusCode = 400;
        throw error;
    }

    const owner = await ShopOwner.findOneAndUpdate(
        { $or: [{ userId: seller._id }, { email: seller.email }] },
        {
            $set: {
                userId: seller._id,
                name: seller.name,
                email: seller.email,
                mobile: String(storeContact || seller.mobile || ''),
                avatar: seller.avatar || '',
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const address = storeLocation || [market.name, market.city, market.state, market.pincode].filter(Boolean).join(', ');
    const base = {
        marketId: market._id,
        ownerId: owner._id,
        address,
        latitude: market.latitude,
        longitude: market.longitude,
        description: storeDescription || '',
        isOpen: true,
    };

    let store = null;
    if (GO_MARKET_SHOP_SELLER_ROLES.includes(role)) {
        store = await GroceryShop.findOneAndUpdate(
            { ownerId: owner._id },
           { $setOnInsert: { ...base, shopName: storeName, shopType: getShopTypeFromRole(role), shopBanner: shopBanner || seller.storeProfile?.image || "" } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    } else if (role === 'RESTAURANT_SELLER') {
        store = await Restaurant.findOneAndUpdate(
            { ownerId: owner._id },
            { $setOnInsert: { ...base, restaurantName: storeName, restaurantBanner: shopBanner || seller.storeProfile?.image || "" } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    }

    seller.storeProfile.marketId = market._id;
    seller.storeProfile.goMarketOwnerId = owner._id;
    await seller.save();

    return { owner, store, market };
}

const sendVerificationOtpEmail = async ({ email, name, otp, subject }) => {
    // 🔑 DEV MODE - Log OTP for testing
    if (process.env.NODE_ENV === 'development') {
        console.log('🔑 DEV OTP for', email, '→', otp);
    }
    
    const sent = await sendEmailFun({
        sendTo: email,
        subject: subject || `Verify your email – ${process.env.STORE_NAME || 'MyStore'}`,
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
        html: VerificationEmail(name, otp),
    });

    if (!sent) {
        console.error(`Verification email failed for ${email}`);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV] OTP for ${email}: ${otp}`);
        }
    }

    return sent;
};

const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };

const sendLoginResponse = async (response, userId) => {
    const accesstoken = await generatedAccessToken(userId);
    const refreshToken = await generatedRefreshToken(userId);

    const user = await UserModel.findByIdAndUpdate(
        userId,
        { last_login_date: new Date() },
        { new: true }
    ).select("_id name email role storeProfile avatar status verify_email").lean();

    response.cookie('accessToken', accesstoken, cookiesOption);
    response.cookie('refreshToken', refreshToken, cookiesOption);

    return response.json({
        message: "Login successfully",
        error: false,
        success: true,
        data: { accesstoken, refreshToken, role: user?.role, user }
    });
};


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
            // Agar user verify ho chuka hai → error return karo
            if (existingUser.verify_email === true) {
                return response.json({
                    message: "User already registered with this email",
                    error: true,
                    success: false
                });
            }
            
            // Agar user hai but verify nahi kiya → purana account delete karo aur naya banao
            // Taki user fresh start kar sake
            await UserModel.findByIdAndDelete(existingUser._id);
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
            status: "Active", // Set status to Active so user can re-register and get OTP
        });

        await user.save();

        const emailSent = await sendVerificationOtpEmail({
            email,
            name,
            otp: verifyCode,
        });

        return response.status(200).json({
            success: true,
            error: false,
            message: emailSent
                ? "Registered successfully! Please check your email to verify your account."
                : "Registered successfully! OTP email could not be sent — use Resend OTP on the verify page.",
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

        const isCodeValid  = String(user.otp) === String(otp).trim();
        const isNotExpired = user.otpExpires > Date.now();

        if (isCodeValid && isNotExpired) {
            user.verify_email = true;
            user.otp          = null;
            user.otpExpires   = null;
            await user.save();

            

            return response.status(200).json({
                error: false,
                success: true,
                memessage: "Email verified successfully! Please login to continue.",
                data: {
                    role: user.role,
                    redirectTo: "/login",
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        storeProfile: user.storeProfile,
                    }
                }
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

        const emailSent = await sendVerificationOtpEmail({
            email,
            name: user.name,
            otp: newOtp,
            subject: `Your new OTP – ${process.env.STORE_NAME || 'MyStore'}`,
        });

        if (!emailSent) {
            return response.status(500).json({
                error: true,
                success: false,
                message: "Could not send OTP email. Please try again in a moment.",
            });
        }

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
    const { name, email, password, avatar, mobile, role, firebaseUid } = request.body;

    try {
        const existingUser = await UserModel.findOne({ email });

        if (!existingUser) {
            const user = await UserModel.create({
                name, mobile, email,
                password: "null",
                avatar, role,
                firebaseUid: firebaseUid || "",
                verify_email: true,
                signUpWithGoogle: true
            });

            await user.save();

            return sendLoginResponse(response, user._id);

        } else {
            if (firebaseUid && !existingUser.firebaseUid) {
                existingUser.firebaseUid = firebaseUid;
                existingUser.signUpWithGoogle = true;
                existingUser.verify_email = true;
                await existingUser.save();
            }
            return sendLoginResponse(response, existingUser._id);
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

        return sendLoginResponse(response, user._id);

        } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}
export async function sendPhoneLoginOtpController(request, response) {
    try {
        const { mobile } = request.body;

        if (!mobile) {
            return response.status(400).json({
                message: "Mobile number is required",
                error: true,
                success: false
            });
        }

        const normalizedMobile = String(mobile).replace(/\D/g, "").slice(-10);

        if (normalizedMobile.length !== 10) {
            return response.status(400).json({
                message: "Please provide a valid 10 digit mobile number",
                error: true,
                success: false
            });
        }

        let user = await UserModel.findOne({ mobile: Number(normalizedMobile) });

        if (user && user.status !== "Active") {
            return response.status(400).json({
                message: "Contact to admin",
                error: true,
                success: false
            });
        }

        if (!user) {
            const generatedEmail = `phone_${normalizedMobile}@fast2sms.local`;
            const randomPassword = `fast2sms-${normalizedMobile}-${Date.now()}`;
            const salt = await bcryptjs.genSalt(10);
            const hashPassword = await bcryptjs.hash(randomPassword, salt);

            user = await UserModel.create({
                name: `User ${normalizedMobile.slice(-4)}`,
                email: generatedEmail,
                password: hashPassword,
                mobile: Number(normalizedMobile),
                verify_email: true,
                status: "Active",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        user.phone_login_otp = otp;
        user.phone_login_otp_expires = otpExpires;
        await user.save();

        const apiKey = process.env.FAST2SMS_API_KEY;

        if (!apiKey) {
            return response.status(500).json({
                message: "FAST2SMS_API_KEY is not configured",
                error: true,
                success: false
            });
        }

        const payload = new URLSearchParams({
            route: "q",
            message: `Your login OTP is ${otp}. It is valid for 10 minutes.`,
            language: "english",
            flash: "0",
            numbers: normalizedMobile
        });

        const smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload.toString()
        });

        const smsResult = await smsResponse.json();

        if (!smsResponse.ok || smsResult?.return === false) {
            return response.status(400).json({
                message: smsResult?.message?.[0] || smsResult?.message || "Unable to send OTP",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "OTP sent successfully",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function verifyPhoneLoginOtpController(request, response) {
    try {
        const { mobile, otp } = request.body;

        if (!mobile || !otp) {
            return response.status(400).json({
                message: "Mobile number and OTP are required",
                error: true,
                success: false
            });
        }

        const normalizedMobile = String(mobile).replace(/\D/g, "").slice(-10);
        const user = await UserModel.findOne({ mobile: Number(normalizedMobile) });

        if (!user) {
            return response.status(400).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Contact to admin",
                error: true,
                success: false
            });
        }

        if (!user.phone_login_otp || user.phone_login_otp !== otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        if (!user.phone_login_otp_expires || user.phone_login_otp_expires < Date.now()) {
            return response.status(400).json({
                message: "OTP expired",
                error: true,
                success: false
            });
        }

        user.phone_login_otp = null;
        user.phone_login_otp_expires = null;
        await user.save();

        return sendLoginResponse(response, user._id);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function createSellerByAdminController(request, response) {
    try {
        const { name, email, password, mobile, role, storeName, marketId } = request.body;

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
        const sellerRole = normalizePanelRole(role, 'SELLER');

        // Build storeProfile if GoMarket seller role
        const isGoMarketSeller = GO_MARKET_SHOP_SELLER_ROLES.includes(sellerRole) || sellerRole === 'RESTAURANT_SELLER';
        const storeProfile = isGoMarketSeller ? {
            storeName: storeName || name,
            contactNo: mobile || '',
            marketId: marketId || null,
        } : undefined;

        const seller = await UserModel.create({
            name,
            email,
            mobile: mobile || null,
            password: hashPassword,
            role: sellerRole,
            verify_email: true,
            status: "Active",
            storeProfile,
        });

        // Auto-provision GoMarket store (ShopOwner + GroceryShop/Restaurant)
        let goMarket = null;
        if (isGoMarketSeller && marketId) {
            try {
                goMarket = await createDefaultGoMarketStore({
                    seller,
                    role: sellerRole,
                    marketId,
                    storeName: storeName || name,
                    storeContact: mobile,
                });
            } catch (provisionErr) {
                console.error('GoMarket store provisioning error (admin create):', provisionErr.message);
            }
        }

        return response.status(200).json({
            message: "Seller created successfully",
            error: false,
            success: true,
            seller,
            goMarket,
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
         if (role) payload.role = normalizePanelRole(role, 'USER');

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

        // If role was changed to a GoMarket shop seller, auto-provision ShopOwner + GroceryShop
        if (payload.role && GO_MARKET_SHOP_SELLER_ROLES.includes(payload.role)) {
            try {
                const marketId = updatedUser.storeProfile?.marketId;
                const storeName = updatedUser.storeProfile?.storeName || updatedUser.name;

                // Upsert ShopOwner
                const owner = await ShopOwner.findOneAndUpdate(
                    { $or: [{ userId: updatedUser._id }, { email: updatedUser.email }] },
                    {
                        $set: {
                            userId: updatedUser._id,
                            name: updatedUser.name,
                            email: updatedUser.email,
                            mobile: String(updatedUser.storeProfile?.contactNo || updatedUser.mobile || ''),
                            avatar: updatedUser.avatar || '',
                        },
                    },
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );

                // Only create GroceryShop if we have a market and one doesn't exist yet
                if (marketId) {
                    const existingShop = await GroceryShop.findOne({ ownerId: owner._id });
                    if (!existingShop) {
                        const market = await Market.findById(marketId).lean();
                        if (market) {
                            const address = updatedUser.storeProfile?.location ||
                                [market.name, market.city, market.state, market.pincode].filter(Boolean).join(', ');
                            await GroceryShop.create({
                                marketId: market._id,
                                ownerId: owner._id,
                                shopName: storeName,
                                shopType: getShopTypeFromRole(payload.role),
                                shopBanner: updatedUser.storeProfile?.image || '',
                                address,
                                latitude: market.latitude,
                                longitude: market.longitude,
                                description: updatedUser.storeProfile?.description || '',
                                isOpen: true,
                            });
                        }
                    }
                }
            } catch (provisionErr) {
                // Non-fatal — log but don't block the role update response
                console.error('GoMarket shop provisioning error after role update:', provisionErr.message);
            }
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


// ─── Avatar Uploaddf ────────────────────────────────────────────────────────────
export async function userAvatarController(request, response) {
    console.log("🔵 Avatar upload endpoint hit");
    console.log("🔵 Request user ID:", request.userId);
    console.log("🔵 Request file:", request.file);
    
    try {
        const userId = request.userId;
        const image = request.file;

        if (!image || !image.path) {
            console.error("❌ No image file in request");
            return response.status(400).json({
                message: "No image file provided",
                error: true, 
                success: false
            });
        }

        console.log("📸 File details:", {
            filename: image.filename,
            originalname: image.originalname,
            mimetype: image.mimetype,
            size: image.size,
            path: image.path
        });

        const user = await UserModel.findOne({ _id: userId });
        if (!user) {
            console.error("❌ User not found:", userId);
            // Clean up uploaded file
            try {
                fs.unlinkSync(image.path);
            } catch (err) {
                console.log("⚠️ Cleanup failed:", err.message);
            }
            return response.status(404).json({
                message: "User not found",
                error: true, 
                success: false
            });
        }

        console.log("✅ User found:", user.name);

        // Delete old avatar from Cloudinary if exists
        if (user.avatar) {
            try {
                const urlArr = user.avatar.split("/");
                const avatar_image = urlArr[urlArr.length - 1];
                const imageName = avatar_image.split(".")[0];
                if (imageName && imageName.length > 5) { // Basic validation
                    console.log("🗑️ Deleting old avatar:", imageName);
                    await cloudinary.uploader.destroy(imageName);
                    console.log("✅ Old avatar deleted");
                }
            } catch (err) {
                console.log("⚠️ Failed to delete old avatar:", err.message);
                // Continue with upload even if delete fails
            }
        }

        // Upload new avatar to Cloudinary
        console.log("📤 Starting Cloudinary upload...");
        const options = { 
            use_filename: false, 
            unique_filename: true, 
            overwrite: true,
            folder: 'user-avatars',
            resource_type: 'image',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
                { quality: 'auto:good', fetch_format: 'auto' }
            ]
        };
        
        const result = await cloudinary.uploader.upload(image.path, options);
        console.log("✅ Cloudinary upload successful");
        console.log("✅ New avatar URL:", result.secure_url);

        // Delete local file
        try {
            fs.unlinkSync(image.path);
            console.log("✅ Local file deleted");
        } catch (err) {
            console.log("⚠️ Failed to delete local file:", err.message);
        }

        // Update user avatar in database
        user.avatar = result.secure_url;
        await user.save();
        console.log("✅ User avatar updated in database");

        return response.status(200).json({ 
            error: false, 
            success: true,
            message: "Avatar updated successfully",
            avatar: result.secure_url,
            data: { avatar: result.secure_url }
        });

    } catch (error) {
        console.error("❌ Avatar upload error:", error);
        console.error("❌ Error stack:", error.stack);
        
        // Clean up local file if exists
        if (request.file?.path) {
            try {
                fs.unlinkSync(request.file.path);
                console.log("✅ Cleanup: Local file deleted after error");
            } catch (err) {
                console.log("⚠️ Cleanup failed:", err.message);
            }
        }

        return response.status(500).json({
            message: error.message || "Failed to upload avatar",
            error: true, 
            success: false
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
        const page = Math.max(parseInt(request.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(request.query.limit || '10', 10), 1);
        const skip = (page - 1) * limit;

        if (!productId) {
            return response.status(400).json({ error: true, success: false, message: 'productId is required' });
        }

        const filter = { productId };
        const total = await ReviewModel.countDocuments(filter);
        const reviews = await ReviewModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return response.status(200).json({
            error: false,
            success: true,
            reviews,
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

export async function getAllReviews(request, response) {
    try {
        const page = Math.max(parseInt(request.query.page || '1', 10), 1);
        const limit = Math.max(parseInt(request.query.limit || '10', 10), 1);
        const skip = (page - 1) * limit;

        let reviewFilter = {};
        let productMeta = [];

        if (isSellerRole(request.currentUser?.role)) {
            const userRole = request.currentUser?.role;
            
            // Get seller's product IDs based on their role
            if (userRole === 'SELLER') {
                // Regular marketplace products
                productMeta = await ProductModel.find({ seller: request.userId })
                    .select('_id name images')
                    .lean();
            } else if (GO_MARKET_SHOP_SELLER_ROLES.includes(userRole)) {
                // Get GoMarket shop owner IDs
                const ownerIds = (await ShopOwner.find({ $or: [{ userId: request.userId }, { email: request.currentUser?.email }] }).select("_id").lean()).map((owner) => owner._id);
                
                if (ownerIds.length > 0) {
                    // Get shop IDs
                    const shopIds = (await GroceryShop.find({ ownerId: { $in: ownerIds } }).select("_id").lean()).map((shop) => shop._id);
                    
                    if (shopIds.length > 0) {
                        // Get grocery products
                        productMeta = await GroceryProduct.find({ shopId: { $in: shopIds } })
                             .select('_id name image images')
                            .lean();
                    }
                }
            } else if (userRole === 'RESTAURANT_SELLER') {
                // Get restaurant owner IDs
                const ownerIds = (await ShopOwner.find({ $or: [{ userId: request.userId }, { email: request.currentUser?.email }] }).select("_id").lean()).map((owner) => owner._id);
                
                if (ownerIds.length > 0) {
                    // Get restaurant IDs
                    const restaurantIds = (await Restaurant.find({ ownerId: { $in: ownerIds } }).select("_id").lean()).map((restaurant) => restaurant._id);
                    
                    if (restaurantIds.length > 0) {
                        // Get restaurant items
                        productMeta = await RestaurantItem.find({ restaurantId: { $in: restaurantIds } })
                            .select('_id itemName image images')
                            .lean();
                    }
                }
            }

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
        
        // If admin, fetch all product types
        if (!isSellerRole(request.currentUser?.role) && reviewProductIds.length > 0) {
            const [marketProducts, groceryProducts, restaurantItems] = await Promise.all([
                ProductModel.find({ _id: { $in: reviewProductIds } }).select('_id name images seller').lean(),
                GroceryProduct.find({ _id: { $in: reviewProductIds } }).select('_id name image images').lean(),
                RestaurantItem.find({ _id: { $in: reviewProductIds } }).select('_id itemName image images').lean()
            ]);
            
            productMeta = [...marketProducts, ...groceryProducts, ...restaurantItems];
        }

        const productMap = new Map(productMeta.map((item) => [String(item._id), item]));
        const reviewsWithProduct = reviews.map((item) => ({
            ...item,
            productName: productMap.get(item.productId)?.name || productMap.get(item.productId)?.itemName || 'Product',
            productImage: productMap.get(item.productId)?.images?.[0] || productMap.get(item.productId)?.image || ''
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
        const {
            storeName, description, image, location, contactNo, moreInfo, category,
            returnPolicy, shippingTime, openHours, supportEmail,
            accountHolderName, bankName, accountNumber, ifscCode
        } = request.body;

        const payload = {
            "storeProfile.storeName":    storeName    || "",
            "storeProfile.description":  description  || "",
            "storeProfile.image":        image        || "",
            "storeProfile.location":     location     || "",
            "storeProfile.contactNo":    contactNo    || "",
            "storeProfile.moreInfo":     moreInfo     || "",
            "storeProfile.category":     category     || "",
            "storeProfile.returnPolicy": returnPolicy || "",
            "storeProfile.shippingTime": shippingTime || "",
            "storeProfile.openHours":    openHours    || "",
            "storeProfile.supportEmail": supportEmail || "",
            "bankDetails.accountHolderName": accountHolderName || "",
            "bankDetails.bankName":          bankName          || "",
            "bankDetails.accountNumber":     accountNumber     || "",
            "bankDetails.ifscCode":          ifscCode          || "",
        };

        const user = await UserModel.findByIdAndUpdate(
            request.userId,
            { $set: payload },
            { new: true }
        ).select("name email role storeProfile bankDetails");

        if (!user) {
            return response.status(404).json({ error: true, success: false, message: "User not found" });
        }

        return response.status(200).json({ error: false, success: true, message: "Store profile updated successfully", user });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}


export async function getSellerStoreProfile(request, response) {
    try {
        const sellerId = request.params.sellerId || request.userId;
        const seller = await UserModel.findById(sellerId).select("name email role storeProfile bankDetails status");

        if (!seller || !isSellerRole(seller.role)) {
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
        if (!seller || !isSellerRole(seller.role)) {
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

export async function deleteMyAccount(request, response) {
    try {
        const userId = request.userId;
        const { email, password, confirmText } = request.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        if (!email || email.trim().toLowerCase() !== user.email.toLowerCase()) {
            return response.status(400).json({
                message: "Please enter your registered email to confirm account deletion",
                error: true,
                success: false
            });
        }

        if (confirmText !== 'DELETE') {
            return response.status(400).json({
                message: 'Please type DELETE to confirm account deletion',
                error: true,
                success: false
            });
        }

        if (user.signUpWithGoogle === false) {
            if (!password) {
                return response.status(400).json({
                    message: 'Password is required to delete your account',
                    error: true,
                    success: false
                });
            }

            const isPasswordValid = await bcryptjs.compare(password, user.password);
            if (!isPasswordValid) {
                return response.status(400).json({
                    message: 'Entered password is incorrect',
                    error: true,
                    success: false
                });
            }
        }

        await deleteUserAssociatedData(user._id);
        await UserModel.findByIdAndDelete(user._id);

    const cookiesOption = { httpOnly: true, secure: true, sameSite: "None" };
        response.clearCookie('accessToken', cookiesOption);
        response.clearCookie('refreshToken', cookiesOption);

        return response.status(200).json({
            message: 'Your account has been deleted successfully',
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }

    }

export async function deleteUser(request, response) {
    try {
        const user = await UserModel.findById(request.params.id);
        if (!user) {
            return response.status(404).json({ message: "User Not found", error: true, success: false });
        }

        await deleteUserAssociatedData(user._id);
        await UserModel.findByIdAndDelete(request.params.id);

    return response.status(200).json({ success: true, error: false, message: "User Deleted!" });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export async function deleteMultiple(request, response) {
    const { ids } = request.body;
    if (!ids || !Array.isArray(ids)) {
        return response.status(400).json({ error: true, success: false, message: 'Invalid input' });
    }

    try {
        const users = await UserModel.find({ _id: { $in: ids } }).select('_id');
        await Promise.all(users.map((user) => deleteUserAssociatedData(user._id)));
        await UserModel.deleteMany({ _id: { $in: ids } });
        return response.status(200).json({ message: "Users deleted successfully", error: false, success: true });

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

// Add this in user.controller.js

export async function registerSellerController(request, response) {
    try {
        
            const {
            name, email, password, mobile, role, marketId,
            storeName, storeLocation, storeContact, storeDescription, shopBanner, drivingLicense,
            accountHolderName, bankName, accountNumber, ifscCode
        } = request.body;

        const sellerRole = normalizePublicSellerRole(role);
        const contactNumber = storeContact || mobile;

        if (!name || !email || !password || !marketId || (sellerRole !== 'DELIVERY_RIDER' && (!storeName || !contactNumber))) {
            return response.status(400).json({
                message: sellerRole === 'DELIVERY_RIDER' ? "Please provide basic details and market." : "Please provide essential basic and store details.",
                error: true,
                success: false
            });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            if (existingUser.verify_email === false) {
                const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                existingUser.otp = newOtp;
                existingUser.otpExpires = Date.now() + 10 * 60 * 1000;
                await existingUser.save();

                const emailSent = await sendVerificationOtpEmail({
                    email,
                    name: existingUser.name,
                    otp: newOtp,
                    subject: `Verify your seller email – ${process.env.STORE_NAME || 'MyStore'}`,
                });

                return response.status(200).json({
                    success: true,
                    error: false,
                    message: emailSent
                        ? "OTP resent! Please check your email to verify your account."
                        : "Account exists but OTP email could not be sent — use Resend OTP on the verify page.",
                    data: { email: existingUser.email },
                });
            }

            return response.status(400).json({
                message: "Email already registered.",
                error: true,
                success: false
            });
        }

        const selectedMarket = await Market.findOne({ _id: marketId, status: 'active' }).select('_id');
        if (!selectedMarket) {
            return response.status(400).json({
                message: "Please select a valid active market",
                error: true,
                success: false
            });
        }

        
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const seller = new UserModel({
            email,
            password: hashPassword,
            name,
            mobile,
            role: sellerRole,
            verify_email: false,
            otp: verifyCode,
            otpExpires: Date.now() + 10 * 60 * 1000,
            status: "Active",
            storeProfile: sellerRole === 'DELIVERY_RIDER' ? undefined : {
                storeName: storeName || "",
                location: storeLocation || "",
                contactNo: contactNumber || "",
                description: storeDescription || "",
                image: shopBanner || "",
                category: "",
                marketId
            },
            riderProfile: sellerRole === 'DELIVERY_RIDER' ? {
                marketId,
                drivingLicense: drivingLicense || "",
                isAvailable: true,
            } : undefined,
            bankDetails: {
                accountHolderName: accountHolderName || "",
                bankName: bankName || "",
                accountNumber: accountNumber || "",
                ifscCode: ifscCode || ""
            }
        });

        await seller.save();
        const goMarket = sellerRole === 'DELIVERY_RIDER' ? null : await createDefaultGoMarketStore({
            seller,
            role: sellerRole,
            marketId,
            storeName,
            storeLocation,
            storeContact: contactNumber,
            storeDescription,
            shopBanner,
        });

        const emailSent = await sendVerificationOtpEmail({
            email,
            name,
            otp: verifyCode,
            subject: `Verify your seller email – ${process.env.STORE_NAME || 'MyStore'}`,
        });

        return response.status(200).json({
            success: true,
            error: false,
            message: emailSent
                ? "Seller registered successfully! Please verify your email OTP to open your panel."
                : "Seller registered! OTP email could not be sent — use Resend OTP on the verify page.",
            data: { email: seller.email, role: sellerRole, sellerId: seller._id, goMarket }
        });

    } catch (error) {
        return response.status(error.statusCode || 500).json({
            message: error.message || error,
            error: true, success: false
        });
    }
}


// ─── OTP-based Login (Email) ──────────────────────────────────────────────────
// Route: POST /api/user/send-login-otp
export async function sendLoginOtpController(request, response) {
    try {
        const { email } = request.body;

        if (!email) {
            return response.status(400).json({
                message: "Email is required",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(200).json({
                message: "User not found. Please register first.",
                error: true,
                success: false,
                registrationPending: true
            });
        }

        // If the user exists but has not finished registration verification,
        // prompt the client to send a registration OTP instead of login OTP.
        if (user.verify_email === false) {
            return response.status(200).json({
                message: "User not verified. Please verify registration OTP or request a new registration OTP.",
                error: true,
                success: false,
                registrationPending: true
            });
        }

        // Only block users who are inactive/suspended after verification.
        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Account is not active. Please contact admin.",
                error: true,
                success: false
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.login_otp = otp;
        user.login_otp_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const emailSent = await sendVerificationOtpEmail({
            email,
            name: user.name,
            otp,
            subject: `Login OTP – ${process.env.STORE_NAME || 'MyStore'}`,
        });

        if (!emailSent) {
            return response.status(500).json({
                message: "Could not send OTP email. Please try again.",
                error: true,
                success: false
            });
        }

        return response.status(200).json({
            message: "OTP sent to your email!",
            error: false,
            success: true
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// Route: POST /api/user/verify-login-otp
export async function verifyLoginOtpController(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                message: "Email and OTP are required",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Same as above: allow verification attempts for unverified (Pending)
        // accounts so users can complete registration via OTP. Block only
        // when the account is non-active but already verified.
        if (user.status !== "Active") {
            return response.status(400).json({
                message: "Account is not active. Please contact admin.",
                error: true,
                success: false
            });
        }

        if (!user.login_otp || user.login_otp !== otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        if (!user.login_otp_expires || user.login_otp_expires < Date.now()) {
            return response.status(400).json({
                message: "OTP expired. Please request a new one.",
                error: true,
                success: false
            });
        }

        // Clear OTP after successful verification
        user.login_otp = null;
        user.login_otp_expires = null;
        await user.save();

        return sendLoginResponse(response, user._id);

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


// ─── OTP-based Registration (Email) ───────────────────────────────────────────
// Route: POST /api/user/send-register-otp
export async function sendRegisterOtpController(request, response) {
    try {
        const { name, email } = request.body;

        console.log('🔹 send-register-otp called with:', { name, email });

        if (!name || !email) {
            return response.status(400).json({
                message: "Name and email are required",
                error: true,
                success: false
            });
        }

        const existingUser = await UserModel.findOne({ email });
        console.log('🔹 Existing user check:', existingUser ? 'User found' : 'User not found');

        // If user exists and is already active/verified, they should login instead
        if (existingUser && existingUser.verify_email === true) {
            console.log('🔹 User already verified, blocking registration');
            return response.status(400).json({
                message: "User already registered with this email. Please login instead.",
                error: true,
                success: false
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔹 Generated OTP:', otp);

        let user;
        
        // If user exists but is pending (verify_email=false), update their OTP
        if (existingUser && existingUser.verify_email === false) {
            console.log('🔹 Updating pending user with new OTP');
            existingUser.name = name;
            existingUser.register_otp = otp;
            existingUser.register_otp_expires = Date.now() + 10 * 60 * 1000;
            user = await existingUser.save();
        } else {
            console.log('🔹 Creating new pending user');
            // Create new temporary user with OTP
            user = new UserModel({
                email,
                password: "temp", // Will be set to null after verification
                name,
                register_otp: otp,
                register_otp_expires: Date.now() + 10 * 60 * 1000, // 10 minutes
                verify_email: false,
                status: "Pending"
            });
            await user.save();
            console.log('🔹 New user created with ID:', user._id);
        }

        console.log('🔹 Attempting to send email to:', email);
        const emailSent = await sendVerificationOtpEmail({
            email,
            name,
            otp,
            subject: `Registration OTP – ${process.env.STORE_NAME || 'MyStore'}`,
        });

        console.log('🔹 Email sent status:', emailSent ? 'SUCCESS' : 'FAILED');

        if (!emailSent) {
            console.log('🔹 Email failed, cleaning up...');
            // Delete the temp user if email fails (only if newly created)
            if (!existingUser) {
                await UserModel.findByIdAndDelete(user._id);
            }
            return response.status(500).json({
                message: "Could not send OTP email. Please try again.",
                error: true,
                success: false
            });
        }

        console.log('🔹 Registration OTP process completed successfully');
        return response.status(200).json({
            message: "OTP sent to your email!",
            error: false,
            success: true
        });

    } catch (error) {
        console.error('❌ send-register-otp error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// Route: POST /api/user/verify-register-otp
export async function verifyRegisterOtpController(request, response) {
    try {
        const { name, email, otp } = request.body;

        if (!name || !email || !otp) {
            return response.status(400).json({
                message: "Name, email, and OTP are required",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Registration session not found. Please start registration again.",
                error: true,
                success: false
            });
        }

        if (user.verify_email === true) {
            return response.status(400).json({
                message: "Email already verified. Please login instead.",
                error: true,
                success: false
            });
        }

        if (!user.register_otp || user.register_otp !== otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        if (!user.register_otp_expires || user.register_otp_expires < Date.now()) {
            return response.status(400).json({
                message: "OTP expired. Please start registration again.",
                error: true,
                success: false
            });
        }

        // Activate user account
        user.name = name; // Update name in case it changed
        user.password = "null"; // No password for OTP-based registration
        user.verify_email = true;
        user.status = "Active";
        user.register_otp = null;
        user.register_otp_expires = null;
        await user.save();

        return sendLoginResponse(response, user._id);

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}
