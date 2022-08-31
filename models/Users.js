const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
	user_id: { type: String, default: "" },
	username: { type: String, default: "" },
	role_id: { type: String, default: "" },
	role: { type: String, default: "" },
	points: { type: Number, default: 0 },
	daily: { type: Boolean, default: false },
	consecutive_daily: { type: Number, default: 0 },
	banned_invitation: { type: Array, default: [] },
	pending_invitation: { type: Array, default: [] },
	monthly_invitation: { type: Number, default: 0 },
	monthly_invitation_current: { type: Number, default: 0 },
	monthly_updated: { type: Boolean, default: false },
	total_invitation: { type: Number, default: 0 },
	monthly_points_received: { type: Number, default: 0 },
	oda_in_name: { type: Boolean, default: true },
	oda_in_name_bonus: { type: Boolean, default: false },
	consecutive_oda: { type: Number, default: 0 },
	daily_starred: { 
		points: { type: Number, default: "" },
		link: { type: String, default: "" },
	},
	invitedBy: {
		inviterId: { type: String, default: "" },
		inviterPoints: { type: Number, default: 0 },
		invitedWithCode: { type: String, default: "" },
	},
	total_daily: { type: Number, default: 0 },
})

module.exports = mongoose.model("Users", UserSchema)