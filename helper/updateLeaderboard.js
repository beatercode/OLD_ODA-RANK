const { MessageEmbed } = require("discord.js")
const logger = require("../helper/_logger")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const { DBCHANNELS } = require("../helper/databaseHelper")

module.exports = {

	async updateLeaderboard(client) {

		try {

			mainHelper.logOnServer(client, "[HOURLY] update leaderboard launched!")
			logger.info("[HOURLY] update leaderboard launched!")
			const DB_CHANNELS = await DBCHANNELS()
			const channelLeaderboardsID = DB_CHANNELS.ch_leaderboards
			const channelLeaderboards = client.channels.cache.get(channelLeaderboardsID)

			const { samurai, noka, shokunin, shonin } = await roleHelper.getAllRoleConstant()
			const { samuraiBoard, nokaBoard, shokuninBoard, shoninBoard } = await roleHelper.getAllBoars()

			let samuraiFinalDescription = roleHelper.createBoardMessage(samuraiBoard.board.slice(0, 10), null)
			let nokaFinalDescription = roleHelper.createBoardMessage(nokaBoard.board.slice(0, 10), null)
			let shokuninFinalDescription = roleHelper.createBoardMessage(shokuninBoard.board.slice(0, 10), null)
			let shoninFinalDescription = roleHelper.createBoardMessage(shoninBoard.board.slice(0, 10), null)

			let toEditMessage = null

			let currentLastMsgId = DB_CHANNELS.ch_leaderboards_last_msg_id
			await channelLeaderboards.messages.fetch(currentLastMsgId).then(message => {
				toEditMessage = message ? message : null
			}).catch(() => { toEditMessage = null })

			let finalEmbeds = []

			if (samuraiFinalDescription) {
				finalEmbeds.push(
					new MessageEmbed()
						.addField("\u200B", samuraiFinalDescription)
						.setColor(samurai.color)
						.setDescription("<@&" + samurai.id + ">")
				)
			}

			if (nokaFinalDescription) {
				finalEmbeds.push(
					new MessageEmbed()
						.addField("\u200B", nokaFinalDescription)
						.setColor(noka.color)
						.setDescription("<@&" + noka.id + ">")
				)
			}

			if (shokuninFinalDescription) {
				finalEmbeds.push(
					new MessageEmbed()
						.addField("\u200B", shokuninFinalDescription)
						.setColor(shokunin.color)
						.setDescription("<@&" + shokunin.id + ">")
				)
			}

			if (shoninFinalDescription) {
				finalEmbeds.push(
					new MessageEmbed()
						.addField("\u200B", shoninFinalDescription)
						.setColor(shonin.color)
						.setDescription("<@&" + shonin.id + ">")
				)
			}

			if (toEditMessage) {
				await toEditMessage.edit({ embeds: finalEmbeds })
			} else {
				let nextMsgId = ""
				await channelLeaderboards.send({ embeds: finalEmbeds }).then(msg => {
					nextMsgId = msg
				})
				if (currentLastMsgId != nextMsgId) {
					const OdaSwitch = require("../models/OdaSwitch")
					await OdaSwitch.updateOne(
						{ name: "Channels" },
						{ $set: { "values.ch_leaderboards_last_msg_id": nextMsgId } }
					)
					logger.debug("Leaderboards updated ---> also updated Leaderboard Message ID to: " + nextMsgId)
				}
			}

			logger.info("[HOURLY] update!")
			return
		} catch (err) {
			mainHelper.commonCatch(err, "updateLeaderboard", logger)
			return
		}
	},

}