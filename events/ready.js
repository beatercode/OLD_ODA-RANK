require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const logger = require("../helper/_logger");
const timebasedEventHandler = require("../custom/timebasedEventHandler");
const config = require("../backup/config.json");

const wait = require("timers/promises").setTimeout;

module.exports = {
	name: "ready",
	once: true,
	async execute(client, commands) {
		const DB_SETTINGS = config.Settings.values;
		console.log(DB_SETTINGS.BOT_NAME + " is online | ----> RUN");
		logger.info(DB_SETTINGS.BOT_NAME + " is online | ----> RUN");
		await wait(1000);

		const CLIENT_ID = client.user.id;
		client.application.commands.set([])
		const rest = new REST({
			version: "9",
		}).setToken(process.env.TOKEN);

		(async () => {
			try {

				if (process.env.ENV === "PROD") {
					await rest.put(Routes.applicationCommands(CLIENT_ID), {
						body: commands,
					});
					console.log("Successfully registered commands globally.");
				} else {
					await rest.put(
						Routes.applicationGuildCommands(CLIENT_ID, DB_SETTINGS.GUILD_ID),
						{
							body: commands,
						}
					);
					console.log("Successfully registered commands locally.");
				}
			} catch (err) {
				if (err) { console.error(err); logger.error(err); }
			}
		})();

		await timebasedEventHandler.setupTimebaseEvents(client);
	},
};
