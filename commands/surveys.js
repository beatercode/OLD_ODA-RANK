/* eslint-disable no-case-declarations */
const { SlashCommandBuilder } = require("@discordjs/builders")
//const Survey = require("../models/Surveys")
const surveyHelper = require("../helper/surveyHelper")
const logger = require("../helper/_logger")
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle} = require("discord.js")
const mainHelper = require("../helper/mainHelper")
//const { getRoleSettingsByValue } = require("../helper/roleHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("survey")
		.setDescription("Survey commands")
		.addSubcommand(subcommand => subcommand.setName("help").setDescription("Survey Help"))
		.addSubcommand(subcommand => subcommand.setName("list").setDescription("List the Survey in database"))
		.addSubcommand(subcommand => subcommand.setName("add").setDescription("Add a survey"))
		.addSubcommand((subcommand) =>
			subcommand
				.setName("edit")
				.setDescription("Lists a users points")
				.addStringOption((option) =>
					option.setName("id").setDescription("The Survey\"s ID to edit").setRequired(true),
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("send")
				.setDescription("Send a survey")
				.addStringOption((option) =>
					option.setName("id").setDescription("The Survey\"s ID to edit").setRequired(true),
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("remove")
				.setDescription("Lists a users points")
				.addStringOption((option) =>
					option.setName("id").setDescription("The Survey\"s ID to purge").setRequired(true),
				)
		)
	,
	async execute(interaction) {

		try {
			logger.info("[COMMAND] surveys start")

			const subcommand = !interaction.options._subcommand ? null : interaction.options._subcommand
			//const member = interaction.member

			switch (subcommand) {
			case "help":
				buildHelpMessage(interaction)
				break
			case "list":
				await surveyHelper.sendSurveyList(interaction)
				break
			case "send":
				await surveyHelper.sendSurvey(interaction)
				break
			case "add":
				await surveyHelper.addSurveyInitialize(interaction)
				break
			case "remove":
				await surveyHelper.deleteSurvey(interaction)
				break
			case "edit":
				interaction.reply({ content: "[ADMIN] - Check the logs [4]", ephemeral: true })
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
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder().setCustomId("listSurveys").setLabel("LIST").setStyle(ButtonStyle.Primary)
		)
	const embed = new EmbedBuilder()
		.setColor("#ffffff")
		.setTitle("ODA Clan Survey Manager")
		.setThumbnail("https://i.imgur.com/JW8vPcb.png")
		.setDescription("ODA Clan tool to manage surveys for ODA Clan members")
		.addFields({ name: "📈 LIST", value: "Lists all the existing surveys" }, { name: "/add", value: "Creates a new survey. \n USAGE: do some stuff" }, { name: "/remove", value: "Deletes a survey. \n USAGE: /remove SURVEYID" }, { name: "/send", value: "Sends a survey. \n USAGE: /send SURVEYID" })
	interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
}