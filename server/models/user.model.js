import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Provide name"]
    },
    email: {
        type: String,
        required: [true, "Provide email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Provide password"]
    },
    avatar: {
        type: String,
        default: ""
    },
    mobile: {
        type: Number,
        default: null
    },
    verify_email: {
        type: Boolean,
        default: false
    },
    access_token: {
        type: String,
        default: ''
    },
    refresh_token: {
        type: String,
        default: ''
    },
    last_login_date: {
        type: Date,
        default: ""
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Suspended", "Pending"],
        default: "Active"
    },
    address_details: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'address'
        }
    ],
    orderHistory: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'order'
        }
    ],
    otp:{
        type:String
    },
    otpExpires:{
        type:Date
    },
    phone_login_otp: {
        type: String,
        default: null
    },
    phone_login_otp_expires: {
        type: Date,
        default: null
    },
    login_otp: {
        type: String,
        default: null
    },
    login_otp_expires: {
        type: Date,
        default: null
    },
    register_otp: {
        type: String,
        default: null
    },
    register_otp_expires: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['ADMIN', 'USER', 'SELLER', 'GROCERY_SELLER', 'RESTAURANT_SELLER', 'DELIVERY_RIDER'],
        default: "USER"
    },
    signUpWithGoogle:{
        type:Boolean,
        default:false
    },
    firebaseUid: {
        type: String,
        default: "",
        index: true
    },
    storeProfile: {
        storeName:    { type: String, default: "" },
        description:  { type: String, default: "" },
        image:        { type: String, default: "" },
        location:     { type: String, default: "" },
        contactNo:    { type: String, default: "" },
        moreInfo:     { type: String, default: "" },
        category:     { type: String, default: "" },
        returnPolicy: { type: String, default: "" },
        shippingTime: { type: String, default: "" },
        openHours:    { type: String, default: "" },
        supportEmail: { type: String, default: "" },
        marketId:     { type: mongoose.Schema.ObjectId, ref: 'Market', default: null },
        goMarketOwnerId: { type: mongoose.Schema.ObjectId, ref: 'ShopOwner', default: null },
        storeStatus:  { type: String, enum: ["open", "closed"], default: "open" },
    },
    bankDetails: {
        accountHolderName: { type: String, default: "" },
        bankName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifscCode: { type: String, default: "" }
    },
    wallet: {
        availableBalance: { type: Number, default: 0 },
        pendingCommission: { type: Number, default: 0 },
        totalCommissionPaid: { type: Number, default: 0 },
        totalDeposited: { type: Number, default: 0 },
        totalWithdrawn: { type: Number, default: 0 }
    },
    walletTransactions: [
        {
            type: {
                type: String,
                enum: ["COMMISSION", "DEPOSIT", "WITHDRAW", "RIDER_EARNING", "RIDER_PAYOUT", "ADMIN_TRANSFER"],
                required: true
            },
            amount: { type: Number, required: true },
            status: {
                type: String,
                enum: ["PENDING", "APPROVED", "REJECTED"],
                default: "PENDING"
            },
            note: { type: String, default: "" },
            createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
            approvedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    preferredMarketId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Market',
        default: null
         },
    riderProfile: {
        marketId: { type: mongoose.Schema.ObjectId, ref: 'Market', default: null },
        drivingLicense: { type: String, default: "" },
        isAvailable: { type: Boolean, default: true },
        totalDelivered: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    }
},
    { timestamps: true }
)


const UserModel = mongoose.model("User",userSchema);

export default UserModel