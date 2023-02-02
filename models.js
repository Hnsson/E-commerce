const mongoose = require('./conn')


var productSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    desc: String,
    price: Number,
    src: String
})
 
//Image is a model which has a schema imageSchema
exports.productModel = new mongoose.model('products', productSchema)