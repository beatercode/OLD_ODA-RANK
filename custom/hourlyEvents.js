const updateLeaderboard = require("../helper/updateLeaderboard")
const Users = require("../models/Users")
const logger = require("../helper/_logger")
const mainHelper = require("../helper/mainHelper")
const { getMemberFromId } = require("../helper/mainHelper")

module.exports = {

	async hourlyChecks(client) {

		mainHelper.logOnServer(client, "[HOURLY] routine starts")
		logger.info("[HOURLY] routine starts")
		await updateLeaderboard.updateLeaderboard(client)
		await this.checkOdaInName(client)

	},

	async checkOdaInName(client) {
		mainHelper.logOnServer(client, "[HOURLY] checkOdaInName starts")
		logger.info("[HOURLY] checkOdaInName starts")
		let allUsers = await Users.find({ oda_in_name: true })
		let mapped = allUsers.map(({ user_id, username, oda_in_name }) => ({ user_id, username, oda_in_name }))
		for (const x of mapped) {
			let usr = await getMemberFromId(client, x.user_id)
			if (usr) {
				let username = (usr.user.username).toLowerCase()
				x.oda_in_name = username.includes("oda clan") ? true : false
			} else { x.oda_in_name = false }
		}
		let notOdaInNameArray = (mapped.filter(x => !x.oda_in_name && x.user_id != "00000000")).map(x => x.user_id)
		let updatedRows = await Users.updateMany({ user_id: { $in: notOdaInNameArray } }, { $set: { oda_in_name: false } })
		logger.info("Hourly check ODA IN NAME done ---> updated: " + updatedRows.modifiedCount)
		logger.info("[HOURLY] checkOdaInName end")
	},
}