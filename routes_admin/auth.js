const express = require('express')
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Admin = require('../models/admin')



const router = express.Router()
dotenv.config()

// endpoint to signup
router.post('/signup', async(req, res)=>{
    const { fullname , email, password, role} = req.body

    if(!fullname || !email || !password || !role)
        return res.status(400).send({statu: 'error', msg: 'All fields must be filled'});

    try {
        // check if admin with email already exists
        const check = await Admin.findOne({email}, {email: 1}).lean()
            if(check)
                return res.status(400).send({status: 'error', msg: 'An account with email already exists'})

        // encrypt password
        const Mpassword = await bcrypt.hash(password, 10);
    

        // create admin document
        const timestamp = Date.now()

        const admin =  new Admin()
            admin.fullname= fullname
            admin.email= email
            admin.password= Mpassword
            admin.role= role
            admin.img_id= ""
            admin.img_url= ""
            admin.timestamp= timestamp
            
            await admin.save()
            

        return res.status(200).send({status: 'ok', msg: 'Admin created successfully', admin})
        

    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }

 
})

// endpoint to login
router.post('/login', async(req, res) =>{
    const {email, password } = req.body

    if(!email || !password)
        return res.status(400).send({status: 'error', msg: 'All fields must be filled'})
    
    try {
        // check if admin exists
        const admin = await Admin.findOneAndUpdate({email}, {is_online: true, last_login: Date.now()}).lean()

        if(!admin)
            return res.status(400).send({status: 'error', msg: 'No user with this email'})

        // comapre password
        const compare_password = await bcrypt.compare(password, admin.password);

        if(!compare_password)
            return res.status(400).send({status:'error', msg:'password incorrect'});


        const token = jwt.sign({
            _id: admin._id,
            email: admin.email
        }, process.env.JWT_SECRET)

       return res.status(200).send({status: 'ok', msg: 'Login successful', admin, token})
        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }

})

//endpoint to logout
router.post('/logout', async(req, res) =>{
    const {token} = req.body

    if(!token)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        // Token verification
         const admin =jwt.verify(token , process.env.JWT_SECRET)

        //update document
         await Admin.findOneAndUpdate({_id: admin._id}, {is_online: false, last_logout: Date.now()}).lean()

        return res.status(200).send({status:'ok', msg:'Logout successful'})

    } catch (e){
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }
    

})

//endpoint to delete account
router.post('delete_admin', async(req, res)=>{
    const{token, admin_id} = req.body

    if(!token || admin_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //update admin document
        await Admin.findOneAndUpdate({_id: admin_id}, {is_deleted: true}).lean()

        res.status(200).send({status:'ok', msg:'Successfully Deleted'})
        
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