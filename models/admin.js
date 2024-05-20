const mongoose = require('mongoose');
const Schema = mongoose.Schema

const adminSchema = new Schema({
    fullname : String,
    email : String,
    password: String,
    role: String,
    img_id: String,
    img_url: String,
    timestamp: Number,
    last_login: Number,
    last_logout: Number,
    is_online: {type: Boolean, default: false},
    is_deleted: {type: Boolean, default: false}

},{collection : 'admins'});

const model = mongoose.model('Admin', adminSchema);
module.exports = model