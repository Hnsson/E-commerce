const express = require('express')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const path = require('path')
const bodyParser = require('body-parser')
const router = require('./routes/routes')

const app = express()
const PORT = process.env.PORT || 80
const http = require('http').createServer(app).listen(PORT, () => {console.log("Server started on port: " + PORT)})

app.use(session({
    secret: "pog",
    saveUninitialized: true,
    resave: false,
    unset: 'destroy'
}))
app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, '/public')))

app.use('/', router)