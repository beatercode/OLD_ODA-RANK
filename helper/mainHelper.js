const { DBROLES, DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {

    async isAdminAccount(inMember) {
        const DB_SETTINGS = await DBSETTINGS();
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
        const DB_SETTINGS = await DBSETTINGS();
        let guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID);
        let member = guild.members.cache.get(id);
        return member;
    }

}