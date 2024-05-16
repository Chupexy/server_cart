const express = require('express')
const User = require('../models/user')
const jwt= require('jsonwebtoken')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')


const router = express.Router()
dotenv.config()

//Endpoint to edit profile
router.post('/edit_profile', async(req,res)=>{
    const {token, fullname, phone_no, email} = req.body

    //check if fields are passed
    if(!token)
    res.status(404).send({status:"error", msg:"required fields must be filled"})

    try{
        // verify token
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //get user document
        let Muser = await User.findOne({_id: user._id}, {fullname: 1, phone_no: 1, email: 1}).lean()

        //update user document
        Muser = await User.findOneAndUpdate(
            {_id: user._id},{
                fullname: fullname || Muser.fullname,
                email: email || Muser.email,
                phone_no: phone_no || Muser.phone_no
        }, {new: true}
    ).lean()

    res.status(200).send({status: 'Successful', msg: 'Successfully updated user', user: Muser})
  
    }catch(e){
        res.status(400).send({status: 'error', msg:'An error occured'})
    }
})


// endpoint to change password
router.post('/change_password', async(req, res)=>{
    const {token , old_password, new_password, confirm_new_password} = req.body;

    //check if fields are passed correctly
    if(!token || !old_password || !new_password || !confirm_new_password){
        res.status(400).send({status: 'error', msg: 'all fields must be filled'})
    }

    // get user document and change password
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)
        const check = await bcrypt.compare(password, old_password)
        if(check){
             if(new_password === confirm_new_password){
            const updatepassword = bcrypt.hash(confirm_new_password, 10)
            let Muser = await User.findOne({_id: user._id}, {password : 1}).lean()

            Muser = await User.findOneAndUpdate({_id: user_id},
            {
                password: updatepassword
            }).lean()

            res.status(200).send({status: 'successful', msg: 'Password successfully changed'})
        }
        }
       
        res.status(400).send({status: 'error', msg: 'new password fields dont match'})
    } catch (error) {
        res.status(400).send({status: 'error', msg: 'An error occured', error})
    }
})

//endpoint to view profile
router.post('/view_proile', async(req, res) =>{
    const {token }= req.body;

    if(!token)
    res.status(400).send({status: 'error', msg: 'all fields must be filled'})

    try {
        // verify token
        const user = jwt.verify(token, process.env.JWT_SECRET);
    
        // get user document
        const Muser = await User.findOne({_id : user._id}).lean(); 
        
        res.status(200).send({status: 'ok', msg: 'successful', user: Muser })
    } catch (error) {
        if(error.name === 'JsonWebTokenError')
          console.log(error)
          return res.status(401).send({status: 'error', msg: 'Token Verification Failed'})

        return res.status(500).send({status: 'error', msg: 'An error occured'})
    }
})

//endpoint to add address
router.post('/add_address', async(req, res) =>{
     const {token, address} = req.body

     if(!token || !address)
     return res.status(400).send({status: 'error', msg: 'All fields must be filled'})

     try {
        //token verification
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //Update document
         let Muser = await User.findOneAndUpdate({_id: user_id},{ $push: {addresses: address}}, {new: true}).lean()

         return res.status(200).send({status: 'ok', msg: 'Address added successfully'})
     } catch (e) {      
        if(e.name === 'JsonWebTokenError')
        console.log(e)
        return res.status(401).send({status: 'error', msg:'Token Verification failed'})
    
        return res.status(500).send({status: 'error', msg:'An error occured'})
     }
})

// endpoint to add card details
router.post('add_cad', async(req, res) =>{
    const {token, card_details} = req.body;

    if(!token || !card_details){
    return res.status(400).send({status: 'error', msg: 'All fields must be filled'})
}
    // Token verification
    try {
        let user = jwt.verify(token, process.env.JWT_SECRET)


        res.status(200).send({status: 'ok', msg: 'Successful'})
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
           console.log(e)  
           return res.status(401).send({status: 'error', msg: 'Token verification failed'})
        }
        return res.status(500).send({status: 'error', msg: 'An error occured'})
    }
})


module.exports = router;