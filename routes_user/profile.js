const express = require('express')
const User = require('../models/user')
const jwt= require('jsonwebtoken')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { encryptObject, decryptObject } = require('../encrypt')


const router = express.Router()
dotenv.config()

//Endpoint to edit profile
router.post('/edit_profile', async(req,res)=>{
    const {token, fullname, phone_no, email} = req.body

    //check if fields are passed
    if(!token)
    return res.status(404).send({status:"error", msg:"required fields must be filled"})

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

    return res.status(200).send({status: 'Successful', msg: 'Successfully updated user', Muser})
  
    }catch(e){
        if(e.name === 'JsonWebTokenError'){
        console.log(e)
        return res.status(401).send({status: 'error', msg: 'Token Verification Failed', error: e})
}
      return res.status(500).send({status: 'error', msg: 'An error occured'}) }
})


// endpoint to change password
router.post('/change_password', async(req, res)=>{
    const {token , old_password, new_password, confirm_new_password} = req.body;

    //check if fields are passed correctly
    if(!token || !old_password || !new_password || !confirm_new_password){
       return res.status(400).send({status: 'error', msg: 'all fields must be filled'})
    }

    // get user document and change password
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)

        let Muser = await User.findOne({_id: user._id}, {password : 1}).lean()

        const check = await bcrypt.compare(old_password, Muser.password)

        if(check){
            if(new_password !== confirm_new_password)
                return res.status(400).send({status:'error', msg:'password missmatch'})

              const updatepassword = await bcrypt.hash(confirm_new_password, 10)

            Muser = await User.findOneAndUpdate({_id: user._id}, {password: updatepassword}).lean()

        return res.status(200).send({status: 'successful', msg: 'Password successfully changed'})       
        }
         return res.status(400).send({status: 'error', msg: 'Old_password not correct'})
   
    } catch (error) {
        if(error.name === 'JsonWebTokenError'){
        console.log(error)
        return res.status(401).send({status: 'error', msg: 'Token Verification Failed', error: e})
}
      return res.status(500).send({status: 'error', msg: 'An error occured'})}
})

//endpoint to view profile
router.post('/view_profile', async(req, res) =>{
    const {token }= req.body;

    if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'})

    try {
        // verify token
        const user = jwt.verify(token, process.env.JWT_SECRET);
    
        // get user document
        const Muser = await User.findOne({_id : user._id}).lean(); 
        
       return res.status(200).send({status: 'ok', msg: 'successful', user: Muser })
    } catch (error) {
        if(error.name === 'JsonWebTokenError'){
          console.log(error)
          return res.status(401).send({status: 'error', msg: 'Token Verification Failed', error: e})
}
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
         await User.findOneAndUpdate({_id: user._id},{ $push: {addresses: address}}, {new: true}).lean()

         return res.status(200).send({status: 'ok', msg: 'Address added successfully'})
     } catch (e) {      
        if(e.name === 'JsonWebTokenError'){
        console.log(e)
        return res.status(401).send({status: 'error', msg:'Token Verification failed', error: e})
        }
        return res.status(500).send({status: 'error', msg:'An error occured'})
     }
})

// endpoint to add card details
router.post('/add_card', async(req, res) =>{
    const {token, card_details} = req.body;

    if(!token || !card_details){
    return res.status(400).send({status: 'error', msg: 'All fields must be filled'})
}
    // Token verification
    try {
        let user = jwt.verify(token, process.env.JWT_SECRET)

        // fetch initial user card details and decrypt it if any
    const userM = await User.findById({ _id: user._id }, { card_details: 1 }).lean();
    if (userM.card_details) {
      // decrypt card details
      let decrypted_card_details = decryptObject(userM.card_details, process.env.CART_DIGITS);
      decrypted_card_details.push(card_details);

      // encrypt card details and update the user document
      const encrypted_card_details = encryptObject(decrypted_card_details, process.env.CART_DIGITS);
      await User.updateOne({ _id: user._id }, { card_details: encrypted_card_details });

      // create notification document
      let notification = new Notification();
      notification.event = "Add card";
      notification.event_id = "Cart";
      notification.message = "New card added to payment method";
      notification.timestamp = Date.now();
      notification.receiver_id = user._id;
      notification.sender_id = "Cart";

      await notification.save();

      // notify user that his order has been accepted
      //setTimeout(handleNotification, 1000, user._id, '', process.env.FOODKART_LOGO, process.env.APP_NAME, "Payment", notification);

      return res.status(200).send({ status: "ok", msg: "success", card_details: decrypted_card_details });
    }

    // encrypt card details and update the user document
    const encrypted_card_details = encryptObject([card_details], process.env.CART_DIGITS);

    await User.updateOne({ _id: user._id }, { card_details: encrypted_card_details });

    return res.status(200).send({ status: "ok", msg: "success", card_details: [card_details] });

    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
           console.log(e)  
           return res.status(401).send({status: 'error', msg: 'Token verification failed', error: e})
        }
        return res.status(500).send({status: 'error', msg: 'An error occured'})
    }
})


module.exports = router;