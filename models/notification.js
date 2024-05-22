const mongoose = require('mongoose');
const Schema = mongoose.Schema

const notificationSchema = new Schema({
    event: String,
    event_id: String,
    message: String,
    timestamp: Number,
    receiver_id: String, // will be the role of an admin if the notification is for an admin
    sender_id: String,
    is_read: {type: Boolean, default: false}
}, {collection: 'notifications'});

const model = mongoose.model('Notification', notificationSchema);
module.exports = model;