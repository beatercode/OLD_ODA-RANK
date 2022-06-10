const Invites = require("../models/Invites")
const logger = require("../helper/_logger")
const { DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {
    name: "inviteDelete",
    async execute(invite) {

        // Check if invite is delete in ODA Guild
        // Delete the Invite from DB
        const DB_SETTINGS = await DBSETTINGS();
        if (invite.guild.id == DB_SETTINGS.GUILD_ID) {
            logger.info("New invite deleted - code [" + invite.code + "] ");
            let removed = await Invites.deleteOne({ code: invite.code })
            if (removed.modifiedCount > 0) {
                logger.info(`Invite delete [${invite.code}] -> DB updated`)
            } else {
                logger.error(`Invite delete [${invite.code}] -> can't update DB`)
            }
        }
    }
}