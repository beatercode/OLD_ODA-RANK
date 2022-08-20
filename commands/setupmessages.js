const { SlashCommandBuilder } = require("@discordjs/builders")
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js")
const mainHelper = require("../helper/mainHelper")
const updateLeaderboard = require("../helper/updateLeaderboard")
const logger = require("../helper/_logger")
const { DBCHANNELS } = require("../helper/databaseHelper")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setupmessages")
		.setDescription("[ADMIN] Setup & Refactor default messages / box"),
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
				if (messages.first() != undefined && (messages.first()).embeds[0] != undefined &&
					(messages.first()).embeds[0].title != undefined) {
					let lastMsgTitle = (messages.first()).embeds[0].title
					if (lastMsgTitle === "ODA Clan Points Manager") {
						isRankPresent = true
					}
				}
			}).catch(console.error)

			let isModPresent = false
			await channelDebug.messages.fetch({ limit: 1 }).then(messages => {
				if (messages.first() != undefined && (messages.first()).embeds[0] != undefined &&
					(messages.first()).embeds[0].title != undefined) {
					let lastMsgTitle = (messages.first()).embeds[0].title
					if (lastMsgTitle === "ODA Clan Mod Manager") {
						isModPresent = true
					}
				}
			}).catch(console.error)

			let contentOutput = ""

			if (!isRankPresent) {
				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId("leaderboard").setLabel("📈 LEADERBOARD").setStyle("DANGER"),
						new ButtonBuilder().setCustomId("claimDaily").setLabel("✅ CLAIM DAILY").setStyle("SUCCESS"),
						new ButtonBuilder().setCustomId("account").setLabel("🙋‍♂️ ACCOUNT").setStyle("PRIMARY")
					)

				const embed = new EmbedBuilder()
					.setColor("#ffffff")
					.setTitle("ODA Clan Points Manager")
					.setThumbnail("https://i.imgur.com/JW8vPcb.png")
					.setDescription("ODA Clan tool to check and keep track of members progress inside the ODA Clan world")
					.addFields({ name: "📈 LEADERBOARD", value: "Check leaderboard of your rank" }, { name: "✅ CLAIM DAILY", value: "Claim your daily point" }, { name: "🙋‍♂️ ACCOUNT", value: "Check your ODA Account" }, )

				await channelRank.send({ embeds: [embed], components: [row] })
				contentOutput += "Default Rank message created\n"
			} else {
				contentOutput += "Default Rank message exist. Delete it and launch the command again\n"
			}

			if (!isModPresent) {
				const row1 = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId("backupUsers").setLabel("🔴 USER DB TO LOCAL").setStyle("PRIMARY"),
						new ButtonBuilder().setCustomId("backupSettings").setLabel("🔴 SETT. DB TO LOCAL").setStyle("PRIMARY"),
						new ButtonBuilder().setCustomId("shokuninZeroDowngrade").setLabel("🔴 SHOK. 0PT DOWNG.").setStyle("PRIMARY"),
					)
				const row2 = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId("updateLeaderboard").setLabel("🟢 UPDATE LEADERBOARD").setStyle("SECONDARY"),
						new ButtonBuilder().setCustomId("clearNicknames").setLabel("🟢 CLEAR NICKNAME").setStyle("SECONDARY"),
						new ButtonBuilder().setCustomId("odaNameDiffChekc").setLabel("🟢 ODA NAME CHECK").setStyle("SECONDARY"),
						//new ButtonBuilder().setCustomId("adjustStarred").setLabel("ADJS. STARRED").setStyle("PRIMARY"),
					)
				const row3 = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId("dailyCheck").setLabel("⏰ DAILY CHECK").setStyle("PRIMARY"),
						new ButtonBuilder().setCustomId("hourlyCheck").setLabel("⏰ HOURLY CHECK").setStyle("PRIMARY"),
						new ButtonBuilder().setCustomId("monthUpgradeDowngrade").setLabel("⏰ MONTH ADJUST ROLES").setStyle("PRIMARY"),
						new ButtonBuilder().setCustomId("monthReset").setLabel("⏰ MONTH RESET").setStyle("PRIMARY"),
						//new ButtonBuilder().setCustomId("adjustStarred").setLabel("ADJS. STARRED").setStyle("PRIMARY"),
					)
				const row4 = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId("dailyTrue").setLabel("📍 D. TRUE").setStyle("DANGER"),
						new ButtonBuilder().setCustomId("dailyFalse").setLabel("📍 D. FALSE").setStyle("DANGER"),
						new ButtonBuilder().setCustomId("dailyFalseAll").setLabel("📍 D. FALSE ALL").setStyle("DANGER"),
					)
				const row5 = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder().setCustomId("setupdb").setLabel("🔵 SETT. USR LOCAL TO DB").setStyle("DANGER"),
						new ButtonBuilder().setCustomId("setupdbMissingUser").setLabel("🔵 USR DISCORD MISS. TO DB").setStyle("DANGER"),
						new ButtonBuilder().setCustomId("setupmessages").setLabel("🔵 MSG LOCAL TO DS").setStyle("DANGER"),
					)

				const embed = new EmbedBuilder()
					.setColor("#0099ff")
					.setTitle("ODA Clan Mod Manager")
					.setDescription("ODA Clan tool moderate the server in several ways")
					.addFields({ name: "BACKUP USER", value: "Dump user table to backup json file" }, { name: "BACKUP SETTINGS", value: "Dump settings table to backup json file" }, { name: "D. TRUE", value: "Set ALLs daily claim to true" }, { name: "D. FALSE", value: "Set ALLs daily claim to false" }, )
					.setFooter({ text: "ODA Clan bot management", iconURL: "https://i.imgur.com/1ED6ifg.jpeg" })

				await channelDebug.send({ embeds: [embed], components: [row1, row2, row3, row4, row5] })
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