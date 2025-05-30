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
        const admin = await Admin.findOneAndUpdate({email, is_deleted: false}, {is_online: true, last_login: Date.now()}, {new: true}).lean()

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
         await Admin.findOneAndUpdate({_id: admin._id}, {is_online: false, last_logout: Date.now()}, {new: true}).lean()

        return res.status(200).send({status:'ok', msg:'Logout successful'})

    } catch (e){
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }
    

})

module.exports = router;