const { Client, Collection, SlashCommandBuilder, ContextMenuCommandBuilder } = require("discord.js"),
	{ GiveawaysManager } = require("discord-giveaways"),
	{ Player } = require("discord-player"),
	{ REST } = require("@discordjs/rest"),
	{ Routes } = require("discord-api-types/v10"),
	{ DiscordTogether } = require("../helpers/discordTogether");

const BaseEvent = require("./BaseEvent.js"),
	BaseCommand = require("./BaseCommand.js"),
	// AmeClient = require("amethyste-api"),
	path = require("path"),
	fs = require("fs").promises,
	mongoose = require("mongoose"),
	extractor = require("../helpers/extractor"),
	playdl = require("play-dl"),
	moment = require("moment");

moment.relativeTimeThreshold("ss", 5);
moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("m", 60);
moment.relativeTimeThreshold("h", 60);
moment.relativeTimeThreshold("d", 24);
moment.relativeTimeThreshold("M", 12);

// Creates JaBa class
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
		this.databaseCache.usersReminds = new Collection(); // members with active reminds
		this.databaseCache.mutedUsers = new Collection(); // members who are currently muted

		// if (this.config.apiKeys.amethyste) this.AmeAPI = new AmeClient(this.config.apiKeys.amethyste);

		this.discordTogether = new DiscordTogether(this);

		playdl.getFreeClientID().then(clientID => {
			playdl.setToken({
				soundcloud: {
					client_id: clientID
				}
			});
		});

		this.player = new Player(this);
		this.player.use("jaba", extractor);

		this.player
			.on("trackStart", async (queue, track) => {
				const m = await queue.metadata.channel.send({ content: this.translate("music/play:NOW_PLAYING", { songName: track.title }, queue.metadata.channel.guild.data.language) });
				if (track.durationMS > 1) {
					setTimeout(() => {
						if (m.deletable) m.delete();
					}, track.durationMS);
				} else {
					setTimeout(() => {
						if (m.deletable) m.delete();
					}, (10 * 60 * 1000)); // m * s * ms
				}
			})
			.on("queueEnd", queue => queue.metadata.channel.send(this.translate("music/play:QUEUE_ENDED", null, queue.metadata.channel.guild.data.language)))
			.on("channelEmpty", queue => queue.metadata.channel.send(this.translate("music/play:STOP_EMPTY", null, queue.metadata.channel.guild.data.language)))
			.on("connectionError", (queue, e) => {
				console.error(e);
				queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.channel.guild.data.language) });
			})
			.on("error", (queue, e) => {
				console.error(e);
				queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.channel.guild.data.language) });
			});

		this.giveawaysManager = new GiveawaysManager(this, {
			storage: "./giveaways.json",
			default: {
				botsCanWin: false,
				embedColor: this.config.embed.color,
				embedColorEnd: "#FF0000",
				reaction: "🎉"
			}
		});
	}

	async init() {
		this.login(this.config.token);

		mongoose.connect(this.config.mongoDB, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		}).then(() => {
			this.logger.log("Connected to the Mongodb database.", "log");
		}).catch((err) => {
			this.logger.log(`Unable to connect to the Mongodb database. Error: ${err}`, "error");
		});

		const autoUpdateDocs = require("../helpers/autoUpdateDocs");
		autoUpdateDocs.update(this);
	}

	/**
	 *
	 * @param {String} dir
	 * @returns
	 */
	async loadCommands(dir) {
		const filePath = path.join(__dirname, dir);
		var folders = await fs.readdir(filePath); folders = folders.map(file => path.join(filePath, file)).filter(async (path) => { path = await fs.lstat(path); path.isDirectory(); });
		const rest = new REST().setToken(this.config.token);
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
						if (command.aliases && Array.isArray(command.aliases) && command.aliases.length > 0) {
							command.aliases.forEach((alias) => {
								const command_alias = (command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder) ? { ...command.command.toJSON() } : { ...command.command };
								command_alias.name = alias;
								aliases.push(command_alias);
								this.commands.set(alias, command);
							});
						}

						commands.push((command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder) ? command.command.toJSON() : command.command, ...aliases);

						if (command.onLoad || typeof command.onLoad === "function") await command.onLoad(this);
						this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
					}
				}
			}
		}

		try {
			if (!this.config.production) {
				await rest.put(
					Routes.applicationGuildCommands(this.config.user, this.config.support.id), {
						body: commands
					}
				);
			} else {
				await rest.put(
					Routes.applicationCommands(this.config.user), {
						body: commands
					}
				);
			}

			this.logger.log("Successfully registered application commands.");
		} catch (err) {
			this.logger.log("Cannot load commands: " + err.message, "error");
		}
	}

	/**
	 *
	 * @param {String} dir
	 * @param {String} file
	 */
	async loadCommand(dir, file) {
		const Command = require(path.join(dir, `${file}.js`));
		if (Command.prototype instanceof BaseCommand) {
			const command = new Command(this);
			this.commands.set(command.command.name, command);
			const aliases = [];
			if (command.aliases && Array.isArray(command.aliases) && command.aliases.length > 0) {
				command.aliases.forEach((alias) => {
					const command_alias = command.command instanceof SlashCommandBuilder ? { ...command.command.toJSON() } : { ...command.command };
					command_alias.name = alias;
					aliases.push(command_alias);
					this.commands.set(alias, command);
				});
			}

			if (command.onLoad || typeof command.onLoad === "function") await command.onLoad(this);
			this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);

			return;
		}
	}

	/**
	 *
	 * @param {String} dir
	 * @param {String} name
	 */
	async unloadCommand(dir, name) {
		delete require.cache[require.resolve(`${dir}${path.sep}${name}.js`)];

		return;
	}

	/**
	 *
	 * @param {String} dir
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

	get defaultLanguage() {
		return this.languages.find(language => language.default).name;
	}

	/**
	 *
	 * @param {String} key
	 * @param {Array} args
	 * @param {String} locale
	 */
	translate(key, args, locale) {
		if (!locale) locale = this.defaultLanguage;
		const language = this.translations.get(locale);
		if (!language) throw "Invalid language set in data.";

		return language(key, args);
	}

	printDate(date, format, locale) {
		if (!locale) locale = this.defaultLanguage;
		const languageData = this.languages.find((language) => language.name === locale || language.aliases.includes(locale));
		if (!format) format = languageData.defaultMomentFormat;

		return moment(new Date(date))
			.locale(languageData.moment)
			.format(format);
	}

	convertTime(time, type, noPrefix, locale) {
		if (!type) type = false;
		if (!locale) locale = this.defaultLanguage;
		const languageData = this.languages.find((language) => language.name === locale || language.aliases.includes(locale));
		const m = moment(time).locale(languageData.moment);

		return (type ? m.toNow(noPrefix) : m.fromNow(noPrefix));
	}

	getNoun(number, one, two, five) {
		let n = Math.abs(number);
		n %= 100;
		if (n >= 5 && n <= 20) return five;
		n %= 10;
		if (n === 1) return one;
		if (n >= 2 && n <= 4) return two;

		return five;
	}

	async findOrCreateUser({ id: userID }, isLean) {
		if (this.databaseCache.users.get(userID)) return isLean ? this.databaseCache.users.get(userID).toJSON() : this.databaseCache.users.get(userID);
		else {
			let userData = (isLean ? await this.usersData.findOne({
				id: userID
			}).lean() : await this.usersData.findOne({
				id: userID
			}));
			if (userData) {
				if (!isLean) this.databaseCache.users.set(userID, userData);

				return userData;
			} else {
				userData = new this.usersData({
					id: userID
				});
				await userData.save();
				this.databaseCache.users.set(userID, userData);

				return isLean ? userData.toJSON() : userData;
			}
		}
	}

	async findOrCreateMember({ id: memberID, guildID }, isLean) {
		if (this.databaseCache.members.get(`${memberID}${guildID}`)) return isLean ? this.databaseCache.members.get(`${memberID}${guildID}`).toJSON() : this.databaseCache.members.get(`${memberID}${guildID}`);
		else {
			let memberData = (isLean ? await this.membersData.findOne({
				guildID,
				id: memberID
			}).lean() : await this.membersData.findOne({
				guildID,
				id: memberID
			}));
			if (memberData) {
				if (!isLean) this.databaseCache.members.set(`${memberID}${guildID}`, memberData);

				return memberData;
			} else {
				memberData = new this.membersData({
					id: memberID,
					guildID: guildID
				});
				await memberData.save();
				const guild = await this.findOrCreateGuild({
					id: guildID
				});
				if (guild) {
					guild.members.push(memberData._id);
					await guild.save();
				}
				this.databaseCache.members.set(`${memberID}${guildID}`, memberData);

				return isLean ? memberData.toJSON() : memberData;
			}
		}
	}

	async findOrCreateGuild({ id: guildID }, isLean) {
		if (this.databaseCache.guilds.get(guildID)) return isLean ? this.databaseCache.guilds.get(guildID).toJSON() : this.databaseCache.guilds.get(guildID);
		else {
			let guildData = (isLean ? await this.guildsData.findOne({
				id: guildID
			}).populate("members").lean() : await this.guildsData.findOne({
				id: guildID
			}).populate("members"));
			if (guildData) {
				if (!isLean) this.databaseCache.guilds.set(guildID, guildData);

				return guildData;
			} else {
				guildData = new this.guildsData({
					id: guildID
				});
				await guildData.save();
				this.databaseCache.guilds.set(guildID, guildData);

				return isLean ? guildData.toJSON() : guildData;
			}
		}
	}
}

module.exports = JaBa;