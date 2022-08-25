const mongoose = require("mongoose")

const SurveySchema = new mongoose.Schema({
	customId: { type: String, default: "" },
	name: { type: String, default: "" },
	question: { type: String, default: "" },
	republishable: { type: Boolean, default: false },
	wasPublished: { type: Boolean, default: false },
	mode: { type: String, default: "survey" },
	validFrom: { type: String, default: ""},
	options: { type: Array, default: [] },
	voters: { type: Array, default: [] }


})

module.exports = mongoose.model("Surveys", SurveySchema)