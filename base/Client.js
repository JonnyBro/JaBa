const { Client, Collection, SlashCommandBuilder, ContextMenuCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js"),
	{ GiveawaysManager } = require("discord-giveaways"),
	{ REST } = require("@discordjs/rest"),
	{ Player: DiscordPlayer } = require("discord-player"),
	{ SpotifyExtractor } = require("@discord-player/extractor"),
	{ YoutubeiExtractor } = require("discord-player-youtubei"),
	{ Routes } = require("discord-api-types/v10");

const BaseEvent = require("./BaseEvent.js"),
	BaseCommand = require("./BaseCommand.js").default,
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

		this.databaseCache = {};
		this.databaseCache.users = new Collection();
		this.databaseCache.guilds = new Collection();
		this.databaseCache.members = new Collection();
		this.databaseCache.usersReminds = new Collection();
	}

	/**
	 * Initializes the client by logging in with the provided token and connecting to the MongoDB database.
	 *
	 * This method is called during the client's startup process to set up the necessary connections and resources.
	 *
	 * @returns {Promise<void>} A Promise that resolves when the client is fully initialized.
	 */
	async init() {
		this.player = new DiscordPlayer(this);

		await this.player.extractors.register(YoutubeiExtractor, {
			authentication: this.config.youtubeCookie,
			streamOptions: {
				useClient: "IOS",
				highWaterMark: 2 * 1024 * 1024, // 2MB, default is 512 KB (512 * 1024)
			},
		});

		await this.player.extractors.register(SpotifyExtractor, {
			clientId: this.config.spotify.clientId,
			clientSecret: this.config.spotify.clientSecret,
		});

		await this.player.extractors.loadDefault(ext => !["YouTubeExtractor", "SpotifyExtractor"].includes(ext));

		this.player.events.on("playerStart", async (queue, track) => {
			const m = (
				await queue.metadata.channel.send({
					content: this.translate(
						"music/play:NOW_PLAYING",
						{
							songName: `${track.title} - ${track.author}`,
							songURL: track.url,
						},
						queue.metadata.data.guild.language,
					),
				})
			).id;

			if (track.durationMS > 1)
				setTimeout(() => {
					const message = queue.metadata.channel.messages.cache.get(m);

					if (message && message.deletable) message.delete();
				}, track.durationMS);
			else
				setTimeout(
					() => {
						const message = queue.metadata.channel.messages.cache.get(m);

						if (message && message.deletable) message.delete();
					},
					5 * 60 * 1000,
				);
		});
		this.player.events.on("emptyQueue", queue => queue.metadata.channel.send(this.translate("music/play:QUEUE_ENDED", null, queue.metadata.data.guild.language)));
		this.player.events.on("emptyChannel", queue => queue.metadata.channel.send(this.translate("music/play:STOP_EMPTY", null, queue.metadata.data.guild.language)));
		this.player.events.on("playerError", (queue, e) => {
			queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.data.guild.language) });
			console.log(e);
		});
		this.player.events.on("error", (queue, e) => {
			queue.metadata.channel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e.message }, queue.metadata.data.guild.language) });
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

		mongoose
			.connect(this.config.mongoDB)
			.then(() => {
				this.logger.log("Connected to the MongoDB database.");
			})
			.catch(e => {
				this.logger.error(`Unable to connect to the MongoDB database.\nError: ${e.message}\n${e.stack}`);
			});

		this.login(this.config.token);
	}

	/**
	 * Loads all the commands from the specified directory and registers them with the Discord API.
	 *
	 * This method dynamically loads all command files from the specified directory,
	 * creates instances of the corresponding command classes, and registers them with the Discord API.
	 *
	 * @param {string} dir - The directory path where the command files are located.
	 * @returns {Promise<void>} A Promise that resolves when all the commands have been loaded and registered.
	 */
	async loadCommands(dir) {
		const rest = new REST().setToken(this.config.token),
			filePath = path.join(__dirname, dir),
			folders = (await fs.readdir(filePath)).map(file => path.join(filePath, file));

		const commands = [];
		for (const folder of folders) {
			const files = await fs.readdir(folder);

			for (const file of files) {
				if (!file.endsWith(".js")) continue;

				const Command = require(path.join(folder, file));

				if (!(Command.prototype instanceof BaseCommand)) continue;

				const command = new Command(this);
				this.commands.set(command.command.name, command);

				if (typeof command.onLoad === "function") await command.onLoad(this);

				commands.push(command.command instanceof SlashCommandBuilder || command.command instanceof ContextMenuCommandBuilder ? command.command.toJSON() : command.command);

				this.logger.log(`Successfully loaded "${file}" command. (Command: ${command.command.name})`);
			}
		}

		try {
			const route = this.config.production ? Routes.applicationCommands(this.config.userId) : Routes.applicationGuildCommands(this.config.userId, this.config.support.id);

			await rest.put(route, { body: commands });

			this.logger.log("Successfully registered application commands.");
		} catch (err) {
			this.logger.error("Error registering application commands:", err);
		}
	}

	/**
	 * Loads a command from the specified directory and file.
	 * @param {string} dir - The directory containing the command file.
	 * @param {string} file - The name of the command file (without the .js extension).
	 * @returns {Promise<void>} This method does not return a value.
	 */
	async loadCommand(dir, file) {
		try {
			const Command = require(path.join(dir, `${file}.js`));

			if (!(Command.prototype instanceof BaseCommand)) {
				return this.logger.error(`Tried to load a non-command file: "${file}.js"`);
			}

			const command = new Command(this);
			this.commands.set(command.command.name, command);

			if (typeof command.onLoad === "function") await command.onLoad(this);

			this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
		} catch (error) {
			this.logger.error(`Error loading command "${file}":`, error);
		}
	}

	/**
	 * Unloads a command from the specified directory and file.
	 * @param {string} dir - The directory containing the command file.
	 * @param {string} name - The name of the command file (without the .js extension).
	 * @returns {void} This method does not return a value.
	 */
	unloadCommand(dir, name) {
		delete require.cache[require.resolve(`${dir}${path.sep}${name}.js`)];

		return;
	}

	/**
	 * Loads all event files from the specified directory and its subdirectories.
	 * @param {string} dir - The directory containing the event files.
	 * @returns {Promise<void>} This method does not return a value.
	 */
	async loadEvents(dir) {
		const filePath = path.join(__dirname, dir);
		const files = await fs.readdir(filePath);

		for (const file of files) {
			const fullPath = path.join(filePath, file);
			const stat = await fs.lstat(fullPath);

			if (stat.isDirectory()) {
				await this.loadEvents(path.join(dir, file));
				continue;
			}

			if (file.endsWith(".js")) {
				try {
					const Event = require(fullPath);

					if (!(Event.prototype instanceof BaseEvent)) {
						this.logger.error(`"${file}" is not a valid event file.`);
						continue;
					}

					const event = new Event();

					if (!event.name || !event.name.length) {
						this.logger.error(`Cannot load "${file}" event: Event name is missing!`);
						continue;
					}

					event.once ? this.once(event.name, event.execute.bind(event, this)) : this.on(event.name, event.execute.bind(event, this));

					this.logger.log(`Successfully loaded "${file}" event. (Event: ${event.name})`);
				} catch (error) {
					this.logger.error(`Error loading event "${file}":`, error);
				}
			}
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
	 * @param {string} [data.color] - The HEX color of the embed's border.
	 * @param {string|Object} [data.footer] - The text to be displayed as the embed's footer.
	 * @param {Date} [data.timestamp] - The timestamp to be displayed in the embed.
	 * @param {string|Object} [data.author] - The author information for the embed.
	 * @returns {EmbedBuilder} The generated EmbedBuilder instance.
	 */
	embed(data) {
		const embed = new EmbedBuilder()
			.setTitle(data.title ?? null)
			.setDescription(data.description ?? null)
			.setThumbnail(data.thumbnail ?? null)
			.addFields(data.fields ?? [])
			.setImage(data.image ?? null)
			.setURL(data.url ?? null)
			.setColor(data.color ?? this.config.embed.color)
			.setFooter(typeof data.footer === "object" ? data.footer : data.footer ? { text: data.footer } : this.config.embed.footer)
			.setTimestamp(data.timestamp ?? null)
			.setAuthor(typeof data.author === "string" ? { name: data.author, iconURL: this.user.avatarURL() } : (data.author ?? null));

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
	 * Returns a User data from the database.
	 * @param {string} userID - The ID of the user to find or create.
	 * @returns {Promise<import("./User")>} The user data object, either retrieved from the database or newly created.
	 */
	async getUserData(userID) {
		let userData = await this.usersData.findOne({ id: userID });

		if (!userData) {
			userData = new this.usersData({ id: userID });
			await userData.save();
		}

		this.databaseCache.users.set(userID, userData);

		return userData;
	}

	/**
	 * Returns a Member data from the database.
	 * @param {string} memberId - The ID of the member to find or create.
	 * @param {string} guildId - The ID of the guild the member belongs to.
	 * @returns {Promise<import("./Member")>} The member data object, either retrieved from the database or newly created.
	 */
	async getMemberData(memberId, guildId) {
		let memberData = await this.membersData.findOne({ guildID: guildId, id: memberId });

		if (!memberData) {
			memberData = new this.membersData({ id: memberId, guildID: guildId });
			await memberData.save();

			const guildData = await this.getGuildData(guildId);
			if (guildData) {
				guildData.members.push(memberData._id);
				await guildData.save();
			}
		}

		this.databaseCache.members.set(`${memberId}/${guildId}`, memberData);
		return memberData;
	}

	/**
	 * Returns a Guild data from the database.
	 * @param {string} guildId - The ID of the guild to find or create.
	 * @returns {Promise<import("./Guild")>} The guild data object, either retrieved from the database or newly created.
	 */
	async getGuildData(guildId) {
		let guildData = await this.guildsData.findOne({ id: guildId }).populate("members");

		if (!guildData) {
			guildData = new this.guildsData({ id: guildId });
			await guildData.save();
		}

		this.databaseCache.guilds.set(guildId, guildData);

		return guildData;
	}
}

module.exports = JaBaClient;
