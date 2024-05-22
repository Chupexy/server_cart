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

module.exports= router