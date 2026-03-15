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
        enum: ["Active", "Inactive", "Suspended"],
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
    role: {
        type: String,
        enum: ['ADMIN', 'USER', 'SELLER'],
        default: "USER"
    },
    signUpWithGoogle:{
        type:Boolean,
        default:false
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
                enum: ["COMMISSION", "DEPOSIT", "WITHDRAW"],
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
    ]
},
    { timestamps: true }
)


const UserModel = mongoose.model("User",userSchema);

export default UserModel