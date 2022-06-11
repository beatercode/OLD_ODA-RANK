const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const Users = require("../models/Users")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const { DBSETTINGS } = require("../helper/databaseHelper")
const logger = require("../helper/_logger")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("claimdaily")
		.setDescription("Claim your daily points!"),
	async execute(interaction) {

		try {
			logger.info("[COMMAND] claimdaily start")
			const member = interaction.member
			let outputString = ""
			let roleSettings = null
			let currentUser = await Users.findOne({ user_id: member.id })
			if (!currentUser) {
				outputString = "I don't know you Kyodai 😥 Go open a ticket"
				const accountEmbed = new MessageEmbed()
					.setTitle("ODA Clan | Claim Info")
					.setDescription(`${outputString}`)
				interaction.reply({
					embeds: [accountEmbed],
					ephemeral: true
				})
				logger.info("[COMMAND] claimdaily end")
				return
			}

			const DB_SETTINGS = await DBSETTINGS()
			let bonusMul = currentUser.oda_in_name_bonus ? 1.1 : 1
			let deservedPoints = Math.round((DB_SETTINGS.DAILY_POINTS * (100 + DB_SETTINGS.MULT_PERCENTAGE * currentUser.consecutive_daily) / 100) * bonusMul)

			let res = await Users.updateOne(
				{ user_id: member.id, daily: false },
				{
					daily: true,
					$inc: {
						consecutive_daily: 1,
						points: deservedPoints
					}
				})

			let msgOutput = res.modifiedCount > 0
				? "Daily points claimed succesfully!"
				: "Already claimed! Come claim tomorrow!"
			roleSettings = await roleHelper.getHigherRoleByArrayOfRolesID(member._roles)
			const claimEmbed = new MessageEmbed()
				.setColor(roleSettings.color)
				.setTitle("Daily claim")
				.setDescription(msgOutput)
			interaction.reply({
				embeds: [claimEmbed],
				ephemeral: true
			})
			if (res.modifiedCount > 0) {
				const { logOnServer } = require("../helper/mainHelper")
				logOnServer(interaction.client, `Daily claim done <@${member.id}> with **${deservedPoints}**`)
				if (["daimyo", "tenno"].includes(roleSettings.command)) {
					logger.info("[COMMAND] claimdaily end")
					return
				}
				const chatChannel = interaction.client.channels.cache.get(roleSettings.chat_channel_id)
				outputString = `<@${member.id}> just claimed **${deservedPoints}** daily points! `
				outputString += `You are in a **${(currentUser.consecutive_daily + 1)}** days streak!`

				const claimEmbed = new MessageEmbed()
					.setColor(roleSettings.color)
					.setTitle("Daily claim")
					.setDescription(outputString)
				await chatChannel.send({
					embeds: [claimEmbed]
				})//.then(async msg => { await msg.react('🔥') })
				logger.info("[COMMAND] claimdaily end")
			}

		} catch (err) {
			mainHelper.commonCatch(err, "claimdaily", logger)
			return
		}
	}
}
