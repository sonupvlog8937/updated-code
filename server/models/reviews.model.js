import mongoose from "mongoose";

const reviewsSchema = new mongoose.Schema({
    image : {
        type : String,
        default : '',
    },
    userName : {
        type : String,
        default : '',
    },
    review : {
        type : String,
        default : '',
    },
    rating : {
        type : String,
        default : '',
    },
    userId : {
        type : String,
        default : '',
    },
    productId : {
        type : String,
        default : '',
    },
    /** grocery_shop | restaurant — empty for legacy product reviews */
    targetType : {
        type : String,
        default : 'product',
        index : true,
    },
    outletId : {
        type : String,
        default : '',
        index : true,
    },
},{
    timestamps : true
});

reviewsSchema.index({ outletId: 1, targetType: 1, createdAt: -1 });
reviewsSchema.index({ userId: 1, outletId: 1, targetType: 1 }, { unique: true, partialFilterExpression: { outletId: { $ne: '' } } });

const ReviewModel = mongoose.model('reviews',reviewsSchema)

export default ReviewModel