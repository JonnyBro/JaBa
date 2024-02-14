const SoftUI = require("./dashboard-core/theme/dbd-soft-ui"),
	DBD = require("./dashboard-core/index"),
	settings = require("./settings");

const { PermissionsBitField } = require("discord.js");

const locales = {
	"en-US": require("../languages/en-US/dashboard.json"),
	"ru-RU": require("../languages/ru-RU/dashboard.json"),
	"uk-UA": require("../languages/uk-UA/dashboard.json"),
};

/**
 *
 * @param {import("../base/Client")} client
 */
module.exports.load = async client => {
	const commands = client.commands.map(v => {
		return {
			commandName: v.command.name,
			commandDescription: client.translate(`${v.category.toLowerCase()}/${v.command.name}:DESCRIPTION`),
			commandUsage: client.translate(`${v.category.toLowerCase()}/${v.command.name}:USAGE`),
			commandAlias: "",
			_category: v.category,
		};
	});
	let categories = [];

	commands.forEach(c => {
		if (!categories.includes(c._category)) categories.push(c._category);
	});

	categories = categories.map(c => {
		return {
			category: c,
			categoryId: c.toLowerCase(),
			subTitle: "",
			hideAlias: true,
			hideDescription: false,
			hideSidebarItem: c === "Owner" || c === "IAT" ? true : false,
			list: commands.filter(v => v._category === c),
		};
	});

	const Dashboard = new DBD.Dashboard({
		port: client.config.dashboard.port,
		client: {
			id: client.user.id,
			secret: client.config.dashboard.secret,
		},
		cookiesSecret: client.config.dashboard.secret,
		domain: client.config.dashboard.domain,
		redirectUri: `${client.config.dashboard.domain}/discord/callback`,
		bot: client,
		ownerIDs: [client.config.owner.id],
		requiredPermissions: PermissionsBitField.Flags.ViewChannel,
		invite: {
			clientId: client.user.id,
			scopes: ["bot", "applications.commands"],
			permissions: "8",
			redirectUri: `${client.config.dashboard.domain}`,
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
					const username = (user?.discriminator === "0" ? user?.username : user?.tag) || "Guest";

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
							title: "Playing music in this much servers",
							icon: "settings-gear-65",
							getValue: client.player.nodes.cache.size,
						},
						{
							title: "Users Count",
							icon: "favourite-28",
							getValue: users,
						},
						{
							title: "Servers Count",
							icon: "notification-70",
							getValue: `${client.guilds.cache.size - 1} out of 2000`,
							progressBar: {
								enabled: true,
								getProgress: Math.round(((client.guilds.cache.size - 1) / 2000) * 100),
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
						url: "https://github.com/JonnyBro",
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
			notify: {
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
				enUS: locales["en-US"],
				ruRU: locales["ru-RU"],
				ukUA: locales["uk-UA"],
			},
		}),
		customPages: [
			DBD.customPagesTypes.redirectToUrl("/github", () => {
				return "https://github.com/JonnyBro/JaBa";
			}),
			DBD.customPagesTypes.redirectToUrl("/updates", () => {
				return "https://github.com/JonnyBro/JaBa/blob/main/dashboard/docs/updates.md";
			}),
		],
		settings: settings(client),
	});

	await Dashboard.init().then(() => {
		client.logger.ready(`Dashboard launched on port ${client.config.dashboard.port}`);
	}).catch(err => {
		client.logger.error(`Dashboard failed to initialize:\n${err}`);
	});
};
