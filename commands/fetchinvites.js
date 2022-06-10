const { SlashCommandBuilder } = require("@discordjs/builders");
const mainHelper = require("../helper/mainHelper");
const { getMemberFromId } = require('../helper/mainHelper');
const { saveInvitesToDb } = require('../helper/databaseHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fetchinvites")
        .setDescription("[ADMIN] Fetch ODA Guild invites and save them to DB")
        .setDefaultPermission(true),
    async execute(interaction) {

        // this interaction is a Message object
        const member = await getMemberFromId(interaction.client, interaction.author.id)

        let isAdmin = await mainHelper.isAdminAccount(member);
        if (!isAdmin) {
            interaction.reply({ content: "Only admin can use this command", ephemeral: true });
            return
        }
        
        const client = interaction.client;
        saveInvitesToDb(client);

        interaction.reply({
            content: "Invites fetched & Database updated",
            ephemeral: true
        })

    }
}
