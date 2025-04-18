// utils.js
function isValidPassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{8,}$/;
    return regex.test(password);
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

module.exports = { isValidPassword, generateOtp };
