const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const Users = require("../models/Users")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const config = require("../backup/config.json")
const logger = require("../helper/_logger")
const { logOnServer } = require("../helper/mainHelper")

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
				if(interaction)
					interaction.reply({
						embeds: [accountEmbed],
						ephemeral: true
					})
				logger.info("[COMMAND] claimdaily end")
				return
			}

			const DB_SETTINGS = config.Settings.values
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

			let outpdateRow = res.modifiedCount
			let msgOutput = outpdateRow > 0
				? "✅ Congratulations! " + deservedPoints + " ODA points claimed succesfully! You are in a 3 days streak!"
				: "❌ Already claimed! Come claim tomorrow!"
			roleSettings = await roleHelper.getHigherRoleByArrayOfRolesID(member._roles)
			const claimEmbed = new MessageEmbed()
				.setColor(roleSettings.color)
				.setTitle("Daily Claim")
				.setDescription(msgOutput)
			interaction.reply({
				embeds: [claimEmbed],
				ephemeral: true
			})
			if (outpdateRow > 0) {
				logOnServer(interaction.client, `Daily claim done <@${member.id}> of **${deservedPoints}** points`)
				if (["daimyo", "tenno"].includes(roleSettings.command)) {
					logger.info("[COMMAND] claimdaily end")
					return
				}
				const DB_CHANNELS = config.Channels.values
				const pointsEventsChannel = interaction.client.channels.cache.get(DB_CHANNELS.ch_points_events)
				outputString = `<@${member.id}> just claimed **${deservedPoints}** ODA points! `
				outputString += `He is in a **${(currentUser.consecutive_daily + 1)}** days streak! 🚀`

				const claimEmbed = new MessageEmbed()
					.setColor(roleSettings.color)
					.setTitle("Daily Claim")
					.setDescription(outputString)
				await pointsEventsChannel.send({
					embeds: [claimEmbed]
				})//.then(async msg => { await msg.react('🔥') })
				logger.info("[COMMAND] claimdaily end")
			}
			return

		} catch (err) {
			mainHelper.commonCatch(err, "claimdaily", logger)
			return
		}
	}
}
