const mongoose = require("mongoose")

const SurveySchema = new mongoose.Schema({
	customId: { type: String, default: "" },
	name: { type: String, default: "" },
	question: { type: String, default: "" },
	republishable: { type: Boolean, default: false },
	wasPublished: { type: Boolean, default: false },
	validFrom: { type: Date, default: new Date()},
	options: {
		value: { type: String, default: "" },
		points: { type: Number, default: 200 },
	},
	voters: {
		user: { type: String, default: ""},
		vote: { type: String, default: ""}
	}


})

module.exports = mongoose.model("Surveys", SurveySchema)