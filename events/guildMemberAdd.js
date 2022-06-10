const Invites = require("../models/Invites")
const Users = require("../models/Users")
const { DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {
	name: "guildMemberAdd",
	async execute(member) {

		const newInvites = await member.guild.invites.fetch();
		let oldInvites = await Invites.find({}, '-_id code amount');
		if (!oldInvites) {
			logger.log("Old invites not found ---> " + oldInvites)
		}
		const invite = newInvites.find(i => i.uses > oldInvites.find(x => x.code === i.code).amount);
		const inviter = (invite != null && invite.inviter != null) ? invite.inviter : null;

		let inviterId = '', inviterPoints = 0;
		let invitedWithCode = "";
		const DB_SETTINGS = await DBSETTINGS();
		if (inviter && invite.code) {
			invitedWithCode = invite.code
			let updatesInv = await Invites.updateMany({ code: invitedWithCode }, { $inc: { valid: 1, amount: 1 } })
			inviterId = inviter.id;
			
			let inviterUserDb = await Users.findOne({ user_id: inviterId});
			let pointsBonusMul = inviterUserDb.monthly_invitation < 3 ? 2 : 1;
			inviterPoints = DB_SETTINGS.INVITATION_POINTS * pointsBonusMul;
			if (updatesInv.modifiedCount > 0) {
				logger.info(`User joined with inv. code [${invitedWithCode}] -> DB updated`)
			} else {
				logger.error(`User joined with inv. code [${invitedWithCode}] -> can't update DB`)
			}

			let updatesUsr = await Users.updateMany({ user_id: inviter.id },
				{ $inc: { points: inviterPoints, monthly_invitation: 1 } })
			if (updatesUsr.modifiedCount > 0) {
				logger.info(`User joined with inv. code [${invitedWithCode}] -> inviter point's fived`)
			} else {
				logger.error(`User joined with inv. code [${invitedWithCode}] -> can't update DB`)
			}
		}

		let newUser = new Users({
			user_id: member.user.id,
			username: member.user.username,
			role_id: "",
			role: "",
			points: 0,
			daily: false,
			consecutive_daily: 0,
			monthly_invitation: 0,
			monthly_points_received: 0,
			multiplier: 1,
			oda_in_name: true,
			oda_in_name_bonus: false,
			consecutive_oda: 0,
			invitedBy: {
				inviterId: inviterId,
				inviterPoints: inviterPoints,
				invitedWithCode: invitedWithCode,
			},
		})
		await newUser.save(err => {
			if (err) {
				console.log(err);
				interaction.reply("Error during setup user [" + member.user.username + "]");
				return;
			}
		})
	}
}