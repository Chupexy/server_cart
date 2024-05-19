const mongoose = require('mongoose');
const Schema = mongoose.Schema

const productSchema = new Schema({
    product_name : String,
    img_id: String,
    img_url: String,
    price: Number,
    timestamp: String,
    description: String,
    category: [String],
    brand: String,
    product_quantity: {type: Number, default: 0},
    is_deleated: {type: Boolean, default: false},
    posted_by: String,
    vendor_name: String,
    vendor_img: String,
    vendor_id: String
},{

})

const model = mongoose.model('Products', productSchema)
module.exports = model