/* eslint-disable no-case-declarations */
const { SlashCommandBuilder } = require("@discordjs/builders")
const surveyHelper = require("../helper/surveyHelper")
const logger = require("../helper/_logger")
const { EmbedBuilder } = require("discord.js")
const mainHelper = require("../helper/mainHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("survey")
		.setDescription("Survey commands")
		.addSubcommand(subcommand => subcommand.setName("help").setDescription("Survey Help"))
		.addSubcommand((subcommand) =>
			subcommand
				.setName("send")
				.setDescription("Send a survey")
				.addStringOption((option) =>
					option.setName("id").setDescription("The Survey\"s ID to edit").setRequired(true),
				)
		)
	,
	async execute(interaction) {

		try {
			logger.info("[COMMAND] surveys start")

			let isAdmin = await mainHelper.isAdminAccount(interaction.member)
			if (!isAdmin) {
				interaction.reply({ content: "Only admin can use this command", ephemeral: true })
				logger.info("[FETCH INVITES] end")
				return
			}

			const subcommand = !interaction.options._subcommand ? null : interaction.options._subcommand

			switch (subcommand) {
				case "help":
					buildHelpMessage(interaction)
					break
				case "send":
					await surveyHelper.sendSurvey(interaction)
					break
				default:
					buildHelpMessage(interaction)
					break
			}

			logger.info("[COMMAND] surveys end")
		} catch (err) {
			mainHelper.commonCatch(err, "survey", logger)
			return
		}
	}


}

function buildHelpMessage(interaction) {
	const desc = "ODA Clan tool to manage surveys for ODA Clan members\n\n"
		+ "Hi Mod!\n"
		+ "Use '/survey send {ID} to send a specific survey in the channel you are\n"
		+ "For all the others functionality, such as list/edit/add/remove you can use our dedicated portal."
	const embed = new EmbedBuilder()
		.setColor("#ffffff")
		.setTitle("ODA Clan Survey Manager")
		.setThumbnail("https://i.imgur.com/JW8vPcb.png")
		.setDescription(desc)
	interaction.reply({ embeds: [embed], ephemeral: true })
}