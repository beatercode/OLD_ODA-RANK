const { SlashCommandBuilder } = require("@discordjs/builders")
const { EmbedBuilder } = require("discord.js")
const Users = require("../models/Users")
const logger = require("../helper/_logger")
const mainHelper = require("../helper/mainHelper")
const { getRoleSettingsByValue } = require("../helper/roleHelper")
const roleHelper = require("../helper/roleHelper")

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

		try {
			const inputUser = interaction.isButton() || !interaction.options ? null : interaction.options.getUser("account")
			const member = interaction.member
			const targetUser = inputUser ? inputUser : member
			const targetUserId = inputUser ? targetUser.id : targetUser.user.id
			logger.info("[COMMAND] account start - inpect " + targetUserId)
			const targetUserDb = await Users.findOne({ user_id: targetUserId })
			let roleSettings = await getRoleSettingsByValue("id", targetUserDb.role_id)
			let outputString = ""
			if (inputUser && roleSettings.lvl > 5) {
				let meDb = await Users.findOne({ user_id: member.user.id })
				let meRoleSettings = await getRoleSettingsByValue("id", meDb.role_id)
				if (meRoleSettings.lvl < 6) {
					const roleColor = roleSettings.color
					outputString = `He is a **${targetUserDb.role}**!`
					outputString += "You cannot have information of a clan member higher than the Samurai level "
					const accountEmbed = new EmbedBuilder()
						.setColor(roleColor)
						.setTitle("ODA Clan | Account Info")
						.setDescription(`<@${targetUserId}>\n${outputString}`)
					interaction.reply({
						embeds: [accountEmbed],
						ephemeral: true
					})
					logger.info("[COMMAND] account end")
					return
				}
			}

			outputString = inputUser
				? `He is a **${targetUserDb.role}** with **${targetUserDb.points}** ODA points! He invited **${targetUserDb.total_invitation} kyodai** in the Clan!`
				: `You are a **${targetUserDb.role}** with **${targetUserDb.points}** ODA points! You invited **${targetUserDb.total_invitation} kyodai** in the Clan!`
				
			let haveOneInvThisMonth = targetUserDb.monthly_invitation_current > 0

			let roleName = (await roleHelper.getRoleSettingsByValue("name", targetUserDb.role)).command
			let criteria = await roleHelper.getInvitationCriteriaByRole(roleName)

			let isCriteriaValid = criteria != undefined && criteria.upgrade != null
			let criteriaUpgrade = isCriteriaValid ? criteria.upgrade : null
			let criteriaDowngrade = isCriteriaValid ? criteria.downgrade : 0

			let criteriaEmoji = criteriaUpgrade == null 
				? "➡️" 
				: targetUserDb.monthly_invitation_current >= criteriaUpgrade 
				? "⬆️" 
				: targetUserDb.monthly_invitation_current < criteriaDowngrade
				? "⬇️"
				: "➡️"

			let stringTargetVar = criteriaUpgrade == null ? "Not necessary" : `${targetUserDb.monthly_invitation_current} / ${criteriaUpgrade}`

			let emojiDailyClaim = targetUserDb.daily ? "✅" : "❌"
			let textDailyClaim = targetUserDb.daily ? "Done" : "To do"

			let textRole = targetUserDb.role
			let level = textRole.substring(textRole.indexOf("Lvl.") + 4, textRole.length)
			try {
				level = parseInt(level)
			} catch (err) { logger.error("Error in taking INT lvl from role text") }
			
			const lvlEmoji =  level == 2 
				? "<:LV2:987264729967910942>" : level == 3 
					? "<:LV3:987264729967910942>" : level == 4 
						? "<:LV4:987264732744540210>" : level == 5 
							? "<:LV5:987264734942330911>" : level == 6 
								? "<:LV6:987264736976588811>" : level == 7 
									? "<:LV7:987264738322960454>" : ""
			
			outputString =  `🥋 **Account**: <@${targetUserId}>\n\n`
			outputString += `${lvlEmoji} **Level**: <@&${targetUserDb.role_id}>\n\n`
			outputString += `📈 **Points**: ${targetUserDb.points}\n\n`
			outputString += `${emojiDailyClaim} **Today Claim**: ${textDailyClaim}\n\n`
			outputString += `${criteriaEmoji} **Target Invitation**: ${stringTargetVar}\n\n`
			outputString += `🚀 **Daily Streak**: ${targetUserDb.consecutive_daily}\n\n`
			outputString += `⛳️ **Total Daily**: ${targetUserDb.total_daily}\n\n`
			outputString += `🎯 **Monthly Invitation**: ${targetUserDb.monthly_invitation}\n\n`
			outputString += `💯 **Total Invitation**: ${targetUserDb.total_invitation}\n\n`

			const roleColor = roleSettings.color
			const accountEmbed = new EmbedBuilder()
				.setColor(roleColor)
				.setTitle("ODA Clan | Account Info")
				.setDescription(`${outputString}`)
			interaction.reply({
				embeds: [accountEmbed],
				ephemeral: true
			})
			logger.info("[COMMAND] account end")
		} catch (err) {
			mainHelper.commonCatch(err, "account", logger)
			return
		}
	}
}
