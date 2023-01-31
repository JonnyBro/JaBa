/* eslint-disable no-async-promise-executor */
const { GatewayIntentBits } = require("discord.js"),
	config = require("../config"),
	fetch = require("node-fetch"),
	chalk = require("chalk"),
	success = (message) => console.log(`   ${chalk.green("✓")} ${message}`),
	error = (message, howToFix) => console.log(`   ${chalk.red("✗")} ${message}${howToFix ? ` : ${howToFix}` : ""}`),
	ignore = (message) => console.log(`   ${chalk.yellow("~")} ${message}`);

const checks = [
	() => {
		console.log("\n\nEnvironnement");
		return new Promise(res => {
			if (parseInt(process.version.split(".")[0].split("v")[1]) >= 12) {
				success("node.js version equal or higher than v12");
			} else {
				error("node.js version should be equal or higher than v12");
			}
			res();
		});
	},
	() => {
		console.log("\n\nDiscord Bot");
		return new Promise(res => {
			const Discord = require("discord.js");
			const client = new Discord.Client({ intents: [ GatewayIntentBits.Guilds ] });
			let readyResolve;
			new Promise(resolve => readyResolve = resolve);
			client.login(config.token).then(async () => {
				success("Valid bot token");
				await readyResolve();
				if (!client.guilds.cache.has("568120814776614924")) {
					error("Should be added to the emojis server", "please add your bot on this server: https://discord.gg/5wrBEwE4bc to make the emojis working");
				} else {
					success("Added to the emojis server");
				}
				res();
			}).catch(() => {
				error("Should be a valid bot token");
				res();
			});
			client.on("ready", readyResolve);
		});
	},
	() => {
		console.log("\n\nMongoDB");
		return new Promise(res => {
			const MongoClient = require("mongodb").MongoClient;
			const dbName = config.mongoDB.split("/").pop();
			const baseURL = config.mongoDB.substr(0, config.mongoDB.length - dbName.length);
			const client = new MongoClient(baseURL, {
				useUnifiedTopology: true,
			});
			client.connect().then(async () => {
				success("Connection to Mongo database success");
				res();
			}).catch(() => {
				error("Not able to connect to Mongo database", "please verify if the MongoDB server is started");
				res();
			});
		});
	},
	() => {
		console.log("\n\nAPI keys");
		return new Promise(async (resolve) => {
			if (!config.apiKeys.amethyste) {
				ignore("Amethyste API is not configured, skipping check.");
			} else {
				const res = await fetch("https://v1.api.amethyste.moe/generate/blurple", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${config.apiKeys.amethyste}`,
					},
				});
				const result = await res.json();
				if (result.status === 401) {
					error("Not valid Amethyste API key", "get your key here: https://api.amethyste.moe/");
				} else {
					success("Valid Amethyste API key");
				}
			}
			resolve();
		});
	},
	() => {
		console.log("\n\nDashboard");
		return new Promise(async (resolve) => {
			if (!config.dashboard.enabled) {
				ignore("Dashboard is not enabled, skipping check.");
			} else {
				const checkPortTaken = (port) => {
					return new Promise(resolve => {
						const net = require("net");
						const tester = net.createServer()
							.once("error", () => {
								resolve(true);
							})
							.once("listening", function () {
								tester
									.once("close", function () {
										resolve(false);
									})
									.close();
							})
							.listen(port);
					});
				};
				const isPortTaken = await checkPortTaken(config.dashboard.port);
				if (isPortTaken) {
					error("Dashboard port not available", "you have probably another process using this port");
				} else {
					success("Dashboard port is available");
				}
			}
			resolve();
		});
	},
];

(async () => {
	console.log(chalk.yellow("This script will check if your config is errored, and some other important things such as whether your database is started, etc..."));
	for (const check of checks) {
		await check();
	}
	process.exit(0);
})();