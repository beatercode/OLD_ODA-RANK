const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const Users = require("../models/Users")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const logger = require("../helper/_logger")
const config = require("../backup/config.json")
const { DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("givepoints")
		.setDescription("Give points to user")
		.addUserOption((option) =>
			option
				.setName("users")
				.setDescription("The user who receive the points")
				.setRequired(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("points")
				.setDescription("The amount of points")
				.setRequired(true)
		),
	async execute(interaction) {

		try {
			logger.info("[COMMAND] givepoints start "
				+ (interaction.options && interaction.options.getUser("account") ? `[${interaction.options.getUser("account").id}]` : "")
				+ (interaction.options && interaction.options.getInteger("points") ? `[${interaction.options.getInteger("points")}]` : ""))
			const inPoints = interaction.options.getInteger("points")
			const inUser = interaction.options.getUser("users")
			//const inMember = await mainHelper.getMemberFromId(interaction.client, inUser.id)
			const fromMember = interaction.member
			let roleSettings = await roleHelper.getHigherRoleByArrayOfRolesID(fromMember._roles)
			let isAdmin = await mainHelper.isAdminAccount(fromMember)
			if (isAdmin) {
				await Users.updateMany({ user_id: inUser.id }, { $inc: { points: inPoints } })
				let msgOutput = `Points were sent correctly to <@${inUser.id}>`
				const claimEmbed = new MessageEmbed()
					.setColor(roleSettings.color)
					.setTitle("Give points")
					.setDescription(msgOutput)
				interaction.reply({
					embeds: [claimEmbed],
					ephemeral: true
				})
				mainHelper.logOnServer(interaction.client, msgOutput)
				logger.info("[COMMAND] givepoints end")
				return
			}
			let startingUser = await Users.findOne({ user_id: interaction.user.id, points: { $gte: inPoints } })
			if (!startingUser) {
				let msgOutput = `You can't send ${inPoints} ODA points to <@${inUser.id}> as you don't have enough`
				const claimEmbed = new MessageEmbed()
					.setColor(roleSettings.color)
					.setTitle("Give points")
					.setDescription(msgOutput)
				interaction.reply({
					embeds: [claimEmbed],
					ephemeral: true
				})
				logger.info("[COMMAND] givepoints end")
				return
			}
			let finalUser = await Users.findOne({ user_id: inUser.id })
			if (!finalUser) {
				let msgOutput = `You can't send ${inPoints} ODA points to <@${inUser.id}> as this user is not valid`
				const claimEmbed = new MessageEmbed()
					.setColor(roleSettings.color)
					.setTitle("Give points")
					.setDescription(msgOutput)
				interaction.reply({
					embeds: [claimEmbed],
					ephemeral: true
				})
				logger.info("[COMMAND] givepoints end")
				return
			}

			const DB_SETTINGS = await DBSETTINGS()
			let finalUserPointsReceived = finalUser.monthly_points_received
			if ((finalUserPointsReceived + inPoints) > DB_SETTINGS.MONTHLY_POINTS_RECEIVED_LIMIT) {
				let msgOutput = `You can't send ${inPoints} ODA points to <@${inUser.id}> as this user would exceed the monthly limit of points achievable via gift`
				const claimEmbed = new MessageEmbed()
					.setColor(roleSettings.color)
					.setTitle("Give points")
					.setDescription(msgOutput)
				interaction.reply({
					embeds: [claimEmbed],
					ephemeral: true
				})
				logger.info("[COMMAND] givepoints end")
				return
			}

			await Users.updateMany({ user_id: inUser.id }, { $inc: { points: inPoints, monthly_points_received: inPoints } })
			await Users.updateMany({ user_id: interaction.user.id }, { $inc: { points: -inPoints } })
			let msgOutput = `Points were sent correctly to <@${inUser.id}>`
			const claimEmbed = new MessageEmbed()
				.setColor(roleSettings.color)
				.setTitle("Give points")
				.setDescription(msgOutput)
			interaction.reply({
				embeds: [claimEmbed],
				ephemeral: true
			})
			const DB_CHANNELS = config.Channels.values
			const pointsEventsChannel = interaction.client.channels.cache.get(DB_CHANNELS.ch_points_events)
			let outputString = `<@${interaction.member.id}> just gave away ${inPoints} ODA points to <@${inUser.id}>!`
			const claimEmbedPublic = new MessageEmbed()
				.setColor(roleSettings.color)
				.setTitle("Points gifted! 🚀")
				.setDescription(outputString)
			await pointsEventsChannel.send({
				embeds: [claimEmbedPublic]
			})
			logger.info("[COMMAND] givepoints end")
			mainHelper.logOnServer(interaction.client, outputString)

		} catch (err) {
			mainHelper.commonCatch(err, "givepoints", logger)
			return
		}
	},
}