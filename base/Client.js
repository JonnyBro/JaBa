const { Client, Collection, SlashCommandBuilder, ContextMenuCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js"),
	{ Player } = require("discord-player"),
	{ GiveawaysManager } = require("discord-giveaways"),
	{ REST } = require("@discordjs/rest"),
	{ Routes } = require("discord-api-types/v10");

const BaseEvent = require("./BaseEvent.js"),
	BaseCommand = require("./BaseCommand.js"),
	path = require("path"),
	fs = require("fs").promises,
	mongoose = require("mongoose");

class JaBaClient extends Client {
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

		this.player = new Player(this);

		this.player.extractors.loadDefault();

		this.player.events.on("playerStart", async (queue, track) => {
			const m = (
				await queue.metadata.channel.send({
					content: this.translate("music/play:NOW_PLAYING", { songName: track.title }, queue.metadata.channel.guild.data.language),
				})
			).id;

			if (track.durationMS > 1)
				setTimeout(() => {
					const message = queue.metadata.channel.messages.cache.get(m);

					if (message && message.deletable) message.delete();
				}, track.durationMS);
			else
				setTimeout(() => {
					const message = queue.metadata.channel.messages.cache.get(m);

					if (message && message.deletable) message.delete();
				}, 5 * 60 * 1000);
		});
		this.player.events.on("emptyQueue", queue => queue.metadata.channel.send(this.translate("music/play:QUEUE_ENDED", null, queue.metadata.channel.guild.data.language)));
		this.player.events.on("emptyChannel", queue => queue.metadata.channel.send(this.translate("music/play:STOP_EMPTY", null, queue.metadata.channel.guild.data.language)));
		this.player.events.on("playerError", (queue, e) => {
			queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.channel.guild.data.language) });
			console.log(e);
		});
		this.player.events.on("error", (queue, e) => {
			queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.channel.guild.data.language) });
			console.log(e);
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
	 * Logins into the account and connects to the database
	 */
	async init() {
		this.login(this.config.token);

		mongoose
			.connect(this.config.mongoDB)
			.then(() => {
				this.logger.log("Connected to the Mongodb database.");
			})
			.catch(err => {
				this.logger.error(`Unable to connect to the Mongodb database.\nError: ${err}`);
			});

		// const autoUpdateDocs = require("../helpers/autoUpdateDocs");
		// autoUpdateDocs.update(this);
	}

	/**
	 * Loads all commands from directory
	 * @param {String} dir Directory where commands are located
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

						if (command.onLoad && typeof command.onLoad === "function") await command.onLoad(this);

						commands.push(command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder ? command.command.toJSON() : command.command);

						this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
					}
				}
			}
		}

		try {
			if (this.config.production) await rest.put(Routes.applicationCommands(this.config.userId), { body: commands });
			else await rest.put(Routes.applicationGuildCommands(this.config.userId, this.config.support.id), { body: commands });

			this.logger.log("Successfully registered application commands.");
		} catch (err) {
			this.logger.error(`Error during commands registration!\n${err.message}`);
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
		const lang = this.translations.get(locale);

		return lang(key, args);
	}

	/**
	 * Returns an embed created from given data
	 * @param {Object} data Data for embed
	 * @returns {import("discord.js").Embed}
	 */
	embed(data) {
		const embed = new EmbedBuilder()
			.setTitle(data.title || null)
			.setDescription(data.description || null)
			.setThumbnail(data.thumbnail || null)
			.addFields(data.fields || [])
			.setImage(data.image || null)
			.setURL(data.url || null)
			.setColor(data.color || this.config.embed.color)
			.setFooter(data.footer || this.config.embed.footer);

		if (data.timestamp) embed.setTimestamp(data.timestamp);
		else if (data.timestamp === null) embed.setTimestamp(null);
		else embed.setTimestamp();

		if (typeof data.author === "string") embed.setAuthor({ name: data.author, iconURL: this.user.avatarURL() });
		else if (typeof data.author === "object" && (data.author.iconURL !== null || data.author.iconURL !== undefined)) embed.setAuthor({ name: data.author.name, iconURL: this.user.avatarURL() });
		else if (!data.author || data.author === null) embed.setAuthor(null);
		else embed.setAuthor(data.author);

		return embed;
	}

	/**
	 * Creates an invite link for guild
	 * @param {String} guildId Guild ID
	 * @returns {String} Invite link
	 */
	async createInvite(guildId) {
		const guild = this.guilds.cache.get(guildId),
			member = guild.members.me,
			channel = guild.channels.cache.find(ch => ch.permissionsFor(member.id).has(PermissionsBitField.FLAGS.CREATE_INSTANT_INVITE) && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice));

		if (channel) return (await channel.createInvite()).url || "No channels found or missing permissions";
	}

	/**
	 * Loads a single command from directory
	 * @param {String} dir Directory where command is located
	 * @param {String} file Filename of the command
	 */
	async loadCommand(dir, file) {
		const Command = require(path.join(dir, `${file}.js`));
		if (!(Command.prototype instanceof BaseCommand)) return this.logger.error("Tried to load a non-command file!");

		const command = new Command(this);
		this.commands.set(command.command.name, command);

		if (command.onLoad && typeof command.onLoad === "function") await command.onLoad(this);

		return this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
	}

	/**
	 * Unloads a command
	 * @param {String} dir Directory where command is located
	 * @param {String} name Command name
	 * @returns
	 */
	async unloadCommand(dir, name) {
		delete require.cache[require.resolve(`${dir}${path.sep}${name}.js`)];

		return;
	}

	/**
	 * Loads all events from directory recursively
	 * @param {String} dir Directory where events are located
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
	 * Finds or creates a user in the database
	 * @param {String} userID User ID
	 * @returns {Promise<import("./User")>} Mongoose model
	 */
	async findOrCreateUser(userID) {
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

	/**
	 * Finds or creates a guild's member in the database
	 * @param {Array} { id: Member ID, Guild ID }
	 * @returns {Promise<import("./Member")>} Mongoose model
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
	 * @returns {Promise<import("./Guild")>} Mongoose model
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

module.exports = JaBaClient;
