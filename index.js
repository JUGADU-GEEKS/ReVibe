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
app.get('/home', async (req, res) => {
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

        res.redirect('/home');
    } catch (err) {
        console.error(err);
        res.render('userLogin', { error: err });
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
app.post('/cart/add', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please login first' });
    }

    try {
        const { productId } = req.body;
        const userId = req.session.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if product is already in cart
        const existingCartItem = user.cart.find(item => item.product.toString() === productId);
        
        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            user.cart.push({
                product: productId,
                quantity: 1
            });
        }

        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Error adding to cart' });
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

//Listening to port 5000
app.listen(5000)