const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser");
const session = require('express-session');
const MongoStore = require("connect-mongo")
const morgan = require("morgan");

const app = express()

// Setting
app.set('port', process.env.PORT || 4000);
app.set('trust proxy', true);

// Middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.use(morgan("dev"))
app.use(cors({
    origin: false,
    credentials: true
}))
const sixHour = 1000 * 60 * 60 * 6;
const URI = process.env.MONGODB_URI
    ? process.env.MONGODB_URI
    : 'mongodb://localhost/databasetest'
app.use(session({
    secret: process.env.COOKIE_SECRET,
    saveUninitialized:true,
    cookie: {
        maxAge: sixHour,
        httpOnly: true,
        secure: true,
        sameSite: "none"
    },
    resave: false,
    store: MongoStore.create({
        mongoUrl: URI,
        ttl: sixHour
    })
}));
app.use(cookieParser());

// Routes
app.use(require('../routes/server.routes'));
app.use(require("../routes/user.routes"))

module.exports = app