const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'E-commerce'
})
.then(() => {
  console.log("Connected to the Database.\n")
})

const db = mongoose.connection;
module.exports = mongoose;