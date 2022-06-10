const mongoose = require('mongoose');

const DiscountsSchema = new mongoose.Schema({
    user_id: String,
    discount_percent: Number,
    origin_role: String,
});

module.exports = mongoose.model("Discounts", DiscountsSchema);