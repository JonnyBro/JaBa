import { Client, Collection, REST, Routes } from "discord.js";
import { config } from "../config.js";
import { glob } from "glob";
import { dirname } from "node:path";

export class ExtendedClient extends Client {
	commands = new Collection();
	__dirname = dirname(new URL(import.meta.url).pathname);
	rest = new REST().setToken(config.token);
	/**
	 * @param {import("discord.js").ClientOptions} options
	 */
	constructor(options) {
		super(options);
	}

	init() {
		this.registerModules();
		this.login(config.token);
	}

	async importFile(filePath) {
		return (await import(`file://${filePath}`))?.default;
	}

	async registerModules() {
		await Promise.all([this.registerCommands(this.__dirname), this.registerEvents(this.__dirname)]);
	}

	async registerCommands(baseDir) {
		const commandFiles = await glob(`${baseDir}/../newCommands/*/*.js`);
		const slashCommands = [];

		for (const filePath of commandFiles) {
			try {
				const command = await this.importFile(filePath);
				if (!command.data.name) return;

				this.commands.set(command.data.name, command);
				slashCommands.push(command.data.toJSON());
			} catch (error) {
				console.error(`Error loading command ${filePath}:`, error);
			}
		}

		if (!slashCommands.length) return;

		try {
			const route = config.production ? Routes.applicationCommands(config.userId) : Routes.applicationGuildCommands(config.userId, config.support.id);
			const data = await this.rest.put(route, { body: slashCommands });

			console.log(`Successfully registered ${data.length} application commands.`);
		} catch (error) {
			console.log(error);
		}
	}

	async registerEvents(baseDir) {
		const eventFiles = await glob(`${baseDir}/../newEvents/**/*.js`);

		for (const file of eventFiles) {
			const event = await this.importFile(file);

			if (event.data.once) {
				this.once(event.data.name, event.run);
			} else {
				this.on(event.data.name, event.run);
			}
		}
	}
}
