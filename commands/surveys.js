/* eslint-disable no-case-declarations */
const { SlashCommandBuilder } = require("@discordjs/builders")
//const Survey = require("../models/Surveys")
const surveyHelper = require("../helper/surveyHelper")
const logger = require("../helper/_logger")
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const mainHelper = require("../helper/mainHelper")
//const { getRoleSettingsByValue } = require("../helper/roleHelper")

module.exports = {
	data: new SlashCommandBuilder()
		/*
		.setName("survey")
		.setDescription("Survey commands")
		.addStringOption((option) =>
			option
				.setName("command")
				.setDescription("Specify command to execute")
				.setRequired(false)
		),
		*/
		.setName("survey")
		.setDescription("Survey commands")
		.addSubcommandGroup((group) =>
			group
				.setName("manage")
				.setDescription("Shows information about points in the guild")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("add")
						.setDescription("To add a new Survey")
						.addStringOption((option) =>
							option.setName("id").setDescription("The NEW Survey ID").setRequired(true),
						)
						.addStringOption((option) =>
							option.setName("title").setDescription("The NEW Survey Title").setRequired(true),
						)
						.addStringOption((option) =>
							option.setName("question").setDescription("The NEW Survey Question").setRequired(true),
						)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("rem")
				.setDescription("Lists a users points")
				.addStringOption((option) =>
					option.setName("id").setDescription("The Survey\"s ID to purge").setRequired(true),
				)
		)
		.addSubcommand(subcommand => subcommand.setName("list").setDescription("List the Survey in database"))
		//.addSubcommand(subcommand => subcommand.setName("testinput").setDescription("Text modal submitting"))
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
			case "add":
				interaction.reply({ content: "[ADMIN] - Check the logs [2]", ephemeral: true })
				break
			case "remove":
				interaction.reply({ content: "[ADMIN] - Check the logs [3]", ephemeral: true })
				break
			case "send":
				interaction.reply({ content: "[ADMIN] - Check the logs [4]", ephemeral: true })
				break
			case "testinput":

				// TEST STUFF
				const modal = new ModalBuilder().setCustomId("odaTestModal").setTitle("ODA Survey")
				const nftInput = new TextInputBuilder()
					.setCustomId("nftInput")
					.setLabel("What's your favorite NFT Project?")
					.setStyle(TextInputStyle.Short)

				const cryptoInput = new TextInputBuilder()
					.setCustomId("cryptoInput")
					.setLabel("What's some of your favorite crypto/token?")
					.setStyle(TextInputStyle.Paragraph)

				const firstActionRow = new ActionRowBuilder().addComponents(nftInput)
				const secondActionRow = new ActionRowBuilder().addComponents(cryptoInput)

				modal.addComponents(firstActionRow, secondActionRow)
				await interaction.showModal(modal)
				// interaction.reply({ content: "[ADMIN] - Check the logs [5]", ephemeral: true })
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
			new ButtonBuilder().setCustomId("listSurveys").setLabel("LIST").setStyle("SUCCESS")
		)
	const embed = new EmbedBuilder()
		.setColor("#ffffff")
		.setTitle("ODA Clan Survey Manager")
		.setThumbnail("https://i.imgur.com/JW8vPcb.png")
		.setDescription("ODA Clan tool to manage surveys for ODA Clan members")
		.addFields({ name: "📈 LIST", value: "Lists all the existing surveys" }, { name: "/add", value: "Creates a new survey. \n USAGE: do some stuff" }, { name: "/remove", value: "Deletes a survey. \n USAGE: /remove SURVEYID" }, { name: "/send", value: "Sends a survey. \n USAGE: /send SURVEYID" })
	interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
}