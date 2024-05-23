const express = require('express')
const User = require('../models/user')
const jwt= require('jsonwebtoken')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')
const { encryptObject, decryptObject } = require('../encrypt')
const {sendPasswordReset} = require("../utils/nodemailer");
const Notification = require('../models/notification')


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

      // notify user 
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


// endpoint for a user to reset their password
router.post('/forgot_password', async (req, res) => {
    const {email} = req.body;
  
    if(!email){
        return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
    }
  
    try {
        // Add Regex for email check
        // const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if(!regex.test(String(email).toLocaleLowerCase())){
        //     return res.status(400).json({status: 'error', msg: 'Please enter a valid email'});
        // }
    
        // check if the user exists
        const found = await User.findOne({email}, {fullname: 1, email: 1}).lean();
    
        if(!found){
            return res.status(400).send({status: 'error', msg: 'There is no user account with this email'});
        }
    
        // create resetPasswordCode
        /**
         * Get the current timestamp and use to verify whether the
         * user can still use this link to reset their password
        */
    
        const timestamp = Date.now();
        const resetPasswordCode = jwt.sign({ email, timestamp }, process.env.JWT_SECRET, { expiresIn: '10m' });
  
        //send email to user to reset password
        // send email to user to reset password
        try {
            await sendPasswordReset(email, found.fullname, resetPasswordCode);
            return res.status(200).json({ status: 'ok', msg: 'Password reset email sent, please check your email' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: 'error', msg: 'Email not sent', error: error.name });
        }
  
    } catch(e) {
        console.error(e);
        return res.status(500).send({status: "error", msg: "some error occured", error: e.name});
    } 
  });
  
  // endpoint to reset password webpage
  router.get("/reset_password/:resetPasswordCode", async (req, res) => {
    const resetPasswordCode = req.params.resetPasswordCode;
    try {
      const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);
  
      const sendTime = data.timestamp;
      // check if more than 5 minutes has elapsed
      const timestamp = Date.now();
      if (timestamp > sendTime) {
        console.log("handle the expiration of the request code");
      }
  
      return res.send(`<!DOCTYPE html>
      <html>
          <head>
              <title>Forgot Password</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">    
              <style>
                  body {
                      font-family: Arial, Helvetica, sans-serif;
                      margin-top: 10%;
                  }
                  form{
              width: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 26%;
              margin-top: 0%;
          }
              @media screen and (max-width: 900px) {
                  form{
              width: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
                  }
              
  
              }
                  input[type=text]
              {
                      width: 100%;
                      padding: 12px 20px;
                      margin: 8px 0;
                      display: inline-block;
                      border: 1px solid #ccc;
                      box-sizing: border-box;
                  }
  
                  button {
                      background-color: #04AA6D;
                      color: white;
                      padding: 14px 20px;
                      margin: 8px 0;
                      border: none;
                      cursor: pointer;
                      width: 100%;
                  }
  
                  button:hover {
                      opacity: 0.8;
                  }   
  
                  .container {
                      padding: 16px;
                  }
  
                  span.psw {
                      float: right;
                      padding-top: 16px;
                  }
  
                  /* Change styles for span and cancel button on extra small screens */
                  @media screen and (max-width: 300px) {
                      span.psw {
                          display: block;
                          float: none;
                      }
  
                      .cancelbtn {
                          width: 100%;
                      }
                  }
              </style>
          </head>
          <body>    
                  <h2 style="display: flex; align-items: center; justify-content: center; margin-bottom: 0;">Recover Account</h2>
                  <h6 style="display: flex; align-items: center; justify-content: center; font-weight: 200;">Enter the new phone number
                      you want to use in recovering your account</h6>    
          
              <form action="http://localhost:3000/user_profile/reset_password" method="post">
                  <div class="imgcontainer">
                  </div>
                  <div class="container">
                      <input type="text" placeholder="Enter new password" name="new_password" required style="border-radius: 5px;" maxlength="11">
                      <input type='text' placeholder="nil" name='resetPasswordCode' value=${resetPasswordCode} style="visibility: hidden"><br>
                      <button type="submit" style="border-radius: 5px; background-color: #1aa803;">Submit</button>            
                  </div>        
              </form>
          </body>
  
      </html>`);
    } catch (e) {
        if (e.name === 'JsonWebTokenError') {
          // Handle general JWT errors
          console.error('JWT verification error:', e.message);
          return res.status(401).send(`</div>
          <h1>Password Reset</h1>
          <p>Token verification failed</p>
          </div>`);
        } else if (e.name === 'TokenExpiredError') {
          // Handle token expiration
          console.error('Token has expired at:', e.expiredAt);
          return res.status(401).send(`</div>
          <h1>Password Reset</h1>
          <p>Token expired</p>
          </div>`);
        } 
      console.log(e);
      return res.status(200).send(`</div>
      <h1>Password Reset</h1>
      <p>An error occured!!! ${e.message}</p>
      </div>`);
    }
  });
  
  // endpoint to reset password
  router.post("/reset_password", async (req, res) => {
    const { new_password, resetPasswordCode } = req.body;
  
    if (!new_password || !resetPasswordCode) {
      return res
        .status(400)
        .json({ status: "error", msg: "All fields must be entered" });
    }
  
    try {
      const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);
      const password = await bcrypt.hash(new_password, 10)
  
      // update the phone_no field
      await User.updateOne(
        { email: data.email },
        {
          $set: { password },
        }
      );
  
      // return a response which is a web page
      return res.status(200).send(`</div>
      <h1>Reset Password</h1>
      <p>Your password has been reset successfully!!!</p>
      <p>You can now login with your new password.</p>
      </div>`);
    } catch (e) {
        if (e.name === 'JsonWebTokenError') {
          // Handle general JWT errors
          console.error('JWT verification error:', e.message);
          return res.status(401).send(`</div>
          <h1>Password Reset</h1>
          <p>Token verification failed</p>
          </div>`);
        } else if (e.name === 'TokenExpiredError') {
          // Handle token expiration
          console.error('Token has expired at:', e.expiredAt);
          return res.status(401).send(`</div>
          <h1>Password Reset</h1>
          <p>Token expired</p>
          </div>`);
        } 
      console.log("error", e);
      return res.status(200).send(`</div>
      <h1>Reset Password</h1>
      <p>An error occured!!! ${e.message}</p>
      </div>`);
    }
  });



module.exports = router;