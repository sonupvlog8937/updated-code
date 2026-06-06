import mongoose from "mongoose";

const myListSchema = new mongoose.Schema({
    productId: {
        type: String,
        required:true
    },
    userId: {
        type: String,
        required:true
    },
    productTitle:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    oldPrice:{
        type:Number,
    },
    brand:{
        type:String,
    },
    discount:{
        type:Number,
    },
    size:{
        type:String,
    },
    weight:{
        type:String,
    },
    ram:{
        type:String,
    },
    color:{
        type:String,
        default:""
    },
    colorCode:{
        type:String,
        default:""
    },
    selectedOptions:{
        type:Object,
        default:{}
    },
},{
    timestamps : true
});


const MyListModel = mongoose.model('MyList',myListSchema)

export default MyListModel
