const { MessageEmbed, Client, Collection } = require("discord.js"),
	{ GiveawaysManager } = require("discord-giveaways"),
	{ SoundCloudPlugin } = require("@distube/soundcloud"),
	{ SpotifyPlugin } = require("@distube/spotify"),
	{ YtDlpPlugin } = require("@distube/yt-dlp"),
	{ SlashCommandBuilder } = require("@discordjs/builders"),
	{ REST } = require("@discordjs/rest"),
	{ Routes } = require("discord-api-types/v9");

const util = require("util"),
	BaseEvent = require("./BaseEvent.js"),
	BaseCommand = require("./BaseCommand.js"),
	AmeClient = require("amethyste-api"),
	path = require("path"),
	fs = require("fs").promises,
	mongoose = require("mongoose"),
	DisTube = require("distube"),
	moment = require("moment");

moment.relativeTimeThreshold("s", 60);
moment.relativeTimeThreshold("ss", 5);
moment.relativeTimeThreshold("m", 60);
moment.relativeTimeThreshold("h", 60);
moment.relativeTimeThreshold("d", 24);
moment.relativeTimeThreshold("M", 12);

// Creates JaBa class
class JaBa extends Client {
	constructor(options) {
		super(options);
		this.config = require("../config"); // Load the config file
		this.customEmojis = require("../emojis"); // load the bot's emojis
		this.languages = require("../languages/language-meta"); // Load the bot's languages
		this.commands = new Collection(); // Creates new commands collection
		this.logger = require("../helpers/logger"); // Load the logger file
		this.wait = util.promisify(setTimeout); // client.wait(1000) - Wait 1 second
		this.functions = require("../helpers/functions"); // Load the functions file
		this.guildsData = require("../base/Guild"); // Guild mongoose model
		this.usersData = require("../base/User"); // User mongoose model
		this.membersData = require("../base/Member"); // Member mongoose model
		this.dashboard = require("../dashboard/app"); // Dashboard app
		this.states = {}; // Used for the dashboard
		this.knownGuilds = [];

		this.databaseCache = {};
		this.databaseCache.users = new Collection();
		this.databaseCache.guilds = new Collection();
		this.databaseCache.members = new Collection();
		this.databaseCache.usersReminds = new Collection(); // members with active reminds
		this.databaseCache.mutedUsers = new Collection(); // members who are currently muted

		if (this.config.apiKeys.amethyste) this.AmeAPI = new AmeClient(this.config.apiKeys.amethyste);

		this.player = new DisTube.default(this, {
			plugins: [
				new SpotifyPlugin({
					emitEventsAfterFetching: true
				}),
				new SoundCloudPlugin(),
				new YtDlpPlugin()
			],
			youtubeDL: false,
			emitNewSongOnly: true,
			leaveOnEmpty: true,
			leaveOnFinish: true,
			leaveOnStop: true,
			searchSongs: 10,
			searchCooldown: 30,
			emptyCooldown: 10,
			emitAddListWhenCreatingQueue: false,
			emitAddSongWhenCreatingQueue: false
		});

		this.player
			.on("playSong", async (queue, song) => {
				const m = await queue.textChannel.send({ content: this.translate("music/play:NOW_PLAYING", { songName: song.name }, queue.textChannel.guild.data.language) });
				if (song.duration > 1) {
					setTimeout(() => {
						if (m.deletable) m.delete();
					}, song.duration * 1000);
				} else {
					setTimeout(() => {
						if (m.deletable) m.delete();
					}, 10 * 60 * 1000); // m * s * ms
				}
			})
			.on("addSong", (queue, song) => queue.textChannel.send({ content: this.translate("music/play:ADDED_QUEUE", { songName: song.name }, queue.textChannel.guild.data.language) }))
			.on("addList", (queue, playlist) => queue.textChannel.send({ content: this.translate("music/play:ADDED_QUEUE_COUNT", { songCount: `**${playlist.songs.length}** ${this.getNoun(playlist.songs.length, this.translate("misc:NOUNS:TRACKS:1"), this.translate("misc:NOUNS:TRACKS:1"), this.translate("misc:NOUNS:TRACKS:2"), this.translate("misc:NOUNS:TRACKS:5"))}` }, queue.textChannel.guild.data.language) }))
			.on("searchResult", (message, result) => {
				let i = 0;
				const embed = new MessageEmbed()
					.setDescription(result.map(song => `**${++i} -** ${song.name}`).join("\n"))
					.setFooter({ text: this.translate("music/play:RESULTS_FOOTER", null, message.guild.data.language) })
					.setColor(this.config.embed.color);
				message.reply({ embeds: [embed] });
			})
			.on("searchDone", () => {})
			.on("searchCancel", message => message.error("misc:TIMES_UP"))
			.on("searchInvalidAnswer", message => message.error("misc:INVALID_NUMBER_RANGE", { min: 1, max: 10 }))
			.on("searchNoResult", message => message.error("music/play:NO_RESULT"))
			.on("error", (textChannel, e) => {
				console.error(e);
				textChannel.send({ content: this.translate("music/play:ERR_OCCURRED", { error: e }, textChannel.guild.data.language) });
			})
			.on("finish", queue => queue.textChannel.send(this.translate("music/play:QUEUE_ENDED", null, queue.textChannel.guild.data.language)))
			// .on("disconnect", queue => queue.textChannel.send(this.translate("music/play:STOP_DISCONNECTED", null, queue.textChannel.guild.data.language)))
			.on("empty", queue => queue.textChannel.send(this.translate("music/play:STOP_EMPTY", null, queue.textChannel.guild.data.language)));

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

	/**
	 *
	 * @param {String} dir
	 * @param {String} guild_id
	 * @returns
	 */
	async loadCommands(dir, guild_id) {
		const filePath = path.join(__dirname, dir);
		const files = await fs.readdir(filePath);
		const rest = new REST({ version: "9" }).setToken(this.config.token);
		const commands = [];
		const guild_commands = [];
		for (let index = 0; index < files.length; index++) {
			const file = files[index];
			const stat = await fs.lstat(path.join(filePath, file));
			if (stat.isDirectory()) this.loadCommands(path.join(dir, file), guild_id);
			if (file.endsWith(".js")) {
				const Command = require(path.join(filePath, file));
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

					if (command.guildOnly) guild_commands.push(command.command instanceof SlashCommandBuilder ? command.command.toJSON() : command.command, ...aliases);
					else commands.push(command.command instanceof SlashCommandBuilder ? command.command.toJSON() : command.command, ...aliases);

					if (command.onLoad || typeof command.onLoad === "function") await command.onLoad(this);
					this.logger.log(`Successfully loaded "${file}" command file. (Command: ${command.command.name})`);
				}
			}
		}

		try {
			if (guild_id && guild_id.length) {
				await rest.put(
					Routes.applicationGuildCommands(this.config.user, guild_id), {
						body: guild_commands
					},
				);
			}
			await rest.put(
				Routes.applicationCommands(this.config.user), {
					body: commands
				},
			);
			this.logger.log("Successfully registered application commands.");
		} catch (err) {
			this.logger.log("Cannot load commands: " + err.message, "error");
		}
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

	async resolveUser(search) {
		let user = null;
		if (!search || typeof search !== "string") return;

		// Try ID search
		if (search.match(/^<@!?(\d+)>$/)) {
			const id = search.match(/^<@!?(\d+)>$/)[1];
			user = this.users.fetch(id).catch(() => {});
			if (user) return user;
		}

		// Try username search
		if (search.match(/^!?(\w+)#(\d+)$/)) {
			const username = search.match(/^!?(\w+)#(\d+)$/)[0];
			const discriminator = search.match(/^!?(\w+)#(\d+)$/)[1];
			user = this.users.find((u) => u.username === username && u.discriminator === discriminator);
			if (user) return user;
		}
		user = await this.users.fetch(search).catch(() => {});

		return user;
	}

	async resolveMember(search, guild) {
		let member = null;
		if (!search || typeof search !== "string") return;

		// Try ID search
		if (search.match(/^<@!?(\d+)>$/)) {
			const id = search.match(/^<@!?(\d+)>$/)[1];
			member = await guild.members.fetch(id).catch(() => {});
			if (member) return member;
		}

		// Try username search
		if (search.match(/^!?(\w+)#(\d+)$/)) {
			guild = await guild.fetch();
			member = guild.members.cache.find((m) => m.user.tag === search);
			if (member) return member;
		}
		member = await guild.members.fetch(search).catch(() => {});

		return member;
	}

	async resolveRole(search, guild) {
		let role = null;
		if (!search || typeof search !== "string") return;

		// Try ID search
		if (search.match(/^<@&!?(\d+)>$/)) {
			const id = search.match(/^<@&!?(\d+)>$/)[1];
			role = guild.roles.cache.get(id);
			if (role) return role;
		}

		// Try name search
		role = guild.roles.cache.find((r) => search === r.name);
		if (role) return role;
		role = guild.roles.cache.get(search);

		return role;
	}
}

module.exports = JaBa;