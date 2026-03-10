const  mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {type:String, required:true},
    productPrice: {type:Number, required:true},
    productQuantity: {type:Number, required:true},
    productImage: {
        public_id: {type:String, required:true},
        secure_url: {type:String, required:true}
    },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref:"user"},

}, {timestamps:true, strict:"throw"})


const productModel = mongoose.model("product", productSchema)

module.exports = productModel