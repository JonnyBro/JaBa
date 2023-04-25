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
		this.dashboard = require("../dashboard/app");
		this.states = {};
		this.knownGuilds = [];

		this.databaseCache = {};
		this.databaseCache.users = new Collection();
		this.databaseCache.guilds = new Collection();
		this.databaseCache.members = new Collection();
		this.databaseCache.usersReminds = new Collection();
		this.databaseCache.mutedUsers = new Collection();

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
				}, (5 * 60 * 1000)); // m * s * ms
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
	 * Login into bot account, connect to DB and update docs
	 */
	async init() {
		this.login(this.config.token);

		mongoose.connect(this.config.mongoDB, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}).then(() => {
			this.logger.log("Connected to the Mongodb database.", "log");
		}).catch(err => {
			this.logger.log(`Unable to connect to the Mongodb database. Error: ${err}`, "error");
		});

		await this.player.extractors.loadDefault();

		const autoUpdateDocs = require("../helpers/autoUpdateDocs");
		autoUpdateDocs.update(this);
	}

	/**
	 * Load commands from directory
	 * @param {String} dir Directory where's all commands located
	 * @returns
	 */
	async loadCommands(dir) {
		const rest = new REST().setToken(this.config.token),
			filePath = path.join(__dirname, dir),
			folders = (await fs.readdir(filePath))
				.map(file => path.join(filePath, file))
				.filter(async path => (await fs.lstat(path)).isDirectory());

		const commands = [];
		for (let index = 0; index < folders.length; index++) {
			const folder = folders[index];
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
								const command_alias = (command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder) ? { ...command.command.toJSON() } : { ...command.command };
								command_alias.name = alias;
								aliases.push(command_alias);
								this.commands.set(alias, command);
							});

						commands.push((command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder) ? command.command.toJSON() : command.command, ...aliases);

						if (command.onLoad || typeof command.onLoad === "function") await command.onLoad(this);
						this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
					}
				}
			}
		}

		try {
			if (this.config.production)
				await rest.put(
					Routes.applicationCommands(this.config.user), {
						body: commands,
					},
				);
			else
				await rest.put(
					Routes.applicationGuildCommands(this.config.user, this.config.support.id), {
						body: commands,
					},
				);

			this.logger.log("Successfully registered application commands.");
		} catch (err) {
			this.logger.log("Cannot load commands: " + err.message, "error");
		}
	}

	/**
	 * Load single command in directory
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
	 * Unload command from cache
	 * @param {String} dir Directory of the command
	 * @param {String} name Name of the command
	 */
	async unloadCommand(dir, name) {
		delete require.cache[require.resolve(`${dir}${path.sep}${name}.js`)];

		return;
	}

	/**
	 * Load events from directory
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
	 * Get default language
	 * @returns {String} Default bot's language
	 */
	get defaultLanguage() {
		return this.languages.find(language => language.default).name;
	}

	/**
	 * Translate from key to language
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
	 * Find or create user in DB
	 * @param {Array} param0 { id: User ID }
	 * @param {Boolean} isLean Return JSON instead Mongoose model?
	 * @returns {import("./User")} Mongoose model or JSON of this user
	 */
	async findOrCreateUser({ id: userID }, isLean) {
		if (this.databaseCache.users.get(userID)) return isLean ? this.databaseCache.users.get(userID).toJSON() : this.databaseCache.users.get(userID);
		else {
			let userData = (isLean ? await this.usersData.findOne({
				id: userID,
			}).lean() : await this.usersData.findOne({
				id: userID,
			}));
			if (userData) {
				if (!isLean) this.databaseCache.users.set(userID, userData);

				return userData;
			} else {
				userData = new this.usersData({
					id: userID,
				});
				await userData.save();
				this.databaseCache.users.set(userID, userData);

				return isLean ? userData.toJSON() : userData;
			}
		}
	}

	/**
	 * Find or create member in DB
	 * @param {Array} param0 { id: Member ID }
	 * @param {Boolean} isLean Return JSON instead Mongoose model?
	 * @returns {import("./Member")} Mongoose model or JSON of this member
	 */
	async findOrCreateMember({ id: memberID, guildId }, isLean) {
		if (this.databaseCache.members.get(`${memberID}${guildId}`)) return isLean ? this.databaseCache.members.get(`${memberID}${guildId}`).toJSON() : this.databaseCache.members.get(`${memberID}${guildId}`);
		else {
			let memberData = (isLean ? await this.membersData.findOne({
				guildID: guildId,
				id: memberID,
			}).lean() : await this.membersData.findOne({
				guildID: guildId,
				id: memberID,
			}));
			if (memberData) {
				if (!isLean) this.databaseCache.members.set(`${memberID}${guildId}`, memberData);

				return memberData;
			} else {
				memberData = new this.membersData({
					id: memberID,
					guildID: guildId,
				});
				await memberData.save();
				const guild = await this.findOrCreateGuild({
					id: guildId,
				});
				if (guild) {
					guild.members.push(memberData._id);
					await guild.save();
				}
				this.databaseCache.members.set(`${memberID}${guildId}`, memberData);

				return isLean ? memberData.toJSON() : memberData;
			}
		}
	}

	/**
	 * Find or create guild in DB
	 * @param {Array} param0 { id: Guild ID }
	 * @param {Boolean} isLean Return JSON instead Mongoose model?
	 * @returns {import("./Guild")} Mongoose model or JSON of this guild
	 */
	async findOrCreateGuild({ id: guildId }, isLean) {
		if (this.databaseCache.guilds.get(guildId)) return isLean ? this.databaseCache.guilds.get(guildId).toJSON() : this.databaseCache.guilds.get(guildId);
		else {
			let guildData = (isLean ? await this.guildsData.findOne({
				id: guildId,
			}).populate("members").lean() : await this.guildsData.findOne({
				id: guildId,
			}).populate("members"));
			if (guildData) {
				if (!isLean) this.databaseCache.guilds.set(guildId, guildData);

				return guildData;
			} else {
				guildData = new this.guildsData({
					id: guildId,
				});
				await guildData.save();
				this.databaseCache.guilds.set(guildId, guildData);

				return isLean ? guildData.toJSON() : guildData;
			}
		}
	}
}

module.exports = JaBa;