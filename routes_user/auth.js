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
             res.status(400).send({status: "error", msg: "User already exists"})
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

        res.status(200).send({status:"successful", msg: "User created successfully", user, token})


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
        const user = await User.findOneAndUpdate({email}, {is_online: true, last_login: Date.now()}).lean()
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

        await User.findOneAndUpdate({_id: user._id}, {is_online: false, last_logout: Date.now()}).lean()

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


// endpoint for a user to reset their password
router.post('/forgot_password', async (req, res) => {
    const {email} = req.body;
  
    if(!email){
        return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
    }
  
    try {
        // Add Regex for email check
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!regex.test(String(email).toLocaleLowerCase())){
            return res.status(400).json({status: 'error', msg: 'Please enter a valid email'});
        }
    
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
          
              <form action="https://server-foodkart.onrender.com/user_auth/reset_password" method="post">
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