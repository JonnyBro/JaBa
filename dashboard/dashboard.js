const SoftUI = require("./dashboard-core/theme/dbd-soft-ui"),
	DBD = require("./dashboard-core/index");

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
		ownerIDs: [ client.config.owner ],
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
							getValue: client.users.cache.size,
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
				enUS: require("../languages/en-US/dashboard.json").DASHBOARD,
				ruRU: require("../languages/ru-RU/dashboard.json").DASHBOARD,
				ukUA: require("../languages/uk-UA/dashboard.json").DASHBOARD,
			},
		}),
		customPages: [
			DBD.customPagesTypes.redirectToUrl("/github", () => {
				return "https://github.com/JonnyBro/JaBa";
			}),
		],
		settings: [{
			categoryId: "main",
			categoryName: "Main settings",
			categoryDescription: "Setup your bot here!",
			categoryOptionsList: [
				{
					optionId: "lang",
					optionName: "Language",
					optionDescription: client.translate("administration/setlang:DESCRIPTION"),
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
				},
				{
					optionId: "xd",
					optionName: "OMG",
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
				},
			],
		}],
	});

	await Dashboard.init().then(() => {
		client.logger.log(`Dashboard launched on port ${client.config.dashboard.port}`, "ready");
	}).catch(err => {
		client.logger.log(`Dashboard failed to initialize:\n${err}`, "error");
	});
};