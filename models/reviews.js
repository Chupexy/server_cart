const mongoose = require('mongoose');
const Schema = mongoose.Schema

const reviewSchema = new Schema({
    user_id: String,
    img_url: String,
    fullname: String,
    product_name: String,
    product_img_url: String,
    product_id: String, 
    review: String,
    rating: {type: Number, default: 0}, // 1 to 5
    timestamp: Number
}, {collection: 'Reviews'});

const model = mongoose.model('review', reviewSchema);
module.exports = model;