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
orders : [String],
last_login: Number,
last_logout: Number,
is_online: {type: Boolean, default: false},
is_deleted: {type: Boolean, default: false}
},{collection: 'users'})

const model= mongoose.model('User', userSchema);
module.exports = model;