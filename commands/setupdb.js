const { SlashCommandBuilder } = require("@discordjs/builders")
const { getHigherRoleByArrayOfRolesID } = require("../helper/roleHelper")
const Users = require("../models/Users")
const mainHelper = require("../helper/mainHelper")
const config = require("../backup/config.json")
const logger = require("../helper/_logger")
const { setOdaDb, DBUSERDUMMY, DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setupdb")
		.setDescription("[ADMIN] Setup & Refactor the tabase!")
		.setDefaultPermission(true),
	async execute(interaction) {

		try {
			logger.info("[COMMAND] setupdb start")
			const member = interaction.member

			let isAdmin = await mainHelper.isAdminAccount(member)
			if (!isAdmin) {
				interaction.reply({ content: "Only admin can use this command", ephemeral: true })
				return
			}

			await setOdaDb("Roles", config.Roles)
			await setOdaDb("Channels", config.Channels)
			await setOdaDb("Settings", config.Settings)
			await setOdaDb("UserDummy", config.UserDummy)

			const DB_SETTINGS = await DBSETTINGS()

			// prendo i membri della GUILD
			const client = interaction.client
			const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID)
			let members = await guild.members.fetch().then((x) => { return x }).catch(console.error)
			members = members.map(x => x)
			// li filtro e ottengo i membri non nel DB
			const allDocs = await Users.find({})
			const allDocsID = allDocs.map(x => x.user_id)
			let memberNotInDB = members.filter(x => !x.user.bot && !allDocsID.includes(x.user.id))

			memberNotInDB.forEach(async member => {
				if(!member) return

				let userRole = await getHigherRoleByArrayOfRolesID(member._roles)
					.catch(() => console.log("ERROR [getHigherRoleByArrayOfRolesID]"))

				if(!userRole) return
				let newUser = new Users(await DBUSERDUMMY())
				newUser.user_id = member.user.id
				newUser.username = member.user.username
				newUser.role_id = userRole.id
				newUser.role = userRole.name

				await newUser.save(err => {
					if (err) {
						console.log(err)
						interaction.reply("Error during setup user [" + member.user.username + "]")
						return
					}
				})
			})

			interaction.reply({
				content: "Database updated",
				ephemeral: true
			})
			logger.info("[COMMAND] setupdb end")

		} catch (err) {
			mainHelper.commonCatch(err, "setupdb", logger)
			return
		}
	}
}
