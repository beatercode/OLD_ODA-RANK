const mongoose = require("mongoose")

const OdaSwitchSchema = new mongoose.Schema({
	name: String,
	values: Object
})

module.exports = mongoose.model("OdaSwitch", OdaSwitchSchema)