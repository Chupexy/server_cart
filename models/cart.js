const mongoose = require('mongoose')
const Schema = mongoose.Schema

const cartSchema = new Schema({
    user_id: String,
    no_of_items: {type: Number, default: 0},
    order_items:[{
        product_id: String,
        product_name: String,
        img_url: String,
        quantity: Number,
        price: Number,
        total_cost: Number,
       description: String,
       vendor_name: String,
    }],
    timestamp: Number
    
},{

})


const model = mongoose.model('Cart', cartSchema)
module.exports = model