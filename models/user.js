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
no_of_orders: {type: Number, default: 0},
addresses: [
{
    address: String,
    city: String,
    state: String
}
],
prefs: {
    show_contact: {type: Boolean, default: false},
    dark_mode: {type: Boolean, default: false},
    receive_notifications: {type: String, default: 'yes'},
    receive_message_alerts: {type: String, default: 'yes'}
},
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