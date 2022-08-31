/* eslint-disable no-case-declarations */
const { SlashCommandBuilder } = require("@discordjs/builders")
//const Survey = require("../models/Surveys")
const surveyHelper = require("../helper/surveyHelper")
const logger = require("../helper/_logger")
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require("discord.js")
const mainHelper = require("../helper/mainHelper")
const hyper = require("../helper/hyper")
//const { getRoleSettingsByValue } = require("../helper/roleHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("new")
		.setDescription("New main command")
		.addSubcommand(subcommand => subcommand.setName("help").setDescription("New command Help"))
		.addSubcommand((subcommand) =>
			subcommand
				.setName("licence")
				.setDescription("Create a new Licence/s")
				.addStringOption((option) =>
					option.setName("amount").setDescription("Default 1").setRequired(false),
				)
		)
	,
	async execute(interaction) {

		try {
			logger.info("[COMMAND] new start")

			const subcommand = !interaction.options._subcommand ? null : interaction.options._subcommand

			console.log(interaction.options)
			//const member = interaction.member

			switch (subcommand) {
				case "help":
					buildHelpMessage(interaction)
					break
				case "licence":
					let amount = interaction.options._hoistedOptions.find(x => x.name == "amount") || 1
					amount = +(amount.value || amount)
					let licences = await hyper.generateLicences(amount)
					let licencesField = ""
					licences.forEach(x => licencesField += `${x}\n`)
					let lNameField = "\u200B"

					let embed = new EmbedBuilder()
						.setColor("#ffffff")
						.setTitle("ODA Clan Licence Manager")
						.setThumbnail("https://i.imgur.com/JW8vPcb.png")
						.setDescription("ODA Clan admin tool to manage Licences etc...")
						.addFields(
							{ name: lNameField, value: licencesField }
						)
					interaction.reply({ embeds: [embed] })
					break
				default:
					buildHelpMessage(interaction)
					break
			}

			logger.info("[COMMAND] new end")
		} catch (err) {
			mainHelper.commonCatch(err, "new", logger)
			return
		}
	}


}

function buildHelpMessage(interaction) {
	let embed = new EmbedBuilder()
		.setColor("#ffffff")
		.setTitle("ODA Clan New Manager")
		.setThumbnail("https://i.imgur.com/JW8vPcb.png")
		.setDescription("ODA Clan admin tool to manage Licences etc...")
		.addFields(
			{ name: "/new licence", value: "Create one new licence, with 30 days length at 0 dollar price" },
			{ name: "amount", value: "Specify the amount of Licences to generate, default is 1" }
		)
	interaction.reply({ embeds: [embed], ephemeral: true })
}