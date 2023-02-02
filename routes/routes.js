const express = require('express');
const path = require('path')
const multer = require('multer')
// var imageModel = require('./imageModel');
const router = express.Router();

const mongoose = require('../conn')
const { productModel } = require('../models');
const { model } = require('mongoose');
const { readlink } = require('fs');

const stripe = require('stripe')("--KEY--")

const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname)
  }
})
var upload = multer({ storage: storageEngine })



async function fetch_all_products() {
  try {
    const all_products = productModel.find();

    if((await all_products.estimatedDocumentCount) === 0) {
      console.log("No documents found!");
    }

    return await all_products
  } catch (err) {
    console.log("CATCH::ERROR Could not fetch documents");
  }
}

async function fetch_one_product(id) {
  try {
    const product = await productModel.findById(parseInt(id));

    if((await product.estimatedDocumentCount) === 0) {
      console.log("CATCH::ERROR No document found!");
    }

    return product
  } catch (err) {
    console.log("Could not fetch document");
  }
}



router.get('/', async (req, res) => {
  fetch_all_products().then(all_products => {
    var cart_length = 0
    
    if(req.session.cart && !(Object.keys(req.session.cart['products']).length === 0)) {
      cart_length = Object.values(req.session.cart.products).reduce((a, b) => a + b);
    }
    res.render('index', {
      products: all_products,
      cart_length: cart_length
    })
  })
})

router.get('/create', (req, res) => {
  res.render('create')
})

router.get('/product/:productId', async (req, res) => {
  fetch_one_product(req.params.productId).then(product => {
    res.render('product', {
      product: product
    })
  })
})

router.post('/product/:productId', async (req, res) => {
  // Add to cart
  if(!req.session.cart) {
    var cart = req.session.cart = {}

    product = {}
    product[req.params.productId] = (product[req.params.productId] || 0) + 1;
    cart["products"] = product;
    // cart[req.params.productId] = (cart[req.params.productId] || 0) + 1;
    res.redirect('/product/'+req.params.productId)
  } else {
    var cart = req.session.cart
    product = {}
    product[req.params.productId] = (product[req.params.productId] || 0) + 1;
    cart["products"][req.params.productId] = ( cart["products"][req.params.productId] || 0) + 1;
    // cart[req.params.productId] = (cart[req.params.productId] || 0) + 1;
    res.redirect('/product/'+req.params.productId)
  }
});


router.get('/test', (req, res) => {
  console.log(req.session.cart)
})

router.get('/cart', async (req, res) => {
  var cart = req.session.cart
  if(cart) {
    cart = req.session.cart.products
    productModel.find().where('_id').in(Object.keys(cart)).exec((err, cart_items) => {
      // Add quantity to cart_items
      cart_items = cart_items.map(o => ({...o._doc, quant: cart[o._id]}));
  
      // Sum of prices
      const sum_price = cart_items.reduce((accumulator, object) => {
        return accumulator + object.price * object.quant;
      }, 0);
      req.session.cart['total'] = sum_price
      res.render('cart', {
        cart: cart_items,
        total_price: sum_price
      })
    })
  } else {
    res.render('cart', {
      total_price: 0
    })
  }

})


router.post('/cart', (req, res) => {
  req.session.cart['products'][Object.keys(req.body)[0]] = parseInt(req.body[Object.keys(req.body)[0]]);
  res.redirect(req.get('referer'))
})

router.get('/cart/:productId', (req, res) => {
  if(req.params.productId) {
    delete req.session.cart['products'][req.params.productId];
    res.redirect('/cart');
  }
})


router.post('/cart/checkout', async (req, res) => {
  // We want to save the cart when they checkout
  // Maybe want to save something on our server to have the order there.
  // Make a new mongoose collection with orders.

  var cart = req.session.cart.products

  productModel.find().where('_id').in(Object.keys(cart)).exec(async (err, price_array) => {
    // Add quantity to cart_items
    prices = price_array.map(o => ({_id: o._id, name: o.name, price: o.price}));
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: Object.keys(prices).map(item => {
          
          return {
            price_data: {
              currency: 'SEK',
              product_data: {
                name: price_array[item].name
              },
              unit_amount: prices[item].price * 100
            },
            quantity: cart[prices[item]._id]
          }
        }),
        success_url: `http://localhost/cart/checkout/success`,
        cancel_url: `http://localhost/cart/checkout/cancel`,
      })

      res.redirect(session.url);
    } catch(e) {
      res.status(500).json({ error: e.message })
    }

  })
})


router.post("/uploadphoto", upload.single('image'), (req,res)=>{
  if(!req.file) {
    console.log("No file recieved")
  } else {
    const filePath = "images/" + req.file.filename;
    productModel.create({
      _id: req.body.id,
      name: req.body.name,
      desc: req.body.desc,
      price: req.body.price,
      src: filePath
    }, (err) => {console.log("Can't add duplicate")})
  }
})





router.get('/cart/checkout/success', (req, res) => {
  delete req.session.cart
  res.render('success')
})


router.get('/cart/checkout/cancel', (req, res) => {
  res.render('cancel')
})



router.all('*', (req, res) => {
  res.render('404')
})

module.exports = router;