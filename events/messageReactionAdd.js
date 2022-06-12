const Users = require("../models/Users")
const logger = require("../helper/_logger")
const { DBCHANNELS, DBSETTINGS } = require("../helper/databaseHelper")
const { MessageEmbed } = require("discord.js")
const mainHelper = require("../helper/mainHelper")

module.exports = {
	name: "messageReactionAdd",
	async execute(reaction, user) {

		try {

			const DB_CHANNELS = await DBCHANNELS()
			const DB_SETTINGS = await DBSETTINGS()
			let reactionChannels = DB_CHANNELS.ch_list_reactions
			let reactedChannel = reaction.message.channelId

			if (reactionChannels.includes(reactedChannel) && !user.bot) {
				let inUser = await Users.findOne({ user_id: user.id })
				if (!inUser) { return }
				let pointsBonusOdaInNameMul = inUser.oda_in_name_bonus ? 1.1 : 1
				let deservedPoints = Math.ceil(DB_SETTINGS.REACTION_POINTS * pointsBonusOdaInNameMul)
				let res = await Users.updateMany({ user_id: user.id }, { $inc: { points: deservedPoints } })
				if (res.modifiedCount > 0) {
					logger.debug(`${user.username} just reacted to message id [${reaction.message.id}]`)
				} else {
					logger.error(`${user.username} just reacted to message id [${reaction.message.id}] WITHOUT UPDATING DB`)
				}
			}

			if (!reactionChannels.includes(reactedChannel) && !user.bot) {
				if(["🥇", "🥈", "🥉"].some(r => r == reaction.emoji.name)) {
					let message = reaction.message
					let targetUserId = null
					let fetched = await message.channel.messages.fetch(message.id)
					targetUserId = fetched.author.id
					//let targetUsername = fetched.author.username
					if(!targetUserId) {
						logger.error("[ADD STARRED ERROR] check msg id [" + reaction.message.id + "]")
						return
					}
					let reactedEmoji = reaction.emoji.name
					let deservedPoints = reactedEmoji == "🥉" ? 200 : reactedEmoji == "🥈" ? 400 : 600
					let deservedColor = reactedEmoji == "🥉" ? "#CD7F32" : reactedEmoji == "🥈" ? "#C0C0C0" : "#FFD700"
					const guild = reaction.message.guild
					const member = guild.members.cache.get(user.id)
					const memberRoles = member._roles
					if(!memberRoles.some(r=> DB_SETTINGS.MOD_ROLE_IDS.includes(r))) return
					let targetMsgUrl = "https://discord.com/channels/" + reaction.message.guild + "/" + reaction.message.channel + "/" + reaction.message.id
					let updated = await Users.updateOne(
						{ user_id: targetUserId, daily_starred: { $ne: targetMsgUrl } }, 
						{ $inc: { points: deservedPoints }, $push: { daily_starred: targetMsgUrl }})
					if (updated.modifiedCount == 0) {
						logger.debug("[ADD STARRED ERROR] check msg id [" + reaction.message.id + "] - seems have already had a bonus")
						return
					} else {
						let outputString = `**<@${targetUserId}>** was rewarded with **${deservedPoints}** points as he brought value within the clan today! ${reactedEmoji}`
						outputString += `\n\nMessage reference [here](${targetMsgUrl})`
						const pointsEventsChannel = reaction.client.channels.cache.get(DB_CHANNELS.ch_points_events)
						const claimEmbed = new MessageEmbed()
							.setColor(deservedColor)
							.setTitle("Clan Value Rewards")
							.setDescription(outputString)
						await pointsEventsChannel.send({
							embeds: [claimEmbed]
						})
						return
					}
				}
			}
		} catch (err) {
			mainHelper.commonCatch(err, "messageReactionAdd", logger)
			return
		}

	}
}