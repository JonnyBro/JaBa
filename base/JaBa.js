const { Client, Collection, SlashCommandBuilder, ContextMenuCommandBuilder } = require("discord.js"),
	{ Player } = require("discord-player"),
	{ GiveawaysManager } = require("discord-giveaways"),
	{ REST } = require("@discordjs/rest"),
	{ Routes } = require("discord-api-types/v10");

const BaseEvent = require("./BaseEvent.js"),
	BaseCommand = require("./BaseCommand.js"),
	path = require("path"),
	fs = require("fs").promises,
	mongoose = require("mongoose");

class JaBa extends Client {
	constructor(options) {
		super(options);
		this.config = require("../config");
		this.customEmojis = require("../emojis");
		this.languages = require("../languages/language-meta");
		this.commands = new Collection();
		this.logger = require("../helpers/logger");
		this.wait = require("node:timers/promises").setTimeout;
		this.functions = require("../helpers/functions");
		this.guildsData = require("../base/Guild");
		this.usersData = require("../base/User");
		this.membersData = require("../base/Member");
		this.dashboard = require("../dashboard/dashboard");
		this.states = {};
		this.knownGuilds = [];

		this.databaseCache = {};
		this.databaseCache.users = new Collection();
		this.databaseCache.guilds = new Collection();
		this.databaseCache.members = new Collection();
		this.databaseCache.usersReminds = new Collection();

		this.player = Player.singleton(this, {
			autoRegisterExtractor: false,
		});

		this.player.events.on("playerStart", async (queue, track) => {
			const m = await queue.metadata.channel.send({ content: this.translate("music/play:NOW_PLAYING", { songName: track.title }, queue.metadata.channel.guild.data.language) });
			if (track.durationMS > 1)
				setTimeout(() => {
					if (m.deletable) m.delete();
				}, track.durationMS);
			else
				setTimeout(() => {
					if (m.deletable) m.delete();
				}, 5 * 60 * 1000); // m * s * ms
		});
		this.player.events.on("emptyQueue", queue => queue.metadata.channel.send(this.translate("music/play:QUEUE_ENDED", null, queue.metadata.channel.guild.data.language)));
		this.player.events.on("emptyChannel", queue => queue.metadata.channel.send(this.translate("music/play:STOP_EMPTY", null, queue.metadata.channel.guild.data.language)));
		this.player.events.on("playerError", (queue, e) => {
			console.log(e);
			queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.channel.guild.data.language) });
		});
		this.player.events.on("error", (queue, e) => {
			console.log(e);
			queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.channel.guild.data.language) });
		});

		this.giveawaysManager = new GiveawaysManager(this, {
			storage: "./giveaways.json",
			default: {
				botsCanWin: false,
				embedColor: this.config.embed.color,
				embedColorEnd: "#FF0000",
				reaction: "🎉",
			},
		});
	}

	/**
	 * Login into account and connect to DB
	 */
	async init() {
		this.login(this.config.token);

		mongoose
			.connect(this.config.mongoDB)
			.then(() => {
				this.logger.log("Connected to the Mongodb database.", "log");
			})
			.catch(err => {
				this.logger.log(`Unable to connect to the Mongodb database.\nError: ${err}`, "error");
			});

		await this.player.extractors.loadDefault();

		// const autoUpdateDocs = require("../helpers/autoUpdateDocs");
		// autoUpdateDocs.update(this);
	}

	/**
	 * Loads commands from directory
	 * @param {String} dir Directory where's all commands located
	 * @returns
	 */
	async loadCommands(dir) {
		const rest = new REST().setToken(this.config.token),
			filePath = path.join(__dirname, dir),
			folders = (await fs.readdir(filePath)).map(file => path.join(filePath, file)).filter(async path => (await fs.lstat(path)).isDirectory());

		const commands = [];
		for (let index = 0; index < folders.length; index++) {
			const folder = folders[index];

			if (folder.endsWith("!DISABLED")) continue;

			const files = await fs.readdir(folder);

			for (let index = 0; index < files.length; index++) {
				const file = files[index];

				if (file.endsWith(".js")) {
					const Command = require(path.join(folder, file));
					if (Command.prototype instanceof BaseCommand) {
						const command = new Command(this);
						this.commands.set(command.command.name, command);
						const aliases = [];
						if (command.aliases && Array.isArray(command.aliases) && command.aliases.length > 0)
							command.aliases.forEach(alias => {
								const command_alias = command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder ? { ...command.command.toJSON() } : { ...command.command };
								command_alias.name = alias;
								aliases.push(command_alias);
								this.commands.set(alias, command);
							});

						commands.push(command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder ? command.command.toJSON() : command.command, ...aliases);

						if (command.onLoad || typeof command.onLoad === "function") await command.onLoad(this);
						this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
					}
				}
			}
		}

		try {
			if (this.config.production)
				await rest.put(Routes.applicationCommands(this.config.userId), {
					body: commands,
				});
			else
				await rest.put(Routes.applicationGuildCommands(this.config.userId, this.config.support.id), {
					body: commands,
				});

			this.logger.log("Successfully registered application commands.");
		} catch (err) {
			this.logger.log("Cannot load commands: " + err.message, "error");
		}
	}

	/**
	 * Loads single command in directory
	 * @param {String} dir Directory where command is
	 * @param {String} file Filename of the command
	 */
	async loadCommand(dir, file) {
		const Command = require(path.join(dir, `${file}.js`));
		if (Command.prototype instanceof BaseCommand) {
			const command = new Command(this);
			this.commands.set(command.command.name, command);
			const aliases = [];
			if (command.aliases && Array.isArray(command.aliases) && command.aliases.length > 0)
				command.aliases.forEach(alias => {
					const command_alias = command.command instanceof SlashCommandBuilder ? { ...command.command.toJSON() } : { ...command.command };
					command_alias.name = alias;
					aliases.push(command_alias);
					this.commands.set(alias, command);
				});

			if (command.onLoad || typeof command.onLoad === "function") await command.onLoad(this);
			this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);

			return;
		}
	}

	/**
	 * Unloads command from cache
	 * @param {String} dir Directory of the command
	 * @param {String} name Name of the command
	 */
	async unloadCommand(dir, name) {
		delete require.cache[require.resolve(`${dir}${path.sep}${name}.js`)];

		return;
	}

	/**
	 * Loads events from directory
	 * @param {String} dir Directory where's all events located
	 * @returns
	 */
	async loadEvents(dir) {
		const filePath = path.join(__dirname, dir);
		const files = await fs.readdir(filePath);
		for (let index = 0; index < files.length; index++) {
			const file = files[index];
			const stat = await fs.lstat(path.join(filePath, file));
			if (stat.isDirectory()) this.loadEvents(path.join(dir, file));
			if (file.endsWith(".js")) {
				const Event = require(path.join(filePath, file));
				if (Event.prototype instanceof BaseEvent) {
					const event = new Event();
					if (!event.name || !event.name.length) return console.error(`Cannot load "${file}" event file: Event name is not set!`);
					if (event.once) this.once(event.name, event.execute.bind(event, this));
					else this.on(event.name, event.execute.bind(event, this));
					this.logger.log(`Successfully loaded "${file}" event file. (Event: ${event.name})`);
				}
			}
		}
	}

	/**
	 * @returns {String} Bot's default language
	 */
	get defaultLanguage() {
		return this.languages.find(language => language.default).name;
	}

	/**
	 * Translates from a key to language
	 * @param {String} key Key
	 * @param {Array} args Arguments for translation
	 * @param {String} locale Language
	 */
	translate(key, args, locale = this.defaultLanguage) {
		const language = this.translations.get(locale);
		if (!language) throw "Invalid language set in data.";

		return language(key, args);
	}

	/**
	 * Finds or creates user in DB
	 * @param {String} userID User ID
	 * @returns {import("./User")} Mongoose model
	 */
	async findOrCreateUser(userID) {
		if (this.databaseCache.users.get(userID)) return this.databaseCache.users.get(userID);
		else {
			let userData = await this.usersData.findOne({ id: userID });

			if (userData) {
				this.databaseCache.users.set(userID, userData);

				return userData;
			} else {
				userData = new this.usersData({ id: userID });
				await userData.save();

				this.databaseCache.users.set(userID, userData);

				return userData;
			}
		}
	}

	/**
	 * Finds or creates member in DB
	 * @param {Array} { id: Member ID, Guild ID }
	 * @returns {import("./Member")} Mongoose model
	 */
	async findOrCreateMember({ id: memberID, guildId }) {
		let memberData = await this.membersData.findOne({ guildID: guildId, id: memberID });

		if (memberData) {
			this.databaseCache.members.set(`${memberID}${guildId}`, memberData);

			return memberData;
		} else {
			memberData = new this.membersData({ id: memberID, guildID: guildId });
			await memberData.save();

			const guildData = await this.findOrCreateGuild(guildId);

			if (guildData) {
				guildData.members.push(memberData._id);

				await guildData.save();
			}

			this.databaseCache.members.set(`${memberID}${guildId}`, memberData);

			return memberData;
		}
	}

	/**
	 * Finds or creates guild in DB
	 * @param {String} guildId Guild ID
	 * @returns {import("./Guild")} Mongoose model
	 */
	async findOrCreateGuild(guildId) {
		let guildData = await this.guildsData.findOne({ id: guildId }).populate("members");

		if (guildData) {
			this.databaseCache.guilds.set(guildId, guildData);

			return guildData;
		} else {
			guildData = new this.guildsData({ id: guildId });
			await guildData.save();

			this.databaseCache.guilds.set(guildId, guildData);

			return guildData;
		}
	}
}

module.exports = JaBa;
