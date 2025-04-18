
// Importing the Libraries Required
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const User = require('./models/userModel'); // Your Mongoose model
const { isValidPassword, generateOtp } = require('./utils');
const nodemailer = require('nodemailer');

// app.use for loading json and static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());


// Setup session middleware (you should do this in your main app.js or index.js)
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false
}));

// setting up the view engine
app.set("view engine", "ejs")

//GET Request Routes
app.get('/', (req, res) => {
    res.render('landingPage')
})
app.get('/signup', (req, res) => {
    res.render('userSignup', { error: null })
})
app.get('/login', (req, res) => {
    res.render('userLogin', {error:null})
})
app.get('/verifyotp', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/signup');
    }

    res.render('verifyotp', { error: null }); // Render with no error initially
});
app.get('/resendotp', async (req, res) => {
    const sessionUser = req.session.user;

    if (!sessionUser || !sessionUser.email) {
        return res.status(401).send("User session not found.");
    }

    const email = sessionUser.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send("User not found.");
        }

        // Generate new OTP
        const otp = generateOtp();

        // Update in DB
        await User.updateOne(
            { email },
            { $set: { otp, verified: false } }
        );

        // Send OTP via email
        await sendOtp(email, otp);

        // Redirect to verify OTP page with message
        res.redirect('/verifyotp');
    } catch (error) {
        console.error("Error in /resendotp:", error);
        res.status(500).send("Something went wrong.");
    }
});
app.get('/home', (req,res)=>{
    res.render('userHome')
})



//POST Requests Routes


// Send OTP using nodemailer
async function sendOtp(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'buddyystudy@gmail.com',
            pass: 'xvnn xhef wzsn hurf'
        }
    });

    await transporter.sendMail({
        from: '"ReVibe" <your_email@gmail.com>',
        to: email,
        subject: 'Verify your OTP',
        text: `Your OTP is ${otp}`
    });
}

app.post('/signup', async (req, res) => {
    const { fullname, email, contact, password } = req.body;
    const confirmPassword = req.body['confirm-password'];

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.redirect('/login');

        if (!email.endsWith('@gmail.com') && !email.endsWith('@outlook.com')) {
            return res.render('userSignup', { error: 'Only Gmail or Outlook emails are allowed.' });
        }

        if (!/^\d{10}$/.test(contact)) {
            return res.render('userSignup', { error: 'Contact number must be exactly 10 digits.' });
        }

        if (password !== confirmPassword) {
            return res.render('userSignup', { error: 'Passwords do not match.' });
        }

        // Hash password properly using await
        const salt = await bcrypt.genSalt(10);
        console.log("Salt:", salt);

        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("Hashed: ", hashedPassword)

        const otp = generateOtp();

        const newUser = new User({
            fullname,
            email,
            contact,
            password: hashedPassword,
            otp
        });

        await newUser.save();
        await sendOtp(email, otp);

        req.session.user = {
            fullname,
            email,
            contact
        };

        res.redirect('/verifyotp');
    } catch (err) {
        console.error("Error during signup:", err);
        res.status(500).send("Something went wrong during signup.");
    }
});

app.post('/verifyotp', async (req, res) => {
    const userSession = req.session.user;

    if (!userSession) {
        return res.redirect('/signup', {error: null});
    }

    const email = userSession.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('verifyotp', { error: "User not found.", message: null });
        }

        const enteredOtp = [
            req.body.otp1 || '',
            req.body.otp2 || '',
            req.body.otp3 || '',
            req.body.otp4 || '',
            req.body.otp5 || '',
            req.body.otp6 || ''
        ].join('');

        if (user.otp === enteredOtp) {
            await User.updateOne({ email }, { $set: { verified: true } });

            req.session.user = {
                fullname: user.full_name,
                email: user.email,
                contact: user.contact
            };

            return res.render('home'); // Or wherever you want to redirect after successful OTP verification
        } else {
            return res.render('verifyotp', { error: "Invalid OTP entered.", message: null });
        }
    } catch (err) {
        console.error("OTP Verification Error:", err);
        res.render('verifyotp', { error: "Something went wrong.", message: null });
    }
});
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('userLogin', { error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('userLogin', { error: 'Invalid email or password.' });
        }

        req.session.user = {
            full_name: user.full_name,
            email: user.email,
            contact: user.contact
        };

        if (!user.verified) {
            return res.redirect('/resendotp');
        }

        res.render('home');
    } catch (err) {
        console.error(err);
        res.render('userLogin', { error: err });
    }
});



//Listening to port 5000
app.listen(5000)