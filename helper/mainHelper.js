const { DBROLES, DBSETTINGS } = require("../helper/databaseHelper")
const config = require("../backup/config.json");

module.exports = {

    async isAdminAccount(inMember) {
        const DB_SETTINGS = config.Settings.values;
        let memberRolesID = inMember._roles;
        let settings = await DBROLES();
        let adminsRoleName = DB_SETTINGS.ADMIN_NAMES;
        let isAdmin = Object.values(settings)
            .filter(x => adminsRoleName
                .some(el => x.command === el))
            .map(x => x.id)
            .some(x => memberRolesID.includes(x))
        return isAdmin;
    },

    async getMemberFromId(client, id) {
        const DB_SETTINGS = config.Settings.values;
        let guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID);
        let member = guild.members.cache.get(id);
        return member;
    },

    async logOnServer(client, msg) {
        const DB_CHANNEL = config.Channels.values;
        const DB_SETTINGS = config.Settings.values;
        if(!DB_SETTINGS.enabled_ds_log) return;
        const chatChannel = client.channels.cache.get(DB_CHANNEL.ch_bot_feedback);
        chatChannel.send(msg)
    }

}