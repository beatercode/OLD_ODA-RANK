const mongoose = require("mongoose")

const CommandsLogSchema = new mongoose.Schema({
	command: String,
	user_id: String,
	user_nick: String,
	date: Date,
})

module.exports = mongoose.model("CommandsLog", CommandsLogSchema)