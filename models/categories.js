const mongoose = require('mongoose')
const Schema = mongoose.Schema

const categorySchema = new Schema({
    categories: [String]
},{collection : 'categories'})

const model = mongoose.model( 'Categories', categorySchema)
module.exports = model