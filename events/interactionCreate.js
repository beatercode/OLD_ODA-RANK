const interactionHandler = require("../helper/interactionButtonHandler")
const mainHalper = require("../helper/mainHelper")
const surveyHelper = require("../helper/surveyHelper")
const logger = require("../helper/_logger")
const { InteractionType } = require("discord.js")

module.exports = {
	name: "interactionCreate",
	async execute(interaction) {

		try {
			if (interaction.isButton()) {
				// SURVEY MANAGE
				if (interaction.customId.includes("survey_delete_")) {
					await surveyHelper.handleSurveyDeleteButton(interaction.customId, interaction)
				}
				if (interaction.customId.includes("survey_choose_")) {
					await surveyHelper.handleSurveyChooseButton(interaction.customId, interaction)
				}
				
				if (interaction.message.embeds[0].title.includes("ODA Clan")) {
					interactionHandler.handleOdaSystemButton(interaction)
				}
			}
			
			if (interaction.type === InteractionType.ModalSubmit) {
				if (interaction.customId.includes("Survey")) {
					surveyHelper.handleSurveyModal(interaction)
				}
			}
			if (!interaction.type === InteractionType.ApplicationCommand) return
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
			console.log("err --->")
			console.log(err)
			mainHalper.commonCatch(err, "interactionCreate", logger)
			return
		}
	}
}