/* eslint-disable no-unreachable */
const Users = require("../models/Users")
const logger = require("../helper/_logger")
const { DBROLES } = require("../helper/databaseHelper")
const { DBSETTINGS } = require("../helper/databaseHelper")

const emojiRank = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

module.exports = {

	async getAllRoleConstant() {
		let samurai = await this.getRoleSettingsByValue("command", "samurai")
		let noka = await this.getRoleSettingsByValue("command", "noka")
		let shokunin = await this.getRoleSettingsByValue("command", "shokunin")
		let shonin = await this.getRoleSettingsByValue("command", "shonin")

		return {
			samurai: samurai,
			noka: noka,
			shokunin: shokunin,
			shonin: shonin
		}
	},

	async getRoleDiscordObjectById(client, id) {
		const settings = await DBSETTINGS()
		const guild = client.guilds.cache.get(settings.GUILD_ID)
		const selectedRole = guild.roles.cache.find(r => r.id === id)
		return selectedRole
	},

	async getRoleSettingsByValue(property, value) {
		const roles = await DBROLES()
		const targetRole = Object.values(roles).find(x => x[property] === value)
		return targetRole
	},

	async getHigherRoleByArrayOfRolesID(rolesID) {
		const roles = await DBROLES()
		let filteredRoles = Object.values(roles).filter(role => role["lvl"] >= 0 && rolesID.includes(role["id"]))
		if (filteredRoles.length > 1) {
			filteredRoles = filteredRoles
				.find(game => game.lvl === Math.max(...filteredRoles.map(e => e.lvl)))
		}
		return Array.isArray(filteredRoles) ? filteredRoles[0] : filteredRoles
	},

	isLevelID(searchID, roles) {
		let doc = roles.find((role) => role.id === searchID)
		return doc ? true : false
	},

	async generateBoard(interaction) {

		const member = interaction.member
		let imTheRole = false
		let roleSettings = null
		if (interaction.isButton() || interaction.options.getRole("role") == null) {
			roleSettings = await this.getHigherRoleByArrayOfRolesID(member._roles)
			imTheRole = true
		} else {
			let selectedRoleId = interaction.options.getRole("role").id
			let myRoleSettings = await this.getHigherRoleByArrayOfRolesID(member._roles)
			roleSettings = await this.getRoleSettingsByValue("id", selectedRoleId)
			imTheRole = roleSettings ? selectedRoleId == myRoleSettings.id : null
		}
		let accessible = roleSettings && (roleSettings.lvl < 6 && roleSettings.lvl >= 2) || imTheRole
		return accessible
			? this.generateBoardInternal(member, imTheRole, roleSettings, 10)
			: {
				board: null,
				myId: member.user.id,
				roleName: roleSettings ? roleSettings.name : "Other",
				roleColor: roleSettings ? roleSettings.colo : "#FFFFFF",
			}
	},

	async generateBoardInternal(member, imTheRole, roleSettings, searchLimit) {

		const userId = member ? member.user.id : null
		const roleColor = roleSettings ? roleSettings.color : null
		const roleName = roleSettings ? roleSettings.name : null
		const roleId = roleSettings ? roleSettings.id : null
		let allUsersByRole = roleSettings
			? await Users.find({ role_id: roleId }).sort({ points: -1 })
			: await Users.find({}).sort({ points: -1 })
		let topBoard = allUsersByRole.map(({ user_id, username, points }) => ({ user_id, username, points }))

		// add position as property
		topBoard.forEach((x, i) => {
			x.position = (i + 1)
		})

		// save my object
		let myObject = topBoard.filter(x => x.user_id == userId)[0]

		// fill or fix 10 top position
		if (searchLimit != 0) {
			if (topBoard.length > searchLimit) {
				topBoard = topBoard.slice(0, searchLimit)
			} /* else {
                for (let index = 0; index < searchLimit; index++) {
                    if (!topBoard[index]) { topBoard.push({ user_id: "00000000", points: 0, username: "dummy" }) }
                }
            } */
		}
		// check if im in the role selected
		if (imTheRole) {
			// add me as 11* if not present
			if (topBoard.filter(e => e.user_id === myObject.user_id ? myObject.user_id : "").length == 0) {
				topBoard.push(myObject)
			}
		}

		return {
			board: topBoard,
			myId: userId,
			roleName: roleName,
			roleColor: roleColor
		}
	},

	createBoardMessage(board, myId) {
		let description = ""
		let counter = 1
		board.forEach(x => {
			if (!x) return
			let pos = counter == x.position ? emojiRank[counter - 1] : x.position ? x.position : emojiRank[counter - 1]
			let newRow = ""
			if (x.user_id == myId) {
				newRow = (counter == 11 && board.length == 11)
					? `\n${pos}. **<@${x.user_id}>** with **${x.points}** ODA points`
					: `${pos} **<@${x.user_id}>** with **${x.points}** ODA points\n`
			} else {
				let atmUser = (x.username).includes("dummy") ? "@dummyUser" : x.username
				newRow = `${pos} **${atmUser}** with **${x.points}** ODA points\n`
			}
			description += newRow
			counter++
		})
		return description
	},

	async createBoardMessageWithRoles(board, myId) {
		let description = ""
		let counter = 1
		let idList = board.map(x => x.user_id)
		let userDb = await Users.find({ user_id: { $in: idList } }, "-_id user_id role role_id")
		board.forEach(async x => {
			if (!x) return
			let pos = counter == x.position ? emojiRank[counter - 1] : x.position ? x.position : emojiRank[counter - 1]
			let newRow = ""
			let userRole = "<@&" + userDb.find(f => f.user_id == x.user_id).role_id + ">"
			if (x.user_id == myId) {
				newRow = (counter == 11 && board.length == 11)
					? `\n**${pos}.** <@${x.user_id}> points **${x.points}** ${userRole}`
					: `**${pos}** <@${x.user_id}> points **${x.points}** ${userRole}\n`
			} else {
				let atmUser = (x.username).includes("dummy") ? "@dummyUser" : " " + x.username
				newRow = `${pos} **${atmUser}** points **${x.points}** ${userRole}\n`
			}
			description += newRow
			counter++
		})
		return description
	},

	async getAllBoars(searchLimit) {
		let samuraiBoard = await this.getBoardByRoleName(searchLimit, "samurai")
		let nokaBoard = await this.getBoardByRoleName(searchLimit, "noka")
		let shokuninBoard = await this.getBoardByRoleName(searchLimit, "shokunin")
		let shoninBoard = await this.getBoardByRoleName(searchLimit, "shonin")

		return {
			samuraiBoard: samuraiBoard,
			nokaBoard: nokaBoard,
			shokuninBoard: shokuninBoard,
			shoninBoard: shoninBoard
		}
	},

	async downgrade(client, user) {
		let res = 0
		res = this.downgrade_db(user)
		res = this.downgrade_discord(client, user)
		return res
	},

	async upgrade(client, user) {
		let res = 0
		res = this.upgrade_db(user)
		res = this.upgrade_discord(client, user)
		return res
	},

	async downgrade_discord(client, user) {
		console.log("Im gonna downgrade DISC the user: " + user.username)
		let currentRole = await this.getRoleSettingsByValue("id", user.role_id)

		let member = await this.getMemberFromId(client, user.user_id)
		let currentRoleObject = await this.getRoleDiscordObjectById(client, currentRole.id)
		member.roles.remove(currentRoleObject)
		return 0
	},

	async upgrade_discord(client, user) {
		console.log("Im gonna upgrade DISC the user: " + user.username)
		let currentRole = await this.getRoleSettingsByValue("id", user.role_id)

		// check upgradable user
		if (currentRole.lvl >= 6) return 1

		let nextRole = await this.getRoleSettingsByValue("lvl", (+currentRole.lvl + 1))

		let member = await this.getMemberFromId(client, user.user_id)
		let nextRoleObject = await this.getRoleDiscordObjectById(client, nextRole.id)
		member.roles.add(nextRoleObject)
		return 0
	},

	async downgrade_db(user) {
		console.log("Im gonna downgrade DB the user: " + user.username)
		let currentRole = await this.getRoleSettingsByValue("id", user.role_id)

		let prevRole = await this.getRoleSettingsByValue("lvl", (+currentRole.lvl - 1))
		let updateEvent = await Users.updateOne({ user_id: user.user_id }, { $set: { role_id: prevRole.id, role: prevRole.name } })

		// check db is done
		if (updateEvent.modifiedCount != 1) return 1
		return 0
	},

	async upgrade_db(user) {
		console.log("Im gonna upgrade DB the user: " + user.username)

		try {
			let currentRole = await this.getRoleSettingsByValue("id", user.role_id)

			// check upgradable user
			if (currentRole.lvl >= 6) return 1

			let nextRole = await this.getRoleSettingsByValue("lvl", (+currentRole.lvl + 1))
			let updateEvent = await Users.updateOne({ user_id: user.user_id }, { $set: { role_id: nextRole.id, role: nextRole.name } })

			// check db is done
			if (updateEvent.modifiedCount != 1) return 1
		} catch (err) {
			logger.error(err)
			return 1
		}
		return 0
	},

	async getBoardByRoleName(searchLimit, roleName) {
		const roleSettings = await this.getRoleSettingsByValue("command", roleName)
		let board = await this.generateBoardInternal(null, false, roleSettings, searchLimit)
		return board
	},

	async getUserBelowMonthInvitationCriteria(roleName) {
		let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
		let criteria = await this.getMinimumInvitationByRole(roleName)
		let returnable = await Users.find({ role_id: roleId, $lt: { monthly_invitation: criteria.downgrade } })
		return returnable
	},

	async isUserMonthInvitationCriteria(user) {
		let result = false
		let roleSettings = await this.getRoleSettingsByValue("name", user.role)
		let roleName = roleSettings.command
		let criteria = await this.getInvitationCriteriaByRole(roleName)

		// To comment
		logger.info("User's criteria [" + roleName + "]: ")
		logger.info(criteria)
		// To comment

		let newMonthlyInvitation = +user.monthly_invitation_current + 1
		console.log("New month inv: " + newMonthlyInvitation)
		console.log("Criteria upgr: " + criteria != null ? criteria.upgrade : "Not necessary")

		if (criteria != null ? newMonthlyInvitation >= criteria.upgrade : false) {
			result = true
		}
		return result
	},

	async getUserMonthInvitationCriteria(mode, roleName) {
		// mode 0 --> above
		// mode 1 --> below

		let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
		let criteria = await this.getInvitationCriteriaByRole(roleName)

		let returnable = null
		if (mode == 0) {
			returnable = await Users.find({ role_id: roleId, $gte: { monthly_invitation: criteria.upgrade } })
		}
		if (mode == 1) {
			returnable = await Users.find({ role_id: roleId, $lt: { monthly_invitation: criteria.downgrade } })
		}
		return returnable
	},

	async getInvitationCriteriaByRole(roleName) {
		const settings = await DBSETTINGS()
		return settings.ROLES_CRITERIA[roleName]
	},

	async getUserUpDownByRolePercentage(roleName, percentage, mode) {
		// mode 0 --> upgrade
		// mode 1 --> downgrade

		if (mode == 0) {
			return await this.getUsersUpgredableByRolePercentage(roleName, percentage)
		}
		if (mode == 1) {
			return await this.getUsersDowngredableByRolePercentage(roleName, percentage)
		}
	},

	async getUserUpDownByRolePercentageAndDiff(roleName, percentage, mode) {
		// mode 0 --> upgrade
		// mode 1 --> downgrade

		if (mode == 0) {
			return await this.getUsersUpgredableByRolePercentageAndDiff(roleName, percentage)
		}
		if (mode == 1) {
			return await this.getUsersDowngredableByRolePercentageAndDiff(roleName, percentage)
		}
	},

	async getUserUpDownByFixedNumber(roleName, fixed, mode) {
		// mode 0 --> upgrade
		// mode 1 --> downgrade

		let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
		return await Users.find({ role_id: roleId }).sort({ points: mode ? 1 : -1 }).limit(fixed)
	},

	async getUserUpDownByFixedNumberAndDiff(roleName, fixed, mode) {
		// mode 0 --> upgrade
		// mode 1 --> downgrade

		let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
		let upDownUsers = await Users.find({ role_id: roleId }).sort({ points: mode ? 1 : -1 }).limit(fixed)
		let threshold = upDownUsers.length > (fixed - 1) ? upDownUsers[fixed - 1].points : 0
		return {
			threshold: threshold,
			returnable: upDownUsers
		}
	},

	async getUserUpDownMyPosition(roleId, myId) {

		let totalUsersOfRole = await Users.find({ role_id: roleId }).sort({ points: -1 })
		let totalUsersOfRoleLen = totalUsersOfRole.length
		let myIndex = totalUsersOfRole.map(object => object.user_id).indexOf(myId)

		return {
			//totalOfRole: totalUsersOfRoleLen,
			myTopPosition: (myIndex + 1),
			myTopPercentage: ((myIndex + 1) * 100 / totalUsersOfRoleLen)
		}
	},

	async getUsersDowngredableByRolePercentage(roleName, percentageDown) {
		const board = await this.getBoardByRoleName(0, roleName)
		if (board.board.length > 0) {
			let toDowngrade = Math.floor(board.board.length / 100 * percentageDown)
			console.log("BOARD [" + roleName + "] LEN [" + board.board.length + "] - PERC. [" + percentageDown + "]")
			let fixer = toDowngrade > 0 ? 0 : 1
			let position = board.board.length - toDowngrade - fixer
			let fromToDeletePoints = board.board[position].points
			let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
			let returnable = await Users.find({ role_id: roleId, points: { $lte: fromToDeletePoints } })
			return returnable
		}
	},

	async getUsersUpgredableByRolePercentage(roleName, percentageUp) {
		const board = await this.getBoardByRoleName(0, roleName)
		//console.log("RoleName [" + roleName + "] - PercUp [" + percentageUp + "]")
		if (board.board.length > 0) {
			let toUpgrade = Math.round(board.board.length / 100 * percentageUp)
			console.log("BOARD [" + roleName + "] LEN [" + board.board.length + "] - PERC. [" + percentageUp + "]")
			//console.log("To Upgrade [" + toUpgrade + "]")
			let fixer = 0//toUpgrade > 0 ? 1 : 0
			let position = fixer + toUpgrade
			//console.log("Position [" + position + "]")
			let fromToUpgradePoints = board.board[position].points
			//console.log("fromToUpgradePoints [" + fromToUpgradePoints + "]")
			let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
			let returnable = await Users.find({ role_id: roleId, points: { $gte: fromToUpgradePoints } }).sort({ points: -1 })
			return returnable
		}
	},

	async getUsersDowngredableByRolePercentageAndDiff(roleName, percentageDown) {
		const board = await this.getBoardByRoleName(0, roleName)
		if (board.board.length > 0) {
			let toDowngrade = Math.floor(board.board.length / 100 * percentageDown)
			let fixer = toDowngrade > 0 ? 0 : 1
			let position = board.board.length - toDowngrade - fixer
			let fromToDeletePoints = board.board[position].points
			let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
			let returnable = await Users.find({ role_id: roleId, points: { $lte: fromToDeletePoints } })
			return {
				threshold: fromToDeletePoints,
				returnable: returnable
			}
		}
	},

	async getUsersUpgredableByRolePercentageAndDiff(roleName, percentageUp) {
		const board = await this.getBoardByRoleName(0, roleName)
		if (board.board.length > 0) {
			let toUpgrade = Math.round(board.board.length / 100 * percentageUp)
			let fixer = toUpgrade > 0 ? 1 : 0
			let position = fixer + toUpgrade
			let fromToUpgradePoints = board.board[position].points
			let roleId = (await this.getRoleSettingsByValue("command", roleName)).id
			let returnable = await Users.find({ role_id: roleId, points: { $gt: fromToUpgradePoints } })
			return {
				threshold: fromToUpgradePoints,
				returnable: returnable
			}
		}
	},

	async getMemberFromId(client, id) {
		const DB_SETTINGS = await DBSETTINGS()
		let guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID)
		let member = guild.members.cache.get(id)
		return member
	},

	async downgradeZeroShokunin(client) {
		const roles = await DBROLES()
		const shokuninRoleObject = await this.getRoleDiscordObjectById(client, roles.shokunin.id)
		const zeroPointsShokunin = await Users.find({ points: 0, role_id: roles.shokunin.id })

		const isZeroPointsShokunin = zeroPointsShokunin != null && zeroPointsShokunin.length != 0
		logger.info("\nShokunin Zero Points LEN: \nzeroPointsShokunin[" + zeroPointsShokunin.length + "]")
		logger.info("\nShokunin Zero Points BOOL: \nzeroPointsShokunin[" + isZeroPointsShokunin + "]")
		
		return

		for (let x of zeroPointsShokunin) {
			let member = await this.getMemberFromId(client, x.user_id)
			member.roles.remove(shokuninRoleObject)
		}
	}

}