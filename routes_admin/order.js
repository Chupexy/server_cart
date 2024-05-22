const express = require('express')
const jwt = require('jsonwebtoken')


const User = require('../models/user')
const Admin= require('../models/admin')
const Order = require('../models/order')
const Product = require('../models/product')
const Notification = require('../models/notification')

const router = express.Router()


//endpoint to view orders
router.post('/view_orders', async(req, res) =>{
    const {token } = req.body
    if(!token)
      return res.status(400).send({status:'error', msg:'all fields must be filled'})
  
    try {
       jwt.verify(token, process.env.JWT_SECRET)
  
      const orders = await Order.find({ }).lean()
      if(orders.length === 0)
        return res.status(200).send({status:'ok', msg:'no orders found'})
  
      return res.status(200).send({status:'ok', msg:'Successful', orders, count : orders.length})
  
    } catch (e) {
      if(e.name === 'JsonWebTokenError'){
        console.log(e)
        res.status(401).send({status:'error', msg:'Token verification failed', error: e})
    }
    return res.status(500).send({status:'error', msg:'An error occured'})
  }
    
  })

  //endpoint to view pending orders
  router.post('/view_pending_orders', async(req, res) =>{
    const {token } = req.body
    if(!token)
        return res.status(400).send({status:'error', msg:'all fields must be filled'})


    try {
        //verify token
        jwt.verify(token, process.env.JWT_SECRET)

        const order = await Order.find({ }, {order_status: "pending"}).lean()
        if(order.length === 0)
            return res.status(200).send({status:'ok', msg:'no pending orders found'})

        return res.status(200).send({status:'ok', msg:'Successful', order, count : order.length})
    } catch (e) {
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }
})

//endpoint to accept order
router.post('/accept_order', async(req, res) =>{
  const {token, order_id } = req.body
  if(!token || !order_id)
    return res.status(400).send({status:'error', msg:'all fields must be filled'})

  try {
    //verify token
    const admin = jwt.verify(token, process.env.JWT_SECRET)
    const timestamp = Date.now()

    //fetch and update order document
    const order = await Order.findOneAndUpdate({_id: order_id}, {is_accepted: true, order_status: "Accepted"}, {new:true}).lean()

    if(!order)
      return res.status(200).send({status:'ok', msg:'Order not found'})

      // send notification to admin
      let notification = new Notification();
      notification.event = `Order Accepted : ${order.product}`;
      notification.event_id = order._id;
      notification.message = `Your order has been accepted ${order.product}`;
      notification.timestamp = timestamp;
      notification.receiver_id = order.user_id;
      notification.sender_id = admin._id;

      await notification.save();


    return res.status(200).send({status:'ok', msg:"Order Accepted"})
    
  } catch (e) {
    if(e.name === 'JsonWebTokenError'){
      console.log(e)
      res.status(401).send({status:'error', msg:'Token verification failed', error: e})
  }
  return res.status(500).send({status:'error', msg:'An error occured'})
  }
})

module.exports= router