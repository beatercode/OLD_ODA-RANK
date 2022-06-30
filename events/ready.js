require("dotenv").config()
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const logger = require("../helper/_logger")
const timebasedEventHandler = require("../custom/timebasedEventHandler")
const config = require("../backup/config.json")
const Users = require("../models/Users")

const wait = require("timers/promises").setTimeout

module.exports = {
	name: "ready",
	once: true,
	async execute(client, commands) {
		const DB_SETTINGS = config.Settings.values
		logger.info(DB_SETTINGS.BOT_NAME + " is online | ----> RUN")
		await wait(1000)

		const CLIENT_ID = client.user.id
		client.application.commands.set([])
		const rest = new REST({
			version: "9",
		}).setToken(process.env.TOKEN);

		(async () => {
			try {

				if (process.env.ENV === "PROD") {
					await rest.put(Routes.applicationCommands(CLIENT_ID), {
						body: commands,
					})
					console.log("Successfully registered commands globally.")
				} else {
					await rest.put(
						Routes.applicationGuildCommands(CLIENT_ID, DB_SETTINGS.GUILD_ID),
						{
							body: commands,
						}
					)
					console.log("Successfully registered commands locally.")
				}
			} catch (err) {
				if (err) { console.error(err); logger.error(err) }
			}
		})()

		await timebasedEventHandler.setupTimebaseEvents(client)
		
		/*
		const guild = client.guilds.cache.get(DB_SETTINGS.GUILD_ID);
		const idlist = []
		await guild.members.fetch().then(async members => {
			await members.forEach(async member => {
				var date = new Date(member.joinedAt)
		  		let jdate =  date.getDate() + "/" + (date.getMonth()+1)
				if((date.getMonth()+1) < 6 || ((date.getMonth()+1) == 6 && date.getDate() < 3)) {
					idlist.push(member.id)
				}
			});
		});
		let up = await Users.updateMany({user_id: { $in: idlist }}, { $inc: { points: 1000 }})
		console.log(up)
		*/
	},
}

function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
}
