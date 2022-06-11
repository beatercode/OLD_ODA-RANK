const { Collection } = require('discord.js')
const Invites = require("../models/Invites")
const OdaSwitch = require("../models/OdaSwitch")
const logger = require('../helper/_logger')
const config = require("../backup/config.json");
const old_user = require("../old_user.json");
const Users = require("../models/Users");
const USERS = require("../models/Users")

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

    async moveUsersData() {
        let json = old_user;
        let allUsers = await Users.find({})

        allUsers.forEach(x => {
            let curUser = json[x.user_id]
            x.points = curUser.points
            x.consecutive_daily = curUser.consecutive_daily
            x.monthly_invitation = curUser.monthly_invitation
            x.oda_in_name = curUser.oda_in_name
            x.consecutive_oda = curUser.consecutive_oda
            x.invited_by = curUser.invited_by
            /*
            console.log(x.user_id + " points [" + x.points + "] daily [" + x.consecutive_daily + "]"
                .concat("monthly_invitation [" + x.monthly_invitation + "] ")
                .concat("oda_in_name [" + x.oda_in_name + "] ")
                .concat("consecutive_oda [" + x.consecutive_oda + "] ")
                .concat("invited_by [" + x.invited_by[0] + "][" + x.invited_by[1] + "]"))
                */
        })

        var updates = [];
        allUsers.forEach(function (item) {
            var updatePromise = Users.updateMany(
                { user_id: item.user_id },
                {
                    "$set": {
                        points: item.points,
                        consecutive_daily: item.consecutive_daily,
                        monthly_invitation: item.monthly_invitation,
                        total_invitation: item.monthly_invitation,
                        oda_in_name: item.oda_in_name,
                        consecutive_oda: item.consecutive_oda,
                        invited_by: item.invited_by,
                    }
                }
            );
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
            if (x.premiumSince) {
                console.log(x.user.username + " has a nitro account");
                console.log("his nick ---> " + x.nickname);
                if (!x.nickname || x.nickname.includes("| ODA Clan")) { } else {
                    x.setNickname(x.user.username + " | ODA Clan");
                }
            }
            /* if (x.nickname != null && x.nickname != x.user.username) {
                console.log("Nickname [" + x.nickname + "] Username [" + x.user.username + "]");
            } */
        })
    },

    async checkReactCount(client) {
        //const DB_CHANNELS = await this.DBCHANNELS();
        //const CH_LIST_REACTIONS = DB_CHANNELS.ch_list_reactions;
        const ch = "961195520032919552";
        const msgid = "979087412024184832";
        const channel = client.channels.cache.get(ch);
        const message = await channel.messages.fetch(msgid);

        const userReactions = message.reactions.cache.map(reaction => reaction.users);

        console.log(userReactions)
    },

    async checkDailyCount(client) {
        //const DB_CHANNELS = await this.DBCHANNELS();
        let tocheck = "Congratulations! You gain";
        let channelId = "978287858773282876";
        let msgId = "980954810545209402";
        let channel = await client.channels.cache.get(channelId);

        channel.messages.fetch(msgId)
            .then(message => console.log(message.reactions.users.cache.get()));

        return;

        //let messages = await client.channels.cache.get(channelId).messages.fetch({ limit: 5000 })
        let messages = await this.lots_of_messages_getter(channel, 200)
        let ar = []
        for (const x of messages) {
            if (x[1].content.startsWith(tocheck)) {
                let time = new Date(x[1].createdTimestamp)
                let userId = x[0]
                let a = { userId: userId, time: time }
                ar.push(a)
            }
        }

        const groupsDate = ar.reduce((groupsDate, item) => {
            const date = this.toYYYYMMFF(item.time)
            if (!groupsDate[date]) {
                groupsDate[date] = [];
            }
            groupsDate[date].push(item.userId);
            return groupsDate;
        }, {});

        const groupArrays = Object.keys(groupsDate).map((date) => {
            return {
                date,
                users: groupsDate[date]
            };
        });

        console.log(groupArrays)
    },

    toYYYYMMFF(date) {
        var x = date
        var y = x.getFullYear().toString();
        var m = (x.getMonth() + 1).toString();
        var d = x.getDate().toString();
        (d.length == 1) && (d = '0' + d);
        (m.length == 1) && (m = '0' + m);
        var yyyymmdd = y + "-" + m + "-" + d;
        return yyyymmdd;
    },

    async lots_of_messages_getter(channel, limit = 500) {
        const sum_messages = [];
        let last_id;
        while (true) {
            const options = { limit: 100 };
            if (last_id) {
                options.before = last_id;
            }
            const messages = await channel.messages.fetch(options);
            sum_messages.push(messages);
            last_id = messages.last().id;
            if (messages.size != 100 || sum_messages >= limit) {
                break;
            }
        }
        return sum_messages;
    }

}