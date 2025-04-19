const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    material: {
        type: String,
        required: [true, 'Material is required'],
        enum: ['cotton', 'polyester', 'wool', 'silk', 'leather', 'denim', 'nylon'],
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Product image is required']
    },
    carbonFootprint: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate carbon footprint based on material before saving
productSchema.pre('save', function(next) {
    const materialCarbonFactors = {
        'cotton': 2.5,    // kg CO2 per kg
        'polyester': 5.5, // kg CO2 per kg
        'wool': 3.0,      // kg CO2 per kg
        'silk': 2.0,      // kg CO2 per kg
        'leather': 4.0,   // kg CO2 per kg
        'denim': 3.5,     // kg CO2 per kg
        'nylon': 6.0      // kg CO2 per kg
    };

    // Calculate carbon footprint based on material
    this.carbonFootprint = materialCarbonFactors[this.material] || 0;
    next();
});

module.exports = mongoose.model('Product', productSchema);
