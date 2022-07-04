const { SlashCommandBuilder } = require("@discordjs/builders")
const mainHelper = require("../helper/mainHelper")
const config = require("../backup/config.json")
const logger = require("../helper/_logger")
const { setOdaDb } = require("../helper/databaseHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setupdb")
		.setDescription("[ADMIN] Setup & Refactor the tabase!")
		.setDefaultPermission(true)
		.addBooleanOption((option) =>
			option
				.setName("settings")
				.setDescription("If specified, settings local JSON will be put on db [true/false]")
				.setRequired(false)
		)
		.addBooleanOption((option) =>
			option
				.setName("users")
				.setDescription("If specified, users local JSON will be put on db [true/false]")
				.setRequired(false)
		),
	async execute(interaction) {

		try {
			logger.info("[COMMAND] setupdb start")
			const member = interaction.member

			let isAdmin = await mainHelper.isAdminAccount(member)
			if (!isAdmin) {
				interaction.reply({ content: "Only admin can use this command", ephemeral: true })
				return
			}

			let optionSettings = interaction.option != null && interaction.option.getBoolean("settings") != null
				? interaction.option.getBoolean("settings")
				: true
			let optionUsers = interaction.option != null && interaction.option.getBoolean("users") != null
				? interaction.option.getBoolean("users")
				: true
			logger.info("Setup db SETTINGS [" + optionSettings + "] - USERS [" + optionUsers + "]")

			if (optionSettings) {

				await setOdaDb("Roles", config.Roles)
				await setOdaDb("Channels", config.Channels)
				await setOdaDb("Settings", config.Settings)
				await setOdaDb("UserDummy", config.UserDummy)
			}

			if (optionUsers) {

				// da fare
			}

			interaction.reply({
				content: optionUsers ? "About users. Do it manually for now" : "Database updated",
				ephemeral: true
			})
			logger.info("[COMMAND] setupdb end")

		} catch (err) {
			mainHelper.commonCatch(err, "setupdb", logger)
			return
		}
	}
}
