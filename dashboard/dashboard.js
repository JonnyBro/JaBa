const SoftUI = require("dbd-soft-ui"),
	DBD = require("discord-dashboard"),
	os = require("os");

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

	await DBD.useLicense(client.config.dashboard.license);
	DBD.Dashboard = DBD.UpdatedClass();

	const Dashboard = new DBD.Dashboard({
		port: client.config.dashboard.port,
		client: {
			id: client.config.user,
			secret: client.config.dashboard.secret,
		},
		domain: client.config.dashboard.domain,
		redirectUri: `${client.config.dashboard.domain}/discord/callback`,
		bot: client,
		ownerIDs: [ client.config.owner ],
		requiredPermissions: [ DBD.DISCORD_FLAGS.Permissions.VIEW_CHANNEL ],
		acceptPrivacyPolicy: true,
		minimizedConsoleLogs: true,
		invite: {
			clientId: client.config.user,
			scopes: ["bot", "applications.commands"],
			permissions: "8",
			redirectUri: client.config.dashboard.domain,
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
					const username = req.session?.user?.username || "Guest";

					const cards = [
						{
							title: "Current User",
							icon: "single-02",
							getValue: username,
							progressBar: {
								enabled: false,
								getProgress: client.guilds.cache.size,
							},
						},
						{
							title: "CPU",
							icon: "tv-2",
							getValue: os.cpus()[0].model,
							progressBar: {
								enabled: false,
								getProgress: 50,
							},
						},
						{
							title: "System Platform",
							icon: "settings-gear-65",
							getValue: os.platform(),
							progressBar: {
								enabled: false,
								getProgress: 50,
							},
						},
						{
							title: "Server Count",
							icon: "notification-70",
							getValue: `${client.guilds.cache.size} out of 2000`,
							progressBar: {
								enabled: true,
								getProgress: (client.guilds.cache.size / 2000) * 100,
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
			colorScheme: "red",
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
				errors: {},
				success: {
					login: "Successfully logged in.",
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
		settings: [{
			categoryId: "setup",
			categoryName: "Setup",
			categoryDescription: "Setup your bot with default settings!",
			categoryOptionsList: [{
				optionId: "lang",
				optionName: "Language",
				optionDescription: "Change bot's language easily",
				optionType: DBD.formTypes.select({
					"English": "en-US",
					"Russian": "ru-RU",
					"Ukrainian": "uk-UA",
				}),
				getActualSet: async ({ guild }) => {
					const guildData = await client.findOrCreateGuild({
						id: guild.id,
					});

					return guildData.language || client.defaultLanguage;
				},
				setNew: async ({ guild, newData }) => {
					const guildData = await client.findOrCreateGuild({
						id: guild.id,
					});

					guildData.language = newData;
					await guildData.save();

					return;
				},
			}],
		}],
	});

	DBD.customPagesTypes.redirectToUrl("github", "https://github.com/JonnyBro/JaBa");

	await Dashboard.init().then(() => {
		client.logger.log(`Dashboard launched on port ${client.config.dashboard.port}`, "ready");
	}).catch(err => {
		client.logger.log(`Dashboard failed to initialize: ${err}`, "error");
	});
};