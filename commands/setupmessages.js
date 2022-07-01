const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const mainHelper = require("../helper/mainHelper")
const updateLeaderboard = require("../helper/updateLeaderboard")
const logger = require("../helper/_logger")
const { DBCHANNELS } = require("../helper/databaseHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setupmessages")
		.setDescription("[ADMIN] Setup & Refactor default messages / box")
	,
	async execute(interaction) {

		try {
			logger.info("[COMMAND] setupmessages start")
			const member = interaction.member

			let isAdmin = await mainHelper.isAdminAccount(member)
			if (!isAdmin) {
				interaction.reply({ content: "Only admin can use this command", ephemeral: true })
				return
			}

			const client = interaction.client
			await client.guilds.fetch()

			const DB_CHANNELS = await DBCHANNELS()
			const channelRankID = DB_CHANNELS.ch_rank
			const channelDebugID = DB_CHANNELS.ch_moderazione
			const channelRank = client.channels.cache.get(channelRankID)
			console.log(channelRankID)
			const channelDebug = client.channels.cache.get(channelDebugID)

			let isRankPresent = false
			await channelRank.messages.fetch({ limit: 1 }).then(messages => {
				if (messages.first() != undefined && (messages.first()).embeds[0] != undefined
                    && (messages.first()).embeds[0].title != undefined) {
					let lastMsgTitle = (messages.first()).embeds[0].title
					if (lastMsgTitle === "ODA Clan Points Manager") {
						isRankPresent = true
					}
				}
			}).catch(console.error)

			let isModPresent = false
			await channelDebug.messages.fetch({ limit: 1 }).then(messages => {
				if (messages.first() != undefined && (messages.first()).embeds[0] != undefined
                    && (messages.first()).embeds[0].title != undefined) {
					let lastMsgTitle = (messages.first()).embeds[0].title
					if (lastMsgTitle === "ODA Clan Mod Manager") {
						isModPresent = true
					}
				}
			}).catch(console.error)

			let contentOutput = ""

			if (!isRankPresent) {
				const row = new MessageActionRow()
					.addComponents(
						new MessageButton().setCustomId("leaderboard").setLabel("📈 LEADERBOARD").setStyle("DANGER"),
						new MessageButton().setCustomId("claimDaily").setLabel("✅ CLAIM DAILY").setStyle("SUCCESS"),
						new MessageButton().setCustomId("account").setLabel("🙋‍♂️ ACCOUNT").setStyle("PRIMARY")
					)

				const embed = new MessageEmbed()
					.setColor("#ffffff")
					.setTitle("ODA Clan Points Manager")
					.setThumbnail("https://i.imgur.com/JW8vPcb.png")
					.setDescription("ODA Clan tool to check and keep track of members progress inside the ODA Clan world")
					.addFields(
						{ name: "📈 LEADERBOARD", value: "Check leaderboard of your rank" },
						{ name: "✅ CLAIM DAILY", value: "Claim your daily point" },
						{ name: "🙋‍♂️ ACCOUNT", value: "Check your ODA Account" },
					)

				await channelRank.send({ embeds: [embed], components: [row] })
				contentOutput += "Default Rank message created\n"
			} else {
				contentOutput += "Default Rank message exist. Delete it and launch the command again\n"
			}

			if (!isModPresent) {
				const row1 = new MessageActionRow()
					.addComponents(
						new MessageButton().setCustomId("backupUsers").setLabel("🔴 USER DB TO LOCAL").setStyle("PRIMARY"),
						new MessageButton().setCustomId("backupSettings").setLabel("🔴 SETT. DB TO LOCAL").setStyle("PRIMARY"),
					)
				const row2 = new MessageActionRow()
					.addComponents(
						new MessageButton().setCustomId("updateLeaderboard").setLabel("🔴 UPDATE LEADERBOARD").setStyle("PRIMARY"),
						new MessageButton().setCustomId("clearNicknames").setLabel("🟢 CLEAR NICKNAME").setStyle("DANGER"),
						new MessageButton().setCustomId("monthUpgradeDowngrade").setLabel("🟢 DO MONTH SHIT").setStyle("DANGER"),
						new MessageButton().setCustomId("monthReset").setLabel("🟢 DO MONTH SHIT").setStyle("DANGER"),
						new MessageButton().setCustomId("odaNameDiffChekc").setLabel("🔴 ODA NAME CHECK").setStyle("PRIMARY"),
						//new MessageButton().setCustomId("adjustStarred").setLabel("ADJS. STARRED").setStyle("PRIMARY"),
					)
				const row3 = new MessageActionRow()
					.addComponents(
						new MessageButton().setCustomId("dailyTrue").setLabel("📍 D. TRUE").setStyle("PRIMARY"),
						new MessageButton().setCustomId("dailyFalse").setLabel("📍 D. FALSE").setStyle("PRIMARY"),
						new MessageButton().setCustomId("setupdb").setLabel("🔵 SETT. USR LOCAL TO DB").setStyle("DANGER"),
						new MessageButton().setCustomId("setupmessages").setLabel("🔵 MSG LOCAL TO DS").setStyle("DANGER"),
					)

				const embed = new MessageEmbed()
					.setColor("#0099ff")
					.setTitle("ODA Clan Mod Manager")
					.setDescription("ODA Clan tool moderate the server in several ways")
					.addFields(
						{ name: "BACKUP USER", value: "Dump user table to backup json file" },
						{ name: "BACKUP SETTINGS", value: "Dump settings table to backup json file" },
						{ name: "D. TRUE", value: "Set ALLs daily claim to true" },
						{ name: "D. FALSE", value: "Set ALLs daily claim to false" },
					)
					.setFooter({ text: "ODA Clan bot management", iconURL: "https://i.imgur.com/1ED6ifg.jpeg" })

				await channelDebug.send({ embeds: [embed], components: [row1, row2, row3] })
				contentOutput += "Default Moderation message created"
			} else {
				contentOutput += "Default Moderation message exist. Delete it and launch the command again"
			}

			updateLeaderboard.updateLeaderboard(client)
			interaction.reply({ content: contentOutput, ephemeral: true })
			logger.info("[COMMAND] setupmessages end")

		} catch (err) {
			mainHelper.commonCatch(err, "stupmessages", logger)
			return
		}
	},
}
