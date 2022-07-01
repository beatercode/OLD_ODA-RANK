const { MessageEmbed } = require("discord.js")
const roleHelper = require("../helper/roleHelper")
const logger = require("../helper/_logger")
const mainHelper = require("../helper/mainHelper")
//const Discounts = require("../models/Discounts")
const Users = require("../models/Users")
const { DBCHANNELS, DBROLES, DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {

	async monthlyCheck(client) {

		mainHelper.logOnServer(client, "[MONTHLY] routine starts")
		logger.info("[MONTHLY] routine starts")
		//this.monthlyAdjustRole(client)
		//this.defaultMonthlyResets()
	},

	async defaultMonthlyResets() {
		// reset month invite, mult, points
		await Users.updateMany({},
			{ $set: { monthly_invitation: 0, consecutive_daily: 0 } })
	},

	async monthlyAdjustRole(client) {

		logger.info("[MONTHLY] monthlyAdjustRole start")
		const searchLimit = 0
		const samuraiBoard = await roleHelper.getBoardByRoleName(searchLimit, "samurai")
		const nokaBoard = await roleHelper.getBoardByRoleName(searchLimit, "noka")
		//const shokuninBoard = await roleHelper.getBoardByRoleName(searchLimit, "shokunin");
		//const shoninBoard = await roleHelper.getBoardByRoleName(searchLimit, "shonin");

		const DB_ROLES = await DBROLES()
		const DB_CHANNELS = await DBCHANNELS()
		const DB_SETTINGS = await DBSETTINGS()

		const shoninPercentage_up = DB_ROLES.shokunin.role_percentage[0]
		const shoninPercentage_down = DB_ROLES.shokunin.role_percentage[1]
		const shokuninPercentage_up = DB_ROLES.shokunin.role_percentage[0]
		const shokuninPercentage_down = DB_ROLES.shokunin.role_percentage[1]
		//const nokaPercentage_down = DB_ROLES.noka.role_percentage[1];
		const nokaPercentage_down = 100
		const nokaDiscount = DB_ROLES.noka.role_discount
		//const samuraiDiscount = DB_ROLES.samurai.role_discount
		const nokaFixed_up = nokaDiscount.filter((x) => x === 100).length

		// DISCOUNT ZONE
		/*
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
		*/

		// UPGRADE DOWNGRADE ZONE
		// mode 0 --> upgrade
		// mode 1 --> downgrade
		let nokaToUpgrade = await roleHelper.
			getUserUpDownByFixedNumber("noka", nokaFixed_up, 0)
		let nokaToDowngrade = await roleHelper
			.getUserUpDownByRolePercentage("noka", nokaPercentage_down, 1)
		let shokuninToUpgrade = await roleHelper
			.getUserUpDownByRolePercentage("shokunin", shokuninPercentage_up, 0)
		let shokuninToDowngrade = await roleHelper
			.getUserUpDownByRolePercentage("shokunin", shokuninPercentage_down, 1)
		let shoninToUpgrade = await roleHelper
			.getUserUpDownByRolePercentage("shonin", shoninPercentage_up, 0)
		let shoninToDowngrade = await roleHelper
			.getUserUpDownByRolePercentage("shonin", shoninPercentage_down, 1)

		// switch do actuale UP/DOWN
		// ⬇️ NOKA to SHOKUNIN
		if (nokaToDowngrade && nokaToDowngrade.length) {
			let downgradedNokaCount = 0
			downgradedNokaCount = await Users.updateMany(
				{ _id: { $in: nokaToDowngrade.map(x => x._id) } },
				{ $set: { role_id: DB_ROLES.shokunin.id, role: DB_ROLES.shokunin.name } })
			logger.info(`END OF MONTH - NOKA DOWNGRADED TO SHOKUNIN [${downgradedNokaCount}]`)
			logger.info("-------------------- START LIST --------------------")
			logger.info(nokaToDowngrade.map(x => x._id))
			logger.info("---------------------- END LIST --------------------")
		}

		// ⬇️ SHOKUNIN to SHONIN
		if (shokuninToDowngrade && shokuninToDowngrade.length) {
			let downgradedShokuninCount = 0
			downgradedShokuninCount = await Users.updateMany(
				{ _id: { $in: shokuninToDowngrade.map(x => x._id) } },
				{ $set: { role_id: DB_ROLES.shonin.id, role: DB_ROLES.shonin.name } })
			logger.info(`END OF MONTH - SHOKUNIN DOWNGRADED TO SHONIN [${downgradedShokuninCount}]`)
			logger.info("-------------------- START LIST --------------------")
			logger.info(shokuninToDowngrade.map(x => x._id))
			logger.info("---------------------- END LIST --------------------")
		}

		// ⬇️ SHONIN to HININ
		if (shoninToDowngrade && shoninToDowngrade.length) {
			let downgradedShoninCount = 0
			downgradedShoninCount = await Users.updateMany(
				{ _id: { $in: shoninToDowngrade.map(x => x._id) } },
				{ $set: { role_id: DB_ROLES.hinin.id, role: DB_ROLES.hinin.name } })
			logger.info(`END OF MONTH - SHONIN DOWNGRADED TO HININ [${downgradedShoninCount}]`)
			logger.info("-------------------- START LIST --------------------")
			logger.info(shoninToDowngrade.map(x => x._id))
			logger.info("---------------------- END LIST --------------------")
		}

		// ⬆️ NOKA to SAMURAI
		if (nokaToUpgrade && nokaToUpgrade.length) {
			let upgradedNokaCount = 0
			upgradedNokaCount = await Users.updateMany(
				{ _id: { $in: nokaToUpgrade.map(x => x._id) } },
				{ $set: { role_id: DB_ROLES.samurai.id, role: DB_ROLES.samurai.name } })
			logger.info(`END OF MONTH - NOKA UPGRADED TO SAMURAI [${upgradedNokaCount}]`)
			logger.info("-------------------- START LIST --------------------")
			logger.info(nokaToUpgrade.map(x => x._id))
			logger.info("---------------------- END LIST --------------------")
		}

		// ⬆️ SHOKUNIN to NOKA
		if (shokuninToUpgrade && shokuninToUpgrade.length) {
			let upgradedShokuninCount = 0
			upgradedShokuninCount = await Users.updateMany(
				{ _id: { $in: shokuninToUpgrade.map(x => x._id) } },
				{ $set: { role_id: DB_ROLES.noka.id, role: DB_ROLES.noka.name } })
			logger.info(`END OF MONTH - SHOKUNIN UPGRADED TO NOKA [${upgradedShokuninCount}]`)
			logger.info("-------------------- START LIST --------------------")
			logger.info(shokuninToUpgrade.map(x => x._id))
			logger.info("---------------------- END LIST --------------------")
		}

		// ⬆️ SHONIN to SHOKUNIN
		if (shoninToUpgrade && shoninToUpgrade.length) {
			let upgradedShoninCount = 0
			upgradedShoninCount = await Users.updateMany(
				{ _id: { $in: shoninToUpgrade.map(x => x._id) } },
				{ $set: { role_id: DB_ROLES.shokunin.id, role: DB_ROLES.shokunin.name } })
			logger.info(`END OF MONTH - SHONIN UPGRADED TO SHOKUNIN [${upgradedShoninCount}]`)
			logger.info("-------------------- START LIST --------------------")
			logger.info(shoninToUpgrade.map(x => x._id))
			logger.info("---------------------- END LIST --------------------")
		}

		let finalEmbeds = []
		if (nokaToDowngrade && nokaToDowngrade.length) {
			nokaToDowngrade = nokaToDowngrade.slice(0, 10)
			let downgradedNokaField = ""
			nokaToDowngrade.forEach(async x => {
				downgradedNokaField += `⬇️ <@${x.user_id}>\n`
				let member = await mainHelper.getMemberFromId(client, x.user_id)
				member.roles.remove(DB_ROLES.noka.id)
			})
			let embed = new MessageEmbed()
				.addField("\u200B", downgradedNokaField)
				.setDescription("<@&" + DB_ROLES.noka.id + "> downgraded to <@&" + DB_ROLES.shokunin.id + ">")
			finalEmbeds.push(embed)
		}

		if (shokuninToDowngrade && shokuninToDowngrade.length) {
			shokuninToDowngrade = shokuninToDowngrade.slice(0, 10)
			let downgradedShokuninField = ""
			shokuninToDowngrade.forEach(async x => {
				downgradedShokuninField += `⬇️ <@${x.user_id}>\n`
				let member = await mainHelper.getMemberFromId(client, x.user_id)
				member.roles.remove(DB_ROLES.shokunin.id)
			})
			let embed = new MessageEmbed()
				.addField("\u200B", downgradedShokuninField)
				.setDescription("<@&" + DB_ROLES.shokunin.id + "> downgraded to <@&" + DB_ROLES.shonin.id + ">")
			finalEmbeds.push(embed)
		}

		if (shoninToDowngrade && shoninToDowngrade.length) {
			shoninToDowngrade = shoninToDowngrade.slice(0, 10)
			let downgradedShoninField = ""
			shoninToDowngrade.forEach(async x => {
				downgradedShoninField += `⬇️ <@${x.user_id}>\n`
				let member = await mainHelper.getMemberFromId(client, x.user_id)
				member.roles.remove(DB_ROLES.shonin.id)
			})
			let embed = new MessageEmbed()
				.addField("\u200B", downgradedShoninField)
				.setDescription("<@&" + DB_ROLES.shonin.id + "> downgraded to <@&" + DB_ROLES.hinin.id + ">")
			finalEmbeds.push(embed)
		}

		if (nokaToUpgrade && nokaToUpgrade.length) {
			let upgradedNokaField = ""
			nokaToUpgrade.forEach(async x => {
				upgradedNokaField += `⬆️ <@${x.user_id}>\n`
				let member = await mainHelper.getMemberFromId(client, x.user_id)
				member.roles.add(DB_ROLES.samurai.id)
			})
			let embed = new MessageEmbed()
				.addField("\u200B", upgradedNokaField)
				.setDescription("<@&" + DB_ROLES.noka.id + "> upgraded to <@&" + DB_ROLES.samurai.id + ">")
			finalEmbeds.push(embed)
		}

		if (shokuninToUpgrade && shokuninToUpgrade.length) {
			shokuninToUpgrade = shokuninToUpgrade.slice(0, 10)
			let upgradedShokuninField = ""
			shokuninToUpgrade.forEach(async x => {
				upgradedShokuninField += `⬆️ <@${x.user_id}>\n`
				let member = await mainHelper.getMemberFromId(client, x.user_id)
				member.roles.add(DB_ROLES.noka.id)
			})
			let embed = new MessageEmbed()
				.addField("\u200B", upgradedShokuninField)
				.setDescription("<@&" + DB_ROLES.shokunin.id + "> upgraded to <@&" + DB_ROLES.noka.id + ">")
			finalEmbeds.push(embed)
		}

		if (shoninToUpgrade && shoninToUpgrade.length) {
			shoninToUpgrade = shoninToUpgrade.slice(0, 10)
			let upgradedShoninField = ""
			shoninToUpgrade.forEach(async x => {
				upgradedShoninField += `⬆️ <@${x.user_id}>\n`
				let member = await mainHelper.getMemberFromId(client, x.user_id)
				member.roles.add(DB_ROLES.shokunin.id)
			})
			let embed = new MessageEmbed()
				.addField("\u200B", upgradedShoninField)
				.setDescription("<@&" + DB_ROLES.shonin.id + "> upgraded to <@&" + DB_ROLES.shokunin.id + ">")
			finalEmbeds.push(embed)
		}

		const channelAnnouncementsID = DB_CHANNELS.ch_announcements
		const channelAnnouncements = client.channels.cache.get(channelAnnouncementsID)

		if (finalEmbeds && finalEmbeds.length) {
			await channelAnnouncements.send({ embeds: finalEmbeds })
		}

		logger.info("[MONTHLY] monthlyAdjustRole end")
	}
}