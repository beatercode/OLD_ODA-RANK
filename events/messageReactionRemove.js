const Users = require("../models/Users");
const logger = require("../helper/_logger")
const { DBCHANNELS, DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {
    name: "messageReactionRemove",
    async execute(reaction, user) {

        try {

            const DB_CHANNELS = await DBCHANNELS();
            const DB_SETTINGS = await DBSETTINGS();
            let reactionChannels = DB_CHANNELS.ch_list_reactions;
            let reactedChannel = reaction.message.channelId;

            if (reactionChannels.includes(reactedChannel) && !user.bot) {
                let inUser = await Users.findOne({ user_id: user.id });
                if (!inUser) { return }
                //let pointsBonusOdaInNameMul = inUser.oda_in_name_bonus ? 1.1 : 1;
                let deservedPoints = DB_SETTINGS.REACTION_POINTS; // * pointsBonusOdaInNameMul
                let res = await Users.updateMany({ user_id: user.id }, { $inc: { points: -deservedPoints } })
                if (res.modifiedCount > 0) {
                    logger.debug(`${user.username} just removed reaction to message id [${reaction.message.id}]`)
                } else {
                    logger.error(`${user.username} just removed reaction to message id [${reaction.message.id}] WITHOUT UPDATING DB`)
                }
            }
        } catch (err) {
            if (err) {
                logger.error(`ERROR ON ${user.username} remove reaction to message id [${reaction.message.id}]`)
                logger.error(err)
            }
        }
    }
}