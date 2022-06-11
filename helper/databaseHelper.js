const { Collection } = require("discord.js")
const Invites = require("../models/Invites")
const OdaSwitch = require("../models/OdaSwitch")
const logger = require("../helper/_logger")
const config = require("../backup/config.json")
const old_user = require("../old_user.json")
const Users = require("../models/Users")

module.exports = {

	async saveInvitesToDb(client) {

		const DB_SETTINGS = config.Settings.values
		const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID)
		const firstInvites = await guild.invites.fetch()
		let checkInvites = new Collection()
		checkInvites.set(DB_SETTINGS.GUILD_ID, new Collection(firstInvites.map((invite) => [invite.code, invite.uses])))
		checkInvites = checkInvites.get(DB_SETTINGS.GUILD_ID)
		checkInvites = [...checkInvites].map(([code, amount]) => ({ code, amount }))

		Invites.bulkWrite(
			checkInvites.map((invite) => ({
				updateOne: {
					filter: { code: invite.code },
					update: { $set: invite },
					upsert: true
				}
			}))
		)
	},

	async setOdaDb(tab, newValue) {
		await OdaSwitch.findOneAndUpdate({ name: tab }, newValue, { upsert: true })
			.catch(err => {
				logger.error("Errore nell'update/setup del DB - [" + tab + "]")
				logger.error(err)
			})
	},

	async DBCHANNELS() {
		//await this.getOdaDb("Channels");
		let res = await OdaSwitch.findOne({ name: "Channels" }, "-_id values")

		if (!res) {
			logger.error("Error in db query [" + "Channels" + "]")
			logger.error(res)
		}
		return res.values ? res.values : null
	},

	async DBROLES() {
		//await this.getOdaDb("Roles");
		let res = await OdaSwitch.findOne({ name: "Roles" }, "-_id values")

		if (!res) {
			logger.error("Error in db query [" + "Roles" + "]")
			logger.error(res)
		}
		return res.values ? res.values : null
	},

	async DBSETTINGS() {
		//return await this.getOdaDb("Settings");
		let res = await OdaSwitch.findOne({ name: "Settings" }, "-_id values")

		if (!res) {
			logger.error("Error in db query [" + "Settings" + "]")
			logger.error(res)
		}
		return res.values ? res.values : null
	},

	async DBUSERDUMMY() {
		//return await this.getOdaDb("Settings");
		let res = await OdaSwitch.findOne({ name: "UserDummy" }, "-_id values")

		if (!res) {
			logger.error("Error in db query [" + "Settings" + "]")
			logger.error(res)
		}
		return res.values ? res.values : null
	},

	async getOdaDb(tab) {
		let res = await OdaSwitch.findOne({ name: tab }, "-_id values")

		if (!res) {
			logger.error("Error in db query [" + tab + "]")
			logger.error(res)
		}
		return res.values ? res.values : null
	},

	async moveUsersData() {
		let json = old_user
		let allUsers = await Users.find({})

		allUsers.forEach(x => {
			let curUser = json[x.user_id]
			x.points = curUser.points
			x.consecutive_daily = curUser.consecutive_daily
			x.monthly_invitation = curUser.monthly_invitation
			x.oda_in_name = curUser.oda_in_name
			x.consecutive_oda = curUser.consecutive_oda
			x.invited_by = curUser.invited_by
			/*
            console.log(x.user_id + " points [" + x.points + "] daily [" + x.consecutive_daily + "]"
                .concat("monthly_invitation [" + x.monthly_invitation + "] ")
                .concat("oda_in_name [" + x.oda_in_name + "] ")
                .concat("consecutive_oda [" + x.consecutive_oda + "] ")
                .concat("invited_by [" + x.invited_by[0] + "][" + x.invited_by[1] + "]"))
                */
		})

		var updates = []
		allUsers.forEach(function (item) {
			var updatePromise = Users.updateMany(
				{ user_id: item.user_id },
				{
					"$set": {
						points: item.points,
						consecutive_daily: item.consecutive_daily,
						monthly_invitation: item.monthly_invitation,
						total_invitation: item.monthly_invitation,
						oda_in_name: item.oda_in_name,
						consecutive_oda: item.consecutive_oda,
						invited_by: item.invited_by,
					}
				}
			)
			updates.push(updatePromise)
		})

		Promise.all(updates).then(function () {
		})
	},

	async odaNameDiffChecker(client) {

		const DB_SETTINGS = config.Settings.values
		const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID)
		let members = await guild.members.fetch()
		members.forEach(x => {
			if (x.premiumSince) {
				console.log(x.user.username + " has a nitro account")
				console.log("his nick ---> " + x.nickname)
				if (!(!x.nickname || x.nickname.includes("| ODA Clan"))) {
					x.setNickname(x.user.username + " | ODA Clan")
				}
			}
			/* if (x.nickname != null && x.nickname != x.user.username) {
                console.log("Nickname [" + x.nickname + "] Username [" + x.user.username + "]");
            } */
		})
	},

	toYYYYMMFF(date) {
		var x = date
		var y = x.getFullYear().toString()
		var m = (x.getMonth() + 1).toString()
		var d = x.getDate().toString();
		(d.length == 1) && (d = "0" + d);
		(m.length == 1) && (m = "0" + m)
		var yyyymmdd = y + "-" + m + "-" + d
		return yyyymmdd
	},

}