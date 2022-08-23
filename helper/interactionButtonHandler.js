/* eslint-disable no-case-declarations */
const fs = require("fs")
const Users = require("../models/Users")
const setupmessages = require("../commands/setupmessages")
const setupdb = require("../commands/setupdb")
const updateLeaderboard = require("../helper/updateLeaderboard")
const databaseHelper = require("../helper/databaseHelper")
const logger = require("../helper/_logger")
const hourlyEvents = require("../custom/hourlyEvents")
const dailyEvents = require("../custom/dailyEvents")
const monthlyEvents = require("../custom/monthlyEvents")
const { DBCHANNELS, DBROLES, DBSETTINGS, DBUSERDUMMY } = require("../helper/databaseHelper")
const roleHelper = require("./roleHelper")
const mainHelper = require("./mainHelper")
const surveyHelper = require("../helper/surveyHelper")


module.exports = {

	async handleOdaSystemButton(interaction) {
		// logger.info(interaction)
		try {
			const member = interaction.member
			const customId = interaction.customId

			switch (customId) {
			case "leaderboard": {
				const board = require("../commands/board")
				board.execute(interaction)
				break
			}
			case "claimDaily": {
				const claimdaily = require("../commands/claimdaily")
				claimdaily.execute(interaction)
				break
			}
			case "account": {
				const account = require("../commands/account")
				account.execute(interaction)
				break
			}
			case "dailyTrue": {
				await Users.updateMany({ user_id: member.id }, { daily: true })
				interaction.reply({ content: "[ADMIN] - Your daily claim flag is now TRUE", ephemeral: true })
				break
			}
			case "dailyFalse": {
				await Users.updateMany({ user_id: member.id }, { daily: false })
				interaction.reply({ content: "[ADMIN] - Your daily claim flag is now FALSE", ephemeral: true })
				break
			}
			case "dailyFalseAll": {
				await Users.updateMany({}, { daily: false })
				interaction.reply({ content: "[ADMIN] - All daily claim flag is now FALSE", ephemeral: true })
				break
			}
			case "backupUsers": {
				let usersDump = await Users.find({})
				usersDump = JSON.stringify(usersDump)
				fs.writeFileSync(__dirname + "/../backup/users.json", usersDump, "UTF-8")
				interaction.reply({ content: "[ADMIN] - users backup done", ephemeral: true })
				break
			}
			case "backupSettings": {
				const configFileNme = "../backup/config.json"
				const config = require(configFileNme)
				config.Channels.values = await DBCHANNELS()
				config.Roles.values = await DBROLES()
				config.Settings.values = await DBSETTINGS()
				config.UserDummy.values = await DBUSERDUMMY()
				fs.writeFileSync(__dirname + "/" + configFileNme,
					JSON.stringify(config),
					{ encoding: "utf8", flag: "w" })
				interaction.reply({ content: "[ADMIN] - settings backup done", ephemeral: true })
				break
			}
			case "setupdb":
				await setupdb.execute(interaction)
				break
			case "setupdbMissingUser":
				let missingList = await mainHelper.setupdbMissingUser(interaction.client)
				let retString = `${missingList}\nMissing DB User from Discord completed`
				interaction.reply({ content: retString, ephemeral: true })
				break
			case "setupmessages":
				await setupmessages.execute(interaction)
				break
			case "updateLeaderboard":
				await updateLeaderboard.updateLeaderboard(interaction.client)
				interaction.reply({ content: "Leaderboard updated", ephemeral: true })
				break
			case "mvUserData":
				await databaseHelper.moveUsersData()
				interaction.reply({ content: "Users points moved", ephemeral: true })
				break
			case "odaNameDiffChekc":
				await databaseHelper.odaNameDiffChecker(interaction.client)
				interaction.reply({ content: "Users nick check done", ephemeral: true })
				break
			case "checkReactCount":
				await databaseHelper.checkReactCount(interaction.client)
				interaction.reply({ content: "Check [reaction] done, view logs", ephemeral: true })
				break
			case "checkDailyCount":
				await databaseHelper.checkDailyCount(interaction.client)
				interaction.reply({ content: "Check [daily] done, view logs", ephemeral: true })
				break
			case "clearNicknames":
				await dailyEvents.clearNicknames(interaction.client)
				interaction.reply({ content: "Nickname cleared, view logs", ephemeral: true })
				break
			case "monthUpgradeDowngrade":
				await monthlyEvents.monthlyAdjustRole(interaction.client)
				interaction.reply({ content: "Monthly role adjust done", ephemeral: true })
				break
			case "monthReset":
				await monthlyEvents.defaultMonthlyResets()
				interaction.reply({ content: "Default montly reset done", ephemeral: true })
				break
			case "shokuninZeroDowngrade":
				await roleHelper.downgradeZeroShokunin(interaction.client)
				interaction.reply({ content: "Shokunin Zero points Downgrade done ( If not, check code or talk with Beater )", ephemeral: true })
				break
			case "hourlyCheck":
				await hourlyEvents.hourlyChecks(interaction.client)
				interaction.reply({ content: "Hourly check done", ephemeral: true })
				break
			case "dailyCheck":
				await dailyEvents.dailyChecks(interaction.client)
				interaction.reply({ content: "Daily check done", ephemeral: true })
				break
			case "listSurveys":
				await surveyHelper.sendSurveyList(interaction)
				break
			case "upgradeMe":
				let upgradeUser = await Users.find({ user_id: interaction.member.user.id })
				await upgradeUser.upgrade()
				break
			case "downgradeMe":
				let downgradeUser = await Users.find({ user_id: interaction.member.user.id })
				await downgradeUser.upgrade()
				break
			}
		} catch (err) {
			if (err) {
				console.log("Error occured" + err)
				logger.error("[handleOdaSystemButton] ---->")
				logger.error(err)
				interaction.reply({ content: "An error occurred during the execution of the command. Open a ticket if the problem persist", ephemeral: true })
			}
		}

	}

}