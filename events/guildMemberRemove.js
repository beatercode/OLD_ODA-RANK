const Users = require("../models/Users");
const Invites = require("../models/Invites");

module.exports = {
	name: "guildMemberRemove",
	async execute(member) {

		const memberId = member.user.id;
		const acc = await Users.findOne({ user_id: memberId });
		let inviter = acc && acc.invitedBy ? acc.invitedBy : null;
		if (inviter) {
			let inviterId = inviter.inviterId;
			let inviterPoints = inviter.inviterPoints;
			let updatedRows = await Users.updateOne(
				{ user_id: acc.invitedBy.inviterId },
				{ $inc: { monthly_invitation: -1, points: -inviterPoints } }
			);
			if (updatedRows.modifiedCount > 0) {
				logger.info(`User id [${memberId}] quit the guild. Inviter id was [${inviterId}]. Points removed from DB`);
			} else {
				logger.info(`User id [${memberId}] quit the guild. Inviter id was [${inviterId}]. Points removed from DB`);
			}

			try {
				updatedRows = await Invites.updateMany({ invitedBy: acc.invitedBy.inviterId }, { $inc: { valid: -1 } })
			} catch (err) { logger.error(err) }
		} else {
			logger.info(`User id [${member.id}] quit the guild. No inviter to get data from`);
		}

		let deleteRows = await Users.deleteOne({ user_id: member.id });
		logger.info(`User id [${member.id}] quit the guild. Delete from DB`);
	}
}