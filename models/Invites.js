const mongoose = require('mongoose');

const InvitesSchema = new mongoose.Schema({
    code: String,
    amount: Number,
    valid: Number,
    inviterId: String,
});

module.exports = mongoose.model("Invites", InvitesSchema);