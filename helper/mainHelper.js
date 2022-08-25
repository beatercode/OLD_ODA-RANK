const { DBROLES, DBSETTINGS, DBUSERDUMMY } = require("../helper/databaseHelper")
const { getHigherRoleByArrayOfRolesID } = require("../helper/roleHelper")
const Users = require("../models/Users")
const config = require("../backup/config.json")
const logger = require("./_logger")

module.exports = {

	async addPoints(userId, points) {
		await Users.updateMany({ user_id: userId }, { $inc: { points: points } })
	},

	async isAdminAccount(inMember) {
		const DB_SETTINGS = config.Settings.values
		let memberRolesID = inMember._roles
		let settings = await DBROLES()
		let adminsRoleName = DB_SETTINGS.ADMIN_NAMES
		let isAdmin = Object.values(settings)
			.filter(x => adminsRoleName
				.some(el => x.command === el))
			.map(x => x.id)
			.some(x => memberRolesID.includes(x))
		return isAdmin
	},

	async getMemberFromId(client, id) {
		const DB_SETTINGS = config.Settings.values
		let guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID)
		let member = guild.members.cache.get(id)
		return member
	},

	async logOnServer(client, msg) {
		const DB_CHANNEL = config.Channels.values
		const DB_SETTINGS = config.Settings.values
		if (!DB_SETTINGS.enabled_ds_log) return
		const chatChannel = client.channels.cache.get(DB_CHANNEL.ch_bot_feedback)
		chatChannel.send(msg)
	},

	async setupdbMissingUser(client) {
		const DB_SETTINGS = await DBSETTINGS()

		const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID)
		let members = await guild.members.fetch().then((x) => { return x }).catch(console.error)
		members = members.map(x => x)
		// li filtro e ottengo i membri non nel DB
		const allDocs = await Users.find({})
		const allDocsID = allDocs.map(x => x.user_id)
		let memberNotInDB = members.filter(x => !x.user.bot && !allDocsID.includes(x.user.id))

		let userListString = ""
		let userListCounter = 0
		memberNotInDB.forEach(async member => {
			if (!member) return

			let userRole = await getHigherRoleByArrayOfRolesID(member._roles)
				.catch(() => console.log("ERROR [getHigherRoleByArrayOfRolesID]"))

			if (!userRole) return
			let newUser = new Users(await DBUSERDUMMY())
			newUser.user_id = member.user.id
			newUser.username = member.user.username
			newUser.role_id = userRole.id
			newUser.role = userRole.name

			userListString += `${member.user.username} added to DB with role ${userRole.name}\n`
			userListCounter++

			await newUser.save(err => {
				if (err) {
					console.log(err)
					logger.error("Error during setup user [" + member.user.username + "]")
					return
				}
			})
		})
		logger.info(userListString)
		return userListCounter
	},

	async todayInDDMMYYY() {
		var d = new Date()
		let adjMonth = (d.getMonth() + 1) < 10 ? "0".concat(d.getMonth() + 1) : d.getMonth() + 1
		return d.getDate()  + "" + adjMonth + "" + d.getFullYear()
	},

	async commonCatch(err, from, logger) {
		if (err) {
			logger.error(`Error in [${from}]`)
			logger.error(err)
		}
	}

}