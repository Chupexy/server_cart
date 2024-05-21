const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Cart = require('../models/cart');


const router = express.Router()
dotenv.config()


//endpoint to add to cart
router.post('/add_to_cart', async (req, res) => {
    const {token, items} = req.body

    if(!token || !items)
        return res.status(400).json({status: 'error', msg: "All fields must be filled"})

    try {

        const user = jwt.verify(token, process.env.JWT_SECRET)
        
        const cart = await Cart.findOneAndUpdate(
        { user_id: user._id },
        {
          $push: { order_items: items },
          $inc: { no_of_items: 1 }
        },
        { new: true }
      ).lean();
  
      return res.status(200).send({ status: "ok", msg: "success", cart });

    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).json({status: 'error', msg: "Token verification failed" })
        }
        res.status(500).send({status:'error', msg:'An error occured', error: e})
        
    }
})

//endpoint to view cart
router.post('/view_cart', async(req, res) =>{
    const {token} = req.body
    if(!token)
        return res.status(400).json({status: 'error', msg: "All fields must be filled"})

    try {

        const user = jwt.verify(token, process.env.JWT_SECRET)

        //get cart document
        const cart = await Cart.findOne({user_id: user._id}).lean()

        res.status(200).send({status:'ok' , msg:'Successful', cart , count: cart.no_of_items})
        
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).json({status: 'error', msg: "Token verification failed" })
        }
        res.status(500).send({status:'error', msg:'An error occured', error: e})
        
    }
})

//endpoint to delete item from cart
router.post('/delete_item', async(req, res) =>{
    const {token, item_id} = req.body

    if(!token || !item_id)
        return res.status(400).json({status: 'error', msg: "All fields must be filled"})

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET)

        //remove from cart
        const cart = await Cart.findOneAndUpdate({user_id: user._id}, {$pull: {order_items: {_id: item_id}}} , {$inc: {no_of_items: -1}}, {new: true}).lean()

        return res.status(200).send({status:'ok', msg:'Deleted successfully', cart})

    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            return res.status(401).json({status: 'error', msg: "Token verification failed" })
        }
        return res.status(500).send({status:'error', msg:'An error occured', error: e})
    }

})
module.exports = router;