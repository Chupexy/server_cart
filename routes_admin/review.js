const express = require('express');
const Review = require('../models/reviews')
const router = express.Router();

//endpoint to view product reviews
router.post('/view_product_reviews', async(req, res)=>{
    const {product_id} = req.body
    if(!product_id)
        return res.status(400).send({status: 'error' , msg: 'Product_id is needed'})
    try{
        const reviews = await Review.find({product_id: product_id})

        if(reviews.length == 0)
            return res.status(200).send({status: 'ok' , msg: 'No reviews at the moment'})

        return res.status(200).send({status: 'ok' , msg: 'Success', reviews: reviews, count: reviews.length})
        }catch(e){
            return res.status(500).send({status: 'error' , msg: 'An error occured', error: e})
            }
})

module.exports = router;