const { MessageEmbed } = require('discord.js');
const roleHelper = require("../helper/roleHelper")
const Discounts = require("../models/Discounts");
const Users = require("../models/Users");
const { DBCHANNELS, DBROLES, DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {

    async monthlyCheck(client) {

        this.monthlyAdjustRole(client);
        this.defaultMonthlyResets();
    },

    async defaultMonthlyResets() {
        // reset month invite, mult, points
        await Users.updateMany({},
            { $set: { monthly_invitation: 0, multiplier: 1, points: 0 } })
    },

    async monthlyAdjustRole(client) {

        const searchLimit = 0;
        const samuraiBoard = await roleHelper.getBoardByRoleName(searchLimit, "samurai");
        const nokaBoard = await roleHelper.getBoardByRoleName(searchLimit, "noka");
        //const shokuninBoard = await roleHelper.getBoardByRoleName(searchLimit, "shokunin");
        //const shoninBoard = await roleHelper.getBoardByRoleName(searchLimit, "shonin");

        const DB_ROLES = await DBROLES();
        const DB_CHANNELS = await DBCHANNELS();
        const DB_SETTINGS = await DBSETTINGS();

        const shoninPercentage_up = DB_ROLES.shokunin.role_percentage[0];
        const shoninPercentage_down = DB_ROLES.shokunin.role_percentage[1];
        const shokuninPercentage_up = DB_ROLES.shokunin.role_percentage[0];
        const shokuninPercentage_down = DB_ROLES.shokunin.role_percentage[1];
        //const nokaPercentage_down = DB_ROLES.noka.role_percentage[1];
        const nokaPercentage_down = 100;
        const nokaDiscount = DB_ROLES.noka.role_discount;
        const samuraiDiscount = DB_ROLES.samurai.role_discount;
        const nokaFixed_up = nokaDiscount.filter((x) => x === 100).length;

        // DISCOUNT ZONE
        if (DB_SETTINGS.enabled_discount) {
            // SAMURAI add discount to DB an save variable for reply/announcement
            for (const x of samuraiBoard.board) {
                let position = x.position - 1;
                let newDiscount = new Discounts({
                    user_id: x.user_id,
                    discount_percent: samuraiDiscount[position],
                    origin_role: samurai_name,
                });
                await newDiscount.save(err => {
                    if (err) {
                        logger.error("Error saving Discount SAMURAI to db OF [" + user_id + "]");
                        logger.error(err);
                    }
                })
                if (position == 9)
                    break;
            }

            // NOKA add discount to DB an save variable for reply/announcement
            for (const x of nokaBoard.board) {
                let position = x.position - 1;
                let newDiscount = new Discounts({
                    user_id: x.user_id,
                    discount_percent: nokaDiscount[position],
                    origin_role: noka_name,
                });
                await newDiscount.save(err => {
                    if (err) {
                        logger.error("Error saving Discount NOKA to db OF [" + user_id + "]");
                        logger.error(err);
                    }
                })
                if (position == 9)
                    break;
            }
        }

        // UPGRADE DOWNGRADE ZONE
        // mode 0 --> upgrade
        // mode 1 --> downgrade
        let nokaToUpgrade = await roleHelper.
            getUserUpDownByFixedNumber("noka", nokaFixed_up, 0);
        let nokaToDowngrade = await roleHelper
            .getUserUpDownByRolePercentage("noka", nokaPercentage_down, 1);
        let shokuninToUpgrade = await roleHelper
            .getUserUpDownByRolePercentage("shokunin", shokuninPercentage_up, 0);
        let shokuninToDowngrade = await roleHelper
            .getUserUpDownByRolePercentage("shokunin", shokuninPercentage_down, 1);
        let shoninToUpgrade = await roleHelper
            .getUserUpDownByRolePercentage("shonin", shoninPercentage_up, 0);
        let shoninToDowngrade = await roleHelper
            .getUserUpDownByRolePercentage("shonin", shoninPercentage_down, 1);

        // switch do actuale UP/DOWN
        if (DB_SETTINGS.only_view) {
            // ⬇️ NOKA to SHOKUNIN
            if (nokaToDowngrade && nokaToDowngrade.length) {
                let downgradedNokaCount = await Users.updateMany(
                    { _id: { $in: nokaToDowngrade.map(x => x._id) } },
                    { $set: { role_id: DB_ROLES.shokunin.id, role: DB_ROLES.shokunin.name } })
                logger.info(`END OF MONTH - NOKA DOWNGRADED TO SHOKUNIN [${downgradedNokaCount}]`);
                logger.info('-------------------- START LIST --------------------');
                logger.info(nokaToDowngrade.map(x => x._id));
                logger.info('---------------------- END LIST --------------------');
            }

            // ⬇️ SHOKUNIN to SHONIN
            if (shokuninToDowngrade && shokuninToDowngrade.length) {
                let downgradedShokuninCount = await Users.updateMany(
                    { _id: { $in: shokuninToDowngrade.map(x => x._id) } },
                    { $set: { role_id: DB_ROLES.shonin.id, role: DB_ROLES.shonin.name } })
                logger.info(`END OF MONTH - SHOKUNIN DOWNGRADED TO SHONIN [${downgradedShokuninCount}]`);
                logger.info('-------------------- START LIST --------------------');
                logger.info(shokuninToDowngrade.map(x => x._id));
                logger.info('---------------------- END LIST --------------------');
            }

            // ⬇️ SHONIN to HININ
            if (shoninToDowngrade && shoninToDowngrade.length) {
                let downgradedShoninCount = await Users.updateMany(
                    { _id: { $in: shoninToDowngrade.map(x => x._id) } },
                    { $set: { role_id: DB_ROLES.hinin.id, role: DB_ROLES.hinin.name } })
                logger.info(`END OF MONTH - SHONIN DOWNGRADED TO HININ [${downgradedShoninCount}]`);
                logger.info('-------------------- START LIST --------------------');
                logger.info(shoninToDowngrade.map(x => x._id));
                logger.info('---------------------- END LIST --------------------');
            }

            // ⬆️ NOKA to SAMURAI
            if (nokaToUpgrade && nokaToUpgrade.length) {
                let upgradedNokaCount = await Users.updateMany(
                    { _id: { $in: nokaToUpgrade.map(x => x._id) } },
                    { $set: { role_id: DB_ROLES.samurai.id, role: DB_ROLES.samurai.name } })
                logger.info(`END OF MONTH - NOKA UPGRADED TO SAMURAI [${upgradedNokaCount}]`);
                logger.info('-------------------- START LIST --------------------');
                logger.info(nokaToUpgrade.map(x => x._id));
                logger.info('---------------------- END LIST --------------------');
            }

            // ⬆️ SHOKUNIN to NOKA
            if (shokuninToUpgrade && shokuninToUpgrade.length) {
                let upgradedShokuninCount = await Users.updateMany(
                    { _id: { $in: shokuninToUpgrade.map(x => x._id) } },
                    { $set: { role_id: DB_ROLES.noka.id, role: DB_ROLES.noka.name } })
                logger.info(`END OF MONTH - SHOKUNIN UPGRADED TO NOKA [${upgradedShokuninCount}]`);
                logger.info('-------------------- START LIST --------------------');
                logger.info(shokuninToUpgrade.map(x => x._id));
                logger.info('---------------------- END LIST --------------------');
            }

            // ⬆️ SHONIN to SHOKUNIN
            if (shoninToUpgrade && shoninToUpgrade.length) {
                let upgradedShoninCount = await Users.updateMany(
                    { _id: { $in: shoninToUpgrade.map(x => x._id) } },
                    { $set: { role_id: DB_ROLES.shokunin.id, role: DB_ROLES.shokunin.name } })
                logger.info(`END OF MONTH - SHONIN UPGRADED TO SHOKUNIN [${upgradedShoninCount}]`);
                logger.info('-------------------- START LIST --------------------');
                logger.info(shoninToUpgrade.map(x => x._id));
                logger.info('---------------------- END LIST --------------------');
            }

        }

        let finalEmbeds = []
        if (nokaToDowngrade && nokaToDowngrade.length) {
            let downgradedNokaField = '';
            nokaToDowngrade.forEach(x => { downgradedNokaField += `⬇️ **${x.position}** <@${x.user_id}>\n`; });
            let embed = new MessageEmbed()
                .addField("\u200B", downgradedNokaField)
                .setDescription("<@&" + DB_ROLES.noka.id + "> downgraded to <@&" + DB_ROLES.shokunin.id + ">")
            finalEmbeds.push(embed)
        }

        if (shokuninToDowngrade && shokuninToDowngrade.length) {
            let downgradedShokuninField = '';
            shokuninToDowngrade.forEach(x => { downgradedShokuninField += `⬇️ **${x.position}** <@${x.user_id}>\n`; });
            let embed = new MessageEmbed()
                .addField("\u200B", downgradedShokuninField)
                .setDescription("<@&" + DB_ROLES.shokunin.id + "> downgraded to <@&" + DB_ROLES.shonin.id + ">")
            finalEmbeds.push(embed)
        }

        if (shoninToDowngrade && shoninToDowngrade.length) {
            let downgradedShoninField = '';
            shoninToDowngrade.forEach(x => { downgradedShoninField += `⬇️ **${x.position}** <@${x.user_id}>\n`; });
            let embed = new MessageEmbed()
                .addField("\u200B", downgradedShoninField)
                .setDescription("<@&" + DB_ROLES.shonin.id + "> downgraded to <@&" + DB_ROLES.hinin.id + ">")
            finalEmbeds.push(embed)
        }

        if (nokaToUpgrade && nokaToUpgrade.length) {
            let upgradedNokaField = '';
            nokaToUpgrade.forEach(x => { upgradedNokaField += `⬆️ **${x.position}** <@${x.user_id}>\n`; });
            let embed = new MessageEmbed()
                .addField("\u200B", upgradedNokaField)
                .setDescription("<@&" + DB_ROLES.noka.id + "> downgraded to <@&" + DB_ROLES.samurai.id + ">")
            finalEmbeds.push(embed)
        }

        if (shokuninToUpgrade && shokuninToUpgrade.length) {
            let upgradedShokuninField = '';
            shokuninToUpgrade.forEach(x => { upgradedShokuninField += `⬆️ **${x.position}** <@${x.user_id}>\n`; });
            let embed = new MessageEmbed()
                .addField("\u200B", upgradedShokuninField)
                .setDescription("<@&" + DB_ROLES.shokunin.id + "> downgraded to <@&" + DB_ROLES.noka.id + ">")
            finalEmbeds.push(embed)
        }

        if (shoninToUpgrade && shoninToUpgrade.length) {
            let upgradedShoninField = '';
            shoninToUpgrade.forEach(x => { upgradedShoninField += `⬆️ **${x.position}** <@${x.user_id}>\n`; });
            let embed = new MessageEmbed()
                .addField("\u200B", upgradedShoninField)
                .setDescription("<@&" + DB_ROLES.shonin.id + "> downgraded to <@&" + DB_ROLES.shokunin.id + ">")
            finalEmbeds.push(embed)
        }

        const channelAnnouncementsID = DB_CHANNELS.ch_announcements;
        const channelAnnouncements = client.channels.cache.get(channelAnnouncementsID);

        if (finalEmbeds && finalEmbeds.length)
            await channelAnnouncements.send({ embeds: [finalEmbeds] })

    }
}