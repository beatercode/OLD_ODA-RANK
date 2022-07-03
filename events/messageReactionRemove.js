const Users = require("../models/Users")
const logger = require("../helper/_logger")
const { DBCHANNELS, DBSETTINGS } = require("../helper/databaseHelper")
const mainHelper = require("../helper/mainHelper")

module.exports = {
	name: "messageReactionRemove",
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
				let res = await Users.updateMany({ user_id: user.id }, { $inc: { points: -deservedPoints } })
				if (res.modifiedCount > 0) {
					logger.debug(`${user.username} just removed reaction to message id [${reaction.message.id}]`)
				} else {
					logger.error(`${user.username} just removed reaction to message id [${reaction.message.id}] WITHOUT UPDATING DB`)
				}
			} else if(!user.bot) {
				if (["🥇", "🥈", "🥉","🔥"].some(r => r == reaction.emoji.name)) {

					let message = reaction.message
					let targetMsgUrl = "https://discord.com/channels/" + reaction.message.guild + "/" + reaction.message.channel + "/" + reaction.message.id
					let targetUserId = null
					let fetched = await message.channel.messages.fetch(message.id)
					targetUserId = fetched.author.id
					if (!targetUserId) {
						logger.error("[ADD STARRED ERROR] check msg id [" + reaction.message.id + "]")
						return
					}

					let reactedEmoji = reaction.emoji.name
					let deservedPoints = reactedEmoji == "🥉" ? 200 : reactedEmoji == "🥈" ? 400 : reactedEmoji == "🥇" ? 600 : 50
					let updated = await Users.updateOne({ user_id: targetUserId, daily_starred: { $elemMatch: { $eq: targetMsgUrl } } }, { $inc: { points: -deservedPoints }, $pull: { daily_starred: targetMsgUrl } })
					if (updated.modifiedCount == 0) {
						return
					} else {
						const guild = reaction.message.guild
						const memberTarget = guild.members.cache.get(targetUserId)
						memberTarget.setNickname(memberTarget.nickname.replace(reactedEmoji, ""))
						
					}
				}
			}

		} catch (err) {
			mainHelper.commonCatch(err, "messageReactionRemove", logger)
			return
		}
	}
}