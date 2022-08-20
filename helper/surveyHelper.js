/* eslint-disable no-unreachable */
const Survey = require("../models/Surveys")
const logger = require("../helper/_logger")
const { ActionRowBuilder, ButtonBuilder, MessageEmbed } = require("discord.js")

module.exports = {
	async sendSurveyList(interaction) {
		let surveys = await Survey.find({});
		let fields = generateFields(surveys);
		const embed = new MessageEmbed()
			.setColor("#ffffff")
			.setTitle("ODA Clan Survey Manager")
			.setThumbnail("https://i.imgur.com/JW8vPcb.png")
			.setDescription("ODA Clan tool to manage surveys for ODA Clan members")
			.addFields(
				fields
			)
		interaction.reply({ embeds: [embed], ephemeral: true })
	},
	
	async removeSurvey(interaction, id) {
		console.log(id)
		await Survey.findOne({customId: id})
		const embed = new MessageEmbed()
		.setColor("#ffffff")
		.setTitle("ODA Clan Survey Manager")
		.setThumbnail("https://i.imgur.com/JW8vPcb.png")
		.setDescription("ODA Clan tool to manage surveys for ODA Clan members")
		.addFields(
			{name: 'title', value: 'title'}
		)
		interaction.reply({ embeds: [embed], ephemeral: true })

	}
}

function generateFields(array) {
	let fields = [];
	for (item of array) {
		let qOptions = item.options;
		var qOptionsArray = (Object.keys(qOptions).map((key) => qOptions[key]))[0];
		let optionsReduced = qOptionsArray.reduce((acc, curr) => `${acc} [${curr}]`, '");
		fields.push({
			name: `ID: [${item.customId}] Name: ${item.name}`,
			value: `**Q**: ${item.question} **Options**: ${optionsReduced}`
		})
	}
	return fields;
}