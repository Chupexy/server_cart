const express = require('express')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin')
const dotenv = require('dotenv')


const router = express.Router()
dotenv.config()

//endpoint to edit profile
router.post('/edit_profile', async(req, res)=>{
    const {token, fullname, phone_no, email, role} = req.body

    //check if fields are passed
    if(!token)
    res.status(404).send({status:"error", msg:"required fields must be filled"})

    try{
        // verify token
        const admin = jwt.verify(token, process.env.JWT_SECRET)

        //get user document
        let Madmin = await Admin.findOne({_id: admin._id}, {fullname: 1, phone_no: 1, email: 1, role: 1}).lean()

        //update admin document
        Madmin = await Admin.findOneAndUpdate(
            {_id: admin._id},{
                fullname: fullname || Madmin.fullname,
                email: email || Madmin.email,
                phone_no: phone_no || Madmin.phone_no, 
                role: role || Madmin.role
        }, {new: true}
    ).lean()

    res.status(200).send({status: 'Successful', msg: 'Successfully updated user', admin: Madmin})
}catch(e){
    res.status(400).send({status: 'error', msg:'An error occured'})
}
})

//endpoint to change password
router.post('/change_password', async(req, res)=>{
    const {token , old_password, new_password, confirm_new_password} = req.body;

    //check if fields are passed correctly
    if(!token || !old_password || !new_password || !confirm_new_password){
        res.status(400).send({status: 'error', msg: 'all fields must be filled'})
    }
 // get user document and change password
 try {
    const admin = jwt.verify(token, process.env.JWT_SECRET)

    let Madmin = await Admin.findOne({_id: admin._id}, {password : 1}).lean()

    const check = await bcrypt.compare(old_password, Madmin.password)

    if(check){
        if(new_password !== confirm_new_password)
            return res.status(400).send({status:'error', msg:'password missmatch'})

          const updatepassword = await bcrypt.hash(confirm_new_password, 10)

        Madmin = await Admin.findOneAndUpdate({_id: admin._id}, {password: updatepassword}).lean()

    return res.status(200).send({status: 'successful', msg: 'Password successfully changed'})       
    }
     return res.status(400).send({status: 'error', msg: 'Old_password not correct'})
    } catch (error) {
        if(error.name === 'JsonWebTokenError'){
            console.log(error)
            return res.status(401).send({status: 'error', msg: 'Token Verification Failed'})}
  
          return res.status(500).send({status: 'error', msg: 'An error occured'})
      }
    
})

//endpoint to view profile
router.post('/view_profile', async(req, res) =>{
    const {token }= req.body;

    if(!token)
    res.status(400).send({status: 'error', msg: 'all fields must be filled'})

    try {
        // verify token
        const admin = jwt.verify(token, process.env.JWT_SECRET);
    
        // get admin document
        const Madmin = await Admin.findOne({_id : admin._id}).lean(); 
        
        res.status(200).send({status: 'ok', msg: 'successful', admin: Madmin })
    } catch (error) {
        if(error.name === 'JsonWebTokenError'){
          console.log(error)
          return res.status(401).send({status: 'error', msg: 'Token Verification Failed'})}

        return res.status(500).send({status: 'error', msg: 'An error occured'})
    }
})




module.exports = router