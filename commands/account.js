const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const Users = require("../models/Users");
const roleHelper = require("../helper/roleHelper")
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

        // gestire account richiesto [ NO DAYMIO e NO TENNO ]
        const inputUser = interaction.isButton() ? null : interaction.options.getUser("account")
        const member = interaction.member;
        const targetUser = inputUser ? inputUser : member;
        const targetUserId = inputUser ? targetUser.id : targetUser.user.id;
        const targetUserDb = await Users.findOne({ user_id: targetUserId })
        let roleSettings = await getRoleSettingsByValue('id', targetUserDb.role_id);
        if (inputUser && roleSettings.lvl > 5) {
            let meDb = await Users.findOne({ user_id: member.user.id })
            let meRoleSettings = await getRoleSettingsByValue('id', meDb.role_id);
            if (meRoleSettings.lvl < 6) {
                const roleColor = roleSettings.color;
                let outputString = `He is a **${targetUserDb.role}**! You cannot have information of a clan member higher than the Samurai level `;
                const accountEmbed = new MessageEmbed()
                    .setColor(roleColor)
                    .setTitle('ODA Clan | Account Info')
                    .setDescription(`<@${targetUserId}>\n${outputString}`)
                interaction.reply({
                    embeds: [accountEmbed],
                    ephemeral: true
                })
                return;
            }
        }

        let outputString = inputUser
            ? `He is a **${targetUserDb.role}** with **${targetUserDb.points}** ODA points! He invited **${targetUserDb.monthly_invitation} kyodai** this month!`
            : `You are a **${targetUserDb.role}** with **${targetUserDb.points}** ODA points! You invited **${targetUserDb.monthly_invitation} kyodai** this month!`;
            
        const roleColor = roleSettings.color;
        const accountEmbed = new MessageEmbed()
            .setColor(roleColor)
            .setTitle('ODA Clan | Account Info')
            .setDescription(`<@${targetUserId}>\n${outputString}`)
        interaction.reply({
            embeds: [accountEmbed],
            ephemeral: true
        })
    }
}
