const logger = require("../helper/_logger")
const { EmbedBuilder } = require("discord.js")
const Users = require("../models/Users")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const hyper = require("../helper/hyper")

module.exports = {
	name: "guildMemberUpdate",
	async execute(oldMember, newMember, commands, client) {

		try {
			if (newMember.nickname !== oldMember.nickname || newMember.user.username != oldMember.user.username) {
				/*
				if (newMember.premiumSince || oldMember.premiumSince) {
					logger.info(oldMember.nickname ? oldMember.nickname : oldMember.user.username 
						+ " has Nitro anche will change nick to [" + newMember.nickname + "]!")
				} else {
					if (newMember.nickname !== null) {
						newMember.setNickname(null)
					}
				}
				*/
				let newNick = !newMember.nickname ? newMember.user.username : newMember.nickname
				let updated = await Users.updateOne({ user_id: newMember.user.id }, { $set: { username: newNick } })
				if (updated.modifiedCount == 1) {
					logger.info(`User ${newMember.user.id} nickname updated! DB updated too.`)
				} else {
					logger.error(`User ${newMember.user.id} nickname updated! DB not updated! Go check what happen.`)
				}
				return
			}

			const userHighestRole = await roleHelper.getHigherRoleByArrayOfRolesID(newMember._roles)
			const newRoleId = userHighestRole ? userHighestRole.id : ""
			const newRoleName = userHighestRole ? userHighestRole.name : ""
			let response = await Users.updateMany(
				{ user_id: newMember.user.id, role_id: { $ne: newRoleId } },
				{ $set: { role_id: newRoleId, role: newRoleName } }
			)

			const isNewShonin = userHighestRole.command == "shonin"
			const newMemberDb = await Users.findOne({ user_id: newMember.user.id })
			// console.log("The highest role of [" + newMember.user.username + "] (which is now a [" + userHighestRole.command + "]) is shonin? [" + isNewShonin + "]")

			if (isNewShonin && newMemberDb.invitedBy.inviterId != "") {

				let inviterUser = await Users.findOne({ user_id: newMemberDb.invitedBy.inviterId })
				const yetBanned = inviterUser.banned_invitation.includes(newMember.user.id)
				console.log("Inviter yet updated? [" + yetBanned + "]")

				if (!yetBanned) {

					await Users.updateOne(
						{ user_id: inviterUser.user_id },
						{
							$pull: { pending_invitation: newMember.user.id },
							$push: { banned_invitation: newMember.user.id },
							$inc: { points: newMemberDb.invitedBy.inviterPoints, monthly_invitation: 1, monthly_invitation_current: 1, total_invitation: 1 }
						}
					)

					let isUserMonthInvitationCriteria = await roleHelper.isUserMonthInvitationCriteria(inviterUser)
					console.log("Inviter user role: " + inviterUser.role)
					let roleSettings = await roleHelper.getRoleSettingsByValue("name", inviterUser.role)
					let roleName = roleSettings.command

					if (roleName == "shonin" || roleName == "shokunin") {

						logger.info("isShonin or isShokunin")
						logger.info("Check raggiungimento criterio upgrade [" + isUserMonthInvitationCriteria + "]")

						if (isUserMonthInvitationCriteria) {
							await Users.updateOne(
								{ user_id: inviterUser.user_id },
								{ $set: { monthly_invitation_current: 0, monthly_updated: true } }
							)

							let res = await roleHelper.upgrade_db(inviterUser)
							if (res != 0) {
								logger.info("ERROR! GO AND CHECK [" + inviterUser.user_id + "]")
								logger.info("THIS USER SHOULD HAVE BEEN UPDATED")
							} else {
								await roleHelper.upgrade_discord(client, inviterUser)
								logger.info("Preparazione invio messaggio in chat di provenienza [" + roleName + "]")

								let targetChannel = client.channels.cache.get(roleSettings.chat_channel_id)
								let nextRole = await this.getRoleSettingsByValue("lvl", (+roleSettings.lvl + 1))

								let outputString = roleName == "shonin"
									? `Congratulations <@${inviterUser.user_id}>, you showed your value and helped to grow our Clan by successfully inviting 2 Kyodai into the Server. You earned the promotion to <@&${nextRole.id}>.`
									: `Congratulations <@${inviterUser.user_id}>, you added great value to our Clan by successfully inviting 5 Kyodai into the Server. You earned the promotion to <@&${nextRole.id}>.`
								const messageToSend = new EmbedBuilder()
									.setColor(roleSettings.color)
									.setTitle("ODA Upgrade")
									.setDescription(outputString)
								await targetChannel.send({ embeds: [messageToSend] })
							}
						}

					} else if (roleName == "noka") {

						logger.info("isNoka")
						logger.info("Check raggiungimento criterio upgrade [" + isUserMonthInvitationCriteria + "]")

						if (isUserMonthInvitationCriteria) {
							await Users.updateOne(
								{ user_id: inviterUser.user_id },
								{ $set: { monthly_invitation_current: 0 } }
							)
							logger.info("Preparazione invio messaggio in chat noka")

							let targetChannel = client.channels.cache.get(roleSettings.chat_channel_id)
							let nextRole = await this.getRoleSettingsByValue("lvl", (+roleSettings.lvl + 1))

							let outputString = `Congratulations <@${inviterUser.user_id}>, you showed true passion and commitment by inviting 10 Kyodai into the Server. You earned the promotion to <@&${nextRole.id}>, open a ticket to claim your free subscription.`
							const messageToSend = new EmbedBuilder()
								.setColor(roleSettings.color)
								.setTitle("ODA Upgrade")
								.setDescription(outputString)
							await targetChannel.send({ embeds: [messageToSend] })
						}

					} else if (roleName == "samurai") {

						logger.info("isSamurai")
						let criteria = await roleHelper.getInvitationCriteriaByRole(roleName)
						let hoursToAdd = criteria.extension_hours
						let msToAdd = hoursToAdd * 60 * 60 * 1000

						logger.info("Aggiungere " + msToAdd + " alla durata della licenza")
						let extendResult = await hyper.extendLicence(inviterUser, msToAdd)

						if (extendResult == 0) {
							let targetChannel = client.channels.cache.get(roleSettings.chat_channel_id)
							await targetChannel.send(`Congratulations <@${inviterUser.user_id}>, you gained ${hoursToAdd} hours to your subriction as you invited a new Kyodai!`)
						} else {
							logger.info("Error during extend - check this user id [" + inviterUser.user_id + "]")
							console.log("Error during extend - check this user id [" + inviterUser.user_id + "]")
						}
					}
				}

			}

			if (response.modifiedCount > 0) {
				logger.info(`User [${newMember.user.id}] ID [${newMember.user.username}] role updated to [${newRoleName}]`)
			} else {
				logger.error(`User [${newMember.user.id}] ID [${newMember.user.username}] filed/not necessary role update`)
			}
		} catch (err) {
			if (err) logger.error(`User [${newMember.user.id}] ID [${newMember.user.username}] updating/upgrading/dowgrading cause an exception`)
			mainHelper.commonCatch(err, "guildMemberAdd", logger)
			return
		}

	}
}