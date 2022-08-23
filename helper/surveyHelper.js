/* eslint-disable no-unreachable */
const Survey = require("../models/Surveys")
// const logger = require("../helper/_logger")
const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const mainHelper = require("./mainHelper")
const Surveys = require("../models/Surveys")

module.exports = {
	async sendSurveyList(interaction) {
		let surveys = await Survey.find({})
		let fields = generateFields(surveys)
		const embed = new EmbedBuilder()
			.setColor("#ffffff")
			.setTitle("ODA Clan Survey Manager")
			.setThumbnail("https://i.imgur.com/JW8vPcb.png")
			.setDescription("ODA Clan tool to manage surveys for ODA Clan members")
			.addFields(
				fields
			)
		interaction.reply({ embeds: [embed], ephemeral: true })
	},

	async handleSurveyDeleteButton(data, interaction) {
		let [ command, subcommand, value, id ] = data.split("_")

		switch (subcommand) {
		case "delete": {
			if (value == "yes") {
				await Survey.deleteOne({ customId: id })
				interaction.reply({ content: "Done", ephemeral: true })
			} else {
				interaction.reply({ content: "Idiot", ephemeral: true })
			}
			break
		}
		default: 
			interaction.reply({ content: "Something wrong just happened", ephemeral: true })
			break
		}
	},

	async deleteSurvey(interaction) {
		let targetId = "Q" + interaction.options._hoistedOptions[0].value
		let surveyToDelete = await Survey.findOne({ customId: targetId })

		const embed = new EmbedBuilder()
			.setColor("#ffffff")
			.setTitle("ODA Clan | Removing Survey " + targetId)
			.setDescription("You allowed to do that and You sure?")
		
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder().setCustomId("survey_delete_yes_" + targetId).setLabel("🟢 Yes").setStyle(ButtonStyle.Success),
				new ButtonBuilder().setCustomId("survey_delete_no_" + targetId).setLabel("🔴 No").setStyle(ButtonStyle.Danger)
			)

		await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
	},

	async sendSurvey(interaction) {
		let targetId = "Q" + interaction.options._hoistedOptions[0].value
		let surveyToSend = await Survey.findOne({ customId: targetId })

		const embed = new EmbedBuilder()
			.setColor("#ffffff")
			// .setTitle("ODA Clan Survey")
			.setTitle("Survey | " + surveyToSend.name)
			.setDescription(surveyToSend.question)
		
		let qOptions = surveyToSend.options
		let howManyRows = Math.floor(qOptions.length / 3)
		let rowReminder = qOptions.length % 3
		console.log(" -- Will use " + howManyRows + " rows for the buttons")

		let rows = []
		let responseIdPrefix = "survey_choose_" + surveyToSend.customId

		// FOR EVERY ROW
		for (let i = 0; i < howManyRows; i ++) {
			rows.push(
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId(responseIdPrefix + "_" + qOptions[i * 3 + 0].value)
							.setLabel(qOptions[i * 3 + 0].value).setStyle(ButtonStyle.Primary),
						new ButtonBuilder().setCustomId(responseIdPrefix + "_" + qOptions[i * 3 + 1].value)
							.setLabel(qOptions[i * 3 + 1].value).setStyle(ButtonStyle.Primary),
						new ButtonBuilder().setCustomId(responseIdPrefix + "_" + qOptions[i * 3 + 2].value)
							.setLabel(qOptions[i * 3 + 2].value).setStyle(ButtonStyle.Primary),
					)
			)
		}

		// REMINDERS
		if (rowReminder > 1) {
			rows.push(
				new ActionRowBuilder()
					.addComponents(
						rowReminder > 0 ? new ButtonBuilder().setCustomId(responseIdPrefix + "_" + qOptions[howManyRows * 3 + 0].value)
							.setLabel(qOptions[howManyRows * 3 + 0].value).setStyle(ButtonStyle.Primary) : null,
						rowReminder > 1 ? new ButtonBuilder().setCustomId(responseIdPrefix + "_" + qOptions[howManyRows * 3 + 1].value)
							.setLabel(qOptions[howManyRows * 3 + 1].value).setStyle(ButtonStyle.Primary) : null
					)
			)
		} else if (rowReminder > 0) {
			rows.push(
				new ActionRowBuilder()
					.addComponents(
						rowReminder > 0 ? new ButtonBuilder().setCustomId(surveyToSend.customId + "_" + qOptions[howManyRows * 3 + 0].value)
							.setLabel(qOptions[howManyRows * 3 + 0].value).setStyle(ButtonStyle.Primary) : null
					)
			)
		}
		
		await Surveys.updateOne({ customId: targetId }, { $set: { wasPublished: true } } )
		await interaction.reply({ embeds: [embed], components: rows })
		// interaction.reply({ content: "In progress", ephemeral: true })
	},

	async handleSurveyChooseButton(data, interaction) {
		let [ command, subcommand, qId, choose ] = data.split("_")

		let voterUserId = interaction.member.user.id
		let voter = { id: voterUserId, choose: choose }

		let votersUpdate = await Surveys.updateOne({ customId: qId, "voters.id": { $ne: voterUserId } }, { $push: { voters: voter } })
		
		if (votersUpdate.modifiedCount == 0) {
			interaction.reply({ content: "You already voted for this survey", ephemeral: true })
			return
		} else {
			interaction.reply({ content: "Your vote has been inserted", ephemeral: true })
		}
	},

	async addSurveyInitialize(interaction) {

		let modalId = "handleSurvey_namequestion_null_" + "null" + "_add"
		const modal = new ModalBuilder().setCustomId(modalId).setTitle("ODA Add Survey")
		const nameInput = new TextInputBuilder()
			.setCustomId("name")
			.setLabel("Name")
			.setStyle(TextInputStyle.Short)

		const questionInput = new TextInputBuilder()
			.setCustomId("question")
			.setLabel("Question")
			.setStyle(TextInputStyle.Paragraph)

		const republishableInput = new TextInputBuilder()
			.setCustomId("republishable")
			.setLabel("Republishable? (true/false)")
			.setStyle(TextInputStyle.Short)

		const wasPublishedInput = new TextInputBuilder()
			.setCustomId("wasPublished")
			.setLabel("Was Published? (true/false)")
			.setStyle(TextInputStyle.Short)

		const optionsInput = new TextInputBuilder()
			.setCustomId("options")
			.setLabel("Options (separated by comma)")
			.setStyle(TextInputStyle.Paragraph)

		const row1 = new ActionRowBuilder().addComponents(nameInput)
		const row2 = new ActionRowBuilder().addComponents(questionInput)
		const row3 = new ActionRowBuilder().addComponents(republishableInput)
		const row4 = new ActionRowBuilder().addComponents(wasPublishedInput)
		const row5 = new ActionRowBuilder().addComponents(optionsInput)

		modal.addComponents(row1, row2, row3, row4, row5)
		await interaction.showModal(modal)
	},

	async handleSurveyModal(interaction) {
		this.addSurvey_firstCommit(interaction.fields.fields, interaction)
	},

	async addSurvey_firstCommit(fields, interaction) {
		let { qName, qQuestion, qRepublishable, qWasPublished, qOptions } = "" 
		for (let field of fields) {
			qName = field[0] == "name" ? field[1].value : qName
			qQuestion = field[0] == "question" ? field[1].value : qQuestion
			qRepublishable = field[0] == "republishable" ? field[1].value : qRepublishable
			qWasPublished = field[0] == "wasPublished" ? field[1].value : qWasPublished
			qOptions = field[0] == "options" ? field[1].value : qOptions
		}

		let myOptions = qOptions.split(",")
		let objOptions = []
		myOptions.forEach(element => {
			objOptions.push({
				value: element,
				points: 200
			})	
		})

		let surveysList = await Survey.find({})
		let arrayIds = surveysList.map(x => Number(x.customId.substring(1, 2)))
		const nextId = "Q".concat(Math.max(...arrayIds) + 1)

		let currectValidFrom = await mainHelper.todayInDDMMYYY()

		await Survey.insertMany([{
			customId: nextId, 
			name: qName, 
			question: qQuestion, 
			republishable: qRepublishable == "true",
			wasPublished: qWasPublished == "true",
			validFrom: currectValidFrom,
			options: objOptions,
			voters: [{}]
		}])

		await interaction.reply({ content: "check bro", ephemeral: true })
	}
}

function generateFields(array) {
	let fields = []
	for (let item of array) {
		let qOptions = item.options
		let optionsReduced = ""
		for(let o of qOptions) {
			optionsReduced += o.value + ", "
		}
		optionsReduced = optionsReduced.substring(0, optionsReduced.length - 2)
		fields.push({
			name: `${item.customId} - ${item.name}`,
			value: `**Q**: ${item.question} **Options**: ${optionsReduced}`
		})
	}
	return fields
}