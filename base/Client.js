const { Client, Collection, SlashCommandBuilder, ContextMenuCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js"),
	{ GiveawaysManager } = require("discord-giveaways"),
	{ REST } = require("@discordjs/rest"),
	{ LavalinkManager } = require("lavalink-client"),
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

		this.lavalink = new LavalinkManager({
			nodes: [this.config.lavalinkNodes],
			sendToShard: (guildId, payload) => this.guilds.cache.get(guildId)?.shard?.send(payload),
			client: {
				id: this.config.userId,
				username: "JaBa",
			},
			autoSkip: true,
			playerOptions: {
				defaultSearchPlatform: "ytmsearch",
				volumeDecrementer: 1,
				onDisconnect: {
					autoReconnect: false,
					destroyPlayer: true,
				},
				onEmptyQueue: {
					destroyAfterMs: 5000,
				},
			},
		});

		this.lavalink.on("trackStart", async (player, track) => {
			const guildData = await this.findOrCreateGuild(player.guildId),
				channel = this.channels.cache.get(player.textChannelId);

			const m = (
				await channel.send({
					content: this.translate("music/play:NOW_PLAYING", { songName: `${track.info.title} - ${track.info.author}` }, guildData.language),
				})
			).id;

			if (track.info.duration > 1)
				setTimeout(() => {
					const message = channel.messages.cache.get(m);

					if (message && message.deletable) message.delete();
				}, track.info.duration);
			else
				setTimeout(() => {
					const message = channel.messages.cache.get(m);

					if (message && message.deletable) message.delete();
				}, 5 * 60 * 1000);
		});
		this.lavalink.on("queueEnd", async player => {
			const guildData = await this.findOrCreateGuild(player.guildId),
				channel = this.channels.cache.get(player.textChannelId);

			channel.send(this.translate("music/play:QUEUE_ENDED", null, guildData.language));
		});
		this.lavalink.on("trackError", async player => {
			const guildData = await this.findOrCreateGuild(player.guildId),
				channel = this.channels.cache.get(player.textChannelId);

			channel.send({ content: this.translate("music/play:ERR_OCCURRED", null, guildData.language) });
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
	 * Initializes the client by logging in with the provided token and connecting to the MongoDB database.
	 *
	 * This method is called during the client's startup process to set up the necessary connections and resources.
	 *
	 * @returns {Promise<void>} A Promise that resolves when the client is fully initialized.
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
	 * Loads all the commands from the specified directory and registers them with the Discord API.
	 *
	 * This method is responsible for dynamically loading all the command files from the specified directory,
	 * creating instances of the corresponding command classes, and registering the commands with the Discord API.
	 * It also handles any additional setup or initialization required by the loaded commands.
	 *
	 * @param {string} dir - The directory path where the command files are located.
	 * @returns {Promise<void>} A Promise that resolves when all the commands have been loaded and registered.
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
			console.log(err);
		}
	}

	/**
	 * Returns the default language from the list of available languages.
	 * @returns {Language} The default language.
	 */
	get defaultLanguage() {
		return this.languages.find(language => language.default);
	}

	/**
	 * Translates a key using the specified locale, or the default language if no locale is provided.
	 * @param {string} key The translation key to look up.
	 * @param {any[]} args Any arguments to pass to the translation function.
	 * @param {string} [locale=this.defaultLanguage.name] The locale to use for the translation. Defaults to the default language.
	 * @returns {string} The translated string.
	 */
	translate(key, args, locale = this.defaultLanguage.name) {
		const lang = this.translations.get(locale);

		return lang(key, args);
	}

	/**
	 * Generates an EmbedBuilder instance with the provided data.
	 * @param {Object} data - The data to use for the embed.
	 * @param {string} [data.title] - The title of the embed.
	 * @param {string} [data.description] - The description of the embed.
	 * @param {string} [data.thumbnail] - The URL of the thumbnail image for the embed.
	 * @param {Object[]} [data.fields] - An array of field objects for the embed.
	 * @param {string} [data.image] - The URL of the image for the embed.
	 * @param {string} [data.url] - The URL to be used as the embed's hyperlink.
	 * @param {number} [data.color] - The color of the embed's border. If not provided, the default color from the client's configuration will be used.
	 * @param {string} [data.footer] - The text to be displayed as the embed's footer. If not provided, the default footer from the client's configuration will be used.
	 * @param {Date} [data.timestamp] - The timestamp to be displayed in the embed's footer. If not provided, the current timestamp will be used.
	 * @param {string|Object} [data.author] - The author information for the embed. Can be a string (name) or an object with `name` and/or `iconURL` properties.
	 * @returns {EmbedBuilder} The generated EmbedBuilder instance.
	 */
	embed(data) {
		const embed = new EmbedBuilder()
			.setTitle(data.title || null)
			.setDescription(data.description || null)
			.setThumbnail(data.thumbnail || null)
			.addFields(data.fields || [])
			.setImage(data.image || null)
			.setURL(data.url || null);

		if (data.color) embed.setColor(data.color);
		else if (data.color === null) embed.setColor(null);
		else embed.setColor(this.config.embed.color);

		if (data.footer) embed.setFooter(data.footer);
		else if (data.footer === null) embed.setFooter(null);
		else embed.setFooter(this.config.embed.footer);

		if (data.timestamp) embed.setTimestamp(data.timestamp);
		else if (data.timestamp === null) embed.setTimestamp(null);
		else embed.setTimestamp();

		if (!data.author || data.author === null) embed.setAuthor(null);
		else if (typeof data.author === "string") embed.setAuthor({ name: data.author, iconURL: this.user.avatarURL() });
		else if (typeof data.author === "object" && (data.author.iconURL !== null || data.author.iconURL !== undefined)) embed.setAuthor({ name: data.author.name, iconURL: data.author.iconURL });
		else embed.setAuthor(data.author);

		return embed;
	}

	/**
	 * Creates an invite for the specified guild.
	 * @param {string} guildId - The ID of the guild to create the invite for.
	 * @returns {Promise<string>} The URL of the created invite, or an error message if no suitable channel was found or the bot lacks the necessary permissions.
	 */
	async createInvite(guildId) {
		const guild = this.guilds.cache.get(guildId),
			member = guild.members.me,
			channel = guild.channels.cache.find(ch => ch.permissionsFor(member.id).has(PermissionsBitField.FLAGS.CREATE_INSTANT_INVITE) && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice));

		if (channel) return (await channel.createInvite()).url || "No channels found or missing permissions";
	}

	/**
	 * Loads a command from the specified directory and file.
	 * @param {string} dir - The directory containing the command file.
	 * @param {string} file - The name of the command file (without the .js extension).
	 * @returns {Promise<string>} A log message indicating the successful loading of the command.
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
	 * Unloads a command from the specified directory and file.
	 * @param {string} dir - The directory containing the command file.
	 * @param {string} name - The name of the command file (without the .js extension).
	 * @returns {void} This method does not return a value.
	 */
	async unloadCommand(dir, name) {
		delete require.cache[require.resolve(`${dir}${path.sep}${name}.js`)];

		return;
	}

	/**
	 * Loads all event files from the specified directory and its subdirectories.
	 * @param {string} dir - The directory containing the event files.
	 * @returns {void} This method does not return a value.
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
	 * Finds or creates a user in the database based on the provided user ID.
	 * @param {string} userID - The ID of the user to find or create.
	 * @returns {import("./User")} The user data object, either retrieved from the database or newly created.
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
	 * Finds or creates a member in the database based on the provided member ID and guild ID.
	 * @param {Object} options - The options for finding or creating the member.
	 * @param {string} options.id - The ID of the member to find or create.
	 * @param {string} options.guildId - The ID of the guild the member belongs to.
	 * @returns {import("./Member")} The member data object, either retrieved from the database or newly created.
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
	 * Finds or creates a guild in the database based on the provided guild ID.
	 * @param {string} guildId - The ID of the guild to find or create.
	 * @returns {import("./Guild")} The guild data object, either retrieved from the database or newly created.
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
