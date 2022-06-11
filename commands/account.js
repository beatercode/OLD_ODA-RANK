const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const Users = require("../models/Users");
const logger = require("../helper/_logger")
const { getRoleSettingsByValue } = require("../helper/roleHelper")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("account")
        .setDescription("Get information about your ODA Account")
        .addUserOption((option) =>
            option
                .setName("account")
                .setDescription("If specified, ask information about that account")
                .setRequired(false)
        ),
    async execute(interaction) {

        logger.info("[COMMAND] account start "
            + (interaction.options && interaction.options.getUser("account"))
            ? interaction.options.getUser("account").id : "");
        const inputUser = interaction.isButton() ? null : interaction.options.getUser("account")
        const member = interaction.member;
        const targetUser = inputUser ? inputUser : member;
        const targetUserId = inputUser ? targetUser.id : targetUser.user.id;
        const targetUserDb = await Users.findOne({ user_id: targetUserId })
        let roleSettings = await getRoleSettingsByValue('id', targetUserDb.role_id);
        let outputString = '';
        if (inputUser && roleSettings.lvl > 5) {
            let meDb = await Users.findOne({ user_id: member.user.id })
            let meRoleSettings = await getRoleSettingsByValue('id', meDb.role_id);
            if (meRoleSettings.lvl < 6) {
                const roleColor = roleSettings.color;
                outputString = `He is a **${targetUserDb.role}**!`
                outputString += `You cannot have information of a clan member higher than the Samurai level `;
                const accountEmbed = new MessageEmbed()
                    .setColor(roleColor)
                    .setTitle('ODA Clan | Account Info')
                    .setDescription(`<@${targetUserId}>\n${outputString}`)
                interaction.reply({
                    embeds: [accountEmbed],
                    ephemeral: true
                })
                return;
                logger.info("[COMMAND] account end")
            }
        }

        outputString = inputUser
            ? `He is a **${targetUserDb.role}** with **${targetUserDb.points}** ODA points! He invited **${targetUserDb.total_invitation} kyodai** in the Clan!`
            : `You are a **${targetUserDb.role}** with **${targetUserDb.points}** ODA points! You invited **${targetUserDb.total_invitation} kyodai** in the Clan!`;

        const roleColor = roleSettings.color;
        const accountEmbed = new MessageEmbed()
            .setColor(roleColor)
            .setTitle('ODA Clan | Account Info')
            .setDescription(`<@${targetUserId}>\n${outputString}`)
        interaction.reply({
            embeds: [accountEmbed],
            ephemeral: true
        })
        logger.info("[COMMAND] account end")
    }
}
