const SoftUI = require("./dashboard-core/theme/dbd-soft-ui"),
	DBD = require("./dashboard-core/index");

const { PermissionsBitField, ChannelType } = require("discord.js");

/**
 *
 * @param {import("../base/JaBa")} client
 */
module.exports.load = async client => {
	const commands = client.commands.map(v => {
		return {
			_category: v.category,
			commandName: v.command.name,
			commandDescription: client.translate(`${v.category.toLowerCase()}/${v.command.name}:DESCRIPTION`),
			commandUsage: client.translate(`${v.category.toLowerCase()}/${v.command.name}:USAGE`),
			commandAlias: "",
		};
	});
	let categories = [];

	commands.forEach(c => {
		if (!categories.includes(c._category))
			categories.push(c._category);
	});

	categories = categories.map(c => {
		return {
			category: c,
			categoryId: c.toLowerCase(),
			subTitle: "",
			hideAlias: true,
			hideDescription: false,
			hideSidebarItem: c === "Owner" || c === "IAT" || c === "SunCountry" ? true : false,
			list: commands.filter(v => v._category === c),
		};
	});

	const Dashboard = new DBD.Dashboard({
		port: client.config.dashboard.port,
		client: {
			id: client.config.user,
			secret: client.config.dashboard.secret,
		},
		cookiesSecret: client.config.dashboard.secret,
		domain: client.config.dashboard.domain,
		redirectUri: `${client.config.dashboard.domain}${client.config.dashboard.port !== 80 ? `:${client.config.dashboard.port}` : ""}/discord/callback`,
		bot: client,
		ownerIDs: [ client.config.owner.id ],
		requiredPermissions: PermissionsBitField.Flags.ViewChannel,
		minimizedConsoleLogs: true,
		invite: {
			clientId: client.config.user,
			scopes: ["bot", "applications.commands"],
			permissions: "8",
			redirectUri: client.config.dashboard.domain + client.config.dashboard.port !== 80 ? `:${client.config.dashboard.port}` : "",
		},
		supportServer: {
			slash: "/support",
			inviteUrl: client.config.support.invite,
		},
		rateLimits: {
			manage: {
				windowMs: 15 * 60 * 1000, // 15 minutes
				max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
				message: "You are ratelimited!", // Message returned if user should be rate limited, could be also JSON/HTML
				store: null, // <Rate Limiter Store> - if null, new MemoryStore()
				// supported stores: https://www.npmjs.com/package/express-rate-limit#store
			},
			guildPage: {
				windowMs: 15 * 60 * 1000,
				max: 100,
				message: "You are ratelimited!",
				store: null,
			},
			settingsUpdatePostAPI: {
				windowMs: 15 * 60 * 1000,
				max: 100,
				message: "You are ratelimited!",
				store: null,
			},
		},
		useTheme404: true,
		useThemeMaintenance: true,
		useUnderMaintenance: false,
		underMaintenanceAccessKey: client.config.dashboard.maintanceKey,
		underMaintenanceAccessPage: "/get-access",
		underMaintenance: {
			title: "Under Maintenance",
			contentTitle: "This page is under maintenance",
			texts: [
				"<br>",
				"We still want to change for the better for you.",
				"Therefore, we are introducing technical updates so that we can allow you to enjoy the quality of our services.",
				"<br>",
				`Come back to us later or join our <a href="${client.config.support.invite}">Discord Support Server</a>`,
			],
		},
		theme: SoftUI({
			customThemeOptions: {
				// eslint-disable-next-line no-unused-vars
				index: async ({ req, res, config }) => {
					const user = req.session?.user;
					const username = user?.username || "Guest";

					const hiddenGuildMembersCount = client.guilds.cache.get("568120814776614924").memberCount;
					let users = 0;
					client.guilds.cache.forEach(g => {
						users += g.memberCount;
					});
					users = users - hiddenGuildMembersCount;

					const cards = [
						{
							title: "Current User",
							icon: "single-02",
							getValue: username,
						},
						{
							title: "Node Version",
							icon: "settings-gear-65",
							getValue: process.versions.node,
						},
						{
							title: "Users Count",
							icon: "favourite-28",
							getValue: users,
						},
						{
							title: "Servers Count",
							icon: "notification-70",
							getValue: `${client.guilds.cache.size} out of 2000`,
							progressBar: {
								enabled: true,
								getProgress: Math.round((client.guilds.cache.size / 2000) * 100),
							},
						},
					];

					return {
						values: [],
						graph: {},
						cards,
					};
				},
			},
			websiteName: `${client.user.username} Dashboard`,
			colorScheme: "blue",
			supporteMail: "",
			icons: {
				favicon: client.user.avatarURL(),
				noGuildIcon: "https://pnggrid.com/wp-content/uploads/2021/05/Discord-Logo-Circle-1024x1024.png",
				sidebar: {
					darkUrl: client.user.avatarURL(),
					lightUrl: client.user.avatarURL(),
					hideName: false,
					borderRadius: "1rem",
					alignCenter: true,
				},
			},
			index: {
				card: {
					category: "JaBa Bot",
					title: "Simple bot made by <a href=\"https://github.com/JonnyBro\">Jonny_Bro</a>",
					description: "JaBa's dashboard",
					image: "",
					link: {
						enabled: false,
						url: "https://google.com",
					},
				},
				graph: {
					enabled: false,
					lineGraph: true,
					title: "Memory Usage",
					tag: "Memory (MB)",
					max: 100,
				},
			},
			sweetalert: {
				errors: {
					settingsSave: "Failed to save setttings",
				},
				success: {
					settingsSave: "Successfully saved setttings.",
					login: "Successfully logged in.",
					logout: "Successfully logged out.",
				},
			},
			preloader: {
				image: "",
				spinner: true,
				text: "Page is loading",
			},
			commands: categories,
			locales: {
				enUS: require("../languages/en-US/dashboard.json"),
				ruRU: require("../languages/ru-RU/dashboard.json"),
				ukUA: require("../languages/uk-UA/dashboard.json"),
			},
		}),
		customPages: [
			DBD.customPagesTypes.redirectToUrl("/github", () => {
				return "https://github.com/JonnyBro/JaBa";
			}),
		],
		settings: [
			{
				categoryId: "main",
				categoryName: "Main settings",
				categoryDescription: "Setup your bot here!",
				categoryPermissions: PermissionsBitField.Flags.ManageGuild,
				categoryOptionsList: [
					{
						optionId: "lang",
						optionName: "Language",
						optionDescription: "Change bot's language on the server",
						optionType: DBD.formTypes.select({
							"English": "en-US",
							"Russian": "ru-RU",
							"Ukrainian": "uk-UA",
						}),
						getActualSet: async ({ guild }) => {
							const guildData = await client.findOrCreateGuild({
								id: guild.id,
							});

							return guildData.language;
						},
						setNew: async ({ guild, newData }) => {
							const guildData = await client.findOrCreateGuild({
								id: guild.id,
							});

							guildData.language = newData;
							await guildData.save();

							return;
						},
					},
					{
						optionId: "welcome",
						optionName: "Welcome Message",
						optionDescription: "Setup welcome message on the server",
						optionType: SoftUI.formTypes.multiRow([
							{
								optionId: "welcome_enable",
								optionName: "Enabled",
								optionDescription: "Toggle welcome messages sending",
								optionType: DBD.formTypes.switch(),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.welcome.enabled;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.welcome.enabled = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "welcome_image",
								optionName: "Add Image",
								optionDescription: "Toggle sending an image with welcome message",
								optionType: DBD.formTypes.switch(),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.welcome.withImage;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.welcome.withImage = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "welcome_message",
								optionName: "Message",
								optionDescription: "Change welcome message (You can use {user}, {server} and {membercount} wildcards)",
								optionType: DBD.formTypes.input("Welcome, {user}!", 2, 100, false, false),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.welcome.message;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.welcome.message = newData !== "" ? newData : null;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "welcome_channel",
								optionName: "Channel",
								optionDescription: "Select a channel for welcome messages",
								optionType: DBD.formTypes.channelsSelect(false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.welcome.channel;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.welcome.channel = newData !== "" ? newData : null;
									await guildData.save();

									return;
								},
							},
						]),
					},
					{
						optionId: "goodbye",
						optionName: "Goodbye Message",
						optionDescription: "Setup goodbye message on the server",
						optionType: SoftUI.formTypes.multiRow([
							{
								optionId: "goodbye_enable",
								optionName: "Enabled",
								optionDescription: "Toggle goodbye messages sending",
								optionType: DBD.formTypes.switch(),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.goodbye.enabled;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.goodbye.enabled = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "goodbye_image",
								optionName: "Add Image",
								optionDescription: "Toggle sending an image with goodbye message",
								optionType: DBD.formTypes.switch(),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.goodbye.withImage;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.goodbye.withImage = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "goodbye_message",
								optionName: "Message",
								optionDescription: "Change goodbye message (You can use {user}, {server} and {membercount} wildcards)",
								optionType: DBD.formTypes.input("goodbye, {user}!", 2, 100, false, false),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.goodbye.message;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.goodbye.message = newData !== "" ? newData : null;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "goodbye_channel",
								optionName: "Channel",
								optionDescription: "Select a channel for goodbye messages",
								optionType: DBD.formTypes.channelsSelect(false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.goodbye.channel;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.goodbye.channel = newData !== "" ? newData : null;
									await guildData.save();

									return;
								},
							},
						]),
					},
					{
						optionId: "autorole",
						optionName: "Auto Role",
						optionDescription: "Setup auto role on the server",
						optionType: SoftUI.formTypes.multiRow([
							{
								optionId: "autorole_enable",
								optionName: "Enabled",
								optionDescription: "Toggle auto role granting for new members",
								optionType: DBD.formTypes.switch(),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.autorole.enabled;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.autorole.enabled = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "autorole_role",
								optionName: "Role",
								optionDescription: "Select a role for auto role",
								optionType: DBD.formTypes.rolesSelect(false, false, true),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.autorole.role;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.autorole.role = newData !== "" ? newData : null;
									await guildData.save();

									return;
								},
							},
						]),
					},
					{
						optionId: "automod",
						optionName: "Auto Mod",
						optionDescription: "Setup auto mod on the server",
						optionType: SoftUI.formTypes.multiRow([
							{
								optionId: "automod_enable",
								optionName: "Enabled",
								optionDescription: "Toggle auto mod granting for new members",
								optionType: DBD.formTypes.switch(),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.automod.enabled;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.automod.enabled = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "automod_ignore",
								optionName: "Ignore channels",
								optionDescription: "Select channels for auto mod to ignore",
								optionType: DBD.formTypes.channelsMultiSelect(false, false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.automod.ignored;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.automod.ignored = newData;
									await guildData.save();

									return;
								},
							},
						]),
					},
					{
						optionId: "channels",
						optionName: "Special Channels",
						optionDescription: "Setup special channels on the server",
						optionType: SoftUI.formTypes.multiRow([
							{
								optionId: "channels_suggestions",
								optionName: "Suggestions channel",
								optionDescription: "Select channel for suggestions to go to",
								optionType: DBD.formTypes.channelsSelect(false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.suggestions;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.suggestions = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "channels_reports",
								optionName: "Reports channel",
								optionDescription: "Select channel for reports to go to",
								optionType: DBD.formTypes.channelsSelect(false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.reports;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.reports = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "channels_birthdays",
								optionName: "Birthdays channel",
								optionDescription: "Select channel for birthdays message to go to",
								optionType: DBD.formTypes.channelsSelect(false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.birthdays;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.birthdays = newData;
									await guildData.save();

									return;
								},
							},
							{
								optionId: "channels_modlogs",
								optionName: "Moderation logs channel",
								optionDescription: "Select channel for moderation logs to go to (warns)",
								optionType: DBD.formTypes.channelsSelect(false, [ ChannelType.GuildText ]),
								getActualSet: async ({ guild }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									return guildData.plugins.modlogs;
								},
								setNew: async ({ guild, newData }) => {
									const guildData = await client.findOrCreateGuild({
										id: guild.id,
									});

									guildData.plugins.modlogs = newData;
									await guildData.save();

									return;
								},
							},
						]),
					},
				],
			},
			{
				categoryId: "test",
				categoryName: "test settings",
				categoryDescription: "ooga booba",
				categoryPermissions: PermissionsBitField.Flags.ViewChannel,
				categoryOptionsList: [
					{
						optionType: DBD.formTypes.embedBuilder({
							username: "JaBa",
							avatarURL: "https://cdn.discordapp.com/avatars/708637495054565426/af98d49ebc9bf28b40b45ed5a0a623b4.png?size=4096",
						}),
						setNew: async ({ guild, user, newData }) => {
							console.log(guild);
							console.log(user);
							console.log(newData);
						},
					},
				],
			},
		],
	});

	await Dashboard.init().then(() => {
		client.logger.log(`Dashboard launched on port ${client.config.dashboard.port}`, "ready");
	}).catch(err => {
		client.logger.log(`Dashboard failed to initialize:\n${err}`, "error");
	});
};