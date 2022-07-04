/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
const { MessageEmbed } = require("discord.js")
const logger = require("../helper/_logger")
const roleHelper = require("../helper/roleHelper")
const mainHelper = require("../helper/mainHelper")
const Discounts = require("../models/Discounts")
const OdaSwitch = require("../models/OdaSwitch")
const Users = require("../models/Users")
const { DBCHANNELS, DBROLES, DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {

	async monthlyCheck(client) {

		mainHelper.logOnServer(client, "[MONTHLY] routine starts")
		logger.info("[MONTHLY] routine starts")
		this.monthlyAdjustRole(client)
		this.defaultMonthlyResets()
	},

	async defaultMonthlyResets() {
		// reset month invite, mult, points
		await Users.updateMany({},
			{ $set: { monthly_invitation: 0, consecutive_daily: 0, daily: false, monthly_points_received: 0 } })
	},

	async monthlyAdjustRole(client) {

		logger.info("[MONTHLY] monthlyAdjustRole start")

		/* ------------------------ [START] VARIABLE SECTION ------------------------ */
		const searchLimit = 0
		const samuraiBoard = await roleHelper.getBoardByRoleName(searchLimit, "samurai")
		const nokaBoard = await roleHelper.getBoardByRoleName(searchLimit, "noka")
		//const shokuninBoard = await roleHelper.getBoardByRoleName(searchLimit, "shokunin");
		//const shoninBoard = await roleHelper.getBoardByRoleName(searchLimit, "shonin");

		const DB_ROLES = await DBROLES()
		const DB_CHANNELS = await DBCHANNELS()
		const DB_SETTINGS = await DBSETTINGS()

		const shoninObjectRole = await roleHelper.getRoleDiscordObjectById(client, DB_ROLES.shonin.id)
		const shokuninObjectRole = await roleHelper.getRoleDiscordObjectById(client, DB_ROLES.shokunin.id)
		const nokaObjectRole = await roleHelper.getRoleDiscordObjectById(client, DB_ROLES.noka.id)
		const samuraiObjectRole = await roleHelper.getRoleDiscordObjectById(client, DB_ROLES.samurai.id)

		//const shoninPercentage_up = DB_ROLES.shonin.role_percentage[0]
		//const shoninPercentage_down = DB_ROLES.shonin.role_percentage[1]
		const shokuninPercentage_up = DB_ROLES.shokunin.role_percentage[0]
		const shokuninPercentage_down = DB_ROLES.shokunin.role_percentage[1]
		const nokaPercentage_down = DB_ROLES.noka.role_percentage[1]
		const nokaDiscount = DB_ROLES.noka.role_discount
		const samuraiDiscount = DB_ROLES.samurai.role_discount
		const nokaFixed_up = nokaDiscount.filter((x) => x === 100).length

		/* ------------------------ [END] VARIABLE SECTION ------------------------ */
		/* ------------------------ [START] DISCOUNT SECTION ------------------------ */

		logger.info("Discount enabled? [" + DB_SETTINGS.enabled_discount + "]")
		if (DB_SETTINGS.enabled_discount) {
			// SAMURAI add discount to DB an save variable for reply/announcement
			for (const x of samuraiBoard.board) {
				let position = x.position - 1
				let newDiscount = new Discounts({
					user_id: x.user_id,
					discount_percent: samuraiDiscount[position],
					origin_role: DB_ROLES.samurai.name,
				})
				await newDiscount.save(err => {
					if (err) {
						logger.error("Error saving Discount SAMURAI to db OF [" + x.user_id + "]")
						logger.error(err)
					}
				})
				if (position == 9)
					break
			}

			// NOKA add discount to DB an save variable for reply/announcement
			for (const x of nokaBoard.board) {
				let position = x.position - 1
				let newDiscount = new Discounts({
					user_id: x.user_id,
					discount_percent: nokaDiscount[position],
					origin_role: DB_ROLES.noka.name,
				})
				await newDiscount.save(err => {
					if (err) {
						logger.error("Error saving Discount NOKA to db OF [" + x.user_id + "]")
						logger.error(err)
					}
				})
				if (position == 9)
					break
			}
		}

		/* ------------------------ [END] DISCOUNT SECTION ------------------------ */
		/* ------------------------ [START] BOARDS SECTION ------------------------ */

		logger.info("START - Retriving boards")
		// mode 0 --> upgrade
		// mode 1 --> downgrade
		//let nokaToUpgrade = await roleHelper.
		//	getUserUpDownByFixedNumber("noka", nokaFixed_up, 0)
		let nokaToUpgrade = []
		let nokaToDowngrade = await roleHelper
			.getUserUpDownByRolePercentage("noka", nokaPercentage_down, 1)
		let shokuninToUpgrade = await roleHelper
			//.getUserUpDownByRolePercentage("shokunin", shokuninPercentage_up, 0)
			.getUserUpDownByFixedNumber("shokunin", 58, 0)
		//let shokuninToDowngrade = await roleHelper
		//	.getUserUpDownByRolePercentage("shokunin", shokuninPercentage_down, 1)
		//let shoninToUpgrade = await roleHelper
		//	.getUserUpDownByRolePercentage("shonin", shoninPercentage_up, 0)
		//let shoninToDowngrade = await roleHelper
		//	.getUserUpDownByRolePercentage("shonin", shoninPercentage_down, 1)
		let shokuninToDowngrade = []
		let shoninToUpgrade = []
		let shoninToDowngrade = []

		const isNokaToUpgrade = nokaToUpgrade != null && nokaToUpgrade.length != 0
		const isNokaToDowngrade = nokaToDowngrade != null && nokaToDowngrade.length != 0
		const isShokuninToUpgrade = shokuninToUpgrade != null && shokuninToUpgrade.length != 0
		const isShokuninToDowngrade = shokuninToDowngrade != null && shokuninToDowngrade.length != 0
		const isShoninToUpgrade = shoninToUpgrade != null && shoninToUpgrade.length != 0
		const isShoninToDowngrade = shoninToDowngrade != null && shoninToDowngrade.length != 0

		const isNokaUpToTextChat = false
		const isShokuninUpToTextChat = true
		const isShoninUpToTextChat = false

		const isTodoDB = false
		const isTodoDiscord = false
		const isTodoRecapmessage = false

		logger.info("\nBoards LEN: \nnokaToUpgrade[" + nokaToUpgrade.length + "] \n"
			+ "nokaToDowngrade[" + nokaToDowngrade.length + "] \n"
			+ "shokuninToUpgrade[" + shokuninToUpgrade.length + "] \n"
			+ "shokuninToDowngrade[" + shokuninToDowngrade.length + "] \n"
			+ "shoninToUpgrade[" + shoninToUpgrade.length + "] \n"
			+ "shoninToDowngrade[" + shoninToDowngrade.length + "]")
		logger.info("\nBoards BOOL: \nnokaToUpgrade[" + isNokaToUpgrade + "] \n"
			+ "nokaToDowngrade[" + isNokaToDowngrade + "] \n"
			+ "shokuninToUpgrade[" + isShokuninToUpgrade + "] \n"
			+ "shokuninToDowngrade[" + isShokuninToDowngrade + "] \n"
			+ "shoninToUpgrade[" + isShoninToUpgrade + "] \n"
			+ "shoninToDowngrade[" + isShoninToDowngrade + "]")

		logger.info("nokaToDowngrade IDs:")
		logger.info(nokaToDowngrade.map(x => x.user_id))
		logger.info("shokuninToUpgrade IDs:")
		logger.info(shokuninToUpgrade.map(x => x.user_id))
		logger.info("END - Retriving boards")

		/* ------------------------ [END] BOARDS SECTION ------------------------ */
		/* ------------------------ [START] DATABASE SECTION ------------------------ */
		if (isTodoDB) {
			logger.info("INIZIO - Aggiornamento DATABASE UP/DOWN")

			// ⬇️ NOKA to SHOKUNIN
			if (isNokaToUpgrade) {
				let downgradedNokaCount = 0
				//downgradedNokaCount = await Users.find({ user_id: { $in: nokaToDowngrade.map(x => x.user_id) } })
				//console.log(downgradedNokaCount)
				downgradedNokaCount = await Users.updateMany({ user_id: { $in: nokaToDowngrade.map(x => x.user_id) } }, { $set: { role_id: DB_ROLES.shokunin.id, role: DB_ROLES.shokunin.name } })
				logger.info(`END OF MONTH - NOKA DOWNGRADED TO SHOKUNIN [${downgradedNokaCount.modifiedCount}]`)
				//logger.info(`END OF MONTH - NOKA DOWNGRADED TO SHOKUNIN [${downgradedNokaCount.length}]`)
				logger.info(nokaToDowngrade.map(x => x.username))
			}

			// ⬇️ SHOKUNIN to SHONIN
			if (isShokuninToDowngrade) {
				let downgradedShokuninCount = 0
				//downgradedShokuninCount = await Users.find({ user_id: { $in: shokuninToDowngrade.map(x => x.user_id) } })
				downgradedShokuninCount = await Users.updateMany({ user_id: { $in: shokuninToDowngrade.map(x => x.user_id) } }, { $set: { role_id: DB_ROLES.shonin.id, role: DB_ROLES.shonin.name } })
				logger.info(`END OF MONTH - SHOKUNIN DOWNGRADED TO SHONIN [${downgradedShokuninCount.modifiedCount}]`)
				//logger.info(`END OF MONTH - SHOKUNIN DOWNGRADED TO SHONIN [${downgradedShokuninCount.length}]`)
				logger.info(shokuninToDowngrade.map(x => x.username))
			}

			// ⬇️ SHONIN to HININ
			if (isShoninToDowngrade) {
				let downgradedShoninCount = 0
				//downgradedShoninCount = await Users.find({ user_id: { $in: shoninToDowngrade.map(x => x.user_id) } })
				downgradedShoninCount = await Users.updateMany({ user_id: { $in: shoninToDowngrade.map(x => x.user_id) } }, { $set: { role_id: DB_ROLES.hinin.id, role: DB_ROLES.hinin.name } })
				logger.info(`END OF MONTH - SHONIN DOWNGRADED TO HININ [${downgradedShoninCount.modifiedCount}]`)
				//logger.info(`END OF MONTH - SHONIN DOWNGRADED TO HININ [${downgradedShoninCount.length}]`)
				logger.info(shoninToDowngrade.map(x => x.username))
			}

			// ⬆️ NOKA to SAMURAI
			if (isNokaToUpgrade) {
				//let upgradedNokaCount = 0
				//upgradedNokaCount = await Users.find({ user_id: { $in: nokaToUpgrade.map(x => x.user_id) } })
				//upgradedNokaCount = await Users.updateMany({ user_id: { $in: nokaToUpgrade.map(x => x.user_id) } }, { $set: { role_id: DB_ROLES.samurai.id, role: DB_ROLES.samurai.name } })
				//logger.info(`END OF MONTH - NOKA UPGRADED TO SAMURAI [${upgradedNokaCount.modifiedCount}]`)
				//logger.info(`END OF MONTH - NOKA UPGRADED TO SAMURAI [${upgradedNokaCount.length}]`)
				logger.info(nokaToUpgrade.map(x => x.username))
			}

			// ⬆️ SHOKUNIN to NOKA
			if (isShokuninToUpgrade) {
				let upgradedShokuninCount = 0
				//upgradedShokuninCount = await Users.find({ user_id: { $in: shokuninToUpgrade.map(x => x.user_id) } })
				upgradedShokuninCount = await Users.updateMany({ user_id: { $in: shokuninToUpgrade.map(x => x.user_id) } }, { $set: { role_id: DB_ROLES.noka.id, role: DB_ROLES.noka.name } })
				logger.info(`END OF MONTH - SHOKUNIN UPGRADED TO NOKA [${upgradedShokuninCount.modifiedCount}]`)
				//logger.info(`END OF MONTH - SHOKUNIN UPGRADED TO NOKA [${upgradedShokuninCount.length}]`)
				logger.info(shokuninToUpgrade.map(x => x.username))
			}

			// ⬆️ SHONIN to SHOKUNIN
			if (isShoninToUpgrade) {
				let upgradedShoninCount = 0
				//upgradedShoninCount = await Users.find({ user_id: { $in: shoninToUpgrade.map(x => x.user_id) } })
				upgradedShoninCount = await Users.updateMany({ user_id: { $in: shoninToUpgrade.map(x => x.user_id) } }, { $set: { role_id: DB_ROLES.shokunin.id, role: DB_ROLES.shokunin.name } })
				logger.info(`END OF MONTH - SHONIN UPGRADED TO SHOKUNIN [${upgradedShoninCount.modifiedCount}]`)
				//logger.info(`END OF MONTH - SHONIN UPGRADED TO SHOKUNIN [${upgradedShoninCount.length}]`)
				logger.info(shoninToUpgrade.map(x => x.username))
			}

			console.log("FINE - Aggiornamento DATABASE UP/DOWN")
		}
		/* ------------------------ [END] DATABASE SECTION ------------------------ */

		let finalEmbedsUp = []
		let headEmbed = new MessageEmbed().setTitle("Kiyosu Festival Top 10!").setColor("#FFFFFF")
		finalEmbedsUp.push(headEmbed)
		let finalEmbedsDown = []

		/* ------------------------ [START] DISCORD SECTION ------------------------ */
		if (isTodoDiscord) {

			await OdaSwitch.updateOne({ name: "Settings" }, { "values.role_upgrade_welcomemsg": false })
			logger.info("OFF - role_upgrade_welcomemsg")
			logger.info("Creating Embeds and adding/rem Roles")

			// ⬆️ NOKA to SHOKUNIN
			if (isNokaToDowngrade) {
				let counterTop10 = 10
				let downgradedNokaField = ""
				nokaToDowngrade.forEach(async x => {
					if (counterTop10 > 0) {
						downgradedNokaField += `⬇️ <@${x.user_id}>\n`
						counterTop10 = counterTop10 - 1
					}
					let member = await mainHelper.getMemberFromId(client, x.user_id)
					member.roles.remove(nokaObjectRole)
				})
				let embed = new MessageEmbed()
					.addField("\u200B", downgradedNokaField)
					.setDescription("<@&" + DB_ROLES.noka.id + "> downgraded to <@&" + DB_ROLES.shokunin.id + ">")
				finalEmbedsDown.push(embed)
				logger.info("NOKA DOWNGRADE completi")
			}

			// ⬆️ SHOKUNIN to SHONIN
			if (isShokuninToDowngrade) {
				let counterTop10 = 10
				let downgradedShokuninField = ""
				shokuninToDowngrade.forEach(async x => {
					if (counterTop10 > 0) {
						downgradedShokuninField += `⬇️ <@${x.user_id}>\n`
						counterTop10 = counterTop10 - 1
					}
					let member = await mainHelper.getMemberFromId(client, x.user_id)
					member.roles.remove(shokuninObjectRole)
				})
				let embed = new MessageEmbed()
					.addField("\u200B", downgradedShokuninField)
					.setDescription("<@&" + DB_ROLES.shokunin.id + "> downgraded to <@&" + DB_ROLES.shonin.id + ">")
				finalEmbedsDown.push(embed)
				logger.info("SHOKUNIN DOWNGRADE completi")
			}

			// ⬆️ SHONIN to HININ
			if (isShoninToDowngrade) {
				let counterTop10 = 10
				let downgradedShoninField = ""
				shoninToDowngrade.forEach(async x => {
					if (counterTop10 > 0) {
						downgradedShoninField += `⬇️ <@${x.user_id}>\n`
						counterTop10 = counterTop10 - 1
					}
					let member = await mainHelper.getMemberFromId(client, x.user_id)
					member.roles.remove(shoninObjectRole)
				})
				let embed = new MessageEmbed()
					.addField("\u200B", downgradedShoninField)
					.setDescription("<@&" + DB_ROLES.shonin.id + "> downgraded to <@&" + DB_ROLES.hinin.id + ">")
				finalEmbedsDown.push(embed)
				logger.info("SHONIN DOWNGRADE completi")
			}

			// ⬆️ NOKA to SAMURAI
			if (isNokaToUpgrade) {
				let counterTop10 = 10
				let upgradedNokaField = ""
				nokaToUpgrade.forEach(async x => {
					if (counterTop10 > 0) {
						upgradedNokaField += `⬆️ <@${x.user_id}>\n`
						counterTop10 = counterTop10 - 1
					}
					let member = await mainHelper.getMemberFromId(client, x.user_id)
					member.roles.add(samuraiObjectRole)
				})
				let embed = new MessageEmbed()
					.addField("\u200B", upgradedNokaField)
					.setDescription("<@&" + DB_ROLES.noka.id + "> upgraded to <@&" + DB_ROLES.samurai.id + ">")
					.setColor(DB_ROLES.samurai.color)
				finalEmbedsUp.push(embed)
				logger.info("NOKA UPGRADE completi")
			}

			// ⬆️ SHOKUNIN to NOKA
			if (isShokuninToUpgrade) {
				let counterTop10 = 10
				let upgradedShokuninField = ""
				shokuninToUpgrade.forEach(async x => {
					if (counterTop10 > 0) {
						upgradedShokuninField += `⬆️ <@${x.user_id}>\n`
						counterTop10 = counterTop10 - 1
					}
					let member = await mainHelper.getMemberFromId(client, x.user_id)
					member.roles.add(nokaObjectRole)
				})
				let embed = new MessageEmbed()
					.addField("\u200B", upgradedShokuninField)
					.setDescription("<@&" + DB_ROLES.shokunin.id + "> upgraded to <@&" + DB_ROLES.noka.id + ">")
					.setColor(DB_ROLES.noka.color)
				finalEmbedsUp.push(embed)
				logger.info("SHOKUNIN UPGRADE completi")
			}

			// ⬆️ SHONIN to SHOKUNIN
			if (isShoninToUpgrade) {
				let counterTop10 = 10
				let upgradedShoninField = ""
				shoninToUpgrade.forEach(async x => {
					if (counterTop10 > 0) {
						upgradedShoninField += `⬆️ <@${x.user_id}>\n`
						counterTop10 = counterTop10 - 1
					}
					let member = await mainHelper.getMemberFromId(client, x.user_id)
					member.roles.add(shokuninObjectRole)
				})
				let embed = new MessageEmbed()
					.addField("\u200B", upgradedShoninField)
					.setDescription("<@&" + DB_ROLES.shonin.id + "> upgraded to <@&" + DB_ROLES.shokunin.id + ">")
					.setColor(DB_ROLES.shokunin.color)
				finalEmbedsUp.push(embed)
				logger.info("SHONIN UPGRADE completi")
			}

			await OdaSwitch.updateOne({ name: "Settings" }, { "values.role_upgrade_welcomemsg": true })
			console.log("ON - role_upgrade_welcomemsg")
		}
		/* ------------------------ [END] DISCORD SECTION ------------------------ */

		const channelAnnouncementsID = DB_CHANNELS.ch_announcements
		const channelAnnouncements = client.channels.cache.get(channelAnnouncementsID)
		const channelStaffID = DB_CHANNELS.ch_staff
		const channelStaff = client.channels.cache.get(channelStaffID)
		const channelChatShokunin = client.channels.cache.get(DB_ROLES.shokunin.chat_channel_id)
		const channelChatNoka = client.channels.cache.get(DB_ROLES.noka.chat_channel_id)
		const channelChatSamurai = client.channels.cache.get(DB_ROLES.samurai.chat_channel_id)

		if (isTodoRecapmessage) {
			if (finalEmbedsUp != null && finalEmbedsUp.length != 0) {
				await channelAnnouncements.send({ embeds: finalEmbedsUp })
				await channelStaff.send({ embeds: finalEmbedsUp })
			}
			if (finalEmbedsDown != null && finalEmbedsDown.length != 0) {
				await channelStaff.send({ embeds: finalEmbedsDown })
			}
		}

		let roleEmbed = null
		let welcomeMsg = ""
		let defTitle = "New Upgrade!"
		let odaClanEmoji = "<:odaclan:987277668770803722>"
		let roleEmoji = ""

		if (isShoninUpToTextChat) {
			welcomeMsg = "Hei <@&" + DB_ROLES.shokunin.id + ">\n"
			welcomeMsg += "**New Kyodais** just reached **Lv.3 - Shokunin 職人** 🥋 \n\n"
			welcomeMsg += "Congratulations on your well-deserved promotion, you have proved your worth by bringing value to the clan."
			roleEmoji = "<:LV3:987264729967910942>"
			roleEmbed = new MessageEmbed()
				.setTitle(defTitle)
				.setDescription(welcomeMsg)
				.setColor(DB_ROLES.shokunin.color)
			await channelChatShokunin.send({ embeds: [roleEmbed] }).then(function (message) {
				//await channelStaff.send({ embeds: [roleEmbed] }).then(function (message) {
				message.react("🥋").then().catch()
				message.react(roleEmoji).then().catch()
				message.react(odaClanEmoji).then().catch()
			})
		}

		if (isShokuninUpToTextChat) {
			welcomeMsg = "Hei <@&" + DB_ROLES.noka.id + ">\n"
			welcomeMsg += "**New Kyodais** just reached **Lv.4 - Nōka 農家** 🥋 \n\n"
			welcomeMsg += "Congratulations on your well-deserved promotion, **Kyodai**, you are now an essential part of our community, thank you for your dedication."
			roleEmoji = "<:LV4:987264732744540210>"
			roleEmbed = new MessageEmbed()
				.setTitle(defTitle)
				.setDescription(welcomeMsg)
				.setColor(DB_ROLES.noka.color)
			await channelChatNoka.send({ embeds: [roleEmbed] }).then(function (message) {
				//await channelStaff.send({ embeds: [roleEmbed] }).then(function (message) {
				message.react("🥋").then().catch()
				message.react(roleEmoji).then().catch()
				message.react(odaClanEmoji).then().catch()
			})
		}

		if (isNokaUpToTextChat) {
			welcomeMsg = "Hei <@&" + DB_ROLES.samurai.id + ">\n"
			welcomeMsg += "**New Kyodais** just reached **Lv.5 - Samurai 武士** 🥋 \n\n"
			welcomeMsg += "Congratulations on becoming the true pillar of our community, **Kyodai**, you now have access to all the benefits and advantages that a true warrior deserves."
			roleEmoji = "<:LV5:987264734942330911>"
			roleEmbed = new MessageEmbed()
				.setTitle(defTitle)
				.setDescription(welcomeMsg)
				.setColor(DB_ROLES.samurai.color)
			await channelChatSamurai.send({ embeds: [roleEmbed] }).then(function (message) {
				//await channelStaff.send({ embeds: [roleEmbed] }).then(function (message) {
				message.react("🥋").then().catch()
				message.react(roleEmoji).then().catch()
				message.react(odaClanEmoji).then().catch()
			})
		}

		logger.info("[MONTHLY] monthlyAdjustRole end")
	}
}