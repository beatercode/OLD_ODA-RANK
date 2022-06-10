const Invites = require("../models/Invites")
const logger = require("../helper/_logger");
const { DBSETTINGS } = require("../helper/databaseHelper");

module.exports = {
    name: "inviteCreate",
    async execute(invite) {

        // Check if invite is delete in ODA Guild
        // Delete the Invite from DB
        const DB_SETTINGS = await DBSETTINGS();
        if (invite.guild.id == DB_SETTINGS.GUILD_ID) {
            logger.info("New invite created - code [" + invite.code + "] from user id [" + invite.inviter.id + "]");
            let newInviteCode = invite.code;
            let newInvite = new Invites({ code: newInviteCode, amount: 0, valid: 0, inviterId: invite.inviter.id })
            let added = await newInvite.save();
            if (added) {
                logger.info(`Invite delete [${newInviteCode}] -> DB updated`)
            } else {
                logger.error(`Invite delete [${newInviteCode}] -> can't update DB`)
            }
        }
    }
}