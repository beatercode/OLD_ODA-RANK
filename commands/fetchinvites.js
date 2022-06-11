const { SlashCommandBuilder } = require("@discordjs/builders")
const mainHelper = require("../helper/mainHelper")
const { getMemberFromId } = require("../helper/mainHelper")
const { saveInvitesToDb } = require("../helper/databaseHelper")
const logger = require("../helper/_logger")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("fetchinvites")
		.setDescription("[ADMIN] Fetch ODA Guild invites and save them to DB")
		.setDefaultPermission(true),
	async execute(interaction) {

		try {
			logger.info("[FETCH INVITES] start")
			const member = await getMemberFromId(interaction.client, interaction.author.id)

			let isAdmin = await mainHelper.isAdminAccount(member)
			if (!isAdmin) {
				interaction.reply({ content: "Only admin can use this command", ephemeral: true })
				logger.info("[FETCH INVITES] end")
				return
			}

			const client = interaction.client
			saveInvitesToDb(client)

			interaction.reply({
				content: "Invites fetched & Database updated",
				ephemeral: true
			})
			logger.info("[FETCH INVITES] end")
		} catch (err) {
			mainHelper.commonCatch(err, "fetchinvites", logger)
			return
		}

	}
}
