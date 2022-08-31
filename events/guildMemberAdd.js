const Invites = require("../models/Invites")
const Users = require("../models/Users")
const { DBSETTINGS } = require("../helper/databaseHelper")
const mainHelper = require("../helper/mainHelper")
const logger = require("../helper/_logger")

module.exports = {
	name: "guildMemberAdd",
	async execute(member) {

		try {
			logger.info("[TRIGGER] guildMemberad start")
			const newInvites = await member.guild.invites.fetch()
			let oldInvites = await Invites.find({}, "-_id code amount")
			if (!oldInvites) {
				logger.log("Old invites not found ---> " + oldInvites)
			}
			let invite = null
			try {
				logger.info("---------------------- newInvites (hjS5Qmwfnq) RUN ----------------------")
				//logger.info(newInvites.find(x => x.code === "Xn7PfjmkdC")) //dave hacker
				//logger.info(newInvites.find(x => x.code === "hjS5Qmwfnq"))
				logger.info("---------------------- oldInvites (hjS5Qmwfnq) RUN ----------------------")
				//logger.info(oldInvites.find(x => x.code === "Xn7PfjmkdC")) //dave hacker
				//logger.info(oldInvites.find(x => x.code === "hjS5Qmwfnq"))
				invite = newInvites.find(i => i.uses > oldInvites.find(x => x.code === i.code).amount)
			} catch (err) {
				logger.error("Let's check what happen to this user [" + member.id + "]")
			}
			const inviter = (invite != null && invite.inviter != null) ? invite.inviter : null

			const DB_SETTINGS = await DBSETTINGS()
			let inviterId = ""
			let inviterPoints = 0
			let invitedWithCode = ""

			if (inviter && invite && invite.code) {
				logger.info("[TRIGGER] guildMemberad inviter [" + invite.code + "]")
				invitedWithCode = invite.code
				let updatesInv = await Invites.updateMany({ code: invitedWithCode }, { $inc: { valid: 1, amount: 1 } })
				inviterId = inviter.id

				let inviterUserDb = await Users.findOne({ user_id: inviterId, banned_invitation: { $nin: member.user.id } })
				if (!inviterUserDb) {
					logger.error(`GO CHECK THIS ID [${member.user.id}][${member.user.username}]`)
					logger.error(`HE JOINED THE GUILD WITH INV. LINK [${invite.code}] OF SOMEONE ID [${inviterId}]`)
					logger.error("BUT CAN'T FIND HIS REF ON DB")
					return
				}
				let pointsBonusMul = inviterUserDb.monthly_invitation < 3 ? 2 : 1
				//let pointsBonusOdaInNameMul = inviterUserDb.oda_in_name_bonus ? 1.1 : 1;
				inviterPoints = DB_SETTINGS.INVITATION_POINTS * pointsBonusMul // * pointsBonusOdaInNameMul
				console.log("Points mul: [" + pointsBonusMul + "] - total inviter points: [" + inviterPoints + "]")
				if (updatesInv.modifiedCount > 0) {
					logger.info(`User joined with inv. code [${invitedWithCode}] -> DB updated`)
				} else {
					logger.error(`User joined with inv. code [${invitedWithCode}] -> can't update DB`)
				}

				logger.info("New pending to add")
				let newPending = member.user.id
				let updatesUsr = await Users.updateMany({ user_id: inviter.id },
					{ $push: { pending_invitation: newPending } })

				if (updatesUsr.modifiedCount > 0) {
					logger.info(`User joined with inv. code [${invitedWithCode}] -> inviter point's gived`)
				} else {
					logger.error(`User joined with inv. code [${invitedWithCode}] -> can't update DB`)
				}
			}
			logger.info("[TRIGGER] guildMemberad "
				+ ((inviter && inviter != null && invite.code && invite.code != null) ? " [" + invite.code + "]" : " no inviter"))

			let newUser = new Users({
				user_id: member.user.id,
				username: member.user.username,
				role_id: "",
				role: "",
				points: 0,
				daily: false,
				consecutive_daily: 0,
				pending_invitation: [],
				monthly_invitation: 0,
				monthly_invitation_current: 0,
				monthly_updated: false,
				total_invitation: 0,
				monthly_points_received: 0,
				oda_in_name: true,
				oda_in_name_bonus: false,
				daily_starred: [],
				consecutive_oda: 0,
				invitedBy: {
					inviterId: inviterId,
					inviterPoints: inviterPoints,
					invitedWithCode: invitedWithCode,
				},
			})
			logger.info("[TRIGGER] guildMemberad end")
			await newUser.save(err => {
				if (err) {
					logger.info("[TRIGGER] guildMemberad error")
					logger.info(err)
					logger.error("Error during setup user [" + member.user.username + "]")
					return
				}
			})
		} catch (err) {
			mainHelper.commonCatch(err, "guildMemberAdd", logger)
			return
		}
	}
}