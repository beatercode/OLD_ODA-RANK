const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const Users = require("../models/Users");
const roleHelper = require("../helper/roleHelper");
const { DBSETTINGS } = require("../helper/databaseHelper");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("claimdaily")
        .setDescription("Claim your daily points!"),
    async execute(interaction) {

        try {
            const member = interaction.member;
            let roleSettings = null;
            let currentUser = await Users.findOne({ user_id: member.id });
            if (!currentUser) {
                let outputString = `I don't know you Kyodai 😥 Go open a ticket`;
                const accountEmbed = new MessageEmbed()
                    .setTitle('ODA Clan | Claim Info')
                    .setDescription(`${outputString}`)
                interaction.reply({
                    embeds: [accountEmbed],
                    ephemeral: true
                })
                return
            }

            const DB_SETTINGS = await DBSETTINGS();
            let bonusMul = currentUser.oda_in_name_bonus ? 1.1 : 1;
            let deservedPoints = Math.round(DB_SETTINGS.DAILY_POINTS * currentUser.multiplier * bonusMul);
            let nextMult = currentUser.multiplier * (1 + (DB_SETTINGS.MULT_PERCENTAGE / 100));

            let res = await Users.updateOne(
                { user_id: member.id, daily: false },
                {
                    daily: true,
                    multiplier: nextMult,
                    $inc: {
                        consecutive_daily: 1,
                        points: deservedPoints
                    }
                });

            let msgOutput = res.modifiedCount > 0
                ? "Daily points claimed succesfully!"
                : "Already claimed! Come claim tomorrow!";
            roleSettings = await roleHelper.getHigherRoleByArrayOfRolesID(member._roles);
            const claimEmbed = new MessageEmbed()
                .setColor(roleSettings.color)
                .setTitle('Daily claim')
                .setDescription(msgOutput)
            interaction.reply({
                embeds: [claimEmbed],
                ephemeral: true
            })
            if (res.modifiedCount > 0) {
                if (["daimyo", "tenno"].includes(roleSettings.command)) {
                    return;
                }
                const chatChannel = interaction.client.channels.cache.get(roleSettings.chat_channel_id);
                // add points
                let outputString = `<@${member.id}> just claimed **${deservedPoints}** daily points! You are in a **${(currentUser.consecutive_daily + 1)}** days streak!`;
                //chatChannel.send(outputString)

                const claimEmbed = new MessageEmbed()
                    .setColor(roleSettings.color)
                    .setTitle('Daily claim')
                    .setDescription(outputString)
                await chatChannel.send({
                    embeds: [claimEmbed]
                })//.then(async msg => { await msg.react('🔥') })
            }

        } catch (err) {
            if (err) {
                logger.error(`ERROR SOMEWHERE ON [claimdaily] - check error and go fix`)
                logger.error(err)
            }
        }
    }
}
