const { Collection } = require('discord.js')
const Invites = require("../models/Invites")
const OdaSwitch = require("../models/OdaSwitch")
const logger = require('../helper/_logger')
const config = require("../backup/config.json");
const old_user = require("../old_user.json");
const Users = require("../models/Users");

module.exports = {

    async saveInvitesToDb(client) {

        const DB_SETTINGS = config.Settings.values;
        const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID);
        const firstInvites = await guild.invites.fetch();
        let checkInvites = new Collection();
        checkInvites.set(DB_SETTINGS.GUILD_ID, new Collection(firstInvites.map((invite) => [invite.code, invite.uses])));
        checkInvites = checkInvites.get(DB_SETTINGS.GUILD_ID)
        checkInvites = [...checkInvites].map(([code, amount]) => ({ code, amount }));

        Invites.bulkWrite(
            checkInvites.map((invite) => ({
                updateOne: {
                    filter: { code: invite.code },
                    update: { $set: invite },
                    upsert: true
                }
            }))
        );

    },

    async setOdaDb(tab, newValue) {
        await OdaSwitch.findOneAndUpdate({ name: tab }, newValue, { upsert: true })
            .catch(err => {
                logger.error("Errore nell'update/setup del DB - [" + tab + "]");
                logger.error(err);
            })
    },

    async DBCHANNELS() {
        //await this.getOdaDb("Channels");
        let res = await OdaSwitch.findOne({ name: "Channels" }, '-_id values');

        if (!res) {
            logger.error("Error in db query [" + "Channels" + "]");
            logger.error(err);
        }
        return res.values ? res.values : null
    },

    async DBROLES() {
        //await this.getOdaDb("Roles");
        let res = await OdaSwitch.findOne({ name: "Roles" }, '-_id values');

        if (!res) {
            logger.error("Error in db query [" + "Roles" + "]");
            logger.error(err);
        }
        return res.values ? res.values : null
    },

    async DBSETTINGS() {
        //return await this.getOdaDb("Settings");
        let res = await OdaSwitch.findOne({ name: "Settings" }, '-_id values');

        if (!res) {
            logger.error("Error in db query [" + "Settings" + "]");
            logger.error(err);
        }
        return res.values ? res.values : null
    },

    async DBUSERDUMMY() {
        //return await this.getOdaDb("Settings");
        let res = await OdaSwitch.findOne({ name: "UserDummy" }, '-_id values');

        if (!res) {
            logger.error("Error in db query [" + "Settings" + "]");
            logger.error(err);
        }
        return res.values ? res.values : null
    },

    async getOdaDb(tab) {
        let res = await OdaSwitch.findOne({ name: tab }, '-_id values');

        if (!res) {
            logger.error("Error in db query [" + tab + "]");
            logger.error(err);
        }
        return res.values ? res.values : null
    },

    async moveUsersPoints() {
        let json = old_user;
        let allUsers = await Users.find({})
        allUsers.forEach(x => {
            x.points = json[x.user_id].points
        })
        let toUpdate = allUsers.filter(x => x.points > 0);

        var updates = [];
        toUpdate.forEach(function (item) {
            var updatePromise = Users.update({ user_id: item.user_id }, { "$set": { points: item.points } });
            updates.push(updatePromise);
        });

        Promise.all(updates).then(function (results) {
        });
    },

    async odaNameDiffChecker(client) {

        const DB_SETTINGS = config.Settings.values;
        const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID);
        let members = await guild.members.fetch();
        members.forEach(x => {
            if(x.premiumSince) {
                console.log(x.user.username + " has a nitro account");
            }
            if(x.nickname != null && x.nickname != x.user.username) {
                console.log("Nickname [" + x.nickname + "] Username [" + x.user.username + "]");
            }
        })
    }

}