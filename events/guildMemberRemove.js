const Users = require("../models/Users")
const Invites = require("../models/Invites")
const logger = require("../helper/_logger")
const mainHelper = require("../helper/mainHelper")

module.exports = {
	name: "guildMemberRemove",
	async execute(member) {

		try {
			logger.info("[TRIGGER] guildMemberRemove start")
			const memberId = member.user.id
			const acc = await Users.findOne({ user_id: memberId })
			let inviter = acc && acc.invitedBy ? acc.invitedBy : null
			if (inviter) {
				let inviterId = inviter.inviterId
				let inviterPoints = inviter.inviterPoints

				// cerco l'utente per capire se è in pending
				// se lo trovo lo rimuovo dall'array su DB
				let invitedUserInPending = await Users.updateOne(
					{ user_id: acc.invitedBy.inviterId, pending_invitation: memberId },
					{ $pull: { pending_invitation: memberId } }
				)

				if (invitedUserInPending.modifiedCount > 0) {
					// update eseguito - posso evitare di procedere
				} else {

					let updatedRows = await Users.updateOne(
						{ user_id: acc.invitedBy.inviterId },
						{ $inc: { total_invitation: -1, points: -inviterPoints } }
					)
					
					await Users.updateOne(
						{ user_id: acc.invitedBy.inviterId, monthly_invitation: { $gt: 0 } },
						{ $inc: { monthly_invitation: -1 } }
					)
					await Users.updateOne(
						{ user_id: acc.invitedBy.inviterId, monthly_invitation_current: { $gt: 0 } },
						{ $inc: { monthly_invitation_current: -1 } }
					)

					if (updatedRows.modifiedCount > 0) {
						logger.info(`User id [${memberId}] quit the guild. Inviter id was [${inviterId}]. Points removed from DB`)
					} else {
						logger.info(`User id [${memberId}] quit the guild. Inviter id was [${inviterId}]. Points removed from DB`)
					}

					try {
						updatedRows = await Invites.updateMany({ invitedBy: acc.invitedBy.inviterId, valid: { $gt: 0 } }, { $inc: { valid: -1 } })
					} catch (err) { logger.error(err) }

				}
			} else {
				logger.info(`User id [${member.id}] quit the guild. No inviter to get data from`)
				logger.info(`User id [${member.id}] quit the guild. No inviter to get data from`)
			}

			await Users.deleteOne({ user_id: member.id })
			logger.info(`User id [${member.id}] quit the guild. Delete from DB`)
			logger.info("[TRIGGER] guildMemberRemove end")
		} catch (err) {
			mainHelper.commonCatch(err, "guildMemberRemove", logger)
			return
		}
	}
}