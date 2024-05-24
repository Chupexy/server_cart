const express = require('express');
const Review = require('../models/reviews')
const Product = require('../models/product')
const jwt = require('jsonwebtoken')
const Order = require('../models/order')



const router = express.Router();

//endpoint to create review
router.post('/create_review', async (req, res) =>{
    const {token, product_img_url, fullname, product_name, product_id, review, rating} = req.body;
    if(!token || !product_img_url || !fullname || !product_name || !product_id || !review || !rating)
        return res.status(400).send({status:'error', msg:'all fields must be filled'})

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);

        const reviewM = new Review();
        reviewM.fullname = fullname;
        reviewM.product_img_url = product_img_url;
        reviewM.product_name = product_name;
        reviewM.product_id = product_id;
        reviewM.review = review;
        reviewM.rating = rating;
        reviewM.user_id = user._id;

        const product_doc = await Product.findById({ _id: product_id }, { rating: 1, no_of_ratings: 1 }).lean()

      const new_rating = ((product_doc.rating * product_doc.no_of_ratings) + rating) / (product_doc.no_of_ratings + 1);
      const f = new_rating.toString().slice(0, 1);;

      // update dish document
      await Product.updateOne({ _id: product_id }, {
        rating: new_rating, $inc: {
          no_of_ratings: 1, [`rating_meta_data.${f}`]: 1
        }
      });

      // update order documents 
      await Order.updateMany({ product_id: product_id }, { rating: new_rating, $inc: { no_of_ratings: 1 } });

        reviewM.save();
        return res.status(200).send({status:'ok', msg:'Successful', review: reviewM})
        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//endpoint to view product reviews
router.post('/view_product_reviews', async(req, res)=>{
  const {token, product_id} = req.body
  if(!product_id || !token)
      return res.status(400).send({status: 'error' , msg: 'All fields must be filled'})
  try{
     const user= jwt.verify(token, process.env.JWT_SECRET)


      const reviews = await Review.find({user_id: user._id, product_id : product_id})

      if(reviews.length == 0)
          return res.status(200).send({status: 'ok' , msg: 'No reviews at the moment'})

      return res.status(200).send({status: 'ok' , msg: 'Success', reviews: reviews, count: reviews.length})
      }catch(e){
        if(e.name == 'JsonWebTokenError'){
          console.log(e)
          return res.status(401).send({status: 'error' , msg: 'Token verification error'})
        }
          return res.status(500).send({status: 'error' , msg: 'An error occured', error: e})
          }
})

module.exports = router;