const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orderSchema =  new Schema({
    user_id: String,
    user_fullname: String,
    user_phone_no: String,
    user_img: String,
    user_address: String,
    product: String,
    category: String,
    product_id: String,
    total_order_cost: Number, // total order price
    is_paid: { type: Boolean, default: false }, // is set to true when user pays for the order
    img_url: String,
    is_accepted: { type: Boolean, default: false },
    is_declined: { type: Boolean, default: false },
    delivery_status: { type: String, default: "pending" }, // pending, delivered, completed
    is_accepted_timestamp: {type: Number, default: 0},
    price: Number,
    quantity: Number,
    order_instructions: String,
    day: Number,
    month: Number,
    year: Number,
    time: String,
    timestamp: Number,
    order_status: {type: String, default: "pending"}
    
},
{collection: 'orders'})

const model = mongoose.model('Order', orderSchema)
module.exports = model