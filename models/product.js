const mongoose = require('mongoose');
const Schema = mongoose.Schema

const productSchema = new Schema({
    product_name : String,
    img_id: String,
    img_url: String,
    price: Number,
    timestamp: String,
    description: String,
    rating: {type: Number, default: 0},
    no_of_ratings: {type: Number, default: 0},
    rating_meta_data: {
        5: {type: Number, default: 0},
        4: {type: Number, default: 0},
        3: {type: Number, default: 0},
        2: {type: Number, default: 0},
        1: {type: Number, default: 0}
    }, 
    category: [String],
    no_of_orders: {type: Number, default: 0},
    brand: String,
    product_quantity: {type: Number, default: 0},
    is_deleted: {type: Boolean, default: false},
    posted_by: String,
    vendor_name: String,
    vendor_img: String,
    vendor_id: String,
},{collection : 'products'})

const model = mongoose.model('Product', productSchema)
module.exports = model