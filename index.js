
// Importing the Libraries Required
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// app.use for loading json and static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// setting up the view engine
app.set("view engine", "ejs")

//GET Request Routes
app.get('/', (req,res)=>{
    res.render('landingPage')
})
app.get('/login', (req,res)=>{
    res.render('userLogin')
})

//Listening to port 5000
app.listen(5000)