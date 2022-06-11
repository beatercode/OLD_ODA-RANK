const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const logger = require("../helper/_logger")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("board")
		.setDescription("Get information on ODA Clan Ranking")
		.addRoleOption((option) =>
			option
				.setName("role")
				.setDescription("If specified, filters only the ranking of the chosen role")
				.setRequired(false)
		),
	async execute(interaction) {

		try {
			let { board, myId, roleName, roleColor } = await roleHelper.generateBoard(interaction)
			logger.info("[COMMAND] board start "
                + (interaction.options && interaction.options.getRole("role") ? `[${interaction.options.getRole("role").name}]` : ""))
            
			if (!board) {
				let finalDescription = "Unfortunately, you cannot access the requested board!"
				let finalEmbed = new MessageEmbed()
					.setAuthor("ODA Clan Board | " + roleName, "https://i.imgur.com/1ED6ifg.jpeg")
					.setDescription(finalDescription)
					.setColor(roleColor)

				interaction.reply({ embeds: [finalEmbed], ephemeral: true })
				logger.info("[COMMAND] board end")
				return
			}

			let finalDescription = roleHelper.createBoardMessage(board, myId)
			const role = await roleHelper.getRoleSettingsByValue("name", roleName)
			const isMyRole = interaction.options == null
                || (interaction.options != null
                    && interaction.options.getRole("role") != null
                    && interaction.options.getRole("role").id === (await roleHelper.getHigherRoleByArrayOfRolesID(interaction.member._roles)).id)
			const percentageUp = role.role_percentage[0] || (role.role_discount.filter(x => x === 100)).length
			const percentageUpFixed = !role.role_percentage[0] && (role.role_discount.filter(x => x === 100)).length > 0
			const percentageDown = role.role_percentage[1]

			let couldUpgrade = false
			let couldDowngrade = false
			if (percentageUp != null) {
				let usersUpgradable = percentageUpFixed
					? await roleHelper.getUserUpDownByRolePercentage(role.command, percentageUp, 0)
					: await roleHelper.getUserUpDownByFixedNumber(role.command, percentageUpFixed, 0)
				if (usersUpgradable) {
					let filter = usersUpgradable.filter(x => x.user_id == myId)
					couldUpgrade = filter.length > 0
				}
			}
			if (percentageDown != null) {
				let usersDowngradable = await roleHelper
					.getUserUpDownByRolePercentage(role.command, percentageDown, 1)
				if (usersDowngradable) {
					let filter = usersDowngradable.filter(x => x.user_id == myId)
					couldDowngrade = filter.length > 0
				}
			}

			if (isMyRole) {
				if (couldDowngrade && percentageDown != 0) {
					finalDescription += "\n\n**Your commitment is not enough; "
                        + "you are in the worst " + percentageDown + " of your role. Increase your ODA points or you "
                        + "will be downgraded at the end of the month**"
				} else if (couldUpgrade && percentageUp != 0) {
					let topAmount = percentageUpFixed ? percentageUp : (percentageUp + "%")
					finalDescription += "\n\n**You are doing a great job Kyodai! You are in the top " + topAmount + ", "
                        + "keep it up and you will be promoted to the next rank at the end of the month!**"
				}
				const { myTopPosition, myTopPercentage } = await roleHelper.getUserUpDownMyPosition(role.id, myId)
				const formatterPercentage = Math.round(100 - myTopPercentage)
				finalDescription += `\n\nYou are the ${myTopPosition}° in your role's board!`
				finalDescription += `\nYou are better than ${formatterPercentage}% of your role's kyodai!`
			}

			finalDescription = finalDescription == "" ? "Hey Kyodai! Can't find any member at this level." : finalDescription
			let finalEmbed = new MessageEmbed()
				.setAuthor("ODA Clan Board | " + roleName, "https://i.imgur.com/1ED6ifg.jpeg")
				.setDescription(finalDescription)
				.setColor(roleColor)

			interaction.reply({ embeds: [finalEmbed], ephemeral: true })
			logger.info("[COMMAND] board end")
		} catch (err) {
			mainHelper.commonCatch(err, "board", logger)
			return
		}
	}
}