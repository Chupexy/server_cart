const express = require("express");
const bcrypt = require("bcryptjs")

const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Cart = require('../models/cart')



const router = express.Router()



// Endpoint to signup
router.post('/signup', async(req, res) =>{
    const {fullname, email, phone_no, password} = req.body

    // Check if all fields are filled
    if(!fullname || !email || !phone_no || !password){
        return res.status(400).send({status: "error", msg: "All fields must be filled"})
    }
    
    try{
        // Check if user already exists
        const found = await User.findOne({email}, {email : 1}).lean()
        if(found){
            return res.status(400).send({status: "error", msg: "User already exists"})
        }


        const timestamp = Date.now()

        const user = new User()
        user.fullname = fullname;
        user.email = email;
        user.phone_no = phone_no;
        user.password = await bcrypt.hash(password, 10)
        user.timestamp = timestamp;
        user.img_id = "";
        user.img_url = "";
        user.addresses = [];
        user.card_details = "";
        user.saved_items = [],
        user.orders = []

        await user.save()


         // create cart document
         const cart = new Cart();
         cart.user_id = user._id;
         cart.order_items = [];
         cart.timestamp = timestamp;

         await cart.save();

    return res.status(200).send({status:"successful", msg: "User created successfully", user})


    }catch(e){
        return res.status(500).send({status: "error",msg:"some error occured", error: e.message})
    } 
})

// Endpoint to login
router.post('/login', async(req, res) =>{
    const { email, password} = req.body

    // Check if all fields are filled
    if(!email || !password)
       return res.status(400).send({status: "error", msg: "All fields must be filled"})

    // Check if user exists
    try{
        const user = await User.findOneAndUpdate({email}, {is_online: true, last_login: Date.now()}, {new: true}).lean()
        if(!user){
           return res.status(400).send({status: "error", msg: "User not found"})
        }
        // Compare password
        const confirm_password = await bcrypt.compare(password, user.password)

        // If password is correct, generate token
        if(confirm_password){
            const token = jwt.sign({
                _id: user._id,
                email: user.email,
            }, process.env.JWT_SECRET)
            return res.status(200).send({status: "Successful", msg: "User logged in successfully", user, token})
        }
        return res.status(400).send({status: "Error", msg: "Incorrect Password"})

    }catch(e){
        res.status(400).send({status: "error", msg: "An error occured"})
    }
})

//Endpoint to logout
router.post('/logout', async(req,res)=>{
    const{ token } = req.body
//check if fields are passed
    if(!token)
    return res.status(400).send({status: "error", msg: "all fields must be filled"})

    //verify token
    try{
        const user = jwt.verify(token, process.env.JWT_SECRET)

        await User.findOneAndUpdate({_id: user._id}, {is_online: false, last_logout: Date.now()}, {new: true}).lean()

        return res.status(200).send({status:"Successful", msg: "Logged out"})
    }catch(e){
        if(e.name === 'JsonWebTokenError'){
        console.log(e)
        return res.status(500).send({status: 'error', msg:'Token verification failed', error : e})
}
    return res.status(401).send({status: "error", msg:"An error occured"})
    }
})

//endpoint to delete user
router.post('/delete_user', async(req, res)=>{
    const{token, user_id} = req.body

    if(!token || user_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //update user document
        await User.findOneAndUpdate({_id: user_id}, {is_deleted: true}).lean()

       return res.status(200).send({status:'ok', msg:'Successfully Deleted'})
        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})


module.exports = router;