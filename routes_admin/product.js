const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Product = require('../models/product');
const Category = require('../models/categories')


const router = express.Router()
dotenv.config()

//endpoint to add product
router.post('/add_product', async (req, res) => {
    const { token, product_name, price, description, brand, product_quantity, category } = req.body;

    if(!token || !product_name || !price || !description || !brand || !product_quantity || !category)
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token 
        const admin = jwt.verify(token, process.env.JWT_SECRET)

        // create product document
        const product = new Product();
        product.product_name = product_name;
        product.price = price;
        product.description = description;
        product.brand = brand;
        product.product_quantity = product_quantity;
        product.category = category;
        product.img_id = "a";
        product.img_url = "a";
        product.posted_by = admin.email
        product.is_deleted = false
        product.vendor_id = admin._id
        product.timestamp = Date.now()
        
        await product.save()

        res.status(200).send({status: 'ok', msg:'Product added Successfully', product})
        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

//endpoint to edit product
router.post('/edit_product', async (req, res) => {
    const { token, product_id, product_name, price, description, brand, product_quantity, category } = req.body;

    if(!token || !product_id )
        return res.status(400).send({status:'error', msg:'All fields must be filled'})

    try {
        //verify token
        const admin = jwt.verify(token, process.env.JWT_SECRET)

        //get product document
        let product = await Product.findOne({_id: product_id}, {product_name: 1, price: 1, description: 1, brand: 1, product_quantity: 1, category: 1}).lean()

        //update product document
        if(!product)
            return res.status(400).send({status: 'error', msg:'Product not found'})

        product = await Product.findByIdAndUpdate({_id: product_id}, {
            product_name: product_name || product.product_name,
            price: price || product.price, 
            description: description || product.description,
            brand: brand || product.brand,
            product_quantity: product_quantity || product.product_quantity,
            category: category || product.category
            }, {new: true}).lean()

           return res.status(200).send({status: 'ok', msg:'Product updated successfully', product})
    } catch (e){
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
        
    }
})

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

//endpoint to add product categories
router.post('/add_product_category', async(req, res) =>{
    const { token, category_name } = req.body;

    if(!token || !category_name)
        return res.status(400).send({status: 'error', msg:'All fields must be filled'});

    try {

        //verify token
        jwt.verify(token, process.env.JWT_SECRET)


        //add category document
        const category = await Category.findOneAndUpdate({ }, {
            $push : {categories: category_name}
        }, {new: true, upsert: true}).lean()

        return res.status(200).send({status: 'ok', msg:'Category successfully added ', categories: category.categories})

        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
        
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

//Endpoint to delete product
router.post('/delete_product', async(req, res) =>{
    const {token, product_id} = req.body

    if(!token || !product_id)
        return res.status(400).send({status:'error', msg:'All fields must be filled'});

    try {
        //verify token
         jwt.verify(token, process.env.JWT_SECRET)

        //update product document
        await Product.findByIdAndUpdate({_id: product_id}, {is_deleted: true}, {new: true}).lean();

        return res.status(200).send({status: 'ok', msg:'Deleted successfully'})

    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).send({status:'error', msg:'Token verification failed', error: e})
            }
            return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

module.exports = router


