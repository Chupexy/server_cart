const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Product = require('../models/product');
const Category = require('../models/categories')
const User = require('../models/user')


const router = express.Router()
dotenv.config()

//endpoint to view single product
router.post('/view_product', async(req, res) =>{
    const { token, product_id } = req.body;

    if(!token || !product_id)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //find product documeent
        const product = await Product.findById({_id: product_id}).lean()

        if(!product)
            return res.status(404).send({status: 'error', msg: 'Product not found'})

        return res.status(200).send({status:'ok', msg:'Product found', product})
        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
            return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

// endpoint to view products
router.post('/view_products', async(req, res) =>{
    const { token } = req.body;

    if(!token)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {
        jwt.verify(token, process.env.JWT_SECRET)

        const products = await Product.find({}).lean()
        if(products.length == 0)
            return res.status(400).send({status:'error', msg:'No product at the moment'});

        res.status(200).send({status:'ok', msg:'Products found', products})
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

//endpoint to view categories
router.post('/view_categories', async(req, res) =>{
    const {token } = req.body
    
    if(!token)
        return res.status(400).send({status:'error', msg:'All fields must be filled'});

    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        const category = await Category.findOne({ }).lean()

        if(!category)
            return res.status(200).send({status:'ok', msg: 'No categories at the moment'})

        return res.status(200).send({status:'ok', categories: category.categories})
        
    } catch (e){
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
            res.status(500).send({status:'error', msg:'An error occured'})

    }
})

//endpoint to search product
router.post('/search_product', async(req, res) =>{
    const {token, search_string } = req.body
    if(!token || !search_string)
        return res.status(400).send({status:'error', msg:'All fields must be filled'});

    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        const product = await Product.findOne({product_name: search_string}).lean()

        if(!product)
            return res.status(200).send({status:'ok', msg: 'Product not found'})

        return res.status(200).send({status: 'ok', msg:'Successful', Product: product})

        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
           return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
}) 

//endpoint to save item
router.post('/save_item', async(req, res) =>{
    const {token, product_id} = req.body
    if(!token || !product_id )
        return res.status(400).send({status:'error', msg:'All fields must be filled'});

    try {
        
        //verify token
        const user =jwt.verify(token, process.env.JWT_SECRET)

        //update user document
         await User.updateOne({_id: user._id}, {$push: {saved_items: product_id}})

         return res.status(200).send({status:'ok', msg:'Saved successfully'})
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
           return res.status(500).send({status:'error', msg:'An error occured'})
        
    } 

})

//endpoint to view popular products
router.post('/view_popular_products', async(req,res) =>{
    const {token} = req.body
    if(!token)
        return res.status(400).send({status:'error', msg:'all fields must be filled'})

    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        const product = await Product.find({ }).sort({no_of_orders: -1}).lean()

        if(product.length === 0)
            return res.status(200).send({status:'ok', msg: 'No popular product yet'})

        return res.status(200).send({status:'ok', msg:'Successful', product, count: product.length})
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
           return res.status(500).send({status:'error', msg:'An error occured'})
    }
})


module.exports = router