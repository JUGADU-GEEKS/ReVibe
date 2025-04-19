// Importing the Libraries Required
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const User = require('./models/userModel'); // Your Mongoose model
const Product = require('./models/productModel');
const { isValidPassword, generateOtp } = require('./utils');
const nodemailer = require('nodemailer');
const multer = require('multer');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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

// Middleware to check admin authentication
const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/adminLogin');
    }
};

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
app.get('/home', isLoggedIn, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('userHome', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});
app.get('/adminLogin', (req,res)=>{
    res.render('adminLogin', {error: null})
})

// Admin Panel Routes
app.get('/admin/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard');
});

app.get('/admin/products/add', isAdmin, (req, res) => {
    res.render('admin/add-product');
});

app.post('/admin/products', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, material, price } = req.body;
        const imagePath = req.file ? '/uploads/' + req.file.filename : '';

        const product = new Product({
            name,
            material,
            image: imagePath,
            price: parseFloat(price)
        });

        await product.save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).send('Error creating product');
    }
});

app.get('/admin/products', isAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.render('admin/products-list', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});

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

            return res.redirect('/home'); // Or wherever you want to redirect after successful OTP verification
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
    console.log('Login attempt for email:', email);

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.render('userLogin', { error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.render('userLogin', { error: 'Invalid email or password.' });
        }

        if (!user.verified) {
            console.log('User not verified');
            return res.redirect('/resendotp');
        }

        // Create session
        req.session.user = {
            userId: user._id,
            email: user.email,
            fullname: user.fullname
        };

        // Generate JWT token
        const token = jwt.sign({ 
            userId: user._id,
            email: user.email 
        }, "kunal", { expiresIn: '24h' });

        // Set both session and cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('Session and cookie set for user:', user.email);
        res.redirect('/home');
    } catch (err) {
        console.error('Login error:', err);
        res.render('userLogin', { error: 'Something went wrong. Please try again.' });
    }
});

app.post('/adminLogin', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if(email=='admin@admin.com' && password=='admin1234'){
            // Set admin session
            req.session.admin = {
            email: email
            };

            return res.render('admin/dashboard.ejs')
        }

        

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Admin login error:', error);
        res.render('adminLogin', { error: 'Something went wrong' });
    }
});

// Add to cart route
app.post('/cart/add', isLoggedIn, async (req, res) => {
    console.log('Add to cart request received');
    const { productId, quantity = 1 } = req.body;
    
    // Get user ID from either session or token
    const userId = req.user.userId || req.session.user?.userId;
    console.log('User ID:', userId);

    if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ error: "Please login first" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found in database');
            return res.status(404).json({ error: "User not found" });
        }
        console.log('User found:', user.email);

        const existingItem = user.cart.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({
                product: productId,
                quantity,
                addedAt: new Date()
            });
        }

        await user.save();
        console.log('Cart updated successfully');
        return res.status(200).json({ message: "🛒 Product added to cart", cart: user.cart });
    } catch (err) {
        console.error("Add to cart error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// View cart route
app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.user.id).populate('cart.product');
        res.render('cart', { cart: user.cart });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Error fetching cart');
    }
});

// View purchased items route
app.get('/purchased', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.user.id).populate('purchased.product');
        res.render('purchased', { purchased: user.purchased });
    } catch (error) {
        console.error('Error fetching purchased items:', error);
        res.status(500).send('Error fetching purchased items');
    }
});

function isLoggedIn(req, res, next) {
    // Check session first
    if (req.session.user) {
        console.log('User authenticated via session');
        req.user = req.session.user;
        return next();
    }

    // If no session, check JWT token
    const token = req.cookies.token;
    console.log('Checking token from cookies:', token ? 'Token exists' : 'No token');

    if (!token) {
        console.log('No authentication found');
        return res.status(401).json({ error: "Please login first" });
    }

    try {
        const decoded = jwt.verify(token, "kunal");
        console.log('Token verified successfully for user:', decoded.email);
        
        // Set user in request
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(401).json({ error: "Please login first" });
    }
}

//Listening to port 5000
app.listen(5000)