const logger = require("../helper/_logger")
const Users = require("../models/Users")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")

module.exports = {
	name: "guildMemberUpdate",
	async execute(oldMember, newMember) {

		try {
			if (newMember.nickname !== oldMember.nickname || newMember.user.username != oldMember.user.username) {

				if (newMember.premiumSince || oldMember.premiumSince) {
					logger.info(oldMember.nickname ? oldMember.nickname : oldMember.user.username 
						+ " has Nitro anche will change nick to [" + newMember.nickname + "]!")
				} else {
					if (newMember.nickname !== null) {
						newMember.setNickname(null)
					}
				}

				let newNick = !newMember.nickname ? newMember.user.username : newMember.nickname
				let updated = await Users.updateOne({ user_id: newMember.user.id }, { $set: { username: newNick } })
				if (updated == 1) {
					logger.info(`User ${newMember.user.id} nickname updated! DB updated too.`)
				} else {
					logger.error(`User ${newMember.user.id} nickname updated! DB not updated! Go check what happen.`)
				}
				return
			}

			const userHighestRole = await roleHelper.getHigherRoleByArrayOfRolesID(newMember._roles)
			const newRoleId = userHighestRole ? userHighestRole.id : ""
			const newRoleName = userHighestRole ? userHighestRole.name : ""
			let response = await Users.updateMany(
				{ user_id: newMember.user.id, role_id: { $ne: newRoleId } },
				{ $set: { role_id: newRoleId, role: newRoleName } }
			)

			if (response.modifiedCount > 0) {
				logger.info(`User [${newMember.user.id}] ID [${newMember.user.username}] role updated to [${newRoleName}]`)
			} else {
				logger.error(`User [${newMember.user.id}] ID [${newMember.user.username}] filed/not necessary role update`)
			}
		} catch (err) {
			if (err) logger.error(`User [${newMember.user.id}] ID [${newMember.user.username}] updating/upgrading/dowgrading cause an exception`)
			mainHelper.commonCatch(err, "guildMemberAdd", logger)
			return
		}

	}
}