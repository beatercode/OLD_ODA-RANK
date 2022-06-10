require("dotenv").config();
const fs = require("fs");
const config = require("./backup/config.json");
const Database = require("./config/Database");

const db = new Database();
db.connect();

const { Client, Intents, Collection } = require("discord.js");
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_INVITES
	],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
const commands = [];
client.commands = new Collection();
const hidden_commands = config.Settings.values.HIDDEN_COMMAND;

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	if (hidden_commands.includes(command.data.name)) continue
	commands.push(command.data.toJSON());
	client.commands.set(command.data.name, command);
}

const eventFiles = fs
	.readdirSync("./events")
	.filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, commands));
	} else {
		client.on(event.name, (...args) => event.execute(...args, commands));
	}
}

client.login(process.env.TOKEN);