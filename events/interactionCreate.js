const interactionHandler = require("../helper/interactionButtonHandler")
const mainHalper = require("../helper/mainHelper")
const logger = require("../helper/_logger")

module.exports = {
	name: "interactionCreate",
	async execute(interaction) {

		try {
			if (interaction.isButton()) {
				// Point manager interaction
				if (interaction.message.embeds[0].title.includes("ODA Clan")) {
					interactionHandler.handlePointSystemButton(interaction)
				}
			}

			if (!interaction.isCommand()) return
			if (interaction.channelId !== "980852571973484555") {
				await interaction.reply({ content: "Hey kyodai! This feature is not yet enabled!", ephemeral: true })
				return
			}
			const command = interaction.client.commands.get(interaction.commandName)
			if (!command) return

			try {
				await command.execute(interaction)
			} catch (err) {
				if (err) console.error(err)

				await interaction.reply({
					content: "An error occurred while executing that command.",
					ephemeral: true,
				})
			}
		} catch (err) {
			mainHalper.commonCatch(err, "interactionCreate", logger)
			return
		}
	}
}