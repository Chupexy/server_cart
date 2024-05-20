const express = require("express");
const dotenv = require("dotenv")
const mongoose = require('mongoose');

dotenv.config()

mongoose.connect(process.env.MONGO_URI)
const con = mongoose.connection
con.on('open', error =>{
    if(error) {
        console.log(`Error connecting to database ${error}`)
    }else{
    console.log("Connected to Database")
    }
})


const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))

//admin routes
app.use('admin_auth', require('./routes_admin/auth'))
app.use('admin_profile', require('./routes_admin/profile'))
app.use('admin_product', require('./routes_admin/product'))


//user routes
app.use('/user_auth', require('./routes_user/auth'))
app.use('/user_profile', require('./routes_user/profile'))
app.use('user_cart', require('./routes_user/cart'))


app.listen(process.env.PORT, ()=>{
    console.log("Server is running on port 3000");
})


module.exports = app;