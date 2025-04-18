require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB Connected Successfully!");
}).catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
});

const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    otp: String,
    verified: { type: Boolean, default: false }

});

module.exports = mongoose.model("User", userSchema);