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
					.setAuthor({name: "ODA Clan Board | " + roleName, iconURL: "https://i.imgur.com/1ED6ifg.jpeg" })
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
			let usersUpgradable = null
			let usersDowngradable = null
			if (percentageUp != null) {
				usersUpgradable = percentageUpFixed
					? await roleHelper.getUserUpDownByFixedNumber(role.command, percentageUp, 0)
					: await roleHelper.getUserUpDownByRolePercentageAndDiff(role.command, percentageUp, 0)
				if (usersUpgradable.returnable) {
					let filter = usersUpgradable.returnable.filter(x => x.user_id == myId)
					couldUpgrade = filter.length > 0
				}
			}
			if (percentageDown != null) {
				usersDowngradable = await roleHelper
					.getUserUpDownByRolePercentage(role.command, percentageDown, 1)
				if (usersDowngradable) {
					let filter = usersDowngradable.filter(x => x.user_id == myId)
					couldDowngrade = filter.length > 0
				}
			}

			if (isMyRole) {
				let myPoints = (board.find(x => x.user_id === myId)).points
				if (couldDowngrade && percentageDown != 0) {
					finalDescription += "\n\nYour commitment is not enough; "
                        + "you are in the **worst " + percentageDown + "** of your role. Increase your ODA points or you "
                        + "will be downgraded at the end of the month. ⬇️"
				} else if (couldUpgrade && percentageUp != 0) {
					const topAmount = percentageUpFixed ? percentageUp : (percentageUp + "%")
					finalDescription += "\n\nYou are doing a great job Kyodai! You are in the **top " + topAmount + "**, "
                        + "keep it up and you will be promoted to the next rank at the end of the month!  ⬆️"
				} else {
					const topAmount = percentageUpFixed ? percentageUp : (percentageUp + "%")
					const missPoints = Math.round(usersUpgradable.threshold - myPoints)
					finalDescription += `\n\nHey Kyodai! You are not in the top **${topAmount}%** of your role's board!`
					finalDescription += `\nYou still need to earn **${missPoints}** points if you want to move up to the next level at the end of the month!  ↔️`
				}
			}

			finalDescription = finalDescription == "" ? "Hey Kyodai! Can't find any member at this level." : finalDescription
			let finalEmbed = new MessageEmbed()
				.setAuthor({name: "ODA Clan Board | " + roleName, iconURL: "https://i.imgur.com/1ED6ifg.jpeg" })
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