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
    username: String,
    image: String,
    email: String,
    password: String,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }],
});

module.exports = mongoose.model("user", userSchema);