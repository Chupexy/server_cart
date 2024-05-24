const express = require('express')
const jwt = require('jsonwebtoken')


const User = require('../models/user')
//const Admin= require('../models/admin')
const Order = require('../models/order')
const Product = require('../models/product')
const Notification = require('../models/notification')

const router = express.Router()

// endpoint to place order(s)
router.post("/place_order", async (req, res) => {
    const { token, orders } = req.body;
  
    // check for required fields
    if (!token || !orders)
      return res.status(400).send({ status: "error", msg: "token and orders needed" });
  
    try {
      // token verification
      const user = jwt.verify(token, process.env.JWT_SECRET);
  
      const MOrders = [];
      const timestamp = Date.now();
      console.log("7")
  
      // create order document 
      for (let i = 0; i < orders.length; i++) {
        //check for required field
        if(!orders[i].product_name || !orders[i].user_fullname || !orders[i].product_id || !orders[i].total_order_cost || !orders[i].img_url || !orders[i].price || !orders[i].quantity || !orders[i].order_instructions || !orders[i].day || !orders[i].month || !orders[i].year)
          return res.status(400).send({ status: "error", msg: "all fields must be filled" });
        console.log('6')

        //fetch needed fields from order document
        const {vendor_id, posted_by, rating, category, no_of_orders} = await Product.findById({_id: orders[i].product_id}, {
           vendor_id: 1, posted_by: 1, rating: 1, category: 1, no_of_orders: 1
        }).lean()


        //create and populate document
        const order = new Order();
        console.log("4")
        order.product_name = orders[i].product_name;
        order.user_fullname = orders[i].user_fullname;
        order.category = category;
        order.product_id = orders[i].product_id;
        order.total_order_cost = orders[i].total_order_cost;
        order.img_url = orders[i].img_url;
        order.price = orders[i].price;
        order.quantity = orders[i].quantity;
        order.order_instructions = orders[i].order_instructions;
        order.day = orders[i].day;
        order.month = orders[i].month;
        order.year = orders[i].year;
        order.posted_by = posted_by;
        order.vendor_id = vendor_id
        order.product_rating = rating;
        order.product_no_of_orders = no_of_orders;
        console.log("2")
        order.timestamp = timestamp;
        console.log(order.timestamp)



        await order.save((error) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Order saved');
  }
})
        console.log(order)
        MOrders.push(order);

        // send notification to admin
      let notification = new Notification();
      notification.event = `New order received: ${order.product}`;
      notification.event_id = order._id;
      notification.message = `A new order has been placed for ${order.product}`;
      notification.timestamp = timestamp;
      notification.receiver_id = order.vendor_id;
      notification.sender_id = user._id;

      await notification.save();

      //setTimeout(handleNotification, 1000, order.vendor_id, '', process.env.FOODKART_LOGO, process.env.APP_NAME, `New order received: "${order.dish}"`, notification);
      
      }
       // update user document
       await User.updateOne({ _id: user._id }, {$push: {orders: MOrders._id}},{$inc: { no_of_orders: 1 }});

       return res.status(200).send({ status: "ok", msg: "success", orders: MOrders });

    }catch(e){
        if(e.name === 'JsonWebTokenError'){
            console.log(e)
            res.status(401).send({status:'error', msg:'Token verification failed', error: e})
        }
        return res.status(500).send({status:'error', msg:'An error occured'})
    }

})

//endpoint to view orders
router.post('/view_orders', async(req, res) =>{
  const {token } = req.body
  if(!token)
    return res.status(400).send({status:'error', msg:'all fields must be filled'})

  try {
    const user= jwt.verify(token, process.env.JWT_SECRET)

    const orders = await Order.find({user_id : user._id}).lean()
    if(orders.length == 0)
      return res.status(200).send({status:'ok', msg:'no orders found', orders: []})

    return res.status(200).send({status:'ok', msg:'Successful', Orders: orders})

  } catch (e) {
    if(e.name === 'JsonWebTokenError'){
      console.log(e)
      res.status(401).send({status:'error', msg:'Token verification failed', error: e})
  }
  return res.status(500).send({status:'error', msg:'An error occured'})
}
  
})
module.exports= router