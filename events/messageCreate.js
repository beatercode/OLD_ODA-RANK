const setupdb = require("../commands/setupdb")
const setupmessages = require("../commands/setupmessages")
const fetchinvites = require("../commands/fetchinvites")
const { DBSETTINGS } = require("../helper/databaseHelper")

module.exports = {
	name: "messageCreate",
	async execute(message) {

		const DB_SETTINGS = await DBSETTINGS()
		const messageNoSlash = (message.content).replace("/", "")
		if (DB_SETTINGS.HIDDEN_COMMAND.includes(messageNoSlash)) {
			switch (messageNoSlash) {
			case "setupdb":
				setupdb.execute(message)
				break
			case "setupmessages":
				setupmessages.execute(message)
				break
			case "fetchinvites":
				fetchinvites.execute(message)
				break
			}
		}
	}
}