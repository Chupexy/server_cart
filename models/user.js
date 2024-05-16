const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
fullname: String,
email: String,
password: String,
phone_no: String,
img_id: String,
img_url: String,
timestamp: Number,
addresses: [
{
    address: String,
    city: String,
    state: String
}
],
card_details: String,
saved_items: [String],
orders : [String]
},{

})

const model= mongoose.model('Users', userSchema);
module.exports = model;